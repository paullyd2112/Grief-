export function sendErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  if (message.startsWith("rate_limited") && message.includes("a day")) {
    // Daily caps on photos, videos and voice memos. The database says which.
    return message.includes("voice")
      ? "You've sent 50 voice memos today, the daily limit. You can send more tomorrow."
      : "You've sent 50 photos and videos today, the daily limit. You can send more tomorrow.";
  }
  if (message.startsWith("rate_limited")) {
    return "You've sent a lot of messages in a short time. Give it a minute, then try again.";
  }
  if (message.startsWith("media_locked")) {
    return "Photos and videos unlock once you've both said hello.";
  }
  if (message.startsWith("too_many")) {
    return "You can send up to 10 photos or videos at a time.";
  }
  if (message.startsWith("too_long")) {
    return "Videos can be up to 60 seconds. Trim it in Photos first, then try again.";
  }
  if (message.startsWith("not_allowed") || message.includes("row-level security")) {
    return "This conversation has ended.";
  }
  return "Check your connection and try again.";
}
