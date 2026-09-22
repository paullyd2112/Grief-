import { Stack } from "expo-router";

export default function ConversationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FAFAF9" },
        headerTintColor: "#1C1917",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#FAFAF9" },
      }}
    />
  );
}
