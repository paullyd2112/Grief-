-- Ndo — retention cron and guidelines tracking
--
-- If pg_cron is available (Supabase Pro+), schedule purge_expired_reports()
-- to run daily. Otherwise the admin console hits /api/cron/purge-reports on
-- a Vercel cron schedule.

-- Try to schedule the cron job; swallow the error if pg_cron is not installed.
do $$
begin
  perform cron.schedule(
    'purge-expired-reports',
    '0 3 * * *',          -- 03:00 UTC daily
    'select public.purge_expired_reports();'
  );
exception when undefined_function or insufficient_privilege then
  raise notice 'pg_cron not available — use the HTTP cron fallback';
end;
$$;
