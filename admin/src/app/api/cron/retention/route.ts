import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Conversation files live at '<conversation_id>/<file>' in both buckets.
const CONVERSATION_BUCKETS = ["voice-memos", "attachments"];
const REPORTED_MEDIA_BUCKET = "reported-media";
const ACCOUNT_GRACE_DAYS = 30;
// Runs daily, so a week of retries for any files a client failed to remove.
const FILE_SWEEP_DAYS = 7;
const DAY_MS = 86_400_000;

async function removeConversationFiles(supabase: SupabaseClient, conversationId: string) {
  for (const name of CONVERSATION_BUCKETS) {
    const bucket = supabase.storage.from(name);
    const { data: files, error } = await bucket.list(conversationId, { limit: 1000 });
    if (error) throw error;
    if (files.length === 0) continue;
    const { error: removeError } = await bucket.remove(
      files.map((f) => `${conversationId}/${f.name}`)
    );
    if (removeError) throw removeError;
  }
}

// Paths of the photo and video copies a report's snapshot points to.
function reportedMediaPaths(snapshot: unknown): string[] {
  const messages = (snapshot as { messages?: unknown[] } | null)?.messages;
  if (!Array.isArray(messages)) return [];
  return messages.flatMap((m) => {
    const attachments = (m as { attachments?: unknown[] }).attachments;
    if (!Array.isArray(attachments)) return [];
    return attachments
      .map((a) => (a as { report_path?: unknown }).report_path)
      .filter((p): p is string => typeof p === "string");
  });
}

function describe(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const errors: string[] = [];

  // 1. Reports past their 90 days. Their photo and video copies go first,
  //    while the snapshot still says where they are.
  const { data: expiring, error: expiringError } = await supabase
    .from("reports")
    .select("snapshot")
    .eq("legal_hold", false)
    .lte("purge_after", new Date().toISOString());
  if (expiringError) errors.push(`list expiring reports: ${expiringError.message}`);
  const expiringMedia = (expiring ?? []).flatMap((r) => reportedMediaPaths(r.snapshot));
  for (let i = 0; i < expiringMedia.length; i += 100) {
    const { error } = await supabase.storage
      .from(REPORTED_MEDIA_BUCKET)
      .remove(expiringMedia.slice(i, i + 100));
    if (error) errors.push(`remove reported media: ${error.message}`);
  }

  const { data: purgedReports, error: purgeError } = await supabase.rpc(
    "purge_expired_reports"
  );
  if (purgeError) errors.push(`purge_expired_reports: ${purgeError.message}`);

  const { data: purgedConcerns, error: concernError } = await supabase.rpc(
    "purge_expired_concerns"
  );
  if (concernError) errors.push(`purge_expired_concerns: ${concernError.message}`);

  // 2. Files from unsent photos, videos and voice memos the sender's app
  //    didn't manage to remove.
  let clearedTrash = 0;
  const { data: trash, error: trashError } = await supabase.rpc("list_storage_trash");
  if (trashError) errors.push(`list_storage_trash: ${trashError.message}`);
  const trashRows = (trash ?? []) as { id: number; bucket: string; path: string }[];
  const cleared: number[] = [];
  for (const name of new Set(trashRows.map((r) => r.bucket))) {
    const rows = trashRows.filter((r) => r.bucket === name);
    const { error } = await supabase.storage.from(name).remove(rows.map((r) => r.path));
    if (error) errors.push(`empty trash (${name}): ${error.message}`);
    else cleared.push(...rows.map((r) => r.id));
  }
  if (cleared.length > 0) {
    const { error } = await supabase.rpc("clear_storage_trash", { ids: cleared });
    if (error) errors.push(`clear_storage_trash: ${error.message}`);
    else clearedTrash = cleared.length;
  }

  // 3. Audio, photos and videos left behind by recently deleted conversations.
  let sweptConversations = 0;
  const { data: deletedConvs, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .gte("deleted_at", new Date(Date.now() - FILE_SWEEP_DAYS * DAY_MS).toISOString());
  if (convError) errors.push(`list deleted conversations: ${convError.message}`);
  for (const conv of deletedConvs ?? []) {
    try {
      await removeConversationFiles(supabase, conv.id);
      sweptConversations++;
    } catch (e) {
      errors.push(`sweep ${conv.id}: ${describe(e)}`);
    }
  }

  // 4. Accounts past the 30-day grace period. Deleting the auth user cascades
  //    through everything in Postgres (attachments included); files in
  //    storage and voice_memos rows don't cascade, so they go first. Any failure leaves the account for tomorrow.
  let deletedAccounts = 0;
  const { data: dueAccounts, error: dueError } = await supabase
    .from("profiles")
    .select("id")
    .lte("deleted_at", new Date(Date.now() - ACCOUNT_GRACE_DAYS * DAY_MS).toISOString());
  if (dueError) errors.push(`list due accounts: ${dueError.message}`);
  for (const account of dueAccounts ?? []) {
    try {
      const { data: seats, error: seatError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", account.id);
      if (seatError) throw seatError;
      const conversationIds = (seats ?? []).map((s) => s.conversation_id);

      for (const id of conversationIds) {
        await removeConversationFiles(supabase, id);
      }

      if (conversationIds.length > 0) {
        const { data: voiceRows, error: voiceError } = await supabase
          .from("messages")
          .select("voice_memo_id")
          .in("conversation_id", conversationIds)
          .not("voice_memo_id", "is", null);
        if (voiceError) throw voiceError;
        const memoIds = (voiceRows ?? []).map((r) => r.voice_memo_id);
        if (memoIds.length > 0) {
          const { error: memoError } = await supabase
            .from("voice_memos")
            .delete()
            .in("id", memoIds);
          if (memoError) throw memoError;
        }
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(account.id);
      if (deleteError) throw deleteError;
      deletedAccounts++;
    } catch (e) {
      errors.push(`delete account ${account.id}: ${describe(e)}`);
    }
  }

  return NextResponse.json(
    {
      purgedReports,
      purgedConcerns,
      clearedTrash,
      sweptConversations,
      deletedAccounts,
      errors,
    },
    { status: errors.length ? 500 : 200 }
  );
}
