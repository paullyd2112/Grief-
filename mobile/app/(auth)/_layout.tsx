import { Stack } from "expo-router";
import { useTheme } from "../../src/theme";

export default function AuthLayout() {
  const { color } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.background },
      }}
    />
  );
}
