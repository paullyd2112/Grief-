-- Ndo — "I'm worried about them"
--
-- Reporting blocks the other person and silently leaves, which is the wrong
-- tool when your match seems to be in crisis. Raising a concern does neither:
-- the conversation stays open and the other person is never told who raised
-- it. Operators see who is worried, about whom, and whatever note the worried
-- person chose to write. They never see the conversation.

create table public.concerns (
  id              uuid primary key default gen_random_uuid(),
  raised_by       uuid references public.profiles(id) on delete set null,
  about_user      uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  note            text,
  created_at      timestamptz not null default now(),
  handled_at      timestamptz,
  handled_by      uuid references public.profiles(id) on delete set null,
  handled_note    text,
  purge_after     timestamptz not null default (now() + interval '90 days')
);

-- One open concern per person per conversation. Raising it again updates the
-- note (and alerts again) rather than stacking rows.
create unique index concerns_one_open
  on public.concerns(raised_by, conversation_id) where handled_at is null;

alter table public.concerns enable row level security;

create policy concerns_read_own on public.concerns
  for select using (raised_by = auth.uid());
create policy concerns_read_admin on public.concerns
  for select using (public.is_admin());
-- No insert or update policies: all writes go through the functions below.

create or replace function public.raise_concern(conv uuid, concern_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  other uuid;
begin
  if not public.is_participant(conv) then
    raise exception 'not a participant';
  end if;

  select user_id into other
    from public.conversation_participants
   where conversation_id = conv and user_id <> auth.uid();

  insert into public.concerns (raised_by, about_user, conversation_id, note)
  values (auth.uid(), other, conv, nullif(trim(concern_note), ''))
  on conflict (raised_by, conversation_id) where handled_at is null
  do update set note = coalesce(excluded.note, public.concerns.note);
end;
$$;

-- The handled note lands in the access log, which the person the concern is
-- about can read in the app. It must never name who raised it.
create or replace function public.handle_concern(concern uuid, resolution_note text)
returns void language plpgsql security definer set search_path = public as $$
declare
  c public.concerns;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;
  if coalesce(trim(resolution_note), '') = '' then
    raise exception 'note_required';
  end if;

  update public.concerns
     set handled_at = now(), handled_by = auth.uid(), handled_note = resolution_note
   where id = concern and handled_at is null
  returning * into c;

  if c.id is null then
    raise exception 'concern_not_open';
  end if;

  insert into public.access_log
    (actor_id, subject_user_id, conversation_id, action, justification)
  values
    (auth.uid(), c.about_user, c.conversation_id, 'concern_handled', resolution_note);
end;
$$;

create or replace function public.purge_expired_concerns()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with gone as (
    delete from public.concerns where purge_after <= now() returning 1
  )
  select count(*) into n from gone;
  return n;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'purge-expired-concerns',
      '0 3 * * *',
      'select public.purge_expired_concerns();'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Alerts: one helper for every operator alert, reports included
-- ---------------------------------------------------------------------------

-- Posts to the webhook in Vault (see 0007). A missing Vault secret or pg_net
-- must never block the insert that triggered the alert.
create or replace function private.post_ops_alert(message text)
returns void language plpgsql security definer set search_path = public as $$
declare
  hook_url text;
begin
  select decrypted_secret into hook_url
    from vault.decrypted_secrets
   where name = 'report_alert_webhook_url';

  if hook_url is not null then
    perform net.http_post(url := hook_url, body := jsonb_build_object('text', message));
  end if;
exception when others then
  return;
end;
$$;

revoke all on function private.post_ops_alert(text) from public;

create or replace function public.notify_report_filed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.post_ops_alert(format(
    'New report filed on Ndo. %s open. Review it in the admin console.',
    (select count(*) from public.reports where resolved_at is null)));
  return new;
end;
$$;

create or replace function public.notify_concern_raised()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.post_ops_alert(
    'Someone on Ndo is worried about the person they''re talking to. Check Concerns in the admin console.');
  return new;
end;
$$;

create trigger concerns_notify
  after insert or update of note on public.concerns
  for each row execute function public.notify_concern_raised();
