# Redesign: progress and review

Tracks the redesign described in [DESIGN_BRIEF.md](../DESIGN_BRIEF.md).

| Step | Status |
| --- | --- |
| 1. Theme and shared components | Done — `mobile/src/theme.ts`, `mobile/src/components/ui/` |
| 2. Home screen mockup, founder approval | Accent and fonts approved (round 3); two smaller decisions open, below |
| 3. Apply screen by screen | Not started |
| 4. Screenshot every screen at 390×844 | Not started |
| 5. Try on a phone | Not started |

No live screen has changed yet. The mockup is a development-only route,
`/design-preview`, that renders the new home screen with sample data.

## Home mockup (390×844), round 3

Round 3 keeps round 2's layout and changes the type: Instrument Serif for the
wordmark, titles and avatar initials, and Figtree for everything else. Names in
the conversation list moved from the serif to Figtree, because Instrument Serif
is too fine at list sizes. The founder picked this pairing from a comparison of
seven, then of Fraunces and Instrument Serif with their crosses.

### Round 2

Round 1 read as generic (beige, slate blue, pastel avatars, tinted boxes).
Round 2 aims for premium, made for people who are grieving: stationery rather
than software.

- **Paper and ink.** Almost everything is a warm neutral. The accent appears
  only on the primary action, links and the unread mark.
- **Type does the work.** Two-line previews and hairline rules instead of
  cards. (Round 2 set names in the serif; round 3 moved them to the sans.)
- **Nothing gamified.** The onboarding progress bar and "1 of 2" are gone;
  the steps are numbered in serif numerals instead.
- **Quiet safety.** "Crisis help" is plain text in the header. The check-in is
  set like a short letter ("From Ndo").
- **Neutral avatars.** Initials on close warm greys, no rainbow tints.
- **Tab bar in ink**, not accent.

Screenshots are in [`home-mockup/`](home-mockup/).

| File | What it shows |
| --- | --- |
| `accent-comparison.png` | The three accent options side by side (round 2 fonts) |
| `active-plum-*.png` | Conversation list (`active-ink-light` and `active-spruce-light` are round 2) |
| `new-plum-*.png` | New user, onboarding steps |
| `waiting-plum-*.png` | Waiting for a match |
| `support-plum-*.png` | Check-in and departure notice above the list (full scroll) |
| `components-plum-*.png` | The component kit |

The tab bar in the mockup is a stand-in; the real one arrives with the
navigation step.

## Decisions

1. **Accent: Plum** `#46304B` (aubergine, the traditional half-mourning
   color). **Decided.** Ink and spruce stay in the preview only for reference. In dark mode,
   buttons use a deep aubergine fill `#5A3F60` with white text, and links use
   a light plum `#C6AFC9`, so nothing turns pastel.
2. **Fonts: Instrument Serif + Figtree.** **Decided.** Instrument Serif
   (one weight, plus italic) for the wordmark, titles and avatar initials;
   Figtree for body text and names.
3. **To confirm — check-in card.** One button (988), "Text HELLO to 741741" as a link.
   Copy unchanged.
4. **To confirm — crisis help** as plain text in the header of every screen.

## Landing page

The public website lives in [`web/`](../../web/) (Next.js, deployable to
Vercel). It uses the same paper-and-ink palette, plum accent and fonts as the
app. Screenshots are in [`landing/`](landing/): desktop in light and dark, and
phone.

Sections, top to bottom: hero with the app, a short statement, how it works
(three numbered steps), the privacy promise quoted from ACCESS_POLICY.md, what
to expect (people not AI, adults only, you're in control, peer support not
therapy), crisis help, and a closing call to action.

The call to action is Apple's official "Download on the App Store" badge. Until
`NEXT_PUBLIC_APP_STORE_URL` is set it carries a "Coming soon" note and doesn't
link anywhere. The privacy policy is at `/privacy` as a draft (see
[docs/legal/](../legal/)). Still needed before launch: the terms page, a
favicon and share image, and the domain.

## Viewing it yourself

```bash
cd mobile
npx expo start --web
# open http://localhost:8081/design-preview?state=active&accent=plum
# states: new, waiting, active, support, components
# accents: ink, spruce, plum
```

Web needs a `mobile/.env` with any Supabase URL and key (see `.env.example`);
the preview doesn't call Supabase.
