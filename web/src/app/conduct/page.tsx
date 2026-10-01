import type { Metadata } from "next";
import { Confirm, LegalPage } from "@/components/Legal";

// Mirrors docs/legal/code-of-conduct.md word for word. Change the wording
// there first. Two items are still open (support contact, crisis-line
// countries), so the page carries a draft note and stays out of search
// results; remove `robots` and `draft` once they're settled.

export const metadata: Metadata = {
  title: "Code of Conduct — Ndo",
  description: "How members treat each other on Ndo, and what happens when someone doesn't.",
  robots: { index: false, follow: false },
};

const values: { title: string; body: string }[] = [
  {
    title: "Lead with empathy, not advice.",
    body: "Members are here to be heard, not fixed. Unsolicited advice about how someone “should” grieve is discouraged.",
  },
  {
    title: "Grief isn’t a competition — but comparisons will happen, so handle them with care.",
    body: "People naturally relate their own loss to someone else’s, and that’s not automatically wrong. But comparing very different kinds of loss (a grandparent to a child, a friend to a sibling) can land as dismissive to the person carrying the heavier weight. Notice the difference between “I relate to some of this” and “this is basically the same as what happened to me,” and let the other person be the one who decides how similar their losses are.",
  },
  {
    title: "Show up as yourself.",
    body: "Honesty about who you are and what you’ve lost matters more than saying the “right” thing.",
  },
  {
    title: "Respect the pace of others.",
    body: "Some people want to talk every day; others need silence for weeks. Both are normal.",
  },
  {
    title: "This is peer support, not therapy.",
    body: "Members support each other as equals who’ve lived through loss — no one here is playing therapist, and no one should be expected to.",
  },
];

const expected = [
  "Listen more than you advise. If you’re unsure what someone needs, ask.",
  "Use content notes before describing a death in graphic detail (e.g., accident, overdose, suicide, violence).",
  "Ask before sharing someone else’s story, screenshot, or words outside the app.",
  "Give people room to opt out of a match or a conversation without needing to explain why.",
  "Assume good faith, but say something (to the person or via a report) if a conversation feels off.",
  "Keep language around religion, an afterlife, grief timelines, or how someone “should” feel optional and non-prescriptive. Members come from different religious and cultural backgrounds, and mourning practices — rituals, timelines, what’s said or left unsaid — vary widely and are all valid.",
];

const endingBlocking = [
  "Ending a match is always available to either person, no explanation required, and isn’t treated as a violation by either party. Whoever ends it can request a new match afterward.",
  "Blocking is permanent — you won’t be re-matched with that person again. Blocking doesn’t require filing a report, though you can still report separately if the behavior warrants it.",
  "Neither action needs to go through moderation first; they’re yours to use whenever a match isn’t working.",
];

const unacceptable = [
  "Harassment, hate speech, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or any other protected characteristic.",
  "Romantic or sexual advances. Ndo is a grief-support space, not a dating platform.",
  "Sending sexual or explicit photos or videos. This is a permanent ban.",
  "Soliciting members for sales, services, coaching, fundraising, or any commercial purpose.",
  "Minimizing, mocking, or arguing with someone’s grief, or telling them how they should feel.",
  "Sharing another member’s identity, story, or messages outside the app without consent.",
  "Impersonating a grief counselor, therapist, or medical professional if you are not one.",
  "Encouraging or glorifying self-harm, suicide, or substance misuse as a way of coping.",
  "Any threat of violence toward another member or oneself.",
];

const safety = [
  "Ndo is peer support, not a crisis service, and no member — including Ndo staff — is expected to act as one.",
  "Crisis-line resources (e.g., 988 in the US) are one tap away in every conversation, under Get help. Ndo doesn’t scan conversations, so we only know someone is struggling if someone tells us.",
  "Members are never asked or expected to talk someone out of a crisis themselves.",
  "If you’re worried about your match, point them toward crisis resources, then let Ndo know with “I’m worried about them” or the in-app report tool.",
  "A person at Ndo (not AI) reviews every concern and report, and can check in on the affected member.",
  "Ndo surfaces external mental health resources and provider directories. Listing a resource is not a vetting or endorsement of it — members use their own judgment when reaching out to any listed provider.",
];

const privacy = [
  "What’s shared in a match conversation stays there. Screenshots, forwarding, or repeating another member’s story to anyone outside Ndo is a violation, with an exception only for reporting harm or a safety risk.",
  "Members choose what personal details to share (last name, location, photos, social handles); no one should pressure another member to share more than they’re comfortable with.",
  "Ndo does not sell member data or use it to train AI. No AI is used anywhere in intake, matching, or moderation — every match and review is handled by a person.",
];

const reporting = [
  "Use the in-app “Report” button on the message or profile in question — this is the fastest path and flags it for review right away.",
  "For anything urgent or safety-related, reporting takes priority over ending the conversation gracefully; it’s fine to simply exit the chat.",
  "Every report is reviewed by a human, not AI. The reporting member’s identity is kept confidential from the person they reported.",
  "Members will get a short confirmation that their report was received and, where appropriate, an outcome once it’s resolved.",
  "Reports made in bad faith — filed knowingly to harass, punish, or retaliate against another member — are themselves a violation and can lead to removal.",
];

const enforcement: [string, string][] = [
  ["First-time, lower-severity (e.g., unsolicited advice, minor tone issue)", "Warning + brief guidance"],
  ["Repeated lower-severity, or single moderate violation (e.g., solicitation, sharing a match’s info)", "Suspension"],
  ["Severe or repeated (e.g., harassment, threats, sexual advances, explicit images, impersonating a professional)", "Permanent ban"],
  ["Immediate danger to self or others", "Crisis resources surfaced immediately; account action follows separately"],
];

function List({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function CodeOfConduct() {
  return (
    <LegalPage
      title="Code of Conduct"
      updated="September 23, 2026"
      draft={<>Not final yet. Items marked in brackets are still to be decided.</>}
    >
      <section aria-labelledby="commitment">
        <h2 id="commitment">Our commitment</h2>
        <p>
          Ndo exists so people who are grieving can find someone who
          understands what they&apos;re carrying — not a stranger they have to
          explain grief 101 to first. Ndo staff aren&apos;t licensed mental
          health professionals, and neither is any member&apos;s match; this is
          peer support between people who&apos;ve lived through loss, not
          therapy. This code of conduct exists to keep the space safe enough for
          people to be honest about what they&apos;re going through.
        </p>
        <p>
          Ndo does not use AI anywhere in intake, matching, or member
          conversations — every match and every review is done by a person.
          Member data is never sold or used to train AI models.
        </p>
        <p>
          By joining Ndo, members agree to treat every conversation as one
          happening between two grieving people — not a customer support
          ticket, not a dating app, not a place to perform or sell anything.
        </p>
      </section>

      <section aria-labelledby="values">
        <h2 id="values">Core values</h2>
        <ol>
          {values.map((v) => (
            <li key={v.title}>
              <strong>{v.title}</strong> {v.body}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="expected">
        <h2 id="expected">Expected behavior</h2>
        <List items={expected} />
      </section>

      <section aria-labelledby="ending">
        <h2 id="ending">Ending a match or blocking someone</h2>
        <List items={endingBlocking} />
      </section>

      <section aria-labelledby="unacceptable">
        <h2 id="unacceptable">Unacceptable behavior</h2>
        <List items={unacceptable} />
      </section>

      <section aria-labelledby="safety">
        <h2 id="safety">Safety and crisis situations</h2>
        <List items={safety} />
      </section>

      <section aria-labelledby="privacy">
        <h2 id="privacy">Privacy and confidentiality</h2>
        <List items={privacy} />
      </section>

      <section aria-labelledby="reporting">
        <h2 id="reporting">Reporting a violation</h2>
        <ol>
          {reporting.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="enforcement">
        <h2 id="enforcement">Enforcement</h2>
        <p>Consequences scale with severity and pattern, not a fixed strike count:</p>
        <div className="legal-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Violation type</th>
                <th scope="col">Typical response</th>
              </tr>
            </thead>
            <tbody>
              {enforcement.map(([v, r]) => (
                <tr key={v}>
                  <th scope="row">{v}</th>
                  <td>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Members can appeal a decision by contacting Ndo support; appeals are
          reviewed by a person at Ndo.
        </p>
      </section>

      <section aria-labelledby="scope">
        <h2 id="scope">Scope and contact</h2>
        <p>
          Ndo is for adults only — you must be 18 or older to create an
          account, and members may not be minors.
        </p>
        <p>
          This code of conduct applies to all activity within Ndo — matched
          conversations, profiles, and any community spaces added later.
          Members may choose to connect off-platform; that&apos;s their call and
          their risk. You can still report someone you were matched with for
          how they treated you off the app, whether in person, by text, or on
          social media, and Ndo may act on it.
        </p>
        <p>
          Questions, reports, or appeals:{" "}
          <Confirm>support email/contact — to be added once set up</Confirm>
        </p>
        <p>
          <Confirm>
            Open item to decide before launch: the exact list of
            countries/regions where crisis-line numbers will be surfaced.
          </Confirm>
        </p>
      </section>
    </LegalPage>
  );
}
