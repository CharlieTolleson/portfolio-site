"use client";

import Link from "next/link";
import { motion } from "motion/react";
import WorkflowGraph from "@/components/WorkflowGraph";
import CausalTree from "@/components/CausalTree";
import DecompWaterfall from "@/components/DecompWaterfall";
import StorySplit from "@/components/StorySplit";
import AnswerSpread from "@/components/AnswerSpread";
import StealthBrief from "@/components/StealthBrief";
import EvalDashboard from "@/components/EvalDashboard";
import CopyEmailButton from "@/components/CopyEmailButton";

/**
 * Built entries, in display order. Each renders as a card on the home page.
 *
 * Ordered for an AI-literate reader, not by date: the Meta agent work first
 * (evals, then the org-wide standards), then Charlie's own agent systems
 * (Hyperion, then the product he is building now), then the measurement work
 * that agents wrap, then the pre-LLM IBM work. The evals entry leads because
 * leading evals for production-bound agents is the most hireable credential on
 * the site. Keeping the two bar-chart thumbnails (AnswerSpread,
 * DecompWaterfall) apart also gives the stack some visual rhythm. The stealth
 * entry never leads: it answers "what now?", but it can't show the product.
 *
 * Titles are written to invite rather than to classify, so `blurb` is where the
 * method keyword lives ("multi-agent orchestrator", "causal inference",
 * "decomposition"). That keeps the card searchable and tells a visitor what the
 * entry actually is, which an evocative title on its own does not.
 *
 * `date` is the year the work was done (Charlie, 2026-10-07), shown beside
 * the role so a reader can place each entry in time.
 *
 * Blurb length is not load-bearing: the paragraph below reserves two lines of
 * space either way, so these can be rewritten without disturbing card heights.
 *
 * `stats` are the skim layer: a visitor who reads nothing else on the card still
 * leaves with the scale or outcome of the work. Every entry with stats carries
 * the same number, so those cards stay height-matched; the stealth entry has
 * none and simply renders shorter, which also sets it apart as the one card
 * that can't show its work. The orchestration card quotes capabilities
 * (custom agents, per-step model config, full traces), never counts or usage
 * figures, because it is a personal project; the Meta eval scope it used to
 * quote now lives on the evals card (2026-10-07).
 * Outcome stats replace scope stats wherever
 * Charlie has an outcome to quote (2026-10-06): sales plays changed by the
 * causal work, reports replaced and time saved by the decomposition agent, and
 * specs written under the agent-ready framework. The Amazon outcome is stated
 * relative to its goal, not in basis points (2026-10-07).
 */
const entries = [
  {
    href: "/work/launch-bar",
    date: "2026",
    title: "Setting the Launch Bar for AI @Meta",
    role: "Eval DS Lead",
    blurb:
      "Seven teams were building agents for thousands of ad sellers. I set the bar they had to clear to launch.",
    stats: [
      { value: "7", label: "AI workflows held to one launch bar" },
      { value: "~100", label: "eval criteria on one dashboard" },
      { value: "30+", label: "people across eight teams aligned" },
    ],
    visual: <EvalDashboard variant="card" />,
  },
  {
    href: "/work/agent-ready-org",
    date: "2026",
    title: "Making an Org Agent-Ready @Meta",
    role: "Framework Author",
    blurb:
      "Agents trust everything they read. I wrote the standards that make it worth trusting.",
    stats: [
      { value: "50+", label: "person org it was presented to" },
      { value: "25+", label: "metrics and data fields given specs" },
      { value: "No mandate", label: "teams adopted it on their own" },
    ],
    visual: <AnswerSpread variant="card" />,
  },
  {
    href: "/work/ai-orchestration",
    date: "2026",
    title: "Orchestrating a Team of Models",
    role: "Creator & Architect",
    blurb:
      "Hyperion, my multi-agent orchestrator: every task a graph, every step on the model that fits it.",
    stats: [
      { value: "Custom", label: "specialist agents for every role" },
      { value: "Any model", label: "per step, with config and callbacks" },
      { value: "Full trace", label: "of every step, for deep diagnostics" },
    ],
    visual: <WorkflowGraph variant="card" />,
  },
  {
    href: "/work/building-in-stealth",
    date: "In development",
    title: "Building in Stealth",
    role: "Founder",
    blurb:
      "My own AI product, for an industry most software has passed by. Ask me for a private walkthrough.",
    // No stats: the entry gives no details about the product, and numbers on
    // the card would promise a kind of evidence the page deliberately withholds.
    stats: [],
    visual: <StealthBrief />,
  },
  {
    href: "/work/causal-inference",
    date: "2026",
    title: "What Moves the Metric @Meta",
    role: "Data Science Lead",
    blurb:
      "They couldn't move the metric. I built a causal inference agent to test every hypothesis.",
    stats: [
      { value: "50+", label: "hypotheses tested" },
      { value: "Minutes", label: "per hypothesis, down from a week" },
      { value: "Sales plays", label: "reprioritized by region and company size" },
    ],
    visual: <CausalTree variant="card" />,
  },
  {
    href: "/work/metric-decomposition",
    date: "2025",
    title: "Metric Forensics @Amazon & @Meta",
    role: "Data Science Lead",
    blurb:
      "Don't know what happened? I built a one-stop-shop framework+agent to tell you.",
    stats: [
      { value: "Goal met", label: "for Price Competitiveness at Amazon" },
      { value: "~30", label: "reports the agent replaced at Meta" },
      { value: "~30 weeks", label: "of data science time saved" },
    ],
    visual: <DecompWaterfall variant="card" />,
  },
  {
    href: "/work/news-event-detection",
    date: "2019",
    title: "Finding the Story @IBM",
    role: "Data Science Lead",
    blurb:
      "Anything can break a supply chain. I built a graph that finds the story before the alert exists.",
    stats: [
      { value: "Live", label: "global news stream" },
      { value: "6", label: "person team led" },
      { value: "Paper", label: "published internally at IBM" },
    ],
    visual: <StorySplit variant="card" />,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-40 sm:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex max-w-3xl flex-col gap-6"
        >
          {/* The headline pairs breadth (the full data science stack) with
              what I do now (AI that makes teams more effective), rather than
              a job title, so it reads for both data science and AI roles and
              leads into the call to connect below (2026-10-08). */}
          <h1 className="text-3xl font-medium leading-snug tracking-tight text-zinc-900 sm:text-4xl">
            Hi, I&apos;m Charlie, a multidisciplinary data scientist with
            experience across the full data science stack, now using AI to make
            teams more effective.
          </h1>
          {/* Background, then an invitation: one pair, so it sits tighter than
              the gap-6 between the hero's other blocks. The second line is a
              call to connect rather than an availability statement
              (2026-10-07): it names the problem Charlie solves for a team and
              puts the email control right beside it, so interest turns into
              contact in one click. */}
          <div className="flex flex-col gap-3 text-xl text-zinc-600">
            <p>Previously a senior data scientist at @Meta, @Amazon, and @IBM</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p>Ready to modernize your team&apos;s agentic stack? Let&apos;s talk.</p>
              <CopyEmailButton />
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-12">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: 0.15 + i * 0.1,
              }}
            >
              <Link
                href={entry.href}
                className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-300 sm:p-10"
              >
                <div className="mb-8 flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <h2 className="text-2xl font-medium text-zinc-900 sm:text-3xl">
                      {entry.title}
                    </h2>
                    {/* Role, then when: the date rides in the same mono
                        overline so it reads as metadata, not a headline. The
                        stealth entry says "In development" rather than a year
                        because it is ongoing. */}
                    <span className="shrink-0 font-mono text-sm uppercase tracking-wide text-zinc-500">
                      {entry.role} · {entry.date}
                    </span>
                  </div>
                  {/* Two lines of space are reserved whether or not the blurb
                      fills them. The visuals below are already height-matched,
                      so a blurb wrapping to a different number of lines is the
                      only thing that can make the cards render at different
                      heights, and reserving the space here means the copy can
                      be edited freely without anyone having to count
                      characters. 3.7rem is two lines of text-lg at
                      leading-relaxed. */}
                  <p className="min-h-[3.7rem] max-w-2xl text-lg font-light leading-relaxed text-zinc-500">
                    {entry.blurb}
                  </p>
                  {entry.stats.length > 0 && (
                    <dl className="mt-2 grid grid-cols-3 gap-x-6 border-t border-zinc-100 pt-5">
                      {entry.stats.map((s) => (
                        <div key={s.label} className="flex flex-col gap-0.5">
                          <dt className="order-2 text-sm leading-snug text-zinc-500">
                            {s.label}
                          </dt>
                          {/* text-xl below `sm`: a third of a phone-width
                              card is about 76px, and word-valued stats
                              ("Minutes", "Sales plays") overflow it at
                              text-2xl. */}
                          <dd className="order-1 m-0 text-xl font-medium tracking-tight text-zinc-900 sm:text-3xl">
                            {s.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                {entry.visual}
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
