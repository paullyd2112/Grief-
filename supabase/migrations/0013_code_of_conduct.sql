-- Ndo — Code of Conduct alignment
--
-- 1. Two people who matched before can be matched again. Only a block keeps
--    them apart for good (DECISIONS.md O1, now decided).
-- 2. Blocking stands on its own: no report needed, and it's permanent.
-- 3. Warnings, the lowest enforcement tier. The member sees a pop-up.
-- 4. No voice memo transcription, so no transcript columns.

-- ---------------------------------------------------------------------------
-- 1. Re-matching
-- ---------------------------------------------------------------------------
-- matches_active_pair (0001) still stops a pair being matched twice at once.

create or replace function public.guard_match_pair()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.blocks
     where (blocker_id = new.user_a and blocked_id = new.user_b)
        or (blocker_id = new.user_b and blocked_id = new.user_a)
  ) then
    raise exception 'blocked_pair: one of these people has blocked the other';
  end if;

  if exists (
    select 1 from public.profiles
     where id in (new.user_a, new.user_b)
       and (status <> 'active' or deleted_at is not null)
  ) then
    raise exception 'inactive_user: one of these accounts is suspended or being deleted';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Blocking
-- ---------------------------------------------------------------------------
-- Blocks are written only by block_user() and report_message(), both security
-- definer. Members can see their own blocks but can't add or lift one
-- directly, so a block can never be undone.

drop policy if exists blocks_rw_self on public.blocks;
create policy blocks_read_self on public.blocks
  for select using (blocker_id = auth.uid());
revoke insert, update, delete on public.blocks from anon, authenticated;

alter table public.matches drop constraint matches_end_kind_check;
alter table public.matches add constraint matches_end_kind_check
  check (end_kind in ('left','reported_and_left','deleted','removed','account_deleted','blocked'));

-- Works on a live or an ended conversation. Ending a live one sends the same
-- neutral "left the conversation" notice as leaving: it never says "blocked".
create or replace function public.block_user(conv uuid)
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

  if other is null then
    raise exception 'no_partner';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (auth.uid(), other)
  on conflict do nothing;

  update public.matches
     set ended_at = now(), ended_by = auth.uid(), end_kind = 'blocked'
   where id = m_id and ended_at is null;

  if found then
    insert into public.match_end_notices (recipient_id, match_id, leaver_name)
    select other, m_id, p.display_name
      from public.profiles p where p.id = auth.uid();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Warnings
-- ---------------------------------------------------------------------------
-- Like check_ins: no link back to the report, so nothing the member can read
-- says who reported them or which conversation it was.

create table public.warnings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  sent_by    uuid references public.profiles(id) on delete set null,
  guidance   text not null check (char_length(trim(guidance)) > 0),
  created_at timestamptz not null default now(),
  seen_at    timestamptz
);

create index warnings_user on public.warnings(user_id, created_at desc);

alter table public.warnings enable row level security;

create policy warnings_read_own on public.warnings
  for select using (user_id = auth.uid());
create policy warnings_update_own on public.warnings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy warnings_read_admin on public.warnings
  for select using (public.is_admin());

revoke insert, update, delete on public.warnings from anon, authenticated;
grant update (seen_at) on public.warnings to authenticated;

create or replace function public.warn_user(report uuid, guidance text)
returns void language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if coalesce(trim(guidance), '') = '' then
    raise exception 'guidance_required';
  end if;

  select reported_user_id into target from public.reports where id = report;
  if target is null then
    raise exception 'report_not_found';
  end if;

  insert into public.warnings (user_id, sent_by, guidance)
  values (target, auth.uid(), trim(guidance));

  insert into public.access_log (actor_id, subject_user_id, action, justification)
  values (auth.uid(), target, 'user_warned', trim(guidance));
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. No transcription
-- ---------------------------------------------------------------------------

alter table public.voice_memos drop column transcript;
alter table public.voice_memos drop column transcript_status;

-- ---------------------------------------------------------------------------
-- Function privileges (same rules as 0012)
-- ---------------------------------------------------------------------------

revoke execute on function public.block_user(uuid), public.warn_user(uuid, text)
  from public, anon;
grant execute on function public.block_user(uuid), public.warn_user(uuid, text)
  to authenticated;
