// Ndo design tokens. Every screen and component reads color, type, spacing and
// shape from here; nothing else should hard-code a hex value or font size.
// See docs/DESIGN_BRIEF.md.

import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

// ---------------------------------------------------------------------------
// Color
//
// Paper and ink. Almost everything is a warm neutral; the one accent is kept
// for the primary action, links and the unread mark, so it means something
// when it appears. Red is reserved for the "Yes, right now" answer in the
// worried sheet. Every text pairing meets WCAG AA (4.5:1).
// ---------------------------------------------------------------------------

export interface Palette {
  background: string; // screen background (paper)
  surface: string; // cards, sheets, grouped list cells
  surfaceSunken: string; // text fields, subtle fills
  text: string; // primary text (ink)
  textSecondary: string; // supporting copy
  textTertiary: string; // timestamps, hints, placeholders
  hairline: string; // separators and outlines
  accent: string; // primary buttons, links, unread mark, own bubbles
  accentPressed: string;
  accentSoft: string; // selected pills
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

type Neutrals = Omit<
  Palette,
  "accent" | "accentPressed" | "accentSoft" | "onAccent" | "bubbleOwn" | "bubbleOwnText"
>;

const neutrals: Record<"light" | "dark", Neutrals> = {
  light: {
    background: "#F4F1EB",
    surface: "#FAF8F4",
    surfaceSunken: "#EAE6DF",
    text: "#1C1B19",
    textSecondary: "#5C5852",
    textTertiary: "#6A655E",
    hairline: "#DEDAD2",
    bubbleTheirs: "#E8E4DC",
    bubbleTheirsText: "#1C1B19",
    danger: "#9E3029",
    dangerPressed: "#842721",
    onDanger: "#FFFFFF",
    scrim: "rgba(28, 27, 25, 0.4)",
  },
  dark: {
    background: "#131211",
    surface: "#1B1A18",
    surfaceSunken: "#252321",
    text: "#EDE9E3",
    textSecondary: "#ACA69E",
    textTertiary: "#8D877F",
    hairline: "#2D2A27",
    bubbleTheirs: "#252321",
    bubbleTheirsText: "#EDE9E3",
    danger: "#B23A31",
    dangerPressed: "#C4473D",
    onDanger: "#FFFFFF",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
};

// Accent options under review (docs/redesign). "ink" is the default.
export const accents = {
  // Blue-black, like fountain-pen ink.
  ink: {
    light: { accent: "#1F2E4A", accentPressed: "#16213A", accentSoft: "#E3E5EA", onAccent: "#FFFFFF", bubbleOwn: "#1F2E4A", bubbleOwnText: "#FFFFFF" },
    dark: { accent: "#AFBDD6", accentPressed: "#C3CEE2", accentSoft: "#232833", onAccent: "#131211", bubbleOwn: "#2E3F60", bubbleOwnText: "#FFFFFF" },
  },
  // Deep evergreen.
  spruce: {
    light: { accent: "#22433B", accentPressed: "#18332C", accentSoft: "#E1E7E3", onAccent: "#FFFFFF", bubbleOwn: "#22433B", bubbleOwnText: "#FFFFFF" },
    dark: { accent: "#A3C4B8", accentPressed: "#B8D3C9", accentSoft: "#1F2A26", onAccent: "#131211", bubbleOwn: "#2C5248", bubbleOwnText: "#FFFFFF" },
  },
  // Aubergine, the traditional color of half-mourning.
  plum: {
    light: { accent: "#46304B", accentPressed: "#36243A", accentSoft: "#E9E2E9", onAccent: "#FFFFFF", bubbleOwn: "#46304B", bubbleOwnText: "#FFFFFF" },
    dark: { accent: "#CDB5D0", accentPressed: "#DBC8DD", accentSoft: "#2A222B", onAccent: "#131211", bubbleOwn: "#583E5E", bubbleOwnText: "#FFFFFF" },
  },
} as const;

export type AccentName = keyof typeof accents;

export function buildPalette(scheme: "light" | "dark", accent: AccentName = "ink"): Palette {
  return { ...neutrals[scheme], ...accents[accent][scheme] };
}

export const palettes = { light: buildPalette("light"), dark: buildPalette("dark") };

// Avatars are quiet: close warm neutrals, told apart by initials, not color.
// Picked from the user's id so a person keeps the same tone everywhere.
const avatarTints = {
  light: [
    { fill: "#E6E1D8", ink: "#3D3A35" },
    { fill: "#E1DDD6", ink: "#3D3A35" },
    { fill: "#E4E2DC", ink: "#3D3A35" },
    { fill: "#E8E2DC", ink: "#3D3A35" },
  ],
  dark: [
    { fill: "#2A2724", ink: "#D8D2C9" },
    { fill: "#282624", ink: "#D8D2C9" },
    { fill: "#2B2926", ink: "#D8D2C9" },
    { fill: "#2C2825", ink: "#D8D2C9" },
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

// Lets the design preview swap accents; the app itself always uses the default.
export const AccentContext = createContext<AccentName>("ink");

export function useTheme(): Theme {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accent = useContext(AccentContext);
  return { scheme, color: buildPalette(scheme, accent) };
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
