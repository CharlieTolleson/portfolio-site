/**
 * About: the bio page, linked from the site header.
 *
 * Role in the system: visitors reach this page after the work has already
 * convinced them, so it answers the next question, "who is this person?",
 * rather than re-selling the case studies. The shape is an intro (what I'm
 * into now and where I've been), a short work list for recruiters who land
 * here directly, a brief origin story, and a few fun facts.
 *
 * Key design decisions:
 *   - **Warm, not cute.** First person and conversational, but sentence case
 *     and no emoji, so it still sits comfortably beside the case studies.
 *   - **Titles left out of the work list.** The list says what I did at each
 *     company rather than repeating job titles, which live on the resume and
 *     LinkedIn.
 *   - **Fun facts stay low-key.** A plain bulleted list at the end, so the
 *     personal notes read as color rather than competing with the work.
 *   - **Figures match the cards.** Every career number here (Meta eval scope)
 *     is the same one the home page quotes, so a reader cross-checking never
 *     finds a mismatch.
 *   - **The current product stays in stealth (Charlie, 2026-10-06).** Neither
 *     the intro nor the work list names it, its industry, or what it connects
 *     to; the work list links to the stealth entry instead.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import CopyEmailButton from "@/components/CopyEmailButton";

export const metadata = {
  title: "About",
  description:
    "Charlie Tolleson: data scientist and AI builder. Building in stealth, previously Meta, Amazon, and IBM. Cyclist, bag maker, and photographer.",
};

const LINK =
  "underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500";

/** Life outside work, kept deliberately low-key so it doesn't compete with the work. */
const FUN_FACTS = [
  "Bikes are my preferred way to get fresh air, whether in the mountains or commuting around town.",
  "I picked up a sewing machine recently to start making bags and tap into my crafty side.",
  "I'm learning to use a hand-me-down DSLR by taking it to beautiful places, usually on my bike.",
];

/** One line per stop, newest first. ReactNode so a line can link to its case study. */
const WORK: { org: string; line: ReactNode }[] = [
  {
    org: "Independent",
    line: (
      <>
        Building{" "}
        <Link href="/work/building-in-stealth" className={LINK}>
          an AI product of my own
        </Link>
        , in stealth for now. Happy to walk you through it privately.
      </>
    ),
  },
  {
    org: "Meta",
    line: (
      <>
        Led{" "}
        <Link href="/work/launch-bar" className={LINK}>
          evals across 7 AI workflows built for thousands of sellers
        </Link>
        ,
        built agent skills that automate key data science workflows, and
        built{" "}
        <Link href="/work/metric-decomposition" className={LINK}>
          an agent that tells you exactly why metrics moved
        </Link>
        .
      </>
    ),
  },
  {
    org: "Amazon",
    line: (
      <>
        Owned the worldwide Price Competitiveness north star metric, diagnosed{" "}
        <Link href="/work/metric-decomposition" className={LINK}>
          what was dragging it down
        </Link>
        , and partnered with teams across the company to balance price
        competitiveness against their own goals.
      </>
    ),
  },
  {
    org: "IBM",
    line: (
      <>
        Led the team behind{" "}
        <Link href="/work/news-event-detection" className={LINK}>
          a live news graph for supply-chain risk
        </Link>
        , and won an Outstanding Technical Achievement Award for a framework
        that let non-technical teams build their own data and ML pipelines.
      </>
    ),
  },
];

/** A small uppercase label over each section, matching the case studies. */
function Label({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-wide text-zinc-400">
      {children}
    </h2>
  );
}

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-32 sm:px-10 lg:px-20">
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Hi there, I&apos;m Charlie.
          </h1>
          {/* Where Charlie lives, stated as a fact rather than a constraint: he
              has no location preference for new roles (2026-10-07). */}
          <p className="font-mono text-sm uppercase tracking-wide text-zinc-500">
            Based in Seattle, WA
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            Lately, I&apos;m into seeing how many of life&apos;s inconveniences I
            can eliminate with agentic AI, whether that&apos;s a personal agent
            for myself or a full-fledged product. Previously, I spent eight
            years at Meta, Amazon, and IBM working in just about every corner of
            data science: production ML, metrics and forecasting, and agentic
            AI.
          </p>
        </div>

        <section className="flex max-w-4xl flex-col gap-5">
          <Label>A few things I&apos;ve done…</Label>
          <ol className="flex flex-col">
            {WORK.map((w) => (
              <li
                key={w.org}
                className="grid grid-cols-1 gap-x-10 gap-y-1 border-t border-zinc-200 py-5 sm:grid-cols-[10rem_1fr]"
              >
                <span className="text-lg font-medium text-zinc-900">
                  {w.org}
                </span>
                <span className="text-lg leading-relaxed text-zinc-600">
                  {w.line}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex max-w-3xl flex-col gap-5">
          <Label>Origin story</Label>
          <p className="text-lg leading-relaxed text-zinc-600">
            I studied Systems Engineering at UVA and fell into data science
            through a summer bootcamp after my first year. Apparently I picked it
            up quickly, because the group behind the bootcamp asked me to lead
            its data science programs, and the rest is history.
          </p>
        </section>

        <section className="flex max-w-3xl flex-col gap-5">
          <Label>Fun facts</Label>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-lg leading-relaxed text-zinc-600 marker:text-zinc-400">
            {FUN_FACTS.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <p className="text-xl leading-relaxed text-zinc-700">
            Open to full-time AI and data science roles, and select freelance
            projects. If you&apos;re building something, say hi.
          </p>
          {/* The closing line asks people to reach out, so the ways to do it
              sit right under it rather than only up in the header. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-sm">
            <CopyEmailButton />
            <a
              href="https://www.linkedin.com/in/charlietolleson"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-zinc-700 ${LINK}`}
            >
              LinkedIn
            </a>
            <Link href="/" className={`text-zinc-700 ${LINK}`}>
              See the work
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
