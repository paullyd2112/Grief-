-- Ndo — photos and videos in conversations, unsend, daily caps
--
-- Decided Sep 28 (DECISIONS.md D23–D25):
-- - Members can send photos and videos inside a conversation, with a caption.
--   They unlock once both people have sent at least one message.
-- - Up to 10 per message, videos up to 60 seconds, 50 a day per member.
-- - The sender chooses whether the other person may save them.
-- - Photos, videos and voice memos can be unsent; they disappear for both.
-- - Voice memos: up to 5 minutes, 50 a day per member.
-- - Same access rule as messages and voice memos: participants of a live
--   conversation only. There is no operator read path. A report copies the
--   files into a separate bucket that only operators can read.

-- ---------------------------------------------------------------------------
-- Messages: a third kind, save permission, unsend
-- ---------------------------------------------------------------------------

alter table public.messages drop constraint messages_kind_check;
alter table public.messages add constraint messages_kind_check
  check (kind in ('text', 'voice', 'media'));

-- Set by the sender when they send photos or videos. Off unless they choose it.
alter table public.messages add column allow_save boolean not null default false;

-- An unsent message keeps its row (so both people see "unsent" and a report
-- still records that something was sent) but loses its content.
alter table public.messages add column unsent_at timestamptz;

-- For 'media', body is the optional caption.
alter table public.messages drop constraint body_matches_kind;
alter table public.messages add constraint body_matches_kind check (
  unsent_at is not null
  or (kind = 'text'  and body is not null and voice_memo_id is null)
  or (kind = 'voice' and voice_memo_id is not null)
  or (kind = 'media' and voice_memo_id is null
      and (body is null or char_length(body) <= 2000))
);

-- Photos and videos are only sent through send_media(), which enforces the
-- rules below; nobody inserts a media message, a save permission or an
-- unsent message directly.
create policy messages_insert_plain_only on public.messages
  as restrictive for insert to authenticated
  with check (kind in ('text', 'voice') and allow_save = false and unsent_at is null);

-- ---------------------------------------------------------------------------
-- Attachments
-- ---------------------------------------------------------------------------

create table public.attachments (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  kind            text not null check (kind in ('photo', 'video')),
  storage_path    text not null unique,
  width           integer check (width is null or width > 0),
  height          integer check (height is null or height > 0),
  -- A second of slack over 60 for how phones round video lengths.
  duration_ms     integer check (duration_ms is null or duration_ms between 1 and 61000),
  position        smallint not null check (position between 0 and 9),
  created_at      timestamptz not null default now(),

  constraint video_has_duration check (kind = 'photo' or duration_ms is not null)
);

create index attachments_message on public.attachments(message_id, position);
create index attachments_sender_created on public.attachments(sender_id, created_at desc);

alter table public.attachments enable row level security;

-- Participants only. No admin policy. This is the commitment.
create policy attachments_read_participant on public.attachments
  for select using (
    public.is_participant(conversation_id) and public.conversation_is_live(conversation_id)
  );

-- No insert, update or delete policies: rows are written only by send_media()
-- and removed by unsend_message() or by deleting the conversation.

-- ---------------------------------------------------------------------------
-- Storage: attachments
-- ---------------------------------------------------------------------------
-- Objects live at '<conversation_id>/<sender_id>-<random>.<ext>'. The sender
-- prefix lets send_media() check a file was uploaded by the caller.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Size and type limits, where the storage schema supports them.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'storage' and table_name = 'buckets'
                and column_name = 'file_size_limit') then
    update storage.buckets
       set file_size_limit = 52428800,  -- 50 MB; a 60-second 720p video is ~12 MB
           allowed_mime_types = array['image/jpeg', 'video/mp4', 'video/quicktime',
                                      'video/3gpp', 'video/webm']
     where id = 'attachments';
  end if;
end;
$$;

create policy storage_attachments_upload on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and public.can_send_to(public.voice_object_conversation(name))
    and split_part(name, '/', 2) like auth.uid()::text || '-%'
  );

create policy storage_attachments_read on storage.objects
  for select using (
    bucket_id = 'attachments'
    and public.is_participant(public.voice_object_conversation(name))
    and public.conversation_is_live(public.voice_object_conversation(name))
  );

-- As with voice memos: lets the deleting participant remove both sides' files
-- before the conversation is marked deleted, and a sender remove what they
-- unsend. The retention job sweeps anything left behind.
create policy storage_attachments_delete on storage.objects
  for delete using (
    bucket_id = 'attachments'
    and public.is_participant(public.voice_object_conversation(name))
  );

-- ---------------------------------------------------------------------------
-- Storage: reported media (operators only)
-- ---------------------------------------------------------------------------
-- When someone reports a conversation, their app copies the photos and videos
-- in the snapshot to '<reporter_id>/<folder>/<file>' here. It's a copy, like
-- reports.snapshot, so it survives unsend and deletion. Only operators can
-- read it; the retention job removes it with the report after 90 days.

insert into storage.buckets (id, name, public)
values ('reported-media', 'reported-media', false)
on conflict (id) do nothing;

create policy storage_reported_media_upload on storage.objects
  for insert with check (
    bucket_id = 'reported-media'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy storage_reported_media_read on storage.objects
  for select using (
    bucket_id = 'reported-media'
    and public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Files waiting to be removed
-- ---------------------------------------------------------------------------
-- unsend_message() queues the files it orphans. The sender's app removes them
-- straight away; the retention job clears whatever is left.

create table private.storage_trash (
  id         bigserial primary key,
  bucket     text not null,
  path       text not null,
  created_at timestamptz not null default now()
);

create or replace function public.list_storage_trash()
returns table (id bigint, bucket text, path text)
language sql security definer set search_path = public as $$
  select id, bucket, path from private.storage_trash order by id limit 1000;
$$;

create or replace function public.clear_storage_trash(ids bigint[])
returns void language sql security definer set search_path = public as $$
  delete from private.storage_trash where id = any(ids);
$$;

-- ---------------------------------------------------------------------------
-- Sending photos and videos
-- ---------------------------------------------------------------------------
-- items: [{ "kind": "photo"|"video", "path": text, "width": int,
--           "height": int, "duration_ms": int }]

create or replace function public.send_media(
  conv       uuid,
  items      jsonb,
  caption    text default null,
  can_save   boolean default false
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  me        uuid := auth.uid();
  n         integer;
  sent_today integer;
  item      jsonb;
  msg_id    uuid;
begin
  if not public.can_send_to(conv) then
    raise exception 'not_allowed: this conversation has ended';
  end if;

  -- Nothing as an opening move: both people must have said something first.
  if not exists (select 1 from public.messages
                  where conversation_id = conv and sender_id = me)
     or not exists (select 1 from public.messages
                     where conversation_id = conv and sender_id <> me) then
    raise exception 'media_locked: photos and videos unlock once you have both sent a message';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' then
    raise exception 'bad_request: items must be a list';
  end if;
  n := jsonb_array_length(items);
  if n < 1 or n > 10 then
    raise exception 'too_many: send between 1 and 10 photos or videos at a time';
  end if;

  if caption is not null and char_length(caption) > 2000 then
    raise exception 'too_long: captions can be up to 2000 characters';
  end if;

  select count(*) into sent_today
    from public.attachments
   where sender_id = me and created_at > now() - interval '1 day';
  if sent_today + n > 50 then
    raise exception 'rate_limited: you can send up to 50 photos and videos a day';
  end if;

  for item in select value from jsonb_array_elements(items) loop
    if coalesce(item->>'kind', '') not in ('photo', 'video') then
      raise exception 'bad_request: unknown attachment kind';
    end if;
    if coalesce(item->>'path', '') not like conv::text || '/' || me::text || '-%' then
      raise exception 'bad_request: attachment path';
    end if;
    if not exists (select 1 from storage.objects
                    where bucket_id = 'attachments' and name = item->>'path') then
      raise exception 'bad_request: attachment was not uploaded';
    end if;
    if item->>'kind' = 'video'
       and coalesce((item->>'duration_ms')::integer, 0) not between 1 and 61000 then
      raise exception 'too_long: videos can be up to 60 seconds';
    end if;
  end loop;

  insert into public.messages (conversation_id, sender_id, kind, body, allow_save)
  values (conv, me, 'media', nullif(trim(caption), ''), coalesce(can_save, false))
  returning id into msg_id;

  insert into public.attachments
    (message_id, conversation_id, sender_id, kind, storage_path,
     width, height, duration_ms, position)
  select msg_id, conv, me, e.value->>'kind', e.value->>'path',
         nullif(e.value->>'width', '')::integer,
         nullif(e.value->>'height', '')::integer,
         case when e.value->>'kind' = 'video'
              then (e.value->>'duration_ms')::integer end,
         (e.ordinality - 1)::smallint
    from jsonb_array_elements(items) with ordinality as e(value, ordinality);

  return msg_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Unsend
-- ---------------------------------------------------------------------------
-- The sender takes back photos, videos or a voice memo. The content goes for
-- both people; the row stays as "unsent". A copy already taken by a report is
-- unaffected. Returns the storage paths so the sender's app can remove the
-- files immediately; they're also queued for the retention job.

create or replace function public.unsend_message(msg uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  m        public.messages%rowtype;
  paths    text[] := '{}';
  memo_path text;
begin
  select * into m from public.messages where id = msg;
  if not found or m.sender_id <> auth.uid() then
    raise exception 'not_allowed: you can only unsend your own messages';
  end if;
  if not public.conversation_is_live(m.conversation_id) then
    raise exception 'not_allowed: this conversation was deleted';
  end if;
  if m.unsent_at is not null then
    return paths;
  end if;
  if m.kind = 'text' then
    raise exception 'not_allowed: only photos, videos and voice memos can be unsent';
  end if;

  if m.kind = 'media' then
    select coalesce(array_agg(storage_path), '{}') into paths
      from public.attachments where message_id = msg;
    delete from public.attachments where message_id = msg;
    insert into private.storage_trash (bucket, path)
    select 'attachments', p from unnest(paths) as p;
  end if;

  update public.messages
     set unsent_at = now(), body = null, allow_save = false, voice_memo_id = null
   where id = msg;

  if m.kind = 'voice' and m.voice_memo_id is not null then
    select storage_path into memo_path from public.voice_memos where id = m.voice_memo_id;
    delete from public.voice_memos where id = m.voice_memo_id;
    if memo_path is not null then
      insert into private.storage_trash (bucket, path) values ('voice-memos', memo_path);
      paths := array[memo_path];
    end if;
  end if;

  return paths;
end;
$$;

-- ---------------------------------------------------------------------------
-- Voice memos: 5 minutes, 50 a day
-- ---------------------------------------------------------------------------

-- A few seconds of slack for how the recorder rounds.
alter table public.voice_memos add constraint voice_memo_max_length
  check (duration_ms <= 305000) not valid;

create or replace function public.enforce_voice_daily_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages
       where sender_id = new.sender_id and kind = 'voice'
         and created_at > now() - interval '1 day') >= 50 then
    raise exception 'rate_limited: you can send up to 50 voice memos a day';
  end if;
  return new;
end;
$$;

create trigger messages_voice_daily_cap
  before insert on public.messages
  for each row when (new.kind = 'voice')
  execute function public.enforce_voice_daily_cap();

-- ---------------------------------------------------------------------------
-- Who may call what (see 0012)
-- ---------------------------------------------------------------------------

revoke execute on function
  public.send_media(uuid, jsonb, text, boolean),
  public.unsend_message(uuid)
from public, anon;

grant execute on function
  public.send_media(uuid, jsonb, text, boolean),
  public.unsend_message(uuid)
to authenticated;

-- Retention job only.
revoke execute on function
  public.list_storage_trash(),
  public.clear_storage_trash(bigint[])
from public, anon, authenticated;

-- Trigger function.
revoke execute on function public.enforce_voice_daily_cap()
from public, anon, authenticated;
