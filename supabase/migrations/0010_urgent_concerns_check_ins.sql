-- Ndo — urgent concerns and check-ins from Ndo
--
-- The worried person answers one question: might this person be at risk of
-- harming themselves or someone else? "Yes, right now" marks the concern
-- urgent and alerts the team immediately.
--
-- The person the concern is about can receive a check-in from Ndo: a gentle
-- card with crisis lines on their home screen. It comes from Ndo, never from
-- their match, and never mentions that anyone raised a concern. Operators
-- send it by choice rather than automatically, so its timing doesn't point
-- at the person who pressed the button.

alter table public.concerns add column urgent boolean not null default false;
alter table public.concerns add column check_in_sent_at timestamptz;

drop function public.raise_concern(uuid, text);

create or replace function public.raise_concern(
  conv         uuid,
  concern_note text default null,
  is_urgent    boolean default false
) returns void language plpgsql security definer set search_path = public as $$
declare
  other uuid;
begin
  if not public.is_participant(conv) then
    raise exception 'not a participant';
  end if;

  select user_id into other
    from public.conversation_participants
   where conversation_id = conv and user_id <> auth.uid();

  -- Urgency only ever escalates: adding a note later can't downgrade it.
  insert into public.concerns (raised_by, about_user, conversation_id, note, urgent)
  values (auth.uid(), other, conv, nullif(trim(concern_note), ''), is_urgent)
  on conflict (raised_by, conversation_id) where handled_at is null
  do update set
    note   = coalesce(excluded.note, public.concerns.note),
    urgent = public.concerns.urgent or excluded.urgent;
end;
$$;

create or replace function public.notify_concern_raised()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.urgent then
    perform private.post_ops_alert(
      'URGENT: someone on Ndo thinks the person they''re talking to may be in danger right now. Check Concerns in the admin console.');
  else
    perform private.post_ops_alert(
      'Someone on Ndo is worried about the person they''re talking to. Check Concerns in the admin console.');
  end if;
  return new;
end;
$$;

drop trigger concerns_notify on public.concerns;
create trigger concerns_notify
  after insert or update of note, urgent on public.concerns
  for each row execute function public.notify_concern_raised();

-- ---------------------------------------------------------------------------
-- Check-ins from Ndo
-- ---------------------------------------------------------------------------

create table public.check_ins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  sent_by    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  seen_at    timestamptz
);

alter table public.check_ins enable row level security;

create policy check_ins_read_own on public.check_ins
  for select using (user_id = auth.uid());
create policy check_ins_update_own on public.check_ins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy check_ins_read_admin on public.check_ins
  for select using (public.is_admin());

revoke update on public.check_ins from anon, authenticated;
grant update (seen_at) on public.check_ins to authenticated;

-- No link from a check-in back to the concern, so nothing the recipient can
-- read connects the two.
create or replace function public.send_check_in(concern uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  c public.concerns;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select * into c from public.concerns where id = concern;
  if c.id is null or c.about_user is null then
    raise exception 'concern_not_found';
  end if;
  if c.check_in_sent_at is not null then
    raise exception 'check_in_already_sent';
  end if;

  insert into public.check_ins (user_id, sent_by) values (c.about_user, auth.uid());
  update public.concerns set check_in_sent_at = now() where id = concern;

  insert into public.access_log (actor_id, subject_user_id, action, justification)
  values (auth.uid(), c.about_user, 'check_in_sent', 'Sent a check-in from Ndo');
end;
$$;
