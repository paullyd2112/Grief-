# Ndo — Decision Log

Running record of decisions that shape the build. Open questions live at the
bottom and move up when answered.

---

## Decided

### D1. No end-to-end encryption in v1
**Decided.** Conversations are encrypted in transit (TLS) and at rest, with
operator access constrained by row-level security and an audit log. See
ACCESS_POLICY.md.

*Why:* the app is delivered as JavaScript from the same origin that stores the
data, so browser-delivered E2E cannot honestly support the claim "the operator
cannot read this" — the operator controls the bundle. Claiming it anyway would
violate the project's own principle of promising less than you deliver, and the
FTC enforces against broken promises, not modest ones.

E2E also removes moderation capability in precisely the setting that needs it
most: two anonymous strangers, one of whom may be there to find vulnerable
people. The tradeoff inverts for a licensed-counselor product, where one side is
credentialed and accountable — that is where E2E belongs, if it is ever built.

*Revisit when:* native apps exist (so the client can be signed and verified) and
the moderation load is no longer carried by one person.

### D2. Operator access is report-gated
**Decided.** No admin RLS policy grants `SELECT` on `messages` or
`voice_memos`. Content reaches an operator only via a reporter-submitted
snapshot. See ACCESS_POLICY.md.

### D3. Retention
**Decided.**
- Reported content: 90 days, then hard-deleted. Legal hold pauses the clock.
- Conversation deletion: removes it for both parties, immediately, text and voice.
- Intake data after account deletion: 30 days, then hard-deleted. *(assumed — confirm)*
- Database backups: 30 days. *(assumed — confirm)*

### D4. Identity — Reddit model
**Decided.** One `display_name` field. Users may enter a real name or invent a
pseudonym; the product does not distinguish or verify. A boolean records which
the user says it is, for their own display preferences only — never for ranking,
matching, or trust scoring.

*Implication:* the safety layer is behavioural — reports, blocks, how people
write and sound — not identity. Consistent with the brief.

### D5. Age gate
**Decided.** Date of birth entered at signup, stored as entered (not a
pass/fail). **One attempt per account, enforced by a primary key** — the form
cannot teach someone the right answer by letting them retry. Self-attested; a
liability boundary, not verification.

### D6. Stack
**Decided.** iOS-primary via React Native (Expo) with a shared TypeScript
codebase. Supabase for Postgres, auth, storage, and realtime. Next.js on Vercel
for the marketing/landing page and the admin matching console. Both vendors
offer a DPA.

The user-facing product is a native iOS app. React Native / Expo gives iOS now,
Android later, and a web fallback — all from one codebase. The voice memo
hold-to-record gesture and push notifications both work dramatically better
native than in a browser.

### D11. Departure notice wording
**Decided.** When someone leaves a conversation normally, the other person sees:
"This user left the conversation." Paired with a reframe ("People step back for
their own reasons — it isn't about you") and a prompt to get matched with
someone new. Report-and-leave is still silent — no notice of any kind.

### D7. Voice interaction model
**Decided.** Instagram DM model — hold to record, live waveform, release to
send, inline playback in the conversation only. No download affordance. Length
capped. Server-side transcription for accessibility and for moderation triage of
*reported* memos only.

### D8. Trial length
**Decided.** 60 days free, then convert. End date shown at signup and again
before the first charge. One-click cancel and pause, no retention interstitial.
Hardship option requires no explanation.

### D9. Matching is manual in v1
**Decided.** Concierge MVP. Every match is made by hand and carries a written
`match_reason`. Those notes are the dataset that determines what — if anything —
is ever worth automating.

### D10. Beta is US-only
**Decided.** Geo-restricted to avoid GDPR at the start.

---

## Open

### O1. Re-matching
Can two people who ended a conversation be matched with each other again later?
Affects whether `blocks` is permanent and whether the matcher sees prior pairings.
*Blocking:* no. Default until decided: prior pairs are excluded from suggestions,
and a block is permanent.

### O2. Geography / timezone in matching
Matters less for async voice than live calls. Currently collected but unused.

### O3. Voice memo length cap
Placeholder: 5 minutes. Needs a real answer once memos exist — it trades depth
against moderation load.

### O4. Hardened admin database role
Upgrade path from ACCESS_POLICY.md: dedicated Postgres role with `SELECT`
revoked on `messages` and `voice_memos` at the grant level, so the admin app
cannot read them even with a misconfigured client. Operationally heavier on
Supabase. Not v1.

### O5. Name and domain
"Ndo" pending handle/domain availability checks and a mental-health-space
conflict search. Not a blocker for the build.

### O6. Operator capacity
Hours per week for one person to match and moderate ~100 users with voice memos.
This number caps beta growth. Needs measuring from week one, not estimating.

### O7. What the reported party sees
A report-and-leave sends no notice. Still open: does the conversation visibly
end for the reported party (with no explanation), or stay visually intact?
Either choice leaks a little. Current implementation: the match is marked ended
and no notice row is written, so the conversation reads as inactive with no
explanatory copy and no re-match prompt. Worth a deliberate decision before
Phase 3 ships.
