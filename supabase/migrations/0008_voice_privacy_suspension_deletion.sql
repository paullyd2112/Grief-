-- Ndo — voice memo privacy, live delivery, suspension, account deletion

-- ---------------------------------------------------------------------------
-- Voice memo storage
-- ---------------------------------------------------------------------------
-- Objects live at '<conversation_id>/<file>'. 0004 let any signed-in account
-- list and download every object in the bucket, operators included. Access
-- now follows the same rule as the messages table: participants of a live
-- conversation only.

create or replace function public.voice_object_conversation(object_name text)
returns uuid language sql immutable as $$
  select case
    when split_part(object_name, '/', 1)
         ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

create or replace function public.caller_is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and status = 'active' and deleted_at is null
  );
$$;

create or replace function public.can_send_to(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.caller_is_active()
     and public.is_participant(conv)
     and exists (
       select 1 from public.conversations c
       join public.matches m on m.id = c.match_id
       where c.id = conv and c.deleted_at is null and m.ended_at is null
     );
$$;

drop policy if exists storage_voice_upload on storage.objects;
drop policy if exists storage_voice_read on storage.objects;

create policy storage_voice_upload on storage.objects
  for insert with check (
    bucket_id = 'voice-memos'
    and public.can_send_to(public.voice_object_conversation(name))
  );

create policy storage_voice_read on storage.objects
  for select using (
    bucket_id = 'voice-memos'
    and public.is_participant(public.voice_object_conversation(name))
    and public.conversation_is_live(public.voice_object_conversation(name))
  );

-- Lets the deleting participant remove both sides' audio before the
-- conversation row is marked deleted. The daily retention job sweeps anything
-- left behind.
create policy storage_voice_delete on storage.objects
  for delete using (
    bucket_id = 'voice-memos'
    and public.is_participant(public.voice_object_conversation(name))
  );

-- ---------------------------------------------------------------------------
-- Live message delivery
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Suspended or deleting accounts can't send or be matched
-- ---------------------------------------------------------------------------

create policy messages_insert_active_only on public.messages
  as restrictive for insert to authenticated
  with check (public.caller_is_active());

create policy voice_memos_insert_active_only on public.voice_memos
  as restrictive for insert to authenticated
  with check (public.caller_is_active());

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
-- Ending every match for one account (suspension, account deletion)
-- ---------------------------------------------------------------------------

alter table public.matches drop constraint matches_end_kind_check;
alter table public.matches add constraint matches_end_kind_check
  check (end_kind in ('left','reported_and_left','deleted','removed','account_deleted'));

-- Not in `public`, so it isn't exposed as an RPC: it acts on any account.
create schema if not exists private;
revoke all on schema private from public;

-- The partner gets the same neutral notice as an ordinary departure. It never
-- says the other person was suspended.
create or replace function private.end_matches_for(target uuid, ender uuid, kind text)
returns void language plpgsql security definer set search_path = public as $$
declare
  m record;
  target_name text;
begin
  select display_name into target_name from public.profiles where id = target;

  for m in
    update public.matches
       set ended_at = now(), ended_by = ender, end_kind = kind
     where (user_a = target or user_b = target) and ended_at is null
     returning id, case when user_a = target then user_b else user_a end as partner
  loop
    insert into public.match_end_notices (recipient_id, match_id, leaver_name)
    values (m.partner, m.id, target_name);
  end loop;
end;
$$;

revoke all on function private.end_matches_for(uuid, uuid, text) from public;

-- ---------------------------------------------------------------------------
-- Suspension (operators)
-- ---------------------------------------------------------------------------

create or replace function public.suspend_user(target uuid, justification text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if coalesce(trim(justification), '') = '' then
    raise exception 'justification_required';
  end if;

  update public.profiles set status = 'suspended' where id = target;
  perform private.end_matches_for(target, auth.uid(), 'removed');

  insert into public.access_log (actor_id, subject_user_id, action, justification)
  values (auth.uid(), target, 'user_suspended', justification);
end;
$$;

create or replace function public.unsuspend_user(target uuid, justification text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if coalesce(trim(justification), '') = '' then
    raise exception 'justification_required';
  end if;

  update public.profiles set status = 'active'
   where id = target and status = 'suspended';

  insert into public.access_log (actor_id, subject_user_id, action, justification)
  values (auth.uid(), target, 'user_unsuspended', justification);
end;
$$;

-- ---------------------------------------------------------------------------
-- Account deletion (users)
-- ---------------------------------------------------------------------------
-- Deleting ends every match and hides the account immediately. The account is
-- hard-deleted 30 days later by the retention job (see docs/ACCESS_POLICY.md);
-- signing back in before then offers to keep it. Status is left alone, so a
-- suspended account can't clear its suspension by deleting and restoring.

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles set deleted_at = now()
   where id = auth.uid() and deleted_at is null;
  perform private.end_matches_for(auth.uid(), auth.uid(), 'account_deleted');
end;
$$;

create or replace function public.restore_my_account()
returns void language sql security definer set search_path = public as $$
  update public.profiles set deleted_at = null where id = auth.uid();
$$;

-- Hard deletion removes the auth user and cascades. These references must not
-- block it: whoever ended a match, deleted a conversation, or filed or
-- received a report.
alter table public.reports alter column reporter_id drop not null;
alter table public.reports alter column reported_user_id drop not null;

alter table public.matches drop constraint matches_ended_by_fkey;
alter table public.matches add constraint matches_ended_by_fkey
  foreign key (ended_by) references public.profiles(id) on delete set null;

alter table public.matches drop constraint matches_matched_by_fkey;
alter table public.matches add constraint matches_matched_by_fkey
  foreign key (matched_by) references public.profiles(id) on delete set null;

alter table public.conversations drop constraint conversations_deleted_by_fkey;
alter table public.conversations add constraint conversations_deleted_by_fkey
  foreign key (deleted_by) references public.profiles(id) on delete set null;
