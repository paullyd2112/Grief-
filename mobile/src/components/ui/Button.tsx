import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { minTapTarget, radius, space, useTheme } from "../../theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "destructive";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  title: string;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  // Stretch to fill the container's width.
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = "primary",
  icon,
  loading = false,
  block = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { color } = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: color.accentFill, pressed: color.accentFillPressed, fg: color.onAccent, border: undefined },
    secondary: { bg: color.surface, pressed: color.surfaceSunken, fg: color.text, border: color.hairline },
    quiet: { bg: "transparent", pressed: color.surfaceSunken, fg: color.accent, border: undefined },
    destructive: { bg: color.danger, pressed: color.dangerPressed, fg: color.onDanger, border: undefined },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "quiet" ? styles.quiet : styles.filled,
        {
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border ?? "transparent",
        },
        block && styles.block,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={18} color={palette.fg} />}
          <Text
            variant={variant === "quiet" ? "bodyMedium" : "headline"}
            style={{ color: palette.fg }}
            align="center"
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTapTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filled: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  quiet: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  block: {
    alignSelf: "stretch",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  disabled: {
    opacity: 0.45,
  },
});
