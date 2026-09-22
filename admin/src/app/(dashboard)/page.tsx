import { createClient } from "@/lib/supabase-server";
import { MatchingQueue } from "./matching-queue";
import type { IntakeWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = await createClient();

  // Unmatched users: have an intake response but no active match
  const { data: allIntakes } = await supabase
    .from("intake_responses")
    .select("*, profiles!inner(*)")
    .order("submitted_at", { ascending: true });

  // Active matches
  const { data: activeMatches } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .is("ended_at", null);

  const matchedUserIds = new Set<string>();
  activeMatches?.forEach((m) => {
    matchedUserIds.add(m.user_a);
    matchedUserIds.add(m.user_b);
  });

  const unmatched = (allIntakes as IntakeWithProfile[] | null)?.filter(
    (i) => !matchedUserIds.has(i.user_id) && i.profiles.status === "active"
  ) ?? [];

  const matched = (allIntakes as IntakeWithProfile[] | null)?.filter(
    (i) => matchedUserIds.has(i.user_id)
  ) ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Matching Queue</h1>
        <p className="text-stone-500 text-sm mt-1">
          {unmatched.length} waiting · {matched.length} matched
        </p>
      </div>

      {unmatched.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No one waiting</p>
          <p className="text-sm mt-1">
            New intakes will appear here as people sign up.
          </p>
        </div>
      ) : (
        <MatchingQueue intakes={unmatched} />
      )}
    </div>
  );
}
