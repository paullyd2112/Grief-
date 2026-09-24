# Redesign: progress and review

Tracks the redesign described in [DESIGN_BRIEF.md](../DESIGN_BRIEF.md).

| Step | Status |
| --- | --- |
| 1. Theme and shared components | Done — `mobile/src/theme.ts`, `mobile/src/components/ui/` |
| 2. Home screen mockup, founder approval | **Waiting for approval** — screenshots below |
| 3. Apply screen by screen | Not started |
| 4. Screenshot every screen at 390×844 | Not started |
| 5. Try on a phone | Not started |

No live screen has changed yet. The mockup is a development-only route,
`/design-preview`, that renders the new home screen with sample data.

## Home mockup (390×844), round 2

Round 1 read as generic (beige, slate blue, pastel avatars, tinted boxes).
Round 2 aims for premium, made for people who are grieving: stationery rather
than software.

- **Paper and ink.** Almost everything is a warm neutral. The accent appears
  only on the primary action, links and the unread mark.
- **Type does the work.** Serif names in the list, two-line previews, hairline
  rules instead of cards.
- **Nothing gamified.** The onboarding progress bar and "1 of 2" are gone;
  the steps are numbered in serif numerals instead.
- **Quiet safety.** "Crisis help" is plain text in the header. The check-in is
  set like a short letter ("From Ndo").
- **Neutral avatars.** Initials on close warm greys, no rainbow tints.
- **Tab bar in ink**, not accent.

Screenshots are in [`home-mockup/`](home-mockup/).

| File | What it shows |
| --- | --- |
| `accent-comparison.png` | The three accent options side by side |
| `active-*-light.png`, `active-ink-dark.png` | Conversation list |
| `new-ink-light.png` | New user, onboarding steps |
| `waiting-ink-light.png` | Waiting for a match |
| `support-ink-*.png` | Check-in and departure notice above the list (full scroll) |
| `components-ink-light.png` | The component kit |

The tab bar in the mockup is a stand-in; the real one arrives with the
navigation step.

## Decisions to confirm

1. **Accent.** Ink `#1F2E4A` (recommended; the brief's "deep muted blue",
   pushed toward fountain-pen ink), Spruce `#22433B`, or Plum `#46304B`
   (aubergine, the traditional half-mourning color).
2. **Fonts.** Newsreader for headings and names, Inter for body text.
3. **Check-in card.** One button (988), "Text HELLO to 741741" as a link.
   Copy unchanged.
4. **Crisis help** as plain text in the header of every screen.

## Viewing it yourself

```bash
cd mobile
npx expo start --web
# open http://localhost:8081/design-preview?state=active&accent=ink
# states: new, waiting, active, support, components
# accents: ink, spruce, plum
```

Web needs a `mobile/.env` with any Supabase URL and key (see `.env.example`);
the preview doesn't call Supabase.
