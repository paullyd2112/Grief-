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
select pg_temp.check('the notice captures the leaver name',
  (select leaver_name from public.match_end_notices
    where match_id = 'aaaaaaaa-0000-0000-0000-000000000002') = 'alex');

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

-- 11. A participant cannot move their seat into someone else's conversation.
set role postgres;
insert into auth.users (id) values
  ('55555555-5555-5555-5555-555555555555'),
  ('66666666-6666-6666-6666-666666666666');
insert into public.profiles (id, display_name, date_of_birth) values
  ('55555555-5555-5555-5555-555555555555', 'sam',   '1991-02-02'),
  ('66666666-6666-6666-6666-666666666666', 'jordan', '1987-07-07');
insert into public.matches (id, user_a, user_b) values
  ('aaaaaaaa-0000-0000-0000-000000000003',
   '55555555-5555-5555-5555-555555555555',
   '66666666-6666-6666-6666-666666666666');
insert into public.conversations (id, match_id) values
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003');

set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
do $$
begin
  update public.conversation_participants
     set conversation_id = 'cccccccc-0000-0000-0000-000000000003'
   where user_id = '44444444-4444-4444-4444-444444444444';
  raise exception 'FAIL: participant rewrote their conversation_id';
exception when insufficient_privilege then
  raise notice 'PASS  participant cannot move into another conversation';
end $$;

-- 12. mark_read stamps only the caller's own seat.
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
select public.mark_read('cccccccc-0000-0000-0000-000000000003');
set role postgres;
select pg_temp.check('mark_read stamps the caller',
  (select last_read_at is not null from public.conversation_participants
    where conversation_id = 'cccccccc-0000-0000-0000-000000000003'
      and user_id = '55555555-5555-5555-5555-555555555555'));
select pg_temp.check('mark_read leaves the other party alone',
  (select last_read_at is null from public.conversation_participants
    where conversation_id = 'cccccccc-0000-0000-0000-000000000003'
      and user_id = '66666666-6666-6666-6666-666666666666'));

-- 13. A user can rename themselves but cannot lift their own suspension.
update public.profiles set status = 'suspended'
 where id = '44444444-4444-4444-4444-444444444444';
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
update public.profiles set display_name = 'outsider2'
 where id = '44444444-4444-4444-4444-444444444444';
do $$
begin
  update public.profiles set status = 'active'
   where id = '44444444-4444-4444-4444-444444444444';
  raise exception 'FAIL: suspended user reactivated themselves';
exception when insufficient_privilege then
  raise notice 'PASS  suspended user cannot reactivate themselves';
end $$;
set role postgres;
select pg_temp.check('user can still change their display name',
  (select display_name from public.profiles
    where id = '44444444-4444-4444-4444-444444444444') = 'outsider2');

-- 14. Matching refuses blocked pairs and repeat pairs.
insert into public.blocks (blocker_id, blocked_id) values
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222');
do $$
begin
  insert into public.matches (user_a, user_b) values
    ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444');
  raise exception 'FAIL: matched a blocked pair';
exception when raise_exception then
  if sqlerrm not like 'blocked_pair%' then raise; end if;
  raise notice 'PASS  a blocked pair cannot be matched';
end $$;
do $$
begin
  insert into public.matches (user_a, user_b) values
    ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444');
  raise exception 'FAIL: re-matched a previous pair';
exception when raise_exception then
  if sqlerrm not like 'previously_matched%' then raise; end if;
  raise notice 'PASS  a previous pair cannot be re-matched';
end $$;

-- 15. Message rate limit: 20 a minute, then refused.
set role authenticated;
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
do $$
begin
  for i in 1..20 loop
    insert into public.messages (conversation_id, sender_id, kind, body)
    values ('cccccccc-0000-0000-0000-000000000003',
            '55555555-5555-5555-5555-555555555555', 'text', 'msg ' || i);
  end loop;
  raise notice 'PASS  20 messages in a minute are allowed';
  insert into public.messages (conversation_id, sender_id, kind, body)
  values ('cccccccc-0000-0000-0000-000000000003',
          '55555555-5555-5555-5555-555555555555', 'text', 'one too many');
  raise exception 'FAIL: 21st message in a minute was accepted';
exception when raise_exception then
  if sqlerrm not like 'rate_limited%' then raise; end if;
  raise notice 'PASS  the 21st message in a minute is refused';
end $$;

-- 16. Filing a report still works when alerts aren't configured.
set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
select public.report_message(
  'cccccccc-0000-0000-0000-000000000003',
  '55555555-5555-5555-5555-555555555555',
  null, 'spam', '{"messages": []}'::jsonb, true);
set role postgres;
select pg_temp.check('report is filed with no alert webhook configured',
  (select count(*) from public.reports
    where conversation_id = 'cccccccc-0000-0000-0000-000000000003') = 1);

-- --- fixtures for 17-21: three fresh pairs ----------------------------------
set role postgres;
insert into auth.users (id) values
  ('70000000-0000-0000-0000-000000000007'), ('80000000-0000-0000-0000-000000000008'),
  ('90000000-0000-0000-0000-000000000009'), ('a0000000-0000-0000-0000-00000000000a'),
  ('b0000000-0000-0000-0000-00000000000b'), ('c0000000-0000-0000-0000-00000000000c');
insert into public.profiles (id, display_name, date_of_birth) values
  ('70000000-0000-0000-0000-000000000007', 'casey',  '1990-01-01'),
  ('80000000-0000-0000-0000-000000000008', 'morgan', '1990-01-01'),
  ('90000000-0000-0000-0000-000000000009', 'drew',   '1990-01-01'),
  ('a0000000-0000-0000-0000-00000000000a', 'quinn',  '1990-01-01'),
  ('b0000000-0000-0000-0000-00000000000b', 'avery',  '1990-01-01'),
  ('c0000000-0000-0000-0000-00000000000c', 'rowan',  '1990-01-01');
insert into public.matches (id, user_a, user_b) values
  ('aaaaaaaa-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000007', '80000000-0000-0000-0000-000000000008'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-00000000000a'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c');
insert into public.conversations (id, match_id) values
  ('cccccccc-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004'),
  ('cccccccc-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000005'),
  ('cccccccc-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000006');
insert into storage.objects (bucket_id, name) values
  ('voice-memos', 'cccccccc-0000-0000-0000-000000000004/1.m4a'),
  ('voice-memos', 'cccccccc-0000-0000-0000-000000000003/1.m4a');

-- 17. Voice memo audio follows the same rule as messages.
set role authenticated;
set request.jwt.claim.sub = '70000000-0000-0000-0000-000000000007';
select pg_temp.check('participant sees only their own conversation''s audio',
  (select count(*) from storage.objects where bucket_id = 'voice-memos') = 1);

set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
select pg_temp.check('non-participant sees no audio',
  (select count(*) from storage.objects where bucket_id = 'voice-memos') = 0);

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('OPERATOR CANNOT LIST OR DOWNLOAD AUDIO',
  (select count(*) from storage.objects where bucket_id = 'voice-memos') = 0);

set request.jwt.claim.sub = '70000000-0000-0000-0000-000000000007';
insert into storage.objects (bucket_id, name)
values ('voice-memos', 'cccccccc-0000-0000-0000-000000000004/2.m4a');
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('voice-memos', 'cccccccc-0000-0000-0000-000000000003/2.m4a');
  raise exception 'FAIL: uploaded audio into someone else''s conversation';
exception when insufficient_privilege then
  raise notice 'PASS  cannot upload audio into someone else''s conversation';
end $$;

select public.delete_conversation('cccccccc-0000-0000-0000-000000000004');
set request.jwt.claim.sub = '80000000-0000-0000-0000-000000000008';
select pg_temp.check('audio is unreadable once the conversation is deleted',
  (select count(*) from storage.objects where bucket_id = 'voice-memos') = 0);

-- 18. New messages are published for live delivery.
set role postgres;
select pg_temp.check('messages are in the realtime publication',
  exists (select 1 from pg_publication_tables
           where pubname = 'supabase_realtime' and tablename = 'messages'));

-- 19. Suspension.
set role authenticated;
set request.jwt.claim.sub = '90000000-0000-0000-0000-000000000009';
do $$
begin
  perform public.suspend_user('a0000000-0000-0000-0000-00000000000a', 'retaliation');
  raise exception 'FAIL: a non-operator suspended someone';
exception when raise_exception then
  if sqlerrm <> 'not_admin' then raise; end if;
  raise notice 'PASS  only operators can suspend';
end $$;
do $$
begin
  perform private.end_matches_for(
    'a0000000-0000-0000-0000-00000000000a', '90000000-0000-0000-0000-000000000009', 'left');
  raise exception 'FAIL: users can call the internal end-matches helper';
exception when insufficient_privilege then
  raise notice 'PASS  the internal end-matches helper is not callable by users';
end $$;

set role postgres;
update public.profiles set status = 'suspended'
 where id = '90000000-0000-0000-0000-000000000009';
set role authenticated;
do $$
begin
  insert into public.messages (conversation_id, sender_id, kind, body)
  values ('cccccccc-0000-0000-0000-000000000005',
          '90000000-0000-0000-0000-000000000009', 'text', 'still here');
  raise exception 'FAIL: suspended user sent a message';
exception when insufficient_privilege then
  raise notice 'PASS  a suspended user cannot send messages';
end $$;
set role postgres;
update public.profiles set status = 'active'
 where id = '90000000-0000-0000-0000-000000000009';

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select public.suspend_user('90000000-0000-0000-0000-000000000009', 'confirmed harassment');
set role postgres;
select pg_temp.check('suspension ends the user''s matches',
  (select end_kind from public.matches
    where id = 'aaaaaaaa-0000-0000-0000-000000000005') = 'removed');
select pg_temp.check('their partner gets the neutral departure notice',
  (select leaver_name from public.match_end_notices
    where match_id = 'aaaaaaaa-0000-0000-0000-000000000005'
      and recipient_id = 'a0000000-0000-0000-0000-00000000000a') = 'drew');
select pg_temp.check('suspension is written to the access log',
  exists (select 1 from public.access_log
           where subject_user_id = '90000000-0000-0000-0000-000000000009'
             and action = 'user_suspended'));
do $$
begin
  insert into public.matches (user_a, user_b) values
    ('90000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-00000000000c');
  raise exception 'FAIL: matched a suspended user';
exception when raise_exception then
  if sqlerrm not like 'inactive_user%' then raise; end if;
  raise notice 'PASS  a suspended user cannot be matched';
end $$;

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select public.unsuspend_user('90000000-0000-0000-0000-000000000009', 'appeal accepted');
set role postgres;
select pg_temp.check('an operator can lift a suspension',
  (select status from public.profiles
    where id = '90000000-0000-0000-0000-000000000009') = 'active');

-- 20. Deleting your account.
set role authenticated;
set request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select public.delete_my_account();
set role postgres;
select pg_temp.check('deleting an account marks it deleted',
  (select deleted_at is not null from public.profiles
    where id = 'b0000000-0000-0000-0000-00000000000b'));
select pg_temp.check('deleting an account ends its matches',
  (select end_kind from public.matches
    where id = 'aaaaaaaa-0000-0000-0000-000000000006') = 'account_deleted');
select pg_temp.check('the partner is told they left, nothing more',
  (select count(*) from public.match_end_notices
    where match_id = 'aaaaaaaa-0000-0000-0000-000000000006'
      and recipient_id = 'c0000000-0000-0000-0000-00000000000c') = 1);
do $$
begin
  insert into public.matches (user_a, user_b) values
    ('70000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-00000000000b');
  raise exception 'FAIL: matched an account being deleted';
exception when raise_exception then
  if sqlerrm not like 'inactive_user%' then raise; end if;
  raise notice 'PASS  an account being deleted cannot be matched';
end $$;

set role authenticated;
select public.restore_my_account();
set role postgres;
select pg_temp.check('signing back in can keep the account',
  (select deleted_at is null from public.profiles
    where id = 'b0000000-0000-0000-0000-00000000000b'));

-- 21. Hard deletion works for someone who left, deleted, reported and was
--     reported, and the report outlives them.
delete from auth.users where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222');
select pg_temp.check('hard deletion succeeds for a user with history',
  not exists (select 1 from public.profiles
               where id in ('11111111-1111-1111-1111-111111111111',
                            '22222222-2222-2222-2222-222222222222')));
select pg_temp.check('the held report survives its reporter and subject',
  (select count(*) from public.reports
    where legal_hold and reporter_id is null and reported_user_id is null) = 1);

-- 22. One person can hold several active matches at once.
insert into public.matches (user_a, user_b) values
  ('70000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-00000000000a'),
  ('70000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-00000000000c');
select pg_temp.check('a person can have several active matches',
  (select count(*) from public.matches
    where ended_at is null
      and '70000000-0000-0000-0000-000000000007' in (user_a, user_b)) = 2);

-- 23. "I'm worried about them": reaches operators, ends nothing, tells no one.
insert into public.matches (id, user_a, user_b) values
  ('aaaaaaaa-0000-0000-0000-000000000007',
   '90000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-00000000000b');
insert into public.conversations (id, match_id) values
  ('cccccccc-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000007');

set role authenticated;
set request.jwt.claim.sub = '90000000-0000-0000-0000-000000000009';
select public.raise_concern('cccccccc-0000-0000-0000-000000000007', 'they said they don''t see the point');
select public.raise_concern('cccccccc-0000-0000-0000-000000000007', 'it''s getting worse');
select pg_temp.check('raising a concern twice keeps one open concern',
  (select count(*) from public.concerns) = 1);
select pg_temp.check('the second raise updates the note',
  (select note from public.concerns) = 'it''s getting worse');

set request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select pg_temp.check('the person it is about cannot see the concern',
  (select count(*) from public.concerns) = 0);

set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
do $$
begin
  perform public.raise_concern('cccccccc-0000-0000-0000-000000000007', 'not mine');
  raise exception 'FAIL: a non-participant raised a concern';
exception when raise_exception then
  if sqlerrm <> 'not a participant' then raise; end if;
  raise notice 'PASS  only a participant can raise a concern';
end $$;

set role postgres;
select pg_temp.check('the concern is about the other participant',
  (select about_user from public.concerns)
    = 'b0000000-0000-0000-0000-00000000000b');
select pg_temp.check('a concern leaves the conversation open',
  (select ended_at is null from public.matches
    where id = 'aaaaaaaa-0000-0000-0000-000000000007'));
select pg_temp.check('a concern blocks no one',
  not exists (select 1 from public.blocks
               where blocker_id = '90000000-0000-0000-0000-000000000009'));

set role authenticated;
set request.jwt.claim.sub = '90000000-0000-0000-0000-000000000009';
do $$
begin
  perform public.handle_concern((select id from public.concerns), 'closing it myself');
  raise exception 'FAIL: a non-operator handled a concern';
exception when raise_exception then
  if sqlerrm <> 'not_admin' then raise; end if;
  raise notice 'PASS  only operators can mark a concern handled';
end $$;

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select pg_temp.check('operators can see concerns',
  (select count(*) from public.concerns) = 1);
select public.handle_concern((select id from public.concerns), 'Reached out with support resources');
set role postgres;
select pg_temp.check('handling a concern is written to the access log',
  exists (select 1 from public.access_log
           where action = 'concern_handled'
             and subject_user_id = 'b0000000-0000-0000-0000-00000000000b'));

update public.concerns set purge_after = now() - interval '1 day';
select pg_temp.check('expired concerns are purged',
  public.purge_expired_concerns() = 1);

-- 24. Urgent concerns and check-ins from Ndo.
set role authenticated;
set request.jwt.claim.sub = '90000000-0000-0000-0000-000000000009';
select public.raise_concern('cccccccc-0000-0000-0000-000000000007', null, true);
select public.raise_concern('cccccccc-0000-0000-0000-000000000007', 'more detail', false);
set role postgres;
select pg_temp.check('"yes, right now" marks the concern urgent',
  (select urgent from public.concerns where handled_at is null));
select pg_temp.check('adding a note later does not downgrade urgency',
  (select urgent and note = 'more detail' from public.concerns where handled_at is null));

set role authenticated;
do $$
begin
  perform public.send_check_in((select id from public.concerns where handled_at is null));
  raise exception 'FAIL: a non-operator sent a check-in';
exception when raise_exception then
  if sqlerrm <> 'not_admin' then raise; end if;
  raise notice 'PASS  only operators can send a check-in';
end $$;

set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select public.send_check_in((select id from public.concerns where handled_at is null));

set request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select pg_temp.check('the person it is about receives the check-in',
  (select count(*) from public.check_ins) = 1);
update public.check_ins set seen_at = now();
select pg_temp.check('they can dismiss it',
  (select seen_at is not null from public.check_ins));
do $$
begin
  update public.check_ins set user_id = '90000000-0000-0000-0000-000000000009';
  raise exception 'FAIL: a check-in was reassigned';
exception when insufficient_privilege then
  raise notice 'PASS  a check-in cannot be changed beyond dismissing it';
end $$;

set request.jwt.claim.sub = '90000000-0000-0000-0000-000000000009';
select pg_temp.check('the worried person cannot see the check-in',
  (select count(*) from public.check_ins) = 0);

set role postgres;
select pg_temp.check('sending a check-in is written to the access log',
  exists (select 1 from public.access_log
           where action = 'check_in_sent'
             and subject_user_id = 'b0000000-0000-0000-0000-00000000000b'));

set role postgres;
\echo ''
\echo 'All access policy assertions passed.'
