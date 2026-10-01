import Link from "next/link";

// Header, footer and App Store badge shared by every page of the site.

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || null;
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null;

// Apple's official "Download on the App Store" badge (from Apple's marketing
// tools; don't redraw or alter it). Black on light pages, white on dark.
// Until the listing exists it isn't a link and carries a "Coming soon" note;
// set NEXT_PUBLIC_APP_STORE_URL and it links straight to the App Store.
export function AppStoreBadge({ size = "large" }: { size?: "large" | "small" }) {
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

export function GetTheApp() {
  return (
    <div className="cta">
      <AppStoreBadge />
      {!APP_STORE_URL && <span className="cta-note">Coming soon</span>}
    </div>
  );
}

export function SiteHeader() {
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
          <nav className="header-links" aria-label="Site">
            <Link className="header-how" href="/#how">
              How it works
            </Link>
            <Link href="/#crisis">Crisis help</Link>
            <AppStoreBadge size="small" />
          </nav>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="wrap footer">
      <div className="footer-brand">
        <span className="wordmark">Ndo</span>
        <p>Peer support for grief. Matched by hand.</p>
      </div>
      <nav className="footer-links" aria-label="Footer">
        <Link href="/#how">How it works</Link>
        <Link href="/#crisis">Crisis help</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/conduct">Code of Conduct</Link>
        {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`}>Contact</a>}
      </nav>
      <p className="footer-legal">© {new Date().getFullYear()} Ndo</p>
    </footer>
  );
}
