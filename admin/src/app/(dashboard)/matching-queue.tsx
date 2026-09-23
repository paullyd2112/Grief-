"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IntakeCard } from "@/components/intake-card";
import { createMatch, logAccess } from "@/lib/admin-actions";
import { pairKey } from "@/lib/pair-key";
import type { IntakeWithProfile } from "@/lib/types";

const EXCLUSION_MESSAGE = {
  blocked:
    "One of these people has blocked the other. They can't be matched.",
  currently_matched: "These two are already matched with each other.",
} as const;

export function MatchingQueue({
  intakes,
  excludedPairs,
  previousPairs,
  activeMatchCounts,
}: {
  intakes: IntakeWithProfile[];
  excludedPairs: Record<string, keyof typeof EXCLUSION_MESSAGE>;
  previousPairs: string[];
  activeMatchCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [matchReason, setMatchReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleSelect = (userId: string) => {
    setSelected((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= 2) return [prev[1], userId]; // shift window
      return [...prev, userId];
    });
  };

  const exclusion =
    selected.length === 2
      ? excludedPairs[pairKey(selected[0], selected[1])]
      : undefined;
  const matchedBefore =
    selected.length === 2 &&
    previousPairs.includes(pairKey(selected[0], selected[1]));

  const handleMatch = async () => {
    if (selected.length !== 2 || exclusion) return;
    if (!matchReason.trim()) {
      setError("Write why you're matching these two — it's the dataset.");
      return;
    }

    setError(null);

    // Log intake reads for both users
    for (const userId of selected) {
      await logAccess({
        subjectUserId: userId,
        action: "intake_read_for_matching",
        justification: `Reviewed intake to hand-match with another user`,
      });
    }

    startTransition(async () => {
      try {
        await createMatch({
          userA: selected[0],
          userB: selected[1],
          matchReason: matchReason.trim(),
        });
        setSelected([]);
        setMatchReason("");
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const selectedIntakes = intakes.filter((i) =>
    selected.includes(i.user_id)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Queue list */}
      <div className="flex-1 space-y-3">
        <p className="text-sm text-stone-500 mb-2">
          Select two people to match. Reading their intake is logged.
        </p>
        {intakes.map((intake) => (
          <IntakeCard
            key={intake.id}
            intake={intake}
            activeMatches={activeMatchCounts[intake.user_id] ?? 0}
            selected={selected.includes(intake.user_id)}
            onSelect={() => toggleSelect(intake.user_id)}
          />
        ))}
      </div>

      {/* Side-by-side compare + match action */}
      {selected.length > 0 && (
        <div className="lg:w-96 lg:sticky lg:top-8 space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">
            {selected.length === 1 ? "Select a second person" : "Compare"}
          </h2>

          {selectedIntakes.map((intake) => (
            <div
              key={intake.id}
              className="border border-stone-200 rounded-xl p-4 bg-white"
            >
              <div className="font-semibold text-stone-900 mb-2">
                {intake.profiles.display_name}
              </div>
              <div className="space-y-1.5 text-sm">
                <p>
                  <span className="text-stone-500">Lost:</span>{" "}
                  {intake.relationship_detail
                    ? `${intake.relationship} (${intake.relationship_detail})`
                    : intake.relationship}
                </p>
                <p>
                  <span className="text-stone-500">How:</span>{" "}
                  {intake.manner_of_death?.replace(/_/g, " ") ?? "—"}
                  {intake.suddenness && intake.suddenness !== "prefer_not_to_say"
                    ? `, ${intake.suddenness}`
                    : ""}
                </p>
                <p>
                  <span className="text-stone-500">When:</span>{" "}
                  {intake.time_since_loss}
                </p>
                <p>
                  <span className="text-stone-500">Pref:</span>{" "}
                  {intake.match_preference.replace(/_/g, " ")}
                </p>
                {intake.free_text && (
                  <p className="italic text-stone-600 mt-2 text-xs">
                    &ldquo;{intake.free_text}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}

          {exclusion && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {EXCLUSION_MESSAGE[exclusion]}
            </p>
          )}

          {matchedBefore && !exclusion && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              These two were matched before and that match ended. Neither
              blocked the other, so they can be matched again.
            </p>
          )}

          {selected.length === 2 && !exclusion && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Why are you matching these two?
                </label>
                <textarea
                  value={matchReason}
                  onChange={(e) => setMatchReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Both lost a younger sibling suddenly, within 8 months of each other. Both prefer similar."
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
                />
                <p className="text-xs text-stone-400 mt-1">
                  This note is the dataset. Fifty of these decide what&apos;s
                  worth automating.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleMatch}
                disabled={isPending}
                className="w-full bg-stone-900 text-white rounded-lg py-3 font-medium hover:bg-stone-800 disabled:opacity-50 transition"
              >
                {isPending ? "Creating match…" : "Create match"}
              </button>
            </div>
          )}

          <button
            onClick={() => setSelected([])}
            className="w-full text-stone-500 text-sm hover:text-stone-700"
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}
