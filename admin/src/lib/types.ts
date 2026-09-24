// Shared with mobile/src/lib/types.ts — keep in sync.
// TODO: extract to a shared package when the monorepo warrants it.

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
  status: AccountStatus;
  created_at: string;
  deleted_at: string | null;
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

export interface IntakeWithProfile extends IntakeResponse {
  profiles: Profile;
}

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  matched_by: string | null;
  match_reason: string | null;
  created_at: string;
  ended_at: string | null;
  end_kind: MatchEndKind | null;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  reason: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
  purge_after: string;
  legal_hold: boolean;
  resolved_at: string | null;
  resolution: string | null;
}

export interface AccessLogEntry {
  id: number;
  actor_id: string | null;
  subject_user_id: string | null;
  conversation_id: string | null;
  report_id: string | null;
  action: string;
  justification: string;
  created_at: string;
}
