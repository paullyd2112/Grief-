// Ndo — shared types derived from the database schema.
// Keep in sync with supabase/migrations/.

export type RelationshipType =
  | "sibling"
  | "parent"
  | "child"
  | "partner"
  | "friend"
  | "other";

export type MannerOfDeath =
  | "illness"
  | "accident"
  | "violence"
  | "overdose"
  | "suicide"
  | "natural"
  | "unknown"
  | "prefer_not_to_say";

export type Suddenness = "sudden" | "gradual" | "prefer_not_to_say";

export type MatchPreference =
  | "similar_only"
  | "prefer_similar"
  | "open_to_anyone";

export type TalkFrequency =
  | "daily"
  | "few_times_a_week"
  | "weekly"
  | "on_hard_days"
  | "not_sure";

export type AccountStatus = "active" | "paused" | "suspended" | "deleted";

export type MessageKind = "text" | "voice";

export type MatchEndKind =
  | "left"
  | "reported_and_left"
  | "deleted"
  | "removed"
  | "account_deleted"
  | "blocked";

export interface Profile {
  id: string;
  display_name: string;
  name_is_pseudonym: boolean;
  date_of_birth: string;
  guidelines_accepted_at: string | null;
  status: AccountStatus;
  created_at: string;
}

export interface IntakeResponse {
  id: string;
  user_id: string;
  relationship: RelationshipType;
  relationship_detail: string | null;
  manner_of_death: MannerOfDeath | null;
  suddenness: Suddenness | null;
  deceased_age_range: string | null;
  time_since_loss: string;
  support_wanted: string[];
  match_preference: MatchPreference;
  financial_strain: boolean | null;
  talk_frequency: TalkFrequency | null;
  avoid_topics: string | null;
  free_text: string | null;
  timezone: string | null;
  submitted_at: string;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  matched_by: string | null;
  match_reason: string | null;
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
  end_kind: MatchEndKind | null;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  deleted_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  voice_memo_id: string | null;
  created_at: string;
}

export interface MatchEndNotice {
  id: string;
  recipient_id: string;
  match_id: string;
  leaver_name: string;
  created_at: string;
  seen_at: string | null;
}

export interface Warning {
  id: string;
  user_id: string;
  guidance: string;
  created_at: string;
  seen_at: string | null;
}
