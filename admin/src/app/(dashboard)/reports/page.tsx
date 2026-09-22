import { createClient } from "@/lib/supabase-server";
import { ReportsList } from "./reports-list";

export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id: string | null;
  reason: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
  purge_after: string;
  legal_hold: boolean;
  resolved_at: string | null;
  resolution: string | null;
  reporter: { display_name: string } | null;
  reported: { display_name: string } | null;
}

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, reported_user_id, conversation_id, reason, snapshot, created_at, purge_after, legal_hold, resolved_at, resolution, reporter:profiles!reporter_id(display_name), reported:profiles!reported_user_id(display_name)"
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
