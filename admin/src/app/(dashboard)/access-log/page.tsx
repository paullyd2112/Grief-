import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface AccessLogRow {
  id: number;
  actor_id: string | null;
  subject_user_id: string | null;
  action: string;
  justification: string;
  conversation_id: string | null;
  report_id: string | null;
  created_at: string;
  actor: { display_name: string } | null;
  subject: { display_name: string } | null;
}

const ACTION_LABELS: Record<string, string> = {
  intake_read_for_matching: "Read intake",
  match_created: "Created match",
  report_resolved: "Resolved report",
  report_snapshot_read: "Read snapshot",
};

export default async function AccessLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("access_log")
    .select(
      "id, actor_id, subject_user_id, action, justification, conversation_id, report_id, created_at, actor:profiles!actor_id(display_name), subject:profiles!subject_user_id(display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (logs as AccessLogRow[] | null) ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Access Log</h1>
        <p className="text-stone-500 text-sm mt-1">
          Every operator read of user data is logged here. Append-only.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No access logged yet</p>
          <p className="text-sm mt-1">
            Entries appear whenever an operator reads intake data or resolves a
            report.
          </p>
        </div>
      ) : (
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-3 font-medium text-stone-600">
                  When
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">
                  Operator
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">
                  Action
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">
                  Subject
                </th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">
                  Justification
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-stone-100 last:border-0"
                >
                  <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-900 font-medium">
                    {row.actor?.display_name ?? row.actor_id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {row.subject?.display_name ??
                      row.subject_user_id?.slice(0, 8) ??
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600 max-w-xs truncate">
                    {row.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
