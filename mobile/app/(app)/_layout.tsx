import { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { useLastNotificationResponse } from "expo-notifications";
import { registerForPush } from "../../src/lib/notifications";

export default function AppLayout() {
  const router = useRouter();
  const response = useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  // Keep this phone's token current without prompting.
  useEffect(() => {
    registerForPush({ ask: false });
  }, []);

  // Tapping a notification opens the conversation it's about.
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const conversationId = response.notification.request.content.data?.conversation_id;
    if (typeof conversationId === "string") {
      router.push(`/(app)/conversations/${conversationId}`);
    }
  }, [response, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#FAFAF9" },
        headerTintColor: "#1C1917",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#FAFAF9" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Ndo" }} />
      <Stack.Screen name="intake" options={{ title: "Tell us about your loss" }} />
      <Stack.Screen
        name="conversations"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="crisis" options={{ title: "Crisis Resources" }} />
      <Stack.Screen name="guidelines" options={{ title: "Guidelines" }} />
      <Stack.Screen name="my-data" options={{ title: "Your Data" }} />
      <Stack.Screen name="feedback" options={{ title: "Feedback" }} />
      <Stack.Screen name="password" options={{ title: "Password" }} />
    </Stack>
  );
}
