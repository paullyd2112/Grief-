-- Ndo — keep concern handling out of the subject's own access log
--
-- Someone may have only one or two matches, so "an operator handled a concern
-- about you" or "an operator sent you a check-in" would point straight at the
-- person who raised it. These entries stay in the log for operators and are
-- hidden from the person they're about. The check-in card is how that person
-- gets support; see docs/ACCESS_POLICY.md.

drop policy access_log_read_self on public.access_log;

create policy access_log_read_self on public.access_log
  for select using (
    subject_user_id = auth.uid()
    and action not in ('concern_handled', 'check_in_sent')
  );
