import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { gutter, space } from "../../theme";
import { Text } from "./Text";

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  // Small controls on the right, level with the title (e.g. crisis help).
  trailing?: ReactNode;
}

// A serif large title that sits at the top of scrolling content.
export function LargeTitleHeader({ title, subtitle, trailing }: LargeTitleHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="largeTitle" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {trailing}
      </View>
      {subtitle && (
        <Text variant="callout" color="textSecondary">
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: gutter,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    gap: space.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  title: {
    flexShrink: 1,
  },
});
