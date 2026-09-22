# Ndo — Build Plan

Phases are ordered so that each one ends in something clickable. Decisions live
in DECISIONS.md; the access commitment lives in ACCESS_POLICY.md.

| Phase | Deliverable | State |
|---|---|---|
| 0 | Decisions: access policy, retention, identity model, stack | **done** |
| 1 | Schema, RLS, safety state machine, access-policy test suite | **done** |
| 1b | Expo/React Native app scaffold, auth, age gate | next |
| 2a | Intake form (mobile) — **goes live before messaging** | |
| 2b | Admin matching console (Next.js on Vercel) | |
| 3 | 1:1 messaging, report / block / end-match, delete-for-both | |
| 4 | Voice memos (IG hold-to-record model), transcription | |
| 5 | Crisis page, guidelines, access log UI, retention cron | |
| 6 | Stripe / RevenueCat, 60-day trial, cancel/pause, hardship path | |

## Architecture

Two apps, one Supabase backend:

- **iOS app** (React Native / Expo, TypeScript) — the product. Auth, intake,
  messaging, voice memos, push notifications. Primary surface.
- **Admin console** (Next.js on Vercel) — matching queue, side-by-side compare,
  report review, access log. Paul-only. Also hosts the marketing landing page.

Both share the same Supabase project, the same RLS, and the same types.

## Sequencing note

Phase 2 ships and goes live before Phase 3 exists.

It is the front door from the brief, not a waitlist: TikTok points at the intake
form, the founding cohort fills it in, and matches are made by hand over email
while messaging is still being built. That runs the cold-start work and the
build in parallel instead of in series — and cold start, not code, is what
killed the closest prior attempt.

The `matches.match_reason` note written on every hand-match is the dataset that
answers the question the brief says cannot be answered in advance: which
dimensions actually predict a good connection. Fifty of those notes decide what,
if anything, is ever worth automating.

## What is not in v1

Minors. Groups. Hosted sessions or anything HIPAA-scoped. Therapist referral
fees. AI replying to users in any form. End-to-end encryption (see DECISIONS.md
D1). Automated matching.

## External gates — not buildable here

- **Lawyer review** of the privacy policy and terms, before the first real user.
  ACCESS_POLICY.md is written to be handed to them as specific questions rather
  than "is this okay?"
- **Stripe account**, domain, and social handles.
- **Recruiting the founding cohort.** The story only works told first-hand.
- **Moderation and matching**, which is the job that does not end when the build
  does. Operator hours per week is the real cap on beta growth (DECISIONS.md O6).
