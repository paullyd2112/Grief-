import type { Metadata } from "next";
import Link from "next/link";
import { Confirm, LegalPage } from "@/components/Legal";

// Mirrors docs/legal/privacy-policy.md word for word. Change the wording there
// first. While any [CONFIRM] item is open the page says it's a draft and stays
// out of search results; remove `robots` and the notice once it's final.

export const metadata: Metadata = {
  title: "Privacy Policy — Ndo",
  description: "What Ndo collects, why, and what you control.",
  robots: { index: false, follow: false },
};

const collected: { category: string; examples: React.ReactNode; source: React.ReactNode }[] = [
  {
    category: "Account information",
    examples: "Name or display name, email, password, date of birth or age confirmation",
    source: "You, at sign-up",
  },
  {
    category: "Intake information",
    examples:
      "Who you lost, roughly when, same-loss matching preference, how often you'd like to talk, topics you'd rather avoid",
    source: "You, at intake (you can skip questions)",
  },
  {
    category: "Messages and profile",
    examples: "Conversations with your matches, anything you add to your profile",
    source: "You and your matches",
  },
  {
    category: "Safety records",
    examples: "Reports, blocks, ended matches, moderation decisions",
    source: "You, other members, Ndo staff",
  },
  {
    category: "Feedback and support",
    examples: "Messages sent through the Feedback tab or to support",
    source: "You",
  },
  {
    category: "Payment information (after beta)",
    examples:
      "Subscription status and billing history; card details are handled by our payment processor, not stored by Ndo",
    source: (
      <>
        Payment processor <Confirm />
      </>
    ),
  },
  {
    category: "Device and usage data",
    examples: "Device type, app version, IP address, crash logs, basic in-app activity",
    source: (
      <>
        Collected automatically <Confirm>CONFIRM: analytics tools used, if any</Confirm>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 23, 2026"
      draft={
        <>
          Draft for legal review. Items marked [CONFIRM] need a decision or a
          lawyer&apos;s input before publishing.
        </>
      }
    >
        <section aria-labelledby="s1">
          <h2 id="s1">1. Our commitments</h2>
          <p>
            What you share on Ndo is about some of the hardest moments of your
            life. We treat it that way. This policy explains what{" "}
            <Confirm>CONFIRM: legal entity name</Confirm> (&ldquo;Ndo,&rdquo;
            &ldquo;we&rdquo;) collects, why, and what you control. In plain
            words:
          </p>
          <ul>
            <li>
              We don&apos;t sell your personal information, and we don&apos;t
              share it for targeted advertising.
            </li>
            <li>
              We don&apos;t use AI in intake, matching, or moderation, and we
              don&apos;t use your information or conversations to train AI
              models.
            </li>
            <li>People, not algorithms, review matches and reports.</li>
            <li>You can delete your account at any time.</li>
          </ul>
          <p>
            This policy is part of the Ndo{" "}
            <Link href="/terms">Terms of Service</Link>.
          </p>
        </section>

        <section aria-labelledby="s2">
          <h2 id="s2">2. What we collect</h2>
          <div className="legal-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Examples</th>
                  <th scope="col">Where it comes from</th>
                </tr>
              </thead>
              <tbody>
                {collected.map((row) => (
                  <tr key={row.category}>
                    <th scope="row">{row.category}</th>
                    <td>{row.examples}</td>
                    <td>{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <strong>Sensitive information.</strong> Intake answers and messages
            about your loss, grief, or mental health may count as sensitive
            personal information under some laws. We collect it only to provide
            the Service, and we use it only for the purposes in Section 3.
          </p>
        </section>

        <section aria-labelledby="s3">
          <h2 id="s3">3. How we use it and who sees it</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Create and run your account</li>
            <li>Match you with other members, based on your intake answers</li>
            <li>Deliver your messages to your matches</li>
            <li>
              Review reports, enforce the{" "}
              <Link href="/conduct">Code of Conduct</Link>, and keep members
              safe, including surfacing crisis resources when a message is
              flagged
            </li>
            <li>Respond to feedback and support requests and improve the app</li>
            <li>Handle billing once paid plans begin</li>
            <li>Meet legal obligations</li>
          </ul>
          <p>Who can see it:</p>
          <ul>
            <li>
              <strong>Your matches</strong> see what you send them and the
              profile details you choose to share.{" "}
              <Confirm>CONFIRM: which intake details, if any, are shown to a match.</Confirm>
            </li>
            <li>
              <strong>Ndo staff</strong> may review intake answers to make
              matches, and may review messages only when they are reported or
              flagged, or when needed for safety, legal, or security reasons.{" "}
              <Confirm>CONFIRM: review practice matches this.</Confirm>
            </li>
            <li>
              <strong>Service providers</strong> who help us run Ndo (for
              example hosting, email, and payment processing) process data on
              our behalf under contracts that limit their use of it. They may
              not sell it or use it for their own purposes.{" "}
              <Confirm>CONFIRM: list of providers.</Confirm>
            </li>
            <li>
              <strong>Legal and safety.</strong> We may disclose information if
              required by law, or if we believe in good faith it&apos;s needed to
              prevent serious harm to someone.
            </li>
            <li>
              <strong>Business transfers.</strong> If Ndo is sold or merged,
              your information may transfer to the new owner, who must honor
              this policy or notify you of changes.
            </li>
          </ul>
          <p>
            We do not sell your personal information, share it for
            cross-context behavioral advertising, or use it to train AI models.
          </p>
        </section>

        <section aria-labelledby="s4">
          <h2 id="s4">4. Retention, deletion, and security</h2>
          <p>
            <strong>Retention.</strong> We keep your information while your
            account is active and only as long as needed for the purposes
            above.
          </p>
          <p>
            <strong>Deleting your account.</strong> You can delete your account
            in the app. When you do, we delete or de-identify your account and
            intake information within <Confirm>CONFIRM: e.g., 30 days</Confirm>. Messages
            you already sent may remain visible to the person you sent them to,{" "}
            <Confirm>CONFIRM: or are removed from both sides</Confirm>. We may keep
            limited records longer where needed for safety or legal reasons,
            such as records of a ban to prevent a removed member from rejoining,
            or where the law requires it.
          </p>
          <p>
            <strong>Security.</strong> We use reasonable technical and
            organizational safeguards, such as encryption in transit and access
            limited to staff who need it, to protect your information.{" "}
            <Confirm>CONFIRM: encryption at rest and other measures in place.</Confirm>{" "}
            No system is perfectly secure, and we can&apos;t guarantee absolute
            security. If a breach affects your personal information, we&apos;ll
            notify you as required by law.
          </p>
        </section>

        <section aria-labelledby="s5">
          <h2 id="s5">5. Your rights and choices</h2>
          <p>Everyone can:</p>
          <ul>
            <li>Update your profile and intake answers in the app</li>
            <li>Choose what you share with a match</li>
            <li>End matches and block members</li>
            <li>Delete your account at any time</li>
            <li>Opt out of non-essential emails using the unsubscribe link</li>
          </ul>
          <p>
            Depending on where you live (including California and other US
            states with privacy laws), you may also have the right to:
          </p>
          <ul>
            <li>Know what personal information we collect about you and how we use it</li>
            <li>Get a copy of your personal information</li>
            <li>Correct information that&apos;s wrong</li>
            <li>Delete your personal information</li>
            <li>
              Limit our use of sensitive personal information (we already use it
              only to provide the Service)
            </li>
            <li>Not be treated differently for using any of these rights</li>
          </ul>
          <p>
            To make a request, contact us (Section 6). We&apos;ll verify your
            identity before acting on it and respond within the time the law
            requires.{" "}
            <Confirm>
              CONFIRM with counsel: which state laws apply, including any
              health-data laws such as Washington&apos;s My Health My Data Act,
              given the nature of grief-related information.
            </Confirm>
          </p>
        </section>

        <section aria-labelledby="s6">
          <h2 id="s6">6. Age limit, changes, and contact</h2>
          <p>
            <strong>Adults only.</strong> Ndo is only for people 18 and older.
            We don&apos;t knowingly collect information from anyone under 18. If
            we learn we have, we&apos;ll delete the account and its information.
          </p>
          <p>
            <strong>Changes to this policy.</strong> If we make material
            changes, we&apos;ll notify you in the app or by email before they
            take effect, and update the date at the top.
          </p>
          <p>
            <strong>Contact.</strong> Privacy questions or requests:{" "}
            <Confirm>CONFIRM: privacy contact email and mailing address</Confirm>.
          </p>
        </section>
    </LegalPage>
  );
}
