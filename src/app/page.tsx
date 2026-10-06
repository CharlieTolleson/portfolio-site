"use client";

import Link from "next/link";
import { motion } from "motion/react";
import WorkflowGraph from "@/components/WorkflowGraph";
import CausalTree from "@/components/CausalTree";
import DecompWaterfall from "@/components/DecompWaterfall";
import StorySplit from "@/components/StorySplit";
import AnswerSpread from "@/components/AnswerSpread";
import StealthBrief from "@/components/StealthBrief";

/**
 * Built entries, in display order. Each renders as a card on the home page.
 *
 * Ordered for an AI-literate reader, not by date: the agent work first (one
 * system, then the org-wide standards, then the product Charlie is building
 * now), then the measurement work that agents wrap, then the pre-LLM IBM work.
 * Keeping the two bar-chart thumbnails (AnswerSpread, DecompWaterfall) apart
 * also gives the stack some visual rhythm. The stealth entry sits after the
 * Meta agent work rather than first: it answers "what now?", but it can't show
 * the product, so it shouldn't be the first impression.
 *
 * Titles are written to invite rather than to classify, so `blurb` is where the
 * method keyword lives ("multi-agent orchestrator", "causal inference",
 * "decomposition"). That keeps the card searchable and tells a visitor what the
 * entry actually is, which an evocative title on its own does not.
 *
 * Blurb length is not load-bearing: the paragraph below reserves two lines of
 * space either way, so these can be rewritten without disturbing card heights.
 *
 * `stats` are the skim layer: a visitor who reads nothing else on the card still
 * leaves with the scale or outcome of the work. Every entry with stats carries
 * the same number, so those cards stay height-matched; the stealth entry has
 * none and simply renders shorter, which also sets it apart as the one card
 * that can't show its work. The orchestration card
 * deliberately quotes the Meta eval scope rather than Hyperion's own timings,
 * because Hyperion is a personal project and the Meta numbers are the outcome
 * that card's blurb opens with. Outcome stats replace scope stats wherever
 * Charlie has an outcome to quote (2026-10-06): sales plays changed by the
 * causal work, reports replaced and time saved by the decomposition agent, and
 * specs written under the agent-ready framework.
 */
const entries = [
  {
    href: "/work/ai-orchestration",
    title: "Orchestrating a Team of Models",
    role: "Creator & Architect",
    blurb:
      "From evals @Meta to Hyperion, a multi-agent orchestrator for building your best agent team.",
    stats: [
      { value: "7", label: "AI workflows evaluated" },
      { value: "30+", label: "people coordinated" },
      { value: "1,000s", label: "of sellers they were built for" },
    ],
    visual: <WorkflowGraph variant="card" />,
  },
  {
    href: "/work/agent-ready-org",
    title: "Making an Org Agent-Ready @Meta",
    role: "Framework Author",
    blurb:
      "Agents trust everything they read. I wrote the standards that make it worth trusting.",
    stats: [
      { value: "50+", label: "person org it was presented to" },
      { value: "25+", label: "metrics and data fields given specs" },
      { value: "30+", label: "Claude Skills built to its guidelines" },
    ],
    visual: <AnswerSpread variant="card" />,
  },
  {
    href: "/work/building-in-stealth",
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
          {/* The headline says what I build and what it gets a team, rather
              than a job title: recruiters scan it for keywords (AI, ML,
              metrics) and founders scan it for a point of view. */}
          <h1 className="text-3xl font-medium leading-snug tracking-tight text-zinc-900 sm:text-4xl">
            Hi, I&apos;m Charlie. I build AI agents, ML models, and measurement
            systems that tell teams why their metrics moved, and what will move
            them next.
          </h1>
          {/* Background, then availability: one pair, so it sits tighter than
              the gap-6 between the hero's other blocks. The availability line
              names the field as well as the arrangement, so a recruiter can
              tell which kind of role to match it against. */}
          <div className="flex flex-col gap-1 text-xl text-zinc-600">
            <p>Previously a senior data scientist at @Meta, @Amazon, and @IBM</p>
            <p>Open to full-time roles and freelance projects in AI and data science</p>
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
                    <span className="shrink-0 font-mono text-sm uppercase tracking-wide text-zinc-500">
                      {entry.role}
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
