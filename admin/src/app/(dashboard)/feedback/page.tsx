import { createClient } from "@/lib/supabase-server";
import { FeedbackList, type FeedbackRow } from "./feedback-list";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("id, body, created_at, read_at, author:profiles!user_id(display_name)")
    .order("created_at", { ascending: false });

  const rows = (data as FeedbackRow[] | null) ?? [];
  const unread = rows.filter((f) => !f.read_at).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Feedback</h1>
        <p className="text-stone-500 text-sm mt-1">
          What members sent from the app. {unread} unread.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No feedback yet</p>
        </div>
      ) : (
        <FeedbackList feedback={rows} />
      )}
    </div>
  );
}
