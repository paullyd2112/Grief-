-- Ndo — core schema
-- See docs/ACCESS_POLICY.md. The access commitment is enforced here, in RLS,
-- not in application code.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

-- One row per signup attempt at the age gate. Primary key on user_id means a
-- person gets exactly one attempt: the form cannot teach them the right answer.
create table public.dob_attempts (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date        not null,
  passed        boolean     not null,
  attempted_at  timestamptz not null default now()
);

create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  -- Reddit model: a real name or an invented one, user's choice. The product
  -- does not distinguish, verify, or score on this.
  display_name           text not null check (char_length(trim(display_name)) between 2 and 32),
  name_is_pseudonym      boolean not null default false,
  date_of_birth          date not null,
  guidelines_accepted_at timestamptz,
  status                 text not null default 'active'
                           check (status in ('active','paused','suspended','deleted')),
  created_at             timestamptz not null default now(),
  deleted_at             timestamptz
);

create table public.admins (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Intake  (readable by operators — this is the matching input, and we say so)
-- ---------------------------------------------------------------------------

create table public.intake_responses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,

  relationship        text not null
                        check (relationship in ('sibling','parent','child','partner','friend','other')),
  relationship_detail text,          -- "older brother", "stepfather" — free text, never inferred

  -- Circumstances. Not an afterthought: these may matter as much as category.
  manner_of_death     text check (manner_of_death in
                        ('illness','accident','violence','overdose','suicide','natural','unknown','prefer_not_to_say')),
  suddenness          text check (suddenness in ('sudden','gradual','prefer_not_to_say')),
  deceased_age_range  text,
  time_since_loss     text not null,

  support_wanted      text[] not null default '{}',

  match_preference    text not null
                        check (match_preference in ('similar_only','prefer_similar','open_to_anyone')),

  -- Optional, self-declared, never inferred from loss type or anything else.
  financial_strain    boolean,

  free_text           text,          -- anything they want a match to know

  timezone            text,
  submitted_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index intake_one_per_user on public.intake_responses(user_id);

-- ---------------------------------------------------------------------------
-- Matching
-- ---------------------------------------------------------------------------

create table public.matches (
  id           uuid primary key default gen_random_uuid(),
  user_a       uuid not null references public.profiles(id) on delete cascade,
  user_b       uuid not null references public.profiles(id) on delete cascade,
  matched_by   uuid references public.profiles(id),

  -- The why. This free-text note is the dataset that decides whether any of
  -- this is ever worth automating. Required by the admin UI, not by the DB,
  -- so an urgent match is never blocked by a text box.
  match_reason text,

  created_at   timestamptz not null default now(),
  ended_at     timestamptz,
  ended_by     uuid references public.profiles(id),
  end_kind     text check (end_kind in ('left','reported_and_left','deleted')),

  constraint ordered_pair check (user_a < user_b),
  constraint no_self_match check (user_a <> user_b)
);

-- A pair is matched at most once at a time; history is preserved.
create unique index matches_active_pair
  on public.matches(user_a, user_b) where ended_at is null;

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Messages  (NO operator read path exists for these tables — by design)
-- ---------------------------------------------------------------------------

create table public.voice_memos (
  id                uuid primary key default gen_random_uuid(),
  storage_path      text not null,
  duration_ms       integer not null check (duration_ms > 0),
  transcript        text,
  transcript_status text not null default 'pending'
                      check (transcript_status in ('pending','ready','failed','skipped')),
  created_at        timestamptz not null default now()
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  kind            text not null default 'text' check (kind in ('text','voice')),
  body            text,
  voice_memo_id   uuid references public.voice_memos(id) on delete cascade,
  created_at      timestamptz not null default now(),

  constraint body_matches_kind check (
    (kind = 'text'  and body is not null and voice_memo_id is null) or
    (kind = 'voice' and voice_memo_id is not null)
  )
);

create index messages_conversation_created on public.messages(conversation_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------------

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete set null,
  reported_user_id uuid not null references public.profiles(id) on delete set null,
  conversation_id  uuid references public.conversations(id) on delete set null,

  -- Deliberately NOT a foreign key. The snapshot must survive deletion of the
  -- original message and of the whole conversation.
  message_id       uuid,

  reason           text,

  -- The only path by which conversation content reaches an operator. Written by
  -- the reporter's own client, which can already see it. A copy, not a pointer.
  snapshot         jsonb not null,

  created_at       timestamptz not null default now(),
  purge_after      timestamptz not null default (now() + interval '90 days'),
  legal_hold       boolean not null default false,
  resolved_at      timestamptz,
  resolution       text
);

create index reports_purge on public.reports(purge_after) where legal_hold = false;

create table public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Append-only. Every operator read of intake or of a report snapshot lands here.
create table public.access_log (
  id              bigserial primary key,
  actor_id        uuid references public.profiles(id) on delete set null,
  subject_user_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid,
  report_id       uuid,
  action          text not null,
  justification   text not null check (char_length(trim(justification)) > 0),
  created_at      timestamptz not null default now()
);

create index access_log_subject on public.access_log(subject_user_id, created_at desc);
