// Ndo design tokens. Every screen and component reads color, type, spacing and
// shape from here; nothing else should hard-code a hex value or font size.
// See docs/DESIGN_BRIEF.md.

import { useColorScheme } from "react-native";

// ---------------------------------------------------------------------------
// Color
//
// Warm off-white and warm near-black, one deep muted blue accent. Red is
// reserved for the "Yes, right now" answer in the worried sheet. Every text
// pairing below meets WCAG AA (4.5:1) against the surface it sits on.
// ---------------------------------------------------------------------------

export interface Palette {
  background: string; // screen background
  surface: string; // cards, sheets, grouped list cells
  surfaceSunken: string; // text fields, subtle fills
  text: string; // primary text
  textSecondary: string; // supporting copy
  textTertiary: string; // timestamps, hints, placeholders
  hairline: string; // separators and outlines
  accent: string; // the one accent: buttons, links, unread dot, own bubbles
  accentPressed: string;
  accentSoft: string; // tinted fills: check-in card, selected pills
  onAccent: string; // text and icons on top of accent
  bubbleOwn: string;
  bubbleOwnText: string;
  bubbleTheirs: string;
  bubbleTheirsText: string;
  danger: string; // "Yes, right now" and destructive actions only
  dangerPressed: string;
  onDanger: string;
  scrim: string; // behind sheets and dialogs
}

const light: Palette = {
  background: "#F7F4EF",
  surface: "#FFFFFF",
  surfaceSunken: "#EFEAE3",
  text: "#221E1A",
  textSecondary: "#5F5850",
  textTertiary: "#716960",
  hairline: "#E4DDD3",
  accent: "#35507A",
  accentPressed: "#2A4064",
  accentSoft: "#E5EAF1",
  onAccent: "#FFFFFF",
  bubbleOwn: "#35507A",
  bubbleOwnText: "#FFFFFF",
  bubbleTheirs: "#ECE6DE",
  bubbleTheirsText: "#221E1A",
  danger: "#A8322A",
  dangerPressed: "#8C2922",
  onDanger: "#FFFFFF",
  scrim: "rgba(24, 20, 16, 0.4)",
};

const dark: Palette = {
  background: "#161412",
  surface: "#201D1A",
  surfaceSunken: "#2A2622",
  text: "#F1ECE5",
  textSecondary: "#B8AFA4",
  textTertiary: "#948B80",
  hairline: "#332E29",
  accent: "#9DB4D8",
  accentPressed: "#B4C6E2",
  accentSoft: "#222A36",
  onAccent: "#14181F",
  bubbleOwn: "#3D5A86",
  bubbleOwnText: "#FFFFFF",
  bubbleTheirs: "#2A2622",
  bubbleTheirsText: "#F1ECE5",
  danger: "#B23A31",
  dangerPressed: "#C4473D",
  onDanger: "#FFFFFF",
  scrim: "rgba(0, 0, 0, 0.55)",
};

export const palettes = { light, dark };

// Soft tints for avatars. Picked from the user's id so a person keeps the same
// color everywhere. Initials are drawn in `ink` on top of `fill`.
const avatarTints = {
  light: [
    { fill: "#E3E9F1", ink: "#2F4870" },
    { fill: "#EAE4DA", ink: "#5A4A33" },
    { fill: "#E2EBE4", ink: "#2F5A3D" },
    { fill: "#EFE3E1", ink: "#6E3A33" },
    { fill: "#E8E3EE", ink: "#4C3D6B" },
    { fill: "#E6E9E0", ink: "#4A5530" },
  ],
  dark: [
    { fill: "#26303F", ink: "#B8C8E2" },
    { fill: "#342D24", ink: "#DCCBB0" },
    { fill: "#243128", ink: "#B3D1BB" },
    { fill: "#382825", ink: "#E2BDB6" },
    { fill: "#2E2838", ink: "#CBBFE0" },
    { fill: "#2C3024", ink: "#C9D3B0" },
  ],
};

// ---------------------------------------------------------------------------
// Type
//
// Newsreader (serif) for headings, Inter (sans) for everything people read at
// length. Sizes follow the iOS text styles so Dynamic Type feels native; Text
// scales with the system setting by default.
// ---------------------------------------------------------------------------

export const fonts = {
  serif: "Newsreader_500Medium",
  serifSemibold: "Newsreader_600SemiBold",
  serifItalic: "Newsreader_400Regular_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
} as const;

export const type = {
  // Serif
  display: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50, letterSpacing: -0.5 },
  largeTitle: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40, letterSpacing: -0.3 },
  title1: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  title2: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  title3: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  // Sans
  headline: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 25 },
  bodyMedium: { fontFamily: fonts.sansMedium, fontSize: 17, lineHeight: 25 },
  callout: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 },
  subhead: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  subheadMedium: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 21 },
  footnote: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
} as const;

export type TypeVariant = keyof typeof type;

// ---------------------------------------------------------------------------
// Spacing and shape — a 4pt grid.
// ---------------------------------------------------------------------------

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// Horizontal inset for screen content.
export const gutter = space.xl;

export const radius = {
  sm: 8, // small chips, progress bars
  md: 12, // buttons, text fields
  lg: 16, // cards, banners
  xl: 24, // sheets
  bubble: 20,
  pill: 999,
} as const;

export const hairlineWidth = 1;

// Minimum tap target, per Apple's HIG.
export const minTapTarget = 44;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export const duration = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export interface Theme {
  scheme: "light" | "dark";
  color: Palette;
}

export function useTheme(): Theme {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, color: palettes[scheme] };
}

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function avatarTint(seed: string, scheme: "light" | "dark") {
  const tints = avatarTints[scheme];
  return tints[hash(seed) % tints.length];
}
