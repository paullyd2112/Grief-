-- Ndo — alert operators when a report is filed
--
-- Posts to a Slack-compatible incoming webhook (Discord works too: append
-- /slack to a Discord webhook URL). The URL lives in Supabase Vault, never in
-- this repo:
--
--   select vault.create_secret('<webhook url>', 'report_alert_webhook_url');
--
-- The alert says only that a report exists and how many are open. No names,
-- no reason, no content — those stay behind the admin console's access log.

do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net not available — report alerts disabled';
end;
$$;

create or replace function public.notify_report_filed()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  hook_url   text;
  open_count integer;
begin
  select count(*) into open_count from public.reports where resolved_at is null;

  select decrypted_secret into hook_url
    from vault.decrypted_secrets
   where name = 'report_alert_webhook_url';

  if hook_url is not null then
    perform net.http_post(
      url  := hook_url,
      body := jsonb_build_object(
        'text',
        format('New report filed on Ndo. %s open. Review it in the admin console.', open_count)
      )
    );
  end if;

  return new;
-- A missing vault or pg_net must never stop someone from filing a report.
exception when others then
  return new;
end;
$$;

create trigger reports_notify
  after insert on public.reports
  for each row execute function public.notify_report_filed();
