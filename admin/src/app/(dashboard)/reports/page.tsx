import { createClient } from "@/lib/supabase-server";
import { ReportsList, type ReportRow } from "./reports-list";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, reported_user_id, conversation_id, reason, snapshot, created_at, purge_after, legal_hold, resolved_at, resolution, reporter:profiles!reporter_id(display_name), reported:profiles!reported_user_id(display_name, status)"
    )
    .order("created_at", { ascending: false });

  const rows = (reports as ReportRow[] | null) ?? [];
  const open = rows.filter((r) => !r.resolved_at);
  const resolved = rows.filter((r) => r.resolved_at);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
        <p className="text-stone-500 text-sm mt-1">
          {open.length} open · {resolved.length} resolved
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No reports</p>
          <p className="text-sm mt-1">
            Reports from users will appear here.
          </p>
        </div>
      ) : (
        <ReportsList reports={rows} />
      )}
    </div>
  );
}
