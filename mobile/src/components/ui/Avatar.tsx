import { StyleSheet, View } from "react-native";
import { avatarTint, fonts, useTheme } from "../../theme";
import { Text } from "./Text";

export interface AvatarProps {
  // Stable per-person seed (their user id), so the tint never changes.
  seed: string;
  name: string;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function Avatar({ seed, name, size = 48 }: AvatarProps) {
  const { scheme } = useTheme();
  const tint = avatarTint(seed, scheme);
  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tint.fill },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: fonts.serif,
          fontSize: size * 0.4,
          lineHeight: size * 0.5,
          color: tint.ink,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
