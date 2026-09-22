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
                  href="/reports"
                  className="text-stone-600 hover:text-stone-900 transition"
                >
                  Reports
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
