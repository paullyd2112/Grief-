import { StyleSheet, View } from "react-native";
import { avatarTint, fonts, hairlineWidth, useTheme } from "../../theme";
import { Text } from "./Text";

export interface AvatarProps {
  // Stable per-person seed (their user id), so the tint never changes.
  seed: string;
  name: string;
  size?: number;
}

// One initial, set in the serif. Two-letter monograms read as placeholders.
function initial(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "·";
}

export function Avatar({ seed, name, size = 48 }: AvatarProps) {
  const { scheme, color } = useTheme();
  const tint = avatarTint(seed, scheme);
  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint.fill,
          borderWidth: hairlineWidth,
          borderColor: color.hairline,
        },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: fonts.serif,
          fontSize: size * 0.44,
          lineHeight: size * 0.56,
          color: tint.ink,
        }}
      >
        {initial(name)}
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
