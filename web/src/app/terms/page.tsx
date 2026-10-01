import type { Metadata } from "next";
import Link from "next/link";
import { Confirm, LegalPage } from "@/components/Legal";

// Mirrors docs/legal/terms-of-service.md word for word. Change the wording
// there first. While any [CONFIRM] item is open the page says it's a draft and
// stays out of search results; remove `robots` and `draft` once it's final.

export const metadata: Metadata = {
  title: "Terms of Service — Ndo",
  description: "The agreement between you and Ndo.",
  robots: { index: false, follow: false },
};

type Clause = { n: string; title: string; body: React.ReactNode };

const sections: { n: number; title: string; clauses: Clause[] }[] = [
  {
    n: 1,
    title: "Agreement, eligibility, and accounts",
    clauses: [
      {
        n: "1.1",
        title: "Agreement",
        body: (
          <>
            These Terms of Service (&ldquo;Terms&rdquo;) are a legal agreement
            between you and <Confirm>CONFIRM: legal entity name</Confirm>{" "}
            (&ldquo;Ndo,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By
            creating an account or using the Ndo app, website, or related
            services (the &ldquo;Service&rdquo;), you agree to these Terms, the
            Ndo <Link href="/conduct">Code of Conduct</Link>, and the Ndo{" "}
            <Link href="/privacy">Privacy Policy</Link>. If you don&apos;t
            agree, don&apos;t use the Service.
          </>
        ),
      },
      {
        n: "1.2",
        title: "Age requirement",
        body: "You must be at least 18 years old to use Ndo. By using the Service, you confirm that you are 18 or older. We will close any account we believe belongs to someone under 18.",
      },
      {
        n: "1.3",
        title: "Your account",
        body: "You agree to give accurate information when you sign up and during intake, and to keep your login details secure. You are responsible for activity on your account. You may not create an account for someone else, share your account, or create a new account after we have removed you.",
      },
      {
        n: "1.4",
        title: "One person, one account",
        body: "Each account must belong to a single, real person.",
      },
    ],
  },
  {
    n: 2,
    title: "What Ndo is and is not",
    clauses: [
      {
        n: "2.1",
        title: "Peer support only",
        body: "Ndo connects adults who are grieving so they can support one another as peers. Ndo is not therapy, counseling, medical care, or a mental health service. Ndo staff and members are not acting as licensed mental health professionals, and nothing on the Service is medical, psychological, or professional advice.",
      },
      {
        n: "2.2",
        title: "Not a crisis service",
        body: "Ndo does not provide emergency or crisis support and does not monitor conversations in real time. If you are in crisis or thinking about harming yourself, call or text 988 (in the US), contact your local emergency number, or go to the nearest emergency room. Crisis resources are always one tap away in the app, but you should never rely on Ndo, or on another member, in an emergency.",
      },
      {
        n: "2.3",
        title: "No guarantees about members",
        body: "Members are individuals, not Ndo employees or agents. We don't guarantee that any member will be a good fit, will respond, or will be supportive, and we are not responsible for what members say or do.",
      },
      {
        n: "2.4",
        title: "No AI in matching or moderation",
        body: "Ndo does not use artificial intelligence in intake, matching, or moderation. Matches and reports are reviewed by people.",
      },
    ],
  },
  {
    n: 3,
    title: "Member conduct, matching, and enforcement",
    clauses: [
      {
        n: "3.1",
        title: "Code of Conduct",
        body: (
          <>
            You agree to follow the Ndo{" "}
            <Link href="/conduct">Code of Conduct</Link>, which is part of these
            Terms. Among other things, you may not harass, threaten, or
            discriminate against others; make romantic or sexual advances;
            solicit members for money or commercial purposes; impersonate a
            licensed professional; share another member&apos;s messages or
            identity without consent; or encourage self-harm.
          </>
        ),
      },
      {
        n: "3.2",
        title: "Matching",
        body: "We match members based on the information you provide at intake. We don't guarantee a match, a particular kind of match, or how quickly a match will happen.",
      },
      {
        n: "3.3",
        title: "Ending matches and blocking",
        body: "You may end a match at any time and request a new one. You may also block a member, which is permanent: you won't be matched with that person again.",
      },
      {
        n: "3.4",
        title: "Reporting",
        body: "You can report a member or message using the in-app Report tool. Reports are reviewed by people. Filing a report knowingly false, or to harass or retaliate against someone, violates these Terms and may lead to your removal.",
      },
      {
        n: "3.5",
        title: "Enforcement",
        body: "If we believe you've violated these Terms or the Code of Conduct, we may warn you, remove content, suspend your account, or permanently remove you from Ndo, at our discretion and with or without notice. We may also act on conduct that happens off the app if it affects the safety of our members. You may appeal a decision by contacting us (Section 6.9).",
      },
    ],
  },
  {
    n: 4,
    title: "Off-platform contact and in-person meetings",
    clauses: [
      {
        n: "4.1",
        title: "Your choice, your risk",
        body: "You may choose to contact a member outside the Service or meet in person. Ndo does not encourage dating and is not a dating service. Any communication, relationship, or meeting outside the Service is at your own discretion and sole risk.",
      },
      {
        n: "4.2",
        title: "No background checks",
        body: "Ndo does not conduct criminal background checks, identity verification, or screening of members, and does not verify the accuracy of anything members say about themselves or their loss.",
      },
      {
        n: "4.3",
        title: "Your responsibility",
        body: "You are solely responsible for your interactions with other members, on or off the Service. You agree to take reasonable safety precautions, including meeting in public places, arranging your own transportation, and never sending money or financial information to another member.",
      },
      {
        n: "4.4",
        title: "Release",
        body: (
          <>
            To the fullest extent permitted by law, you release Ndo and its
            owners, employees, and contractors from any claims, damages, or
            losses arising out of your interactions with other members,
            including interactions or meetings that happen off the Service.{" "}
            <Confirm>
              CONFIRM with counsel: California Civil Code Section 1542 waiver
              language, if Ndo is governed by California law.
            </Confirm>
          </>
        ),
      },
      {
        n: "4.5",
        title: "Reporting off-platform conduct",
        body: "You can still report a member for conduct that happened off the Service. We'll review it and may remove the member, but we cannot investigate or intervene in off-platform matters.",
      },
    ],
  },
  {
    n: 5,
    title: "Resources, beta, billing, and feedback",
    clauses: [
      {
        n: "5.1",
        title: "Third-party resources",
        body: "Ndo may list outside mental health resources, crisis lines, and provider directories. We don't vet, endorse, or guarantee any of them, and we're not responsible for their services, content, or availability. Your use of any third-party resource is between you and that provider.",
      },
      {
        n: "5.2",
        title: "Beta",
        body: "Ndo is currently offered as a free beta. Beta features may change, break, or be removed at any time, and the Service is provided without any commitment to availability during the beta.",
      },
      {
        n: "5.3",
        title: "Paid plans",
        body: (
          <>
            After the beta, access may require a paid subscription. We will
            notify beta members before any charges begin, and you won&apos;t be
            charged unless you choose to subscribe. Subscription terms,
            including price, billing period, automatic renewal, cancellation,
            and refunds, will be shown before you subscribe.{" "}
            <Confirm>
              CONFIRM: payment processor, auto-renewal disclosures,
              cancellation method, and refund policy before paid plans launch.
            </Confirm>
          </>
        ),
      },
      {
        n: "5.4",
        title: "Feedback",
        body: "If you send us feedback or suggestions, including through the in-app Feedback tab, you allow us to use them to improve Ndo without owing you anything. We won't publish feedback in a way that identifies you without your permission.",
      },
    ],
  },
  {
    n: 6,
    title: "Legal terms",
    clauses: [
      {
        n: "6.1",
        title: "Your content",
        body: "You own what you write on Ndo. You give us a limited license to store, process, and display it only as needed to operate the Service, keep members safe, and enforce these Terms. We don't sell your content or use it to train AI models.",
      },
      {
        n: "6.2",
        title: "Our property",
        body: "The Ndo name, logo, app, and site are owned by Ndo. You may not copy, reverse-engineer, scrape, or resell any part of the Service.",
      },
      {
        n: "6.3",
        title: "Disclaimer",
        body: "The Service is provided “as is” and “as available,” without warranties of any kind, express or implied, including fitness for a particular purpose, to the fullest extent permitted by law. We don't promise the Service will be uninterrupted, error-free, or that it will improve your wellbeing.",
      },
      {
        n: "6.4",
        title: "Limitation of liability",
        body: (
          <>
            To the fullest extent permitted by law, Ndo will not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages, or for any emotional distress, personal injury, or loss
            arising from your use of the Service or your interactions with other
            members. Our total liability for any claim is limited to the greater
            of the amount you paid us in the 12 months before the claim or $100.{" "}
            <Confirm>CONFIRM with counsel.</Confirm>
          </>
        ),
      },
      {
        n: "6.5",
        title: "Indemnity",
        body: "You agree to cover Ndo's reasonable losses and legal costs if a claim is brought against us because of your conduct, your content, or your violation of these Terms.",
      },
      {
        n: "6.6",
        title: "Ending your account",
        body: "You can delete your account at any time in the app. We may suspend or end your access as described in Section 3.5. Sections that by their nature should survive (including 4, 6.3 to 6.7) continue after your account ends.",
      },
      {
        n: "6.7",
        title: "Disputes and governing law",
        body: (
          <>
            These Terms are governed by the laws of{" "}
            <Confirm>CONFIRM: State of California</Confirm>, without regard to
            conflict-of-law rules.{" "}
            <Confirm>
              CONFIRM with counsel: whether to use informal resolution first,
              arbitration, a class action waiver, or courts in a named county.
            </Confirm>
          </>
        ),
      },
      {
        n: "6.8",
        title: "Changes",
        body: "We may update these Terms as Ndo grows. If we make material changes, we'll notify you in the app or by email before they take effect. Continuing to use Ndo after that means you accept the updated Terms.",
      },
      {
        n: "6.9",
        title: "Contact",
        body: (
          <>
            Questions, appeals, or legal notices:{" "}
            <Confirm>CONFIRM: contact email and mailing address</Confirm>.
          </>
        ),
      },
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 23, 2026"
      draft={
        <>
          Draft for legal review. Items marked [CONFIRM] need a decision or a
          lawyer&apos;s input before publishing.
        </>
      }
    >
      {sections.map((s) => (
        <section key={s.n} aria-labelledby={`s${s.n}`}>
          <h2 id={`s${s.n}`}>
            {s.n}. {s.title}
          </h2>
          {s.clauses.map((c) => (
            <p key={c.n} id={`c${c.n.replace(".", "-")}`}>
              <strong>
                {c.n} {c.title}.
              </strong>{" "}
              {c.body}
            </p>
          ))}
        </section>
      ))}
    </LegalPage>
  );
}
