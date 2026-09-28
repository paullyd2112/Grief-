# Legal documents

| Document | File | Website page | Status |
| --- | --- | --- | --- |
| Privacy Policy | [privacy-policy.md](privacy-policy.md) | `/privacy` | Draft, waiting on the [CONFIRM] items and legal review |
| Terms of Service | [terms-of-service.md](terms-of-service.md) | `/terms` | Draft, waiting on the [CONFIRM] items and legal review |
| Code of Conduct | [code-of-conduct.md](code-of-conduct.md) | `/conduct` | Two open items (support contact, crisis-line countries) |

The app shows a short summary of the Code of Conduct in
`mobile/app/(app)/guidelines.tsx`, with an optional link to the full text
(`EXPO_PUBLIC_CODE_OF_CONDUCT_URL`). Once the domain is live, point that at
`/conduct`.

The `.md` files hold the founder's wording word for word. Change the wording
there first, then mirror it on the website. While a document still has
[CONFIRM] items, its web page shows a draft notice, highlights each open item,
and tells search engines not to index it.

## Founder decisions, Sep 28

Applied to all three documents and their web pages:

- **No message scanning.** Every "flagged message" and automatic crisis
  detection line is replaced. Crisis help is one tap away in the app, and
  members tell Ndo through "I'm worried about them" or a report. (Privacy
  Policy section 3, Terms 2.2, Code of Conduct "Safety and crisis
  situations".)
- **One reviewer.** Appeals are "reviewed by a person at Ndo"; the promise of
  a second reviewer is gone.
- **No timed suspensions.** Suspensions and bans are decided case by case, so
  the enforcement table says "Suspension" instead of "Temporary suspension".
- **"Keep your login details secure"** stays in the Terms.
- **Passwords.** Members can sign in with an email code or a password (set in
  Settings > Password), so the Privacy Policy's "password" is now accurate.
- **Off-platform conduct.** The Code of Conduct's scope now matches Terms 3.5
  and 4.5: members may connect off-platform at their own risk, and can still
  report a match for how they behaved off the app, in person, by text or on
  social media.
- **Staff access for safety, legal or security reasons** stays in the Privacy
  Policy. The admin console is unchanged; the website promise and
  ACCESS_POLICY.md now say "or the law or someone's safety requires it" (D21).

Still open:

- Report outcomes and the "profile" wording (items 5 and 6 below).

The notes below are the original review, kept for reference.

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

## Terms of Service and Code of Conduct: review notes

Same approach as above: the drafts compared with the code,
[ACCESS_POLICY.md](../ACCESS_POLICY.md) and [DECISIONS.md](../DECISIONS.md).
Nothing has been changed in the documents' text.

### Where the drafts disagree with the app or with each other

1. **Automatic crisis detection.** Terms 2.2 says Ndo "may show crisis
   resources when certain messages are flagged". The Code of Conduct says the
   app "surfaces crisis-line resources … directly in that conversation" when a
   member expresses suicidal thoughts, and that staff "review flagged crisis
   messages". DECISIONS.md D17 decided the opposite: messages are not scanned,
   and a "Get help" link sits in every conversation header and on the home
   screen. What does exist: a member can report a message, or use "I'm worried
   about them", and staff can then send a check-in. Suggested Code of Conduct
   wording: "Crisis-line resources are one tap away in every conversation
   (Get help). If you're worried about the person you're talking to, use
   'I'm worried about them' or report the message; a person at Ndo reviews it
   and can check in on them."
2. **Off-platform conduct: the two documents contradict each other.** Terms
   3.5 and 4.5 say Ndo may act on conduct off the app and members can report
   it. The Code of Conduct's scope says it "does not extend to what members
   choose to do off-platform". DECISIONS.md D14 sides with the Terms (ended
   conversations stay listed so off-platform conduct can be reported).
   Suggest adding to the Code of Conduct scope: "…but you can still report
   someone you were matched with for how they treated you off the app, and we
   may act on it."
3. **Appeals reviewer.** The Code of Conduct promises appeals are "reviewed by
   someone who wasn't part of the original decision". DECISIONS.md D16:
   appeals are reviewed by Paul, there is no second reviewer during the beta,
   "so the Code of Conduct should not promise one." Suggest: "Appeals are
   reviewed by a person at Ndo" until there is a second reviewer.
4. **Temporary suspensions.** The enforcement table lists "Temporary
   suspension". D16 notes timed suspensions and a distinct permanent-ban
   state aren't built yet: today a suspension lasts until an operator lifts
   it. Either build timed suspensions before launch or word the table as
   "Suspension".
5. **Report outcomes.** The Code of Conduct says members get "where
   appropriate, an outcome once it's resolved". The app confirms receipt but
   has no way to tell the reporter the outcome. Either drop the promise or add
   the feature.
6. **"Report button on the … profile".** There are no member profile pages
   to report from; reports are made on a message, and block works from the
   conversation. Suggest "on the message in question".
7. **Login details (Terms 1.3).** Sign-in is a one-time code sent by email,
   so there's no password to keep secure. "Keep access to your email secure"
   fits better.

### Suggested answers to open items

| Item | What the app does today |
| --- | --- |
| Terms 6.9 / Code of Conduct contact | Use the same address as `NEXT_PUBLIC_SUPPORT_EMAIL` and `EXPO_PUBLIC_SUPPORT_EMAIL` (the app already shows it to suspended and warned members for appeals). |
| Crisis-line countries | The app lists US numbers (988, Crisis Text Line) plus a link to IASP's worldwide directory, on the crisis screen and the website. |
| Payment terms (Terms 5.3) | No payments yet. Apple requires in-app purchase for digital subscriptions sold in an iOS app, so auto-renewal and cancellation terms will follow Apple's rules. |

### Still needs the founder or counsel

- Legal entity name (all three documents).
- Governing law, dispute resolution, and the California Civil Code 1542
  waiver.
- Limitation of liability amount.
