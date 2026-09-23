-- Ndo — feedback, and the two intake questions the FAQ promises
--
-- 1. Intake: how often someone wants to talk, and anything they'd rather not
--    discuss. Both optional. Operators read them for matching, like the rest
--    of intake; they are not shown to the match.
-- 2. Feedback: members write to the team. Every piece is read by a person.

-- ---------------------------------------------------------------------------
-- 1. Intake
-- ---------------------------------------------------------------------------

alter table public.intake_responses
  add column talk_frequency text
    check (talk_frequency in ('daily','few_times_a_week','weekly','on_hard_days','not_sure')),
  add column avoid_topics text
    check (char_length(avoid_topics) <= 1000);

-- ---------------------------------------------------------------------------
-- 2. Feedback
-- ---------------------------------------------------------------------------
-- Deleted with the account. Operators mark it read; members can't edit or
-- remove what they sent, and can't see anyone else's.

create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body       text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index feedback_created on public.feedback(created_at desc);

alter table public.feedback enable row level security;

create policy feedback_insert_self on public.feedback
  for insert with check (user_id = auth.uid());
create policy feedback_read_own on public.feedback
  for select using (user_id = auth.uid());
create policy feedback_read_admin on public.feedback
  for select using (public.is_admin());
create policy feedback_update_admin on public.feedback
  for update using (public.is_admin()) with check (public.is_admin());

revoke update, delete on public.feedback from anon, authenticated;
grant update (read_at) on public.feedback to authenticated;

-- Server clock, and a ceiling so the inbox can't be flooded.
create or replace function public.guard_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  new.read_at := null;

  if (select count(*) from public.feedback
       where user_id = new.user_id
         and created_at > now() - interval '1 day') >= 10 then
    raise exception 'rate_limited: too much feedback today, try again tomorrow';
  end if;

  return new;
end;
$$;

create trigger feedback_guard
  before insert on public.feedback
  for each row execute function public.guard_feedback();

-- Same alert channel as reports and concerns. No content in the alert.
create or replace function public.notify_feedback_sent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.post_ops_alert('New feedback on Ndo. Read it in the admin console.');
  return new;
end;
$$;

create trigger feedback_notify
  after insert on public.feedback
  for each row execute function public.notify_feedback_sent();
