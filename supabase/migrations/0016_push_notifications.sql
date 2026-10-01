-- Ndo — push notifications
--
-- Decided Oct 1 (DECISIONS.md D26). The database sends them, the same way it
-- sends operator alerts (0009): a trigger posts to Expo's push service with
-- pg_net. Notifications never contain what anyone wrote, said or sent, only
-- that something arrived:
--   - "New message from Maya"            (any message, photo, video or memo)
--   - "You've been matched with someone" (a new conversation)
--   - "Checking in on you"               (a check-in from Ndo)
-- A failed push never blocks the insert that caused it.

-- ---------------------------------------------------------------------------
-- Device tokens
-- ---------------------------------------------------------------------------

create table public.push_tokens (
  token      text primary key check (char_length(token) between 10 and 400),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  platform   text check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- Members can see their own devices. Writes go through the functions below,
-- so a token that moves to a different account on the same phone follows it.
create policy push_tokens_read_own on public.push_tokens
  for select using (user_id = auth.uid());

create or replace function public.register_push_token(push_token text, device_platform text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (push_token, auth.uid(), device_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

-- On sign-out, so the next person to use the phone doesn't get your alerts.
create or replace function public.unregister_push_token(push_token text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_tokens where token = push_token and user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Sending
-- ---------------------------------------------------------------------------

create or replace function private.send_push(
  recipient uuid,
  title     text,
  body      text,
  payload   jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare
  messages jsonb;
begin
  -- Suspended or deleting accounts get nothing.
  if not exists (select 1 from public.profiles
                  where id = recipient and status = 'active' and deleted_at is null) then
    return;
  end if;

  select jsonb_agg(jsonb_build_object(
           'to', token,
           'title', title,
           'body', body,
           'data', payload,
           'sound', 'default'))
    into messages
    from public.push_tokens
   where user_id = recipient;

  if messages is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  return;
end;
$$;

revoke all on function private.send_push(uuid, text, text, jsonb) from public;

-- A new message, photo, video or voice memo: tell the other person who it's
-- from, never what it says.
create or replace function public.push_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  sender_name text;
  recipient   uuid;
begin
  select display_name into sender_name from public.profiles where id = new.sender_id;
  select user_id into recipient
    from public.conversation_participants
   where conversation_id = new.conversation_id and user_id <> new.sender_id
   limit 1;

  if recipient is not null then
    perform private.send_push(
      recipient,
      'Ndo',
      format('New message from %s', coalesce(sender_name, 'your match')),
      jsonb_build_object('conversation_id', new.conversation_id));
  end if;
  return new;
end;
$$;

create trigger messages_push
  after insert on public.messages
  for each row execute function public.push_new_message();

-- A new match: each person is told when their seat in a conversation is made.
create or replace function public.push_new_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.send_push(
    new.user_id,
    'Ndo',
    'You''ve been matched with someone. Say hello when you''re ready.',
    jsonb_build_object('conversation_id', new.conversation_id));
  return new;
end;
$$;

create trigger conversation_participants_push
  after insert on public.conversation_participants
  for each row execute function public.push_new_match();

-- A check-in from Ndo. Like the card itself, it never mentions why.
create or replace function public.push_check_in()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.send_push(new.user_id, 'Ndo', 'Checking in on you', '{}'::jsonb);
  return new;
end;
$$;

create trigger check_ins_push
  after insert on public.check_ins
  for each row execute function public.push_check_in();

-- ---------------------------------------------------------------------------
-- Who may call what (see 0012)
-- ---------------------------------------------------------------------------

revoke execute on function
  public.register_push_token(text, text),
  public.unregister_push_token(text)
from public, anon;

grant execute on function
  public.register_push_token(text, text),
  public.unregister_push_token(text)
to authenticated;

revoke execute on function
  public.push_new_message(),
  public.push_new_match(),
  public.push_check_in()
from public, anon, authenticated;
