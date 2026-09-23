"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { handleConcern, sendCheckIn } from "@/lib/admin-actions";

export interface ConcernRow {
  id: string;
  note: string | null;
  urgent: boolean;
  created_at: string;
  handled_at: string | null;
  handled_note: string | null;
  check_in_sent_at: string | null;
  raiser: { display_name: string } | null;
  about: { display_name: string } | null;
}

function ConcernCard({
  concern,
  onHandle,
  onSendCheckIn,
}: {
  concern: ConcernRow;
  onHandle: (id: string, note: string) => void;
  onSendCheckIn: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const isOpen = !concern.handled_at;
  const aboutName = concern.about?.display_name ?? "a deleted account";

  return (
    <div
      className={`border rounded-xl p-4 ${
        !isOpen
          ? "border-stone-200 bg-white"
          : concern.urgent
            ? "border-red-300 bg-red-50/50"
            : "border-amber-300 bg-amber-50/40"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-stone-600">
          {concern.urgent && (
            <span className="mr-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
              Urgent: may be in danger now
            </span>
          )}
          <span className="font-medium text-stone-900">
            {concern.raiser?.display_name ?? "A deleted account"}
          </span>{" "}
          is worried about{" "}
          <span className="font-medium text-stone-900">{aboutName}</span>
        </p>
        <span className="text-xs text-stone-400">
          {new Date(concern.created_at).toLocaleString()}
        </span>
      </div>

      {concern.note ? (
        <p className="text-sm text-stone-800 bg-white border border-stone-200 rounded-lg p-3 mb-3">
          &ldquo;{concern.note}&rdquo;
        </p>
      ) : (
        <p className="text-xs text-stone-400 italic mb-3">No note left.</p>
      )}

      <div className="mb-3 text-sm">
        {concern.check_in_sent_at ? (
          <p className="text-stone-500">
            Check-in sent {new Date(concern.check_in_sent_at).toLocaleString()}
          </p>
        ) : concern.about ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Show ${aboutName} a check-in from Ndo with crisis lines? It won't mention this concern or who raised it.`
                  )
                ) {
                  onSendCheckIn(concern.id);
                }
              }}
              className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-blue-700 transition"
            >
              Send check-in
            </button>
            <span className="text-xs text-stone-500">
              {concern.urgent
                ? "Urgent: send it now."
                : "Not urgent: waiting a little makes it harder to connect to who raised this."}
            </span>
          </div>
        ) : null}
      </div>

      {concern.handled_at ? (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">
            Handled {new Date(concern.handled_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-green-900">{concern.handled_note}</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm text-stone-500 hover:text-stone-700 underline underline-offset-2"
          >
            Mark handled
          </button>
          {showForm && (
            <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="What you did (required)"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
              />
              <p className="text-xs text-amber-700">
                {aboutName} can read this note in their access log. Don&apos;t
                mention who raised the concern.
              </p>
              <button
                onClick={() => {
                  if (note.trim()) onHandle(concern.id, note.trim());
                }}
                disabled={!note.trim()}
                className="bg-stone-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition"
              >
                Mark handled
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ConcernsList({ concerns }: { concerns: ConcernRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onHandle = (concernId: string, note: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await handleConcern({ concernId, note });
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const onSendCheckIn = (concernId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await sendCheckIn({ concernId });
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const open = concerns.filter((c) => !c.handled_at);
  const ordered = [
    ...open.filter((c) => c.urgent),
    ...open.filter((c) => !c.urgent),
    ...concerns.filter((c) => c.handled_at),
  ];

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isPending && <p className="text-sm text-stone-500">Saving…</p>}
      {ordered.map((c) => (
        <ConcernCard
          key={c.id}
          concern={c}
          onHandle={onHandle}
          onSendCheckIn={onSendCheckIn}
        />
      ))}
    </div>
  );
}
