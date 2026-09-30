import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import CopyEmailButton from "@/components/CopyEmailButton";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Site-wide defaults. Individual pages override `title`/`description` and add
 * their own `openGraph` block; anything they don't set falls back to these.
 *
 * `metadataBase` is required for Next to emit absolute OG URLs. Without it,
 * relative image paths are dropped from the tags and link previews render bare.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://charlietolleson.com"),
  title: {
    default: "Charlie Tolleson: Data Scientist & AI Systems",
    template: "%s | Charlie Tolleson",
  },
  description:
    "Multidisciplinary data scientist architecting and scaling AI, ML, and measurement systems. Previously Meta, Amazon, IBM.",
  openGraph: {
    siteName: "Charlie Tolleson",
    type: "website",
    locale: "en_US",
    title: "Charlie Tolleson: Data Scientist & AI Systems",
    description:
      "Multidisciplinary data scientist architecting and scaling AI, ML, and measurement systems. Previously Meta, Amazon, IBM.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Charlie Tolleson: Data Scientist & AI Systems",
    description:
      "Architecting and scaling AI, ML, and measurement systems. Previously Meta, Amazon, IBM.",
  },
};

/**
 * Header profile links. They live in the layout so every page, including a case
 * study someone landed on from a shared link, is one click from getting in
 * touch. Email is not here: it is the copy-to-clipboard pill rendered last in
 * the header, the one salient call-to-action on the site.
 */
const CONTACT = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/charlietolleson" },
  { label: "GitHub", href: "https://github.com/CharlieTolleson" },
];

const NAV_LINK =
  "text-zinc-500 transition-colors hover:text-zinc-900";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        <header className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-8 sm:px-10 lg:px-16">
          <Link
            href="/"
            className="font-mono text-base uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Charlie Tolleson
          </Link>
          <nav className="flex items-center gap-5 font-mono text-sm sm:gap-6">
            <Link href="/about" className={NAV_LINK}>
              About
            </Link>
            <span aria-hidden className="h-4 w-px bg-zinc-300" />
            {CONTACT.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className={NAV_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.label}
              </a>
            ))}
            <CopyEmailButton />
          </nav>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
