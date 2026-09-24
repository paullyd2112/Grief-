import { SymbolView } from "expo-symbols";
import light from "expo-symbols/androidWeights/light";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

// The one icon set: SF Symbols on iOS, the matching Material Symbol on Android
// and web. Add new icons here so every platform has a counterpart.
const icons = {
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  chevronLeft: { ios: "chevron.left", android: "chevron_left", web: "chevron_left" },
  check: { ios: "checkmark", android: "check", web: "check" },
  checkCircle: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  circle: { ios: "circle", android: "radio_button_unchecked", web: "radio_button_unchecked" },
  close: { ios: "xmark", android: "close", web: "close" },
  mic: { ios: "mic", android: "mic", web: "mic" },
  send: { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" },
  stop: { ios: "stop.fill", android: "stop", web: "stop" },
  play: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
  pause: { ios: "pause.fill", android: "pause", web: "pause" },
  more: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
  support: { ios: "lifepreserver", android: "support", web: "support" },
  phone: { ios: "phone", android: "call", web: "call" },
  message: { ios: "message", android: "sms", web: "sms" },
  conversations: {
    ios: "bubble.left.and.bubble.right",
    android: "forum",
    web: "forum",
  },
  conversationsFill: {
    ios: "bubble.left.and.bubble.right.fill",
    android: "forum",
    web: "forum",
  },
  person: { ios: "person.crop.circle", android: "account_circle", web: "account_circle" },
  personFill: {
    ios: "person.crop.circle.fill",
    android: "account_circle",
    web: "account_circle",
  },
  info: { ios: "info.circle", android: "info", web: "info" },
  alert: { ios: "exclamationmark.circle", android: "error", web: "error" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  hourglass: { ios: "hourglass", android: "hourglass_empty", web: "hourglass_empty" },
  leaf: { ios: "leaf", android: "eco", web: "eco" },
} as const;

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  size?: number;
  color: ColorValue;
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 22, color, style }: IconProps) {
  return (
    <SymbolView
      name={icons[name]}
      size={size}
      tintColor={color}
      weight={{ ios: "regular", android: light }}
      style={style}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
