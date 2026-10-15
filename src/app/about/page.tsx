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
 *   - **Problem, fix, adoption (2026-10-15).** Each work line follows the
 *     framing of Charlie's entrepreneurship resume: the problem he noticed,
 *     what he built, and who picked it up. Lines link to their case studies.
 *   - **Figures match the cards.** Every career number here (seven teams,
 *     50+ hypotheses) is the same one the home page quotes, so a reader
 *     cross-checking never finds a mismatch. Resume-only figures (org size,
 *     speedup multiples, dollar amounts, Skill counts) stay off the site.
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
        Taking my own AI products from customer discovery to launch,
        including{" "}
        <Link href="/work/building-in-stealth" className={LINK}>
          one in stealth
        </Link>
        . Happy to walk you through it privately.
      </>
    ),
  },
  {
    org: "Meta",
    line: (
      <>
        Saw that AI agents were only as good as the context they read, so I{" "}
        <Link href="/work/agent-ready-org" className={LINK}>
          wrote the context and Skills standards
        </Link>{" "}
        a data science org adopted on its own. Moved seven teams to{" "}
        <Link href="/work/launch-bar" className={LINK}>
          one eval and launch-gate method
        </Link>{" "}
        before each invented its own. Built agent skills that automate
        recurring data science work,{" "}
        <Link href="/work/metric-decomposition" className={LINK}>
          an agent that tells you exactly why metrics moved
        </Link>
        , and{" "}
        <Link href="/work/causal-inference" className={LINK}>
          Double ML libraries that tested 50+ sales hypotheses
        </Link>{" "}
        in days, not months.
      </>
    ),
  },
  {
    org: "Amazon",
    line: (
      <>
        Grew a one-team role into worldwide ownership of Pricing&apos;s customer
        experience metrics, as single-threaded owner of the Price
        Competitiveness north star. Diagnosed{" "}
        <Link href="/work/metric-decomposition" className={LINK}>
          what was dragging it down
        </Link>{" "}
        and beat the annual goal. Found goals that conflicted across orgs, then
        led a working group that resolved them and set up a process for metric
        tradeoffs.
      </>
    ),
  },
  {
    org: "IBM",
    line: (
      <>
        Data science was the bottleneck for new pipelines, so I wrote a
        framework that let non-technical staff build their own ETL and ML
        pipelines from one config file. Several teams adopted it, it halved
        deployment time, and it won an Outstanding Technical Achievement Award.
        Also led the team behind{" "}
        <Link href="/work/news-event-detection" className={LINK}>
          a live news graph for supply-chain risk
        </Link>
        .
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
            Lately, I&apos;ve been ideating, prototyping, and working toward
            launch on several projects, having fun with AI along the way.
            Previously, I spent eight
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
            up quickly, because the group behind it,{" "}
            <a
              href="https://joinforge.co"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              Forge
            </a>
            , asked me to lead its data science programs. Everything since has
            been largely self-taught, mostly by building things, which is still
            how I learn best.
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
