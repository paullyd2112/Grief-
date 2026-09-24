import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { type Palette, type TypeVariant, type as typeScale, useTheme } from "../../theme";

type TextColor = Extract<
  keyof Palette,
  "text" | "textSecondary" | "textTertiary" | "accent" | "onAccent" | "danger" | "onDanger"
>;

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  color?: TextColor;
  align?: "left" | "center" | "right";
}

// Themed text. Scales with the system text size (Dynamic Type); large display
// styles are capped so headings don't swallow the screen.
export function Text({
  variant = "body",
  color = "text",
  align,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const { color: c } = useTheme();
  const isDisplay = variant === "display" || variant === "largeTitle";
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (isDisplay ? 1.4 : undefined)}
      style={[typeScale[variant], { color: c[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
