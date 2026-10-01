import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gutter, space, useTheme } from "../../theme";

export interface ScreenProps {
  children: ReactNode;
  // Pinned below the scrolling content (a primary button, a footnote).
  footer?: ReactNode;
  // Centre the content vertically (sign-in, short status screens).
  centered?: boolean;
  // Set when a navigation header already covers the top safe area.
  underHeader?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

// The page every screen sits on: paper background, the gutter, safe areas,
// and the keyboard kept out of the way.
export function Screen({ children, footer, centered, underHeader, contentStyle }: ScreenProps) {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: color.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.fill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: (underHeader ? 0 : insets.top) + space.xl },
          centered && styles.centered,
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>{footer}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: gutter,
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  centered: { justifyContent: "center" },
  footer: { paddingHorizontal: gutter, paddingTop: space.sm, gap: space.sm },
});
