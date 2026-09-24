import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

// Same pairing as the app: Newsreader for headings, Inter for reading.
const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
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
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
