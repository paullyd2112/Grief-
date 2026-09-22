-- Ndo — safety hardening
--
-- 1. Column-level update rights, so row policies can't be used to rewrite
--    fields a user must never control.
-- 2. Matching can never pair two people where either has blocked the other,
--    or who have already been matched before.
-- 3. A per-sender message rate limit, so a bad actor can't flood someone
--    before they get the chance to report.
-- 4. Read receipts for the sender's own unread indicator, stamped by the server.

-- ---------------------------------------------------------------------------
-- 1. Column-level update rights
-- ---------------------------------------------------------------------------

-- The only field a participant should touch is last_read_at, and mark_read()
-- below stamps that with the server clock. RLS already rejects moving a seat
-- to another conversation; this removes the write path entirely.
revoke update on public.conversation_participants from anon, authenticated;

-- Without this a suspended user could set their own status back to 'active'.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, name_is_pseudonym, guidelines_accepted_at)
  on public.profiles to authenticated;

revoke update on public.match_end_notices from anon, authenticated;
grant update (seen_at) on public.match_end_notices to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Matching guard
-- ---------------------------------------------------------------------------

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
    select 1 from public.matches
     where user_a = new.user_a and user_b = new.user_b
  ) then
    raise exception 'previously_matched: these two have been matched before';
  end if;

  return new;
end;
$$;

create trigger matches_guard_pair
  before insert on public.matches
  for each row execute function public.guard_match_pair();

-- ---------------------------------------------------------------------------
-- 3. Message rate limit
-- ---------------------------------------------------------------------------

create index if not exists messages_sender_created
  on public.messages(sender_id, created_at desc);

create or replace function public.enforce_message_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  last_minute integer;
  last_hour   integer;
begin
  select count(*) filter (where created_at > now() - interval '1 minute'),
         count(*)
    into last_minute, last_hour
    from public.messages
   where sender_id = new.sender_id
     and created_at > now() - interval '1 hour';

  if last_minute >= 20 or last_hour >= 200 then
    raise exception 'rate_limited: too many messages, try again shortly';
  end if;

  return new;
end;
$$;

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.enforce_message_rate_limit();

-- ---------------------------------------------------------------------------
-- 4. Read receipts
-- ---------------------------------------------------------------------------

-- Server clock, not the device's, so a phone with a skewed clock can't make
-- messages look permanently unread.
create or replace function public.mark_read(conv uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversation_participants
     set last_read_at = now()
   where conversation_id = conv and user_id = auth.uid();
$$;
