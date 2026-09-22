import { Stack } from "expo-router";

export default function AppLayout() {
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
    </Stack>
  );
}
