import type { Metadata, Viewport } from "next";
import { Figtree, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Same pairing as the app: Instrument Serif for the wordmark and headings,
// Figtree for reading. Instrument Serif has a single weight.
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ndo — Talk with someone who has lost someone, too",
  description:
    "Ndo matches you with people who are grieving a loss like yours, for private one-to-one conversations. Every match is made by a person, not an algorithm.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F1EB" },
    { media: "(prefers-color-scheme: dark)", color: "#131211" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
