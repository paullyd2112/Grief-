import type { IntakeWithProfile, TalkFrequency } from "@/lib/types";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">{children}</span>;
}

function Value({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-stone-900">{children}</span>;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <Label>{label}</Label>
      <Value>{value}</Value>
    </div>
  );
}

function Badge({ children, color = "stone" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    stone: "bg-stone-100 text-stone-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] ?? colors.stone}`}>
      {children}
    </span>
  );
}

export const TALK_FREQUENCY_LABELS: Record<TalkFrequency, string> = {
  daily: "Most days",
  few_times_a_week: "A few times a week",
  weekly: "Once a week or so",
  on_hard_days: "When a hard day hits",
  not_sure: "Not sure yet",
};

export function IntakeCard({
  intake,
  activeMatches,
  selected,
  onSelect,
}: {
  intake: IntakeWithProfile;
  activeMatches: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const p = intake.profiles;
  const matchPrefLabels: Record<string, string> = {
    similar_only: "Similar loss only",
    prefer_similar: "Prefer similar",
    open_to_anyone: "Open to anyone",
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left border rounded-xl p-4 transition ${
        selected
          ? "border-stone-900 bg-stone-900/5 ring-1 ring-stone-900"
          : "border-stone-200 bg-white hover:border-stone-400"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-semibold text-stone-900">{p.display_name}</span>
          {p.name_is_pseudonym && (
            <span className="ml-2 text-xs text-stone-400">(pseudonym)</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {activeMatches === 0 ? (
            <Badge color="amber">No matches yet</Badge>
          ) : (
            <Badge color="green">
              {activeMatches} active {activeMatches === 1 ? "match" : "matches"}
            </Badge>
          )}
          <Badge color="blue">{matchPrefLabels[intake.match_preference] ?? intake.match_preference}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Row label="Relationship" value={
          intake.relationship_detail
            ? `${intake.relationship} — ${intake.relationship_detail}`
            : intake.relationship
        } />
        <Row label="Manner of death" value={intake.manner_of_death?.replace(/_/g, " ")} />
        <Row label="Suddenness" value={intake.suddenness?.replace(/_/g, " ")} />
        <Row label="Their age" value={intake.deceased_age_range} />
        <Row label="Time since loss" value={intake.time_since_loss} />
        <Row label="Timezone" value={intake.timezone} />
        <Row label="Wants to talk" value={intake.talk_frequency ? TALK_FREQUENCY_LABELS[intake.talk_frequency] : null} />
        <Row label="Would rather not discuss" value={intake.avoid_topics} />
        {intake.financial_strain !== null && (
          <Row label="Financial strain" value={intake.financial_strain ? "Yes" : "No"} />
        )}
      </div>

      {intake.free_text && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <Label>In their words</Label>
          <p className="text-sm text-stone-700 mt-1 italic">
            &ldquo;{intake.free_text}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-stone-400">
        Submitted {new Date(intake.submitted_at).toLocaleDateString()}
      </div>
    </button>
  );
}
