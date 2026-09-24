import Image from "next/image";
import Link from "next/link";
import { IPhone } from "@/components/IPhone";
import appHome from "../../public/app-home.png";
import appHomeDark from "../../public/app-home-dark.png";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || null;
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null;

// The privacy promise exactly as docs/ACCESS_POLICY.md words it for users.
const PROMISE =
  "Your conversations are encrypted in transit and at rest. Nobody at Ndo reads them unless you or the person you're talking to reports a message. When that happens, only the reported message and a little context around it are sent to us. Every time someone at Ndo looks at your information, it's logged, and you can ask to see that log.";

const steps = [
  {
    title: "Tell us about your loss",
    body: "A few gentle questions: who you lost, how long it's been, and what kind of support you're looking for. Only the Ndo team sees your answers.",
  },
  {
    title: "We match you by hand",
    body: "A real person reads what you shared and matches you with people whose experience is close to yours. No algorithm, no swiping.",
  },
  {
    title: "Talk at your own pace",
    body: "Write or send a voice memo whenever you're ready, day or night. Every conversation is private and one‑to‑one: no feeds, no likes, no audience.",
  },
];

const principles = [
  {
    title: "People, not AI",
    body: "Every match is made by a person, and every message comes from one.",
  },
  {
    title: "For adults",
    body: "Ndo is for people 18 and older.",
  },
  {
    title: "You're in control",
    body: "Step back from a conversation, block someone or report a message at any time.",
  },
  {
    title: "Peer support, not therapy",
    body: "Ndo connects you with people who have been there. It isn't a substitute for professional or crisis care.",
  },
];

// Apple's official "Download on the App Store" badge (from Apple's marketing
// tools; don't redraw or alter it). Black on light pages, white on dark.
// Until the listing exists it isn't a link and carries a "Coming soon" note;
// set NEXT_PUBLIC_APP_STORE_URL and it links straight to the App Store.
function AppStoreBadge({ size = "large" }: { size?: "large" | "small" }) {
  const badge = (
    <span className={`badge badge-${size}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="only-light" src="/app-store-badge-black.svg" alt="Download on the App Store" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="only-dark" src="/app-store-badge-white.svg" alt="Download on the App Store" />
    </span>
  );
  if (APP_STORE_URL) {
    return <a href={APP_STORE_URL}>{badge}</a>;
  }
  return badge;
}

function GetTheApp() {
  return (
    <div className="cta">
      <AppStoreBadge />
      {!APP_STORE_URL && <span className="cta-note">Coming soon</span>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="header">
        <div className="wrap header-inner">
          <Link className="wordmark" href="/" aria-label="Ndo home">
            Ndo
          </Link>
          <nav className="header-links" aria-label="Page">
            <a href="#how">How it works</a>
            <a href="#crisis">Crisis help</a>
            <AppStoreBadge size="small" />
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="wrap hero">
          <div className="hero-copy">
            <p className="eyebrow">Peer support for grief</p>
            <h1>
              Talk with someone who has lost someone,{" "}
              <span className="accent-italic">too.</span>
            </h1>
            <p className="lede">
              Ndo matches you with people who are grieving a loss like yours,
              for private one‑to‑one conversations. Every match is made by a
              person, not an algorithm.
            </p>
            <GetTheApp />
          </div>
          <div className="hero-visual">
            <IPhone>
              {/* Light and dark captures of the app; CSS shows the one that
                  matches the reader's color scheme. */}
              <Image
                className="only-light"
                src={appHome}
                alt="The Ndo app: a quiet list of conversations with the people you've been matched with."
                priority
                sizes="(min-width: 60rem) 20rem, 80vw"
              />
              <Image
                className="only-dark"
                src={appHomeDark}
                alt="The Ndo app: a quiet list of conversations with the people you've been matched with."
                sizes="(min-width: 60rem) 20rem, 80vw"
              />
            </IPhone>
          </div>
        </section>

        <section className="statement" aria-label="Why Ndo">
          <div className="wrap">
            <p>
              Grief can be lonely in a particular way. Often the people who
              understand best are the ones who have been through it.
            </p>
          </div>
        </section>

        <section className="wrap section" id="how" aria-labelledby="how-title">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2 id="how-title">Matched by hand, with care.</h2>
          </div>
          <ol className="steps">
            {steps.map((step, i) => (
              <li className="step" key={step.title}>
                <span className="step-n" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="wrap section" aria-labelledby="privacy-title">
          <div className="section-head">
            <p className="eyebrow">Privacy</p>
            <h2 id="privacy-title">What you share stays in the conversation.</h2>
          </div>
          <figure className="promise">
            <blockquote>{PROMISE}</blockquote>
            <figcaption>Our promise to everyone on Ndo.</figcaption>
          </figure>
        </section>

        <section className="wrap section" aria-labelledby="principles-title">
          <div className="section-head">
            <p className="eyebrow">What to expect</p>
            <h2 id="principles-title">Built carefully, for a hard time.</h2>
          </div>
          <div className="principles">
            {principles.map((p) => (
              <div className="principle" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap crisis" id="crisis" aria-labelledby="crisis-title">
          <div className="crisis-inner">
            <p className="eyebrow">Crisis help</p>
            <h2 id="crisis-title">If you&apos;re struggling right now</h2>
            <p>
              Call or text <a href="tel:988">988</a> to reach the 988 Suicide
              &amp; Crisis Lifeline, or text HELLO to{" "}
              <a href="sms:741741&amp;body=HELLO">741741</a> to reach the
              Crisis Text Line. Both are free, confidential and there any time,
              day or night. If you or someone else is in immediate danger, call
              911.
            </p>
            <p>
              Outside the US,{" "}
              <a href="https://www.iasp.info/resources/Crisis_Centres/">
                find a crisis center in your country
              </a>
              .
            </p>
            <p className="fine">
              These are independent organizations. Listing them isn&apos;t a
              vetting or endorsement by Ndo.
            </p>
          </div>
        </section>

        <section className="wrap closing" aria-labelledby="closing-title">
          <h2 id="closing-title">When you&apos;re ready, we&apos;re here.</h2>
          <GetTheApp />
        </section>
      </main>

      <footer className="wrap footer">
        <div className="footer-brand">
          <span className="wordmark">Ndo</span>
          <p>Peer support for grief. Matched by hand.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#crisis">Crisis help</a>
          {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>}
        </nav>
        <p className="footer-legal">© {new Date().getFullYear()} Ndo</p>
      </footer>
    </>
  );
}
