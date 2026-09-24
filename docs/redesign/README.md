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

## Home mockup (390×844)

Screenshots are in [`home-mockup/`](home-mockup/), each in light and dark.

| State | File | What it shows |
| --- | --- | --- |
| New user | `new-*.png` | The two onboarding steps as one progress block |
| Waiting | `waiting-*.png` | Calm waiting state after onboarding, before a match |
| Active | `active-*.png` | Conversation rows: avatar, name, preview, time, unread dot, hairlines |
| Support | `support-*.png` | Check-in card and departure notice above the list (full scroll) |
| Components | `components-*.png` | The component kit: type, color, buttons, avatars, grouped list, banners, fields, pills |

The tab bar in the mockup is a stand-in; the real one arrives with the
navigation step.

## Decisions to confirm

1. **Palette.** Background `#F7F4EF`, text `#221E1A`, accent `#35507A` (deep
   muted blue). Dark mode lightens the accent to `#9DB4D8`. Every text pairing
   meets WCAG AA.
2. **Fonts.** Newsreader for headings, Inter for body text.
3. **Check-in card.** One button (988), with "Text HELLO to 741741" as a text
   link beneath it. Copy unchanged.
4. **Crisis help.** A quiet outlined "Crisis help" pill in the header, next to
   the large title. The same pill will sit on every screen.
5. **Errors in forms** use an icon and a dark outline, not red, so red stays
   reserved for "Yes, right now".

## Viewing it yourself

```bash
cd mobile
npx expo start --web
# open http://localhost:8081/design-preview?state=active
# states: new, waiting, active, support, components
```

Web needs a `mobile/.env` with any Supabase URL and key (see `.env.example`);
the preview doesn't call Supabase.
