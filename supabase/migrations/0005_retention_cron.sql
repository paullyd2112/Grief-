-- Ndo — retention cron
--
-- If pg_cron is available, schedule purge_expired_reports() to run daily.
-- Otherwise the admin console hits /api/cron/purge-reports on a Vercel cron
-- schedule.

do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron not available — use the HTTP cron fallback';
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'purge-expired-reports',
      '0 3 * * *',          -- 03:00 UTC daily
      'select public.purge_expired_reports();'
    );
  end if;
end;
$$;
