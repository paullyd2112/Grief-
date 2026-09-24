import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { duration, gutter, radius, space, useTheme } from "../../theme";
import { Icon } from "./Icon";
import { useReduceMotion } from "./motion";
import { Text } from "./Text";

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  // Set false for sheets that must be answered before closing.
  dismissable?: boolean;
}

// A sheet that rises from the bottom over a soft scrim. With Reduce Motion on,
// it fades in place instead of sliding.
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
}: BottomSheetProps) {
  const { color } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(0));
  // Stay mounted through the closing animation, then unmount.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? duration.slow : duration.base,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  const translateY = reduceMotion
    ? 0
    : progress.interpolate({ inputRange: [0, 1], outputRange: [480, 0] });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissable ? onClose : undefined}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]}
          onPress={dismissable ? onClose : undefined}
          accessibilityLabel={dismissable ? "Close" : undefined}
          accessible={dismissable}
        />
      </Animated.View>
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: color.surface,
              paddingBottom: Math.max(insets.bottom, space.lg) + space.sm,
              opacity: reduceMotion ? progress : 1,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: color.hairline }]} />
          {(title || dismissable) && (
            <View style={styles.header}>
              <Text variant="title2" accessibilityRole="header" style={styles.title}>
                {title ?? ""}
              </Text>
              {dismissable && (
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={space.md}
                  style={[styles.close, { backgroundColor: color.surfaceSunken }]}
                >
                  <Icon name="close" size={14} color={color.textSecondary} />
                </Pressable>
              )}
            </View>
          )}
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anchor: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.sm,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: radius.pill,
    marginBottom: space.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: gutter,
    paddingBottom: space.md,
    gap: space.md,
  },
  title: {
    flex: 1,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: gutter,
    gap: space.lg,
  },
});
