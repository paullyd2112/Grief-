# Legal documents

| Document | File | Website page | Status |
| --- | --- | --- | --- |
| Privacy Policy | [privacy-policy.md](privacy-policy.md) | `/privacy` | Draft, waiting on the [CONFIRM] items and legal review |
| Terms of Service | Not yet in the repo | Not built | Waiting for the text |
| Code of Conduct | Not yet in the repo (the app shows a summary in `mobile/app/(app)/guidelines.tsx`) | Not built | Waiting for the full text |

The `.md` files hold the founder's wording word for word. Change the wording
there first, then mirror it on the website. While a document still has
[CONFIRM] items, its web page shows a draft notice, highlights each open item,
and tells search engines not to index it.

## Privacy Policy: review notes

These notes compare the Sep 23 draft with the code and
[ACCESS_POLICY.md](../ACCESS_POLICY.md), which says: "If the code and this
document disagree, the code is a bug." They are suggestions for the founder and
counsel. None of them has been applied to the policy text.

### Where the draft and the app disagree

1. **Staff access to messages (Section 3).** The draft says staff "may review
   messages only when they are reported or flagged, or when needed for safety,
   legal, or security reasons." The app is stricter than that, and the database
   enforces it: staff can't read any message or voice memo unless it was
   reported, and then only the reported message and a little context. Nothing
   flags messages automatically. The draft gives away Ndo's strongest promise
   and allows access the product doesn't have. Suggested wording: "Ndo staff
   can read a message only when you or the person you're talking to reports
   it. Then we see only the reported message and a little context around it."
2. **"Surfacing crisis resources when a message is flagged" (Section 3).**
   There is no server-side scanning of messages (ACCESS_POLICY.md, "Known
   limits"). Crisis help is always one tap away, and operators can send a
   check-in after an "I'm worried about them" concern. Suggest describing that
   instead.
3. **Password (Section 2).** Ndo doesn't use passwords. Sign-in is a one-time
   code sent by email.
4. **Voice memos (Section 2).** They aren't mentioned. Suggest "Messages and
   voice memos", and saying that memos are never transcribed.
5. **Concerns ("I'm worried about them") are missing.** Members can tell Ndo
   they're worried about someone. Ndo stores who raised it, about whom, and an
   optional note, keeps it for 90 days, and never tells the person it's about.
   That is information about a person that they don't know exists, so it
   belongs in Section 2 and Section 3.
6. **Under-18 sign-up attempts.** The age gate keeps a record of date-of-birth
   attempts (`dob_attempts`) so an under-18 person can't retry with a different
   date. The draft says "we'll delete the account and its information." These
   records have no purge job today. Either the policy mentions them, or they get
   a retention period.
7. **The access log is missing.** Every time staff open someone's intake answers
   or a report, it's logged, and members can see their own log in the app (Your
   data). This is a real differentiator and fits under Section 5.
8. **Deleting a conversation (Section 4).** When either person deletes a
   conversation, it's removed for both immediately. The draft doesn't say so.
9. **Unsubscribe link (Section 5).** Ndo only sends sign-in codes today, so
   there's no email to unsubscribe from yet. Fine to keep if marketing emails
   are planned.

### Suggested answers to the [CONFIRM] items

| Item | What the app does today | Source |
| --- | --- | --- |
| Which intake details a match sees | None. Only the member and Ndo staff can read intake answers. A match sees the display name and messages. | `supabase/migrations/0002_rls.sql` (`intake_rw_self`, `intake_read_admin`) |
| Review practice | Intake: yes, to match by hand. Messages: only reported ones (see disagreement 1). | ACCESS_POLICY.md |
| Deletion window | Account hidden and unmatched immediately; hard-deleted after 30 days unless the member signs back in to keep it. Intake is hard-deleted at 30 days. | ACCESS_POLICY.md, `0008_voice_privacy_suspension_deletion.sql` |
| Messages after account deletion | Removed from both sides at hard deletion: deleting the account cascades to its matches, conversations and messages. | `0001_core_schema.sql` (`on delete cascade`) |
| Encryption at rest | Yes, in transit and at rest. Not end-to-end, and ACCESS_POLICY.md says to state that plainly. | ACCESS_POLICY.md, "Known limits" |
| Other retention | Reports and concerns: 90 days (longer under legal hold). Database backups: 30 days. | ACCESS_POLICY.md |
| Analytics tools | None installed in the app, admin console or website. | `package.json` files |
| Service providers | Supabase (database, file storage, sign-in email), Vercel (website and admin console), Apple (App Store). Report alerts go to a Slack-compatible webhook and contain no personal information. | Code and README files |
| Payment processor | None yet. | |

### Still needs the founder or counsel

- Legal entity name.
- Privacy contact email and mailing address.
- Which state laws apply, including Washington's My Health My Data Act.
