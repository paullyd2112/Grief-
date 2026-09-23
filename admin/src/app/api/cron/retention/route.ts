import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const BUCKET = "voice-memos";
const ACCOUNT_GRACE_DAYS = 30;
// Runs daily, so a week of retries for any audio a client failed to remove.
const AUDIO_SWEEP_DAYS = 7;
const DAY_MS = 86_400_000;

async function removeConversationAudio(supabase: SupabaseClient, conversationId: string) {
  const bucket = supabase.storage.from(BUCKET);
  const { data: files, error } = await bucket.list(conversationId, { limit: 1000 });
  if (error) throw error;
  if (files.length === 0) return;
  const { error: removeError } = await bucket.remove(
    files.map((f) => `${conversationId}/${f.name}`)
  );
  if (removeError) throw removeError;
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

  // 1. Reports past their 90 days.
  const { data: purgedReports, error: purgeError } = await supabase.rpc(
    "purge_expired_reports"
  );
  if (purgeError) errors.push(`purge_expired_reports: ${purgeError.message}`);

  const { data: purgedConcerns, error: concernError } = await supabase.rpc(
    "purge_expired_concerns"
  );
  if (concernError) errors.push(`purge_expired_concerns: ${concernError.message}`);

  // 2. Audio left behind by recently deleted conversations.
  let sweptConversations = 0;
  const { data: deletedConvs, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .gte("deleted_at", new Date(Date.now() - AUDIO_SWEEP_DAYS * DAY_MS).toISOString());
  if (convError) errors.push(`list deleted conversations: ${convError.message}`);
  for (const conv of deletedConvs ?? []) {
    try {
      await removeConversationAudio(supabase, conv.id);
      sweptConversations++;
    } catch (e) {
      errors.push(`sweep ${conv.id}: ${describe(e)}`);
    }
  }

  // 3. Accounts past the 30-day grace period. Deleting the auth user cascades
  //    through everything in Postgres; audio and voice_memos rows don't
  //    cascade, so they go first. Any failure leaves the account for tomorrow.
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
        await removeConversationAudio(supabase, id);
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
    { purgedReports, purgedConcerns, sweptConversations, deletedAccounts, errors },
    { status: errors.length ? 500 : 200 }
  );
}
