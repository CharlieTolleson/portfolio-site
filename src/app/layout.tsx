import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        <header className="w-full px-6 py-8 sm:px-10 lg:px-16">
          <Link
            href="/"
            className="font-mono text-base uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Charlie Tolleson
          </Link>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
