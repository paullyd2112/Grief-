-- Ndo — access policy regression test
--
-- Proves the commitments in docs/ACCESS_POLICY.md hold at the database level.
-- Run against a fresh database with the migrations applied. Any FAIL means the
-- product is making a promise it does not keep.

\set ON_ERROR_STOP on
\pset tuples_only on

create or replace function pg_temp.check(label text, ok boolean)
returns void language plpgsql as $$
begin
  raise notice '%  %', case when ok then 'PASS' else 'FAIL' end, label;
  if not ok then
    raise exception 'assertion failed: %', label;
  end if;
end $$;

-- --- fixtures (as superuser) -----------------------------------------------
set role postgres;

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444');

insert into public.profiles (id, display_name, date_of_birth) values
  ('11111111-1111-1111-1111-111111111111', 'alex',      '1990-01-01'),
  ('22222222-2222-2222-2222-222222222222', 'riley',     '1988-05-05'),
  ('33333333-3333-3333-3333-333333333333', 'operator',  '1985-03-03'),
  ('44444444-4444-4444-4444-444444444444', 'outsider',  '1992-09-09');

insert into public.admins (user_id) values ('33333333-3333-3333-3333-333333333333');

insert into public.matches (id, user_a, user_b, match_reason) values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222222',
   'both lost a younger sibling suddenly, within 8 months of each other');

insert into public.conversations (id, match_id) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.messages (id, conversation_id, sender_id, kind, body) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111', 'text', 'private content, operator must never see this'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'text', 'also private');

-- --- tests ------------------------------------------------------------------

-- 1. A participant reads their own conversation.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select pg_temp.check('participant can read their messages',
  (select count(*) from public.messages) = 2);

-- 2. A stranger reads nothing.
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select pg_temp.check('non-participant reads zero messages',
  (select count(*) from public.messages) = 0);

-- 3. THE COMMITMENT: an operator reads nothing.
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('operator is an admin', (select public.is_admin()));
select pg_temp.check('OPERATOR CANNOT READ MESSAGES',
  (select count(*) from public.messages) = 0);
select pg_temp.check('OPERATOR CANNOT READ VOICE MEMOS',
  (select count(*) from public.voice_memos) = 0);

-- 4. An operator can still read intake and match metadata (needed to match).
select pg_temp.check('operator can read profiles',
  (select count(*) from public.profiles) = 4);
select pg_temp.check('operator can read match metadata',
  (select count(*) from public.matches) = 1);

-- 5. Reporting hands over a snapshot, and that snapshot survives deletion.
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select public.report_message(
  'cccccccc-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'dddddddd-0000-0000-0000-000000000001',
  'harassment',
  '{"message": "private content, operator must never see this", "context": []}'::jsonb,
  true
);

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('operator can read the reported snapshot',
  (select snapshot->>'message' from public.reports limit 1) is not null);

-- 6. Report-and-leave is SILENT — no notice row for the reported party.
select pg_temp.check('report-and-leave notifies nobody',
  (select count(*) from public.match_end_notices) = 0);

set role postgres;
select pg_temp.check('report-and-leave recorded as silent end',
  (select end_kind from public.matches
    where id = 'aaaaaaaa-0000-0000-0000-000000000001') = 'reported_and_left');

-- 7. An ordinary departure DOES send a neutral notice.
insert into public.matches (id, user_a, user_b) values
  ('aaaaaaaa-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   '44444444-4444-4444-4444-444444444444');
insert into public.conversations (id, match_id) values
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002');

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.end_match('cccccccc-0000-0000-0000-000000000002', false);
set role postgres;
select pg_temp.check('ordinary departure sends one neutral notice',
  (select count(*) from public.match_end_notices
    where match_id = 'aaaaaaaa-0000-0000-0000-000000000002') = 1);
select pg_temp.check('the notice goes to the other party',
  (select recipient_id from public.match_end_notices
    where match_id = 'aaaaaaaa-0000-0000-0000-000000000002')
    = '44444444-4444-4444-4444-444444444444');

-- 8. Deleting a conversation removes content for BOTH parties.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select public.delete_conversation('cccccccc-0000-0000-0000-000000000001');
set role postgres;
select pg_temp.check('deletion removes messages for everyone',
  (select count(*) from public.messages
    where conversation_id = 'cccccccc-0000-0000-0000-000000000001') = 0);
select pg_temp.check('reported snapshot survives deletion',
  (select count(*) from public.reports) = 1);

-- 9. Retention purge respects legal hold.
update public.reports set purge_after = now() - interval '1 day';
select pg_temp.check('expired report is purged',
  public.purge_expired_reports() = 1);

insert into public.reports (reporter_id, reported_user_id, reason, snapshot, purge_after, legal_hold)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
        'held', '{}'::jsonb, now() - interval '1 day', true);
select pg_temp.check('legal hold survives the purge',
  public.purge_expired_reports() = 0);

-- 10. The age gate allows exactly one attempt.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.dob_attempts (user_id, date_of_birth, passed)
values ('11111111-1111-1111-1111-111111111111', '2010-01-01', false);
do $$
begin
  insert into public.dob_attempts (user_id, date_of_birth, passed)
  values ('11111111-1111-1111-1111-111111111111', '1990-01-01', true);
  raise exception 'FAIL: age gate allowed a second attempt';
exception when unique_violation then
  raise notice 'PASS  age gate allows exactly one attempt';
end $$;

set role postgres;
\echo ''
\echo 'All access policy assertions passed.'
