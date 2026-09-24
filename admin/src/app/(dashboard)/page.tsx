import { createClient } from "@/lib/supabase-server";
import { MatchingQueue } from "./matching-queue";
import { pairKey } from "@/lib/pair-key";
import type { IntakeWithProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = await createClient();

  const { data: allIntakes } = await supabase
    .from("intake_responses")
    .select("*, profiles!inner(*)")
    .order("submitted_at", { ascending: true });

  const { data: allMatches } = await supabase
    .from("matches")
    .select("user_a, user_b, ended_at");

  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id");

  const activeMatchCounts: Record<string, number> = {};
  allMatches?.forEach((m) => {
    if (m.ended_at) return;
    activeMatchCounts[m.user_a] = (activeMatchCounts[m.user_a] ?? 0) + 1;
    activeMatchCounts[m.user_b] = (activeMatchCounts[m.user_b] ?? 0) + 1;
  });
  const countFor = (userId: string) => activeMatchCounts[userId] ?? 0;

  // The database refuses these pairs too; this just says so before you try.
  // A pair whose earlier match ended can be matched again unless one blocked
  // the other.
  const excludedPairs: Record<string, "blocked" | "currently_matched"> = {};
  const previousPairs: string[] = [];
  allMatches?.forEach((m) => {
    const key = pairKey(m.user_a, m.user_b);
    if (m.ended_at) previousPairs.push(key);
    else excludedPairs[key] = "currently_matched";
  });
  blocks?.forEach((b) => {
    excludedPairs[pairKey(b.blocker_id, b.blocked_id)] = "blocked";
  });

  // Everyone can hold several matches. People with none come first, longest
  // waiting at the top (the query is already oldest-first and sort is stable).
  const matchable = ((allIntakes as IntakeWithProfile[] | null) ?? [])
    .filter((i) => i.profiles.status === "active" && !i.profiles.deleted_at)
    .sort((a, b) => countFor(a.user_id) - countFor(b.user_id));

  const waiting = matchable.filter((i) => countFor(i.user_id) === 0).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Matching Queue</h1>
        <p className="text-stone-500 text-sm mt-1">
          {waiting} waiting for a first match · {matchable.length} people in total
        </p>
      </div>

      {matchable.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No one here yet</p>
          <p className="text-sm mt-1">
            New intakes will appear here as people sign up.
          </p>
        </div>
      ) : (
        <MatchingQueue
          intakes={matchable}
          excludedPairs={excludedPairs}
          previousPairs={previousPairs}
          activeMatchCounts={activeMatchCounts}
        />
      )}
    </div>
  );
}
