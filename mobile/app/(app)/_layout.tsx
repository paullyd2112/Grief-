import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useLastNotificationResponse } from "expo-notifications";
import { registerForPush } from "../../src/lib/notifications";
import { fonts, useTheme } from "../../src/theme";

// Notification taps only exist on phones; the web preview has no native module.
const useNotificationTap =
  Platform.OS === "web" ? () => null : useLastNotificationResponse;

export default function AppLayout() {
  const router = useRouter();
  const { color } = useTheme();
  const response = useNotificationTap();
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
        headerStyle: { backgroundColor: color.background },
        headerTintColor: color.text,
        headerTitleStyle: { fontFamily: fonts.sansSemibold, color: color.text },
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: color.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="intake" options={{ title: "" }} />
      <Stack.Screen
        name="conversations"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="crisis" options={{ title: "" }} />
      <Stack.Screen name="guidelines" options={{ title: "" }} />
      <Stack.Screen name="my-data" options={{ title: "" }} />
      <Stack.Screen name="feedback" options={{ title: "" }} />
      <Stack.Screen name="password" options={{ title: "" }} />
    </Stack>
  );
}
