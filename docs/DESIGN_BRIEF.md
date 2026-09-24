# Ndo redesign brief

**Context.** Ndo is a peer-support app that matches grieving people one-on-one.
It's built with Expo SDK 57, Expo Router and Supabase. Everything works; it
just looks like an unstyled prototype. The goal is Hinge-level polish, but
calmer and warmer: dignified, never clinical, never playful like a dating app.

## Don't change

- Any behavior, the database, `supabase/migrations/`, or `tests/`.
- Copy the founder has approved: the "I'm worried about them" sheet, the
  check-in card, the departure notice, the community guidelines, and the crisis
  resources.
- No AI features.

## Principles

- Restraint: one accent color, content instead of boxes, generous but
  intentional whitespace.
- Safety stays quiet: crisis help is always one tap away but never shouts.
- Accessibility: Dynamic Type, AA contrast, 44pt tap targets, respect Reduce
  Motion.

## 1. Design system first

Put tokens in `mobile/src/theme.ts` and build shared components before touching
screens.

- **Color:** warm off-white background and warm near-black text. One accent, a
  deep muted blue, replacing the stock `#3B82F6`. Own chat bubbles in the
  accent, theirs in warm grey. Red only for "Yes, right now". Plan for dark
  mode.
- **Type:** a serif for headings (e.g. Newsreader, Fraunces or Source Serif) and
  a clean sans for body text. Define a clear size scale.
- **Spacing and shape:** a 4pt grid and consistent corner radii (cards,
  bubbles, pills).
- **Icons:** one icon set (SF Symbols via `expo-symbols`). No emoji. Replace the
  🎤 mic.
- **Components:** Button (primary / secondary / quiet / destructive), list row,
  avatar (initials on a soft tint based on the user's id), bottom sheet, notice
  banner, text field, pill select, large-title header.
- **Motion:** subtle transitions and light haptics on send.

## 2. Navigation

- A bottom tab bar: Conversations, and You (profile and settings).
- Large-title headers.
- Sign out moves into You.
- Crisis help stays reachable from every screen, quietly.

## 3. Screens, in priority order

1. **Home / Conversations:** serif large title. Rows with avatar, name, message
   preview, time and unread dot, separated by hairlines instead of boxes. A calm
   waiting state. The onboarding steps become one progress block. The check-in
   becomes a soft inline card with one button and a text link. The departure
   notice gets a gentle restyle.
2. **Conversation:** header with avatar and name. Bubbles grouped by sender,
   with timestamps in day separators instead of under every bubble. Icon buttons
   for mic and send. A proper voice-memo waveform. The contact-info warning as
   an inline banner. The menu as a native iOS action sheet, with "I'm worried
   about them" first.
3. **Onboarding:** login as the brand moment (serif "Ndo" wordmark and tagline).
   A native date picker for the age gate. Create profile. Readable guidelines.
   Intake as one question per screen with a progress bar, gentler for someone
   grieving.
4. **You (Settings):** a profile header plus an iOS-style grouped list.
5. **Sheets:** the worried sheet and the report sheet, restyled with the same
   copy.
6. **Everything else:** crisis resources, your data, suspended, account deleted,
   and underage screens, all calm and typographic.
7. **Admin console:** last. Same palette, light cleanup only.

## 4. Brand

A serif "Ndo" wordmark, app icon and splash screen. The App Store needs the icon
and splash anyway.

## Process

1. Build the theme and components.
2. Mock up the home screen and get the founder's approval from screenshots.
3. Apply the design screen by screen.
4. Screenshot every screen at 390×844.
5. Try it on a phone with Expo Go or a development build.

## Technical notes

- Read `mobile/AGENTS.md` and check the SDK 57 docs before using `expo-font`,
  `@expo-google-fonts`, `expo-symbols`, `expo-haptics`, or Expo Router tabs.
- Install packages with `npx expo install`.
- Keep `npx tsc --noEmit` and `npx expo lint` clean.
- Web previews need `react-native-web`, `react-dom` and `@expo/metro-runtime`
  added properly, plus a `mobile/.env` with the Supabase URL and publishable key
  (see `mobile/.env.example`).

## Out of scope

Push notifications, App Store submission (beyond the icon and splash), billing.
