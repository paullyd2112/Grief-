import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, space, useTheme } from "../../theme";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface NoticeBannerProps {
  // "accent" is a soft blue fill for things from Ndo (check-ins); "neutral" is
  // a quiet warm fill for everything else.
  tone?: "neutral" | "accent";
  icon?: IconName;
  title?: string;
  body?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function NoticeBanner({
  tone = "neutral",
  icon,
  title,
  body,
  children,
  style,
}: NoticeBannerProps) {
  const { color } = useTheme();
  const bg = tone === "accent" ? color.accentSoft : color.surfaceSunken;
  const iconColor = tone === "accent" ? color.accent : color.textSecondary;
  return (
    <View
      accessibilityRole="summary"
      style={[styles.banner, { backgroundColor: bg }, style]}
    >
      {icon && <Icon name={icon} size={20} color={iconColor} style={styles.icon} />}
      <View style={styles.body}>
        {title && <Text variant="headline">{title}</Text>}
        {body && (
          <Text variant="subhead" color="textSecondary">
            {body}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: space.md,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  icon: {
    marginTop: space.xxs,
  },
  body: {
    flex: 1,
    gap: space.xs,
  },
});
