-- Ndo — row-level security
--
-- The load-bearing fact about this file: there is no policy anywhere granting
-- an administrator SELECT on `messages` or `voice_memos`. That absence IS the
-- access commitment. If you are ever tempted to add one, read
-- docs/ACCESS_POLICY.md first, then don't.

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.is_participant(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv and user_id = auth.uid()
  );
$$;

create or replace function public.conversation_is_live(conv uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations where id = conv and deleted_at is null
  );
$$;

-- ---------------------------------------------------------------------------

alter table public.dob_attempts              enable row level security;
alter table public.profiles                  enable row level security;
alter table public.admins                    enable row level security;
alter table public.intake_responses          enable row level security;
alter table public.matches                   enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.voice_memos               enable row level security;
alter table public.reports                   enable row level security;
alter table public.blocks                    enable row level security;
alter table public.access_log                enable row level security;

-- Age gate: insert once, read your own. Nobody updates it, ever.
create policy dob_insert_self on public.dob_attempts
  for insert with check (user_id = auth.uid());
create policy dob_read_self on public.dob_attempts
  for select using (user_id = auth.uid());

-- Profiles: your own, your active match partners', and operators.
create policy profiles_read_self on public.profiles
  for select using (id = auth.uid());
create policy profiles_read_partner on public.profiles
  for select using (
    exists (
      select 1
      from public.conversation_participants mine
      join public.conversation_participants theirs
        on theirs.conversation_id = mine.conversation_id
      where mine.user_id = auth.uid() and theirs.user_id = public.profiles.id
    )
  );
create policy profiles_read_admin on public.profiles
  for select using (public.is_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

create policy admins_read_admin on public.admins
  for select using (public.is_admin());

-- Intake: yours, and operators'. This is the one content-ish thing an operator
-- can read, because hand-matching requires it. Users are told so at intake.
create policy intake_rw_self on public.intake_responses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy intake_read_admin on public.intake_responses
  for select using (public.is_admin());

-- Matches: the parties see their own; operators see all (metadata only).
create policy matches_read_party on public.matches
  for select using (user_a = auth.uid() or user_b = auth.uid());
create policy matches_read_admin on public.matches
  for select using (public.is_admin());
create policy matches_write_admin on public.matches
  for all using (public.is_admin()) with check (public.is_admin());

create policy conversations_read_party on public.conversations
  for select using (public.is_participant(id));
-- Operators see that a conversation exists and when it started/ended. Metadata.
create policy conversations_read_admin on public.conversations
  for select using (public.is_admin());

create policy participants_read_own on public.conversation_participants
  for select using (public.is_participant(conversation_id));
create policy participants_update_own on public.conversation_participants
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===========================================================================
-- MESSAGES AND VOICE MEMOS
-- Participants only. No admin policy. This is the commitment.
-- ===========================================================================

create policy messages_read_participant on public.messages
  for select using (
    public.is_participant(conversation_id) and public.conversation_is_live(conversation_id)
  );

create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and public.is_participant(conversation_id)
    and public.conversation_is_live(conversation_id)
    -- cannot send into an ended match
    and exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_id and m.ended_at is null
    )
  );

create policy voice_memos_read_participant on public.voice_memos
  for select using (
    exists (
      select 1 from public.messages msg
      where msg.voice_memo_id = public.voice_memos.id
        and public.is_participant(msg.conversation_id)
        and public.conversation_is_live(msg.conversation_id)
    )
  );

create policy voice_memos_insert_self on public.voice_memos
  for insert with check (auth.uid() is not null);

-- ===========================================================================

-- Reports: you file your own and can see what you filed. Operators review.
create policy reports_insert_self on public.reports
  for insert with check (reporter_id = auth.uid());
create policy reports_read_own on public.reports
  for select using (reporter_id = auth.uid());
create policy reports_read_admin on public.reports
  for select using (public.is_admin());
create policy reports_update_admin on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

create policy blocks_rw_self on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy blocks_read_admin on public.blocks
  for select using (public.is_admin());

-- Access log: append-only. A user can read their own history; operators can
-- read all of it. Nobody can update or delete — no policy grants it.
create policy access_log_read_self on public.access_log
  for select using (subject_user_id = auth.uid());
create policy access_log_read_admin on public.access_log
  for select using (public.is_admin());
create policy access_log_insert_admin on public.access_log
  for insert with check (public.is_admin() and actor_id = auth.uid());
