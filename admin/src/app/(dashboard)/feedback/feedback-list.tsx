"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markFeedbackRead } from "@/lib/admin-actions";

// Author is null once that account has been deleted (feedback goes with it,
// so this only shows mid-deletion).
export interface FeedbackRow {
  id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  author: { display_name: string } | null;
}

export function FeedbackList({ feedback }: { feedback: FeedbackRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const markRead = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await markFeedbackRead({ feedbackId: id });
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {feedback.map((f) => (
        <div
          key={f.id}
          className={`border rounded-xl p-4 ${
            f.read_at ? "border-stone-200 bg-white" : "border-blue-200 bg-blue-50/30"
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-stone-900">
              {f.author?.display_name ?? "Unknown"}
            </span>
            <span className="text-xs text-stone-400">
              {new Date(f.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{f.body}</p>
          {!f.read_at && (
            <button
              onClick={() => markRead(f.id)}
              disabled={isPending}
              className="mt-3 text-sm text-stone-500 hover:text-stone-700 underline underline-offset-2 disabled:opacity-50"
            >
              Mark read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
