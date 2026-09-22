"use server";

import { createClient } from "@/lib/supabase-server";

/**
 * Log an operator access. Every read of intake data or report snapshot
 * must go through this function. It writes to access_log, which is
 * append-only and visible to the subject user on request.
 */
export async function logAccess(params: {
  subjectUserId: string;
  action: string;
  justification: string;
  conversationId?: string;
  reportId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("access_log").insert({
    actor_id: user.id,
    subject_user_id: params.subjectUserId,
    action: params.action,
    justification: params.justification,
    conversation_id: params.conversationId ?? null,
    report_id: params.reportId ?? null,
  });
}

/**
 * Create a match between two users. The match_reason is the dataset
 * that decides whether anything is ever worth automating.
 */
export async function createMatch(params: {
  userA: string;
  userB: string;
  matchReason: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Ensure ordered pair (user_a < user_b) as the schema requires
  const [a, b] =
    params.userA < params.userB
      ? [params.userA, params.userB]
      : [params.userB, params.userA];

  // Create the match
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      user_a: a,
      user_b: b,
      matched_by: user.id,
      match_reason: params.matchReason,
    })
    .select()
    .single();

  if (matchError) throw new Error(matchError.message);

  // Create the conversation (trigger seats both participants)
  const { error: convError } = await supabase
    .from("conversations")
    .insert({ match_id: match.id });

  if (convError) throw new Error(convError.message);

  // Log access for both users
  const justification = `Hand-matched: ${params.matchReason}`;
  await logAccess({
    subjectUserId: a,
    action: "match_created",
    justification,
  });
  await logAccess({
    subjectUserId: b,
    action: "match_created",
    justification,
  });

  return match;
}

/**
 * Resolve a report.
 */
export async function resolveReport(params: {
  reportId: string;
  resolution: string;
  reportedUserId: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      resolved_at: new Date().toISOString(),
      resolution: params.resolution,
    })
    .eq("id", params.reportId);

  if (error) throw new Error(error.message);

  await logAccess({
    subjectUserId: params.reportedUserId,
    action: "report_resolved",
    justification: params.resolution,
    reportId: params.reportId,
  });
}
