import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { gutter, hairlineWidth, minTapTarget, radius, space, useTheme } from "../../theme";
import { Icon } from "./Icon";
import { Text } from "./Text";

export interface ListRowProps {
  title: string;
  subtitle?: string | null;
  leading?: ReactNode;
  // A short value on the right (e.g. a time), or any node.
  trailing?: ReactNode;
  chevron?: boolean;
  // Emphasize the title and subtitle, e.g. for unread conversations.
  emphasized?: boolean;
  subtitleLines?: number;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

// A content row with no box around it. Stack rows inside <ListSection> or
// <ListGroup> to get hairline separators.
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron = false,
  emphasized = false,
  subtitleLines = 1,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ListRowProps) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: color.surfaceSunken },
        disabled && styles.disabled,
        style,
      ]}
    >
      {leading}
      <View style={styles.body}>
        <Text variant={emphasized ? "headline" : "bodyMedium"} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text
            variant="subhead"
            color={emphasized ? "text" : "textSecondary"}
            numberOfLines={subtitleLines}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {typeof trailing === "string" ? (
        <Text variant="footnote" color="textTertiary">
          {trailing}
        </Text>
      ) : (
        trailing
      )}
      {chevron && <Icon name="chevronRight" size={14} color={color.textTertiary} />}
    </Pressable>
  );
}

// Separates children with hairlines. `inset` lines the separator up with the
// row text (skip the avatar).
function withSeparators(children: ReactNode, inset: number, lineColor: string) {
  const items = Children.toArray(children).filter(isValidElement);
  return items.map((child, i) => (
    <Fragment key={child.key ?? i}>
      {i > 0 && (
        <View
          style={{
            height: hairlineWidth,
            backgroundColor: lineColor,
            marginLeft: inset,
          }}
        />
      )}
      {child}
    </Fragment>
  ));
}

// Edge-to-edge rows on the screen background, hairlines between them.
export function ListSection({
  children,
  inset = gutter,
}: {
  children: ReactNode;
  inset?: number;
}) {
  const { color } = useTheme();
  return <View>{withSeparators(children, inset, color.hairline)}</View>;
}

// iOS-style grouped list: rows on a rounded surface, with an optional header
// and footer. Used by the You screen.
export function ListGroup({
  children,
  header,
  footer,
  inset = space.lg,
}: {
  children: ReactNode;
  header?: string;
  footer?: string;
  inset?: number;
}) {
  const { color } = useTheme();
  return (
    <View style={styles.group}>
      {header && (
        <Text variant="footnote" color="textSecondary" style={styles.groupHeader}>
          {header.toUpperCase()}
        </Text>
      )}
      <View style={[styles.groupBody, { backgroundColor: color.surface }]}>
        {withSeparators(children, inset, color.hairline)}
      </View>
      {footer && (
        <Text variant="footnote" color="textTertiary" style={styles.groupFooter}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTapTarget + space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: gutter,
    paddingVertical: space.md,
  },
  body: {
    flex: 1,
    gap: space.xxs,
  },
  disabled: {
    opacity: 0.5,
  },
  group: {
    marginHorizontal: space.lg,
    marginBottom: space.xxl,
  },
  groupHeader: {
    marginLeft: space.lg,
    marginBottom: space.sm,
    letterSpacing: 0.4,
  },
  groupBody: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  groupFooter: {
    marginHorizontal: space.lg,
    marginTop: space.sm,
  },
});
