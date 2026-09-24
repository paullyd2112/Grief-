export function sendErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  if (message.startsWith("rate_limited")) {
    return "You've sent a lot of messages in a short time. Give it a minute, then try again.";
  }
  if (message.includes("row-level security")) {
    return "This conversation has ended.";
  }
  return "Check your connection and try again.";
}
