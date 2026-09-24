# Ndo

A peer-support platform that connects grieving people one-on-one with other
grieving people. All grief, filtered by preference. Matching is by hand.

Not therapy. Crisis resources are surfaced throughout; 988 in the US.

## The commitment this codebase enforces

Ndo staff cannot read conversation content — text or voice — unless a message is
reported. This is not a policy promise; it is the absence of any row-level
security policy granting an operator `SELECT` on `messages` or `voice_memos`,
and it is regression-tested.

```bash
./tests/run.sh
```

Full statement, including the limits of the claim: [docs/ACCESS_POLICY.md](docs/ACCESS_POLICY.md).

## Layout

| Path | |
|---|---|
| `docs/ACCESS_POLICY.md` | What operators can and cannot read, and why |
| `docs/DECISIONS.md` | Decision log, with open questions at the bottom |
| `docs/BUILD_PLAN.md` | Phases and sequencing |
| `supabase/migrations/` | Schema, RLS, safety state machine |
| `tests/` | Access-policy regression suite |

## Stack

iOS app via React Native (Expo, TypeScript) · Admin console via Next.js on
Vercel · Supabase for Postgres, auth, storage, realtime. Conversations are
encrypted in transit and at rest, not end-to-end — the reasoning is in
DECISIONS.md D1.
