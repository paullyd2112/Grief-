-- Ndo — safety state machine and retention
--
-- The end-of-match branching is a safety behaviour, not a UX detail. A normal
-- departure sends a neutral notice. A report-and-leave sends NOTHING: notifying
-- a predatory account that it was reported tells it to adjust and try again.

-- Departure notices. No row is ever written for a report-and-leave.
-- Normal departure: "This user left the conversation." + reframe + re-match prompt.
-- Report-and-leave: NOTHING. Silent. No notice of any kind.
create table public.match_end_notices (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  match_id     uuid not null references public.matches(id) on delete cascade,
  -- The display_name of the person who left, captured at departure time so it
  -- survives if the leaver later changes their name or deletes their account.
  leaver_name  text not null,
  created_at   timestamptz not null default now(),
  seen_at      timestamptz
);

alter table public.match_end_notices enable row level security;
create policy notices_read_self on public.match_end_notices
  for select using (recipient_id = auth.uid());
create policy notices_update_self on public.match_end_notices
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- Seat both parties when a match is created.
create or replace function public.seed_conversation_participants()
returns trigger language plpgsql security definer set search_path = public as $$
declare m public.matches;
begin
  select * into m from public.matches where id = new.match_id;
  insert into public.conversation_participants (conversation_id, user_id)
  values (new.id, m.user_a), (new.id, m.user_b)
  on conflict do nothing;
  return new;
end;
$$;

create trigger conversations_seed_participants
  after insert on public.conversations
  for each row execute function public.seed_conversation_participants();

-- ---------------------------------------------------------------------------
-- Ending a match
-- ---------------------------------------------------------------------------

create or replace function public.end_match(conv uuid, silent boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare
  m_id  uuid;
  other uuid;
begin
  if not public.is_participant(conv) then
    raise exception 'not a participant';
  end if;

  select match_id into m_id from public.conversations where id = conv;

  select user_id into other
  from public.conversation_participants
  where conversation_id = conv and user_id <> auth.uid();

  update public.matches
     set ended_at = now(),
         ended_by = auth.uid(),
         end_kind = case when silent then 'reported_and_left' else 'left' end
   where id = m_id and ended_at is null;

  -- Silent departures notify nobody. That is the whole point.
  if not silent then
    insert into public.match_end_notices (recipient_id, match_id, leaver_name)
    select other, m_id, p.display_name
      from public.profiles p where p.id = auth.uid();
    -- The app renders this as:
    --   "<leaver_name> left the conversation."
    --   "People step back for their own reasons — it isn't about you."
    --   [Get matched with someone new]
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Deleting a conversation — removes it for BOTH parties, text and voice
-- ---------------------------------------------------------------------------

create or replace function public.delete_conversation(conv uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m_id uuid;
begin
  if not public.is_participant(conv) then
    raise exception 'not a participant';
  end if;

  select match_id into m_id from public.conversations where id = conv;

  -- Hard delete. No one keeps a copy of someone else's voice after the
  -- conversation is gone. Reported content survives only as reports.snapshot,
  -- which is an independent copy taken at report time.
  delete from public.voice_memos
   where id in (select voice_memo_id from public.messages
                 where conversation_id = conv and voice_memo_id is not null);
  delete from public.messages where conversation_id = conv;

  update public.conversations
     set deleted_at = now(), deleted_by = auth.uid()
   where id = conv and deleted_at is null;

  update public.matches
     set ended_at = coalesce(ended_at, now()),
         ended_by = coalesce(ended_by, auth.uid()),
         end_kind = coalesce(end_kind, 'deleted')
   where id = m_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reporting — the only path by which content reaches an operator
-- ---------------------------------------------------------------------------

create or replace function public.report_message(
  conv          uuid,
  target_user   uuid,
  target_msg    uuid,
  report_reason text,
  content       jsonb,          -- reporter's client supplies message + context
  also_leave    boolean default true
) returns uuid language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if not public.is_participant(conv) then
    raise exception 'not a participant';
  end if;

  insert into public.reports
    (reporter_id, reported_user_id, conversation_id, message_id, reason, snapshot)
  values
    (auth.uid(), target_user, conv, target_msg, report_reason, content)
  returning id into rid;

  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), target_user)
  on conflict do nothing;

  -- Leaving after a report is always silent.
  if also_leave then
    perform public.end_match(conv, true);
  end if;

  return rid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Retention — a promise that isn't a cron job is just a sentence
-- ---------------------------------------------------------------------------

create or replace function public.purge_expired_reports()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with gone as (
    delete from public.reports
     where legal_hold = false and purge_after <= now()
     returning 1
  )
  select count(*) into n from gone;
  return n;
end;
$$;

-- Scheduled in 0004 if pg_cron is available; otherwise invoked by a Vercel cron
-- route. Either way it runs — see docs/ACCESS_POLICY.md.
