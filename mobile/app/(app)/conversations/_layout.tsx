import { Stack } from "expo-router";
import { fonts, useTheme } from "../../../src/theme";

export default function ConversationsLayout() {
  const { color } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.background },
        headerTintColor: color.text,
        headerTitleStyle: { fontFamily: fonts.sansSemibold, color: color.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: color.background },
      }}
    />
  );
}
