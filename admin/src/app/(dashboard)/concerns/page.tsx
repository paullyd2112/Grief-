import { createClient } from "@/lib/supabase-server";
import { ConcernsList, type ConcernRow } from "./concerns-list";

export const dynamic = "force-dynamic";

export default async function ConcernsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("concerns")
    .select(
      "id, note, created_at, handled_at, handled_note, raiser:profiles!raised_by(display_name), about:profiles!about_user(display_name)"
    )
    .order("created_at", { ascending: false });

  const rows = (data as ConcernRow[] | null) ?? [];
  const open = rows.filter((c) => !c.handled_at).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Concerns</h1>
        <p className="text-stone-500 text-sm mt-1">
          Someone was worried about the person they&apos;re talking to. The
          conversation is still open and that person hasn&apos;t been told.
          {" "}{open} open.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">No concerns</p>
        </div>
      ) : (
        <ConcernsList concerns={rows} />
      )}
    </div>
  );
}
