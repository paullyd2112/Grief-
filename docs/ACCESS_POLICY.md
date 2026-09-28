# Ndo — Access Policy

This is the operator access policy. It is the source of truth for the privacy
policy, the database schema, and any future security questionnaire. If the code
and this document disagree, the code is a bug.

## The commitment

**Ndo staff cannot read conversation content — text or voice — unless a message
is reported.**

This is not a promise of restraint. It is enforced by the database: there is no
row-level security policy anywhere that grants an administrator `SELECT` on
`messages` or `voice_memos`. No admin screen queries them. The only path by
which conversation content reaches an operator is a report.

The one exception is described under "Exceptional access" below: a legal
demand or a serious safety risk. It never goes through the admin console.

## What an operator CAN read

| Data | Readable | Why |
|---|---|---|
| Intake responses | Yes | Required to match people by hand. Stated plainly at intake. |
| Display name, account status, signup date | Yes | Account administration. |
| That a conversation exists, when it started/ended | Yes | Matching and safety metrics. Metadata only. |
| Message *counts* and timestamps | Yes | Liveness — is this match working. Never content. |
| Reported content + surrounding context | Yes | Only what the reporter's device submitted. |
| Report/block counts per account | Yes | Behavioural safety signal that needs no content. |
| A concern ("I'm worried about them") | Yes | Who is worried, about whom, and the note the worried person chose to write. Never the conversation. The person it's about is never told a concern was raised or by whom. Operators may send them a check-in from Ndo (crisis lines on their home screen) that never mentions the concern. |

## What an operator CANNOT read

- Message bodies in any unreported conversation.
- Voice memo audio in any unreported conversation. (Memos are never transcribed; see DECISIONS.md D7.)
- Any content in a conversation after either party deletes it, unless it was
  reported before deletion.

## How a report works

1. The reporter's own client — which can already see the messages — submits the
   specific message plus a bounded window of surrounding context.
2. That snapshot is written to `reports.snapshot`. It is a **copy**, not a
   pointer. It survives deletion of the original conversation.
3. Only then does that content become readable by an operator.

The snapshot is what an operator reviews. The live conversation stays closed.

When a report is filed, operators get an alert (a Slack-compatible webhook,
configured in Supabase Vault). The alert says only that a report exists and how
many are open: no names, no reason, no content. Everything else stays behind
the admin console and its access log.

## Exceptional access (legal or safety)

Decided Sep 28 (DECISIONS.md D21). Ndo may read a conversation that nobody
reported only when the law requires it (for example a subpoena or court order)
or when someone's safety is at serious risk. The Privacy Policy says so, and so
does the promise users see.

- The admin console stays as it is: it has no way to open an unreported
  conversation, and no one adds one.
- Only the founder does this, directly in the database, and only for the
  conversation the request or risk concerns.
- Before reading, the founder writes a row to `access_log` by hand with the
  subject and a justification, so the member's own access log shows it, as the
  promise says. (The one exception is the concern rule under Logging below.)
- Anything read this way is used only for the legal request or the safety
  response, and is not kept afterwards.

## Logging

Every operator read of intake data or of a report snapshot writes a row to
`access_log`, with the acting account, the subject, and a required free-text
justification. The log is append-only. Users can request their own access log.

One exception, for safety: when someone raises a concern about the person
they're talking to, what operators do about it (handling the concern, sending
a check-in) is logged but not shown to the person it's about. Someone with one
or two matches could otherwise tell who reached out, and people need to feel
safe asking for help for someone else. The check-in is how the person it's
about gets support.

## Retention

| Data | Retention |
|---|---|
| Reported content (`reports.snapshot`) | 90 days from report, then hard-deleted |
| Concerns | 90 days from being raised, then hard-deleted |
| Reported content under legal hold | Held until the hold is lifted, then 90-day clock resumes |
| Conversation deleted by either party | Removed for both parties immediately |
| Voice memo audio in a deleted conversation | Unreadable immediately; files removed by the deleting device, with a daily sweep as backup |
| Account deleted by the user | Hidden and unmatched immediately; hard-deleted after 30 days unless they sign back in and keep it |
| Intake data after account deletion | 30 days, then hard-deleted |
| Database backups | 30 days |

The 90-day purge runs as a scheduled job. A retention promise that is not a cron
job is just a sentence.

## Known limits — stated honestly

- **The `service_role` key bypasses row-level security.** RLS constrains the
  application; it cannot constrain a Postgres superuser. The operating rule is
  that the service-role key is never used in the admin application and never
  used in a code path that reads `messages` or `voice_memos`. The hardening
  upgrade, when it is worth the operational cost, is a dedicated database role
  with `SELECT` revoked on those tables at the grant level, so the admin app is
  physically incapable of reading them. Tracked in DECISIONS.md.
- **Conversations are encrypted in transit and at rest, not end-to-end.** A
  database breach exposes ciphertext at rest; a compromise of the running
  application could expose content. We do not claim otherwise.
- **Playback-only voice memos cannot be saved in the app.** They can be
  screen-recorded or recorded off the speaker. The UI says so.
- **We cannot see a crisis unless someone tells us.** There is no server-side
  scanning of conversation content. Crisis resources surface to the user
  themselves; the report button is the path to a human.

## The promise, as users will see it

> Your conversations are encrypted in transit and at rest. Nobody at Ndo reads
> them unless you or the person you're talking to reports a message, or the law
> or someone's safety requires it. When a message is reported, only the
> reported message and a little context around it are sent to us. Every time
> someone at Ndo looks at your information, it's logged, and you can ask to see
> that log.
