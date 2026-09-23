"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resolveReport,
  logAccess,
  suspendUser,
  unsuspendUser,
} from "@/lib/admin-actions";
import type { AccountStatus } from "@/lib/types";

// Reporter and reported are null once that account has been hard-deleted.
export interface ReportRow {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  conversation_id: string | null;
  reason: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
  purge_after: string;
  legal_hold: boolean;
  resolved_at: string | null;
  resolution: string | null;
  reporter: { display_name: string } | null;
  reported: { display_name: string; status: AccountStatus } | null;
}

function SnapshotViewer({ report }: { report: ReportRow }) {
  const { snapshot } = report;
  const messages = Array.isArray(snapshot.messages) ? snapshot.messages : [];
  // The app records sender_id only; name it from the report's two parties.
  const nameFor = (senderId: unknown) => {
    if (senderId && senderId === report.reporter_id) {
      return report.reporter?.display_name ?? "Reporter";
    }
    if (senderId && senderId === report.reported_user_id) {
      return report.reported?.display_name ?? "Reported user";
    }
    return "Unknown";
  };
  if (messages.length === 0) {
    return (
      <p className="text-xs text-stone-400 italic">No messages in snapshot</p>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {messages.map((msg: Record<string, unknown>, i: number) => {
        const senderName = nameFor(msg.sender_id);
        const body = typeof msg.body === "string" ? msg.body : (msg.kind === "voice" ? "[voice memo]" : "");
        const ts = typeof msg.created_at === "string" ? msg.created_at : null;
        return (
          <div key={i} className="text-sm">
            <span className="font-medium text-stone-700">
              {senderName}:
            </span>{" "}
            <span className="text-stone-600">{body}</span>
            {ts && (
              <span className="text-xs text-stone-400 ml-2">
                {new Date(ts).toLocaleString()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function JustifiedAction({
  placeholder,
  buttonLabel,
  danger,
  onSubmit,
}: {
  placeholder: string;
  buttonLabel: string;
  danger?: boolean;
  onSubmit: (justification: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-3 pt-3 border-t border-stone-200 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
      />
      <button
        onClick={() => {
          if (text.trim()) onSubmit(text.trim());
        }}
        disabled={!text.trim()}
        className={`${
          danger ? "bg-red-600 hover:bg-red-700" : "bg-stone-900 hover:bg-stone-800"
        } text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ReportCard({
  report,
  onResolve,
  onSuspend,
  onUnsuspend,
}: {
  report: ReportRow;
  onResolve: (id: string, resolution: string) => void;
  onSuspend: (userId: string, justification: string) => void;
  onUnsuspend: (userId: string, justification: string) => void;
}) {
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [openForm, setOpenForm] = useState<"resolve" | "suspend" | "unsuspend" | null>(null);
  const toggleForm = (form: "resolve" | "suspend" | "unsuspend") =>
    setOpenForm((current) => (current === form ? null : form));

  const isOpen = !report.resolved_at;
  const reportedId = report.reported_user_id;
  const reportedName = report.reported?.display_name ?? "this user";
  const isSuspended = report.reported?.status === "suspended";

  return (
    <div
      className={`border rounded-xl p-4 ${
        isOpen
          ? "border-red-200 bg-red-50/30"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                isOpen
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {isOpen ? "Open" : "Resolved"}
            </span>
            {report.legal_hold && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Legal hold
              </span>
            )}
          </div>
          <p className="text-sm text-stone-600 mt-1">
            <span className="font-medium text-stone-900">
              {report.reporter?.display_name ?? "Unknown"}
            </span>{" "}
            reported{" "}
            <span className="font-medium text-stone-900">
              {report.reported?.display_name ?? "Unknown"}
            </span>
            {isSuspended && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-white">
                Suspended
              </span>
            )}
          </p>
        </div>
        <span className="text-xs text-stone-400">
          {new Date(report.created_at).toLocaleDateString()}
        </span>
      </div>

      {report.reason && (
        <p className="text-sm text-stone-700 mb-3">
          <span className="text-stone-500">Reason:</span> {report.reason}
        </p>
      )}

      {report.resolved_at && report.resolution && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-3">
          <p className="text-xs text-green-700 font-medium mb-1">Resolution</p>
          <p className="text-sm text-green-900">{report.resolution}</p>
          <p className="text-xs text-green-600 mt-1">
            {new Date(report.resolved_at).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="flex gap-2 text-sm">
        <button
          onClick={setShowSnapshot.bind(null, !showSnapshot)}
          className="text-stone-500 hover:text-stone-700 underline underline-offset-2"
        >
          {showSnapshot ? "Hide snapshot" : "View snapshot"}
        </button>
        {isOpen && (
          <button
            onClick={() => toggleForm("resolve")}
            className="text-stone-500 hover:text-stone-700 underline underline-offset-2"
          >
            Resolve
          </button>
        )}
        {reportedId && !isSuspended && (
          <button
            onClick={() => toggleForm("suspend")}
            className="text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            Suspend {reportedName}
          </button>
        )}
        {reportedId && isSuspended && (
          <button
            onClick={() => toggleForm("unsuspend")}
            className="text-stone-500 hover:text-stone-700 underline underline-offset-2"
          >
            Lift suspension
          </button>
        )}
      </div>

      {showSnapshot && (
        <div className="mt-3 pt-3 border-t border-stone-200">
          <SnapshotViewer report={report} />
        </div>
      )}

      {openForm === "resolve" && isOpen && (
        <JustifiedAction
          placeholder="Resolution notes (required)"
          buttonLabel="Mark resolved"
          onSubmit={(text) => onResolve(report.id, text)}
        />
      )}

      {openForm === "suspend" && reportedId && (
        <JustifiedAction
          placeholder={`Why you're suspending ${reportedName} (required, goes in the access log). Their conversations end and their partners see a neutral "left the conversation" notice.`}
          buttonLabel={`Suspend ${reportedName}`}
          danger
          onSubmit={(text) => {
            setOpenForm(null);
            onSuspend(reportedId, text);
          }}
        />
      )}

      {openForm === "unsuspend" && reportedId && (
        <JustifiedAction
          placeholder="Why you're lifting the suspension (required, goes in the access log)"
          buttonLabel="Lift suspension"
          onSubmit={(text) => {
            setOpenForm(null);
            onUnsuspend(reportedId, text);
          }}
        />
      )}

      <div className="mt-3 text-xs text-stone-400">
        Purges {new Date(report.purge_after).toLocaleDateString()}
        {report.legal_hold ? " (held)" : ""}
      </div>
    </div>
  );
}

export function ReportsList({ reports }: { reports: ReportRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const open = reports.filter((r) => !r.resolved_at);
  const resolved = reports.filter((r) => r.resolved_at);
  const shown = tab === "open" ? open : resolved;

  const handleResolve = async (reportId: string, resolution: string) => {
    setError(null);
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    await logAccess({
      subjectUserId: report.reported_user_id,
      action: "report_snapshot_read",
      justification: `Reviewed report snapshot to resolve report`,
      reportId,
    });

    startTransition(async () => {
      try {
        await resolveReport({
          reportId,
          resolution,
          reportedUserId: report.reported_user_id,
        });
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const runAction = (action: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const handleSuspend = (userId: string, justification: string) =>
    runAction(() => suspendUser({ userId, justification }));

  const handleUnsuspend = (userId: string, justification: string) =>
    runAction(() => unsuspendUser({ userId, justification }));

  return (
    <div>
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab("open")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            tab === "open"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Open ({open.length})
        </button>
        <button
          onClick={() => setTab("resolved")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            tab === "resolved"
              ? "bg-stone-900 text-white"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          Resolved ({resolved.length})
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {isPending && (
        <p className="text-sm text-stone-500 mb-3">Saving…</p>
      )}

      {shown.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <p>No {tab} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onResolve={handleResolve}
              onSuspend={handleSuspend}
              onUnsuspend={handleUnsuspend}
            />
          ))}
        </div>
      )}
    </div>
  );
}
