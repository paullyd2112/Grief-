import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

// Shared layout for /privacy, /terms and /conduct. Each page mirrors its file
// in docs/legal/ word for word.

// An open decision from a draft, highlighted so it can't slip through.
export function Confirm({ children }: { children?: React.ReactNode }) {
  return <mark className="confirm">[{children ?? "CONFIRM"}]</mark>;
}

export function LegalPage({
  title,
  updated,
  draft,
  children,
}: {
  title: string;
  updated: string;
  // While a document has open items the page says so and stays out of search
  // results (set `robots` in the page's metadata too). Drop both once final.
  draft?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      <main id="main" className="wrap legal">
        <header className="legal-head">
          <p className="eyebrow">Legal</p>
          <h1>{title}</h1>
          <p className="legal-date">Last updated {updated}</p>
          {draft && (
            <p className="legal-draft" role="note">
              {draft}
            </p>
          )}
        </header>

        {children}
      </main>

      <SiteFooter />
    </>
  );
}
