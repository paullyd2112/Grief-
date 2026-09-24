import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count: openReports } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .is("resolved_at", null);

  const { count: openConcerns } = await supabase
    .from("concerns")
    .select("id", { count: "exact", head: true })
    .is("handled_at", null);

  const { count: urgentConcerns } = await supabase
    .from("concerns")
    .select("id", { count: "exact", head: true })
    .is("handled_at", null)
    .eq("urgent", true);

  const { count: unreadFeedback } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-lg font-bold text-stone-900">
                Ndo
              </Link>
              <div className="flex gap-6 text-sm">
                <Link
                  href="/"
                  className="text-stone-600 hover:text-stone-900 transition"
                >
                  Queue
                </Link>
                <Link
                  href="/concerns"
                  className="text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5"
                >
                  Concerns
                  {!!openConcerns && (
                    <span
                      className={`${
                        urgentConcerns ? "bg-red-600" : "bg-amber-500"
                      } text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none`}
                    >
                      {openConcerns}
                    </span>
                  )}
                </Link>
                <Link
                  href="/reports"
                  className="text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5"
                >
                  Reports
                  {!!openReports && (
                    <span className="bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
                      {openReports}
                    </span>
                  )}
                </Link>
                <Link
                  href="/feedback"
                  className="text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5"
                >
                  Feedback
                  {!!unreadFeedback && (
                    <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none">
                      {unreadFeedback}
                    </span>
                  )}
                </Link>
                <Link
                  href="/access-log"
                  className="text-stone-600 hover:text-stone-900 transition"
                >
                  Access Log
                </Link>
              </div>
            </div>
            <span className="text-xs text-stone-400">{user.email}</span>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
