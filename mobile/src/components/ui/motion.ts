import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Tracks the system Reduce Motion setting. Components that animate should
// fall back to a plain fade (or no animation) when this is true.
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduce(value);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}

// Light, sparing haptics. Web has no Taptic Engine, so these are no-ops there.
export const haptics = {
  send() {
    if (Platform.OS === "web") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  select() {
    if (Platform.OS === "web") return;
    Haptics.selectionAsync().catch(() => {});
  },
};
