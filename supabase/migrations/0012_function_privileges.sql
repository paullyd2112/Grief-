-- Ndo — who may call which database function
--
-- Supabase exposes every function in `public` as an RPC, callable signed out
-- by default. Nothing in Ndo is for signed-out use, some functions are only
-- for the retention job, and trigger functions are never called directly.
-- (Triggers still fire: Postgres doesn't check EXECUTE when a trigger runs.)

-- Called by signed-in users. Each checks the caller itself.
revoke execute on function
  public.end_match(uuid, boolean),
  public.delete_conversation(uuid),
  public.report_message(uuid, uuid, uuid, text, jsonb, boolean),
  public.mark_read(uuid),
  public.delete_my_account(),
  public.restore_my_account(),
  public.raise_concern(uuid, text, boolean),
  public.suspend_user(uuid, text),
  public.unsuspend_user(uuid, text),
  public.handle_concern(uuid, text),
  public.send_check_in(uuid)
from public, anon;

grant execute on function
  public.end_match(uuid, boolean),
  public.delete_conversation(uuid),
  public.report_message(uuid, uuid, uuid, text, jsonb, boolean),
  public.mark_read(uuid),
  public.delete_my_account(),
  public.restore_my_account(),
  public.raise_concern(uuid, text, boolean),
  public.suspend_user(uuid, text),
  public.unsuspend_user(uuid, text),
  public.handle_concern(uuid, text),
  public.send_check_in(uuid)
to authenticated;

-- Used inside row-level security policies, which run as the signed-in user.
revoke execute on function
  public.is_admin(),
  public.is_participant(uuid),
  public.conversation_is_live(uuid),
  public.caller_is_active(),
  public.can_send_to(uuid),
  public.voice_object_conversation(text)
from public, anon;

grant execute on function
  public.is_admin(),
  public.is_participant(uuid),
  public.conversation_is_live(uuid),
  public.caller_is_active(),
  public.can_send_to(uuid),
  public.voice_object_conversation(text)
to authenticated;

-- Retention job only (pg_cron runs as the owner; the Vercel route uses the
-- service role).
revoke execute on function
  public.purge_expired_reports(),
  public.purge_expired_concerns()
from public, anon, authenticated;

-- Trigger functions.
revoke execute on function
  public.guard_match_pair(),
  public.enforce_message_rate_limit(),
  public.notify_report_filed(),
  public.notify_concern_raised(),
  public.seed_conversation_participants()
from public, anon, authenticated;

alter function public.voice_object_conversation(text) set search_path = '';

-- pg_net belongs in the extensions schema; its functions live in `net`
-- either way, so the alert helper is unaffected. It can't be moved with SET
-- SCHEMA, and nothing depends on it yet, so reinstall it.
do $$
begin
  if exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
              where e.extname = 'pg_net' and n.nspname = 'public') then
    drop extension pg_net;
    create extension pg_net with schema extensions;
  end if;
exception when others then
  raise notice 'pg_net could not be moved: %', sqlerrm;
end;
$$;
