"use client";

import Link from "next/link";
import { motion } from "motion/react";
import WorkflowGraph from "@/components/WorkflowGraph";
import CausalTree from "@/components/CausalTree";
import DecompWaterfall from "@/components/DecompWaterfall";

/** Built entries, newest last. Each renders as a card above the coming-soon
 *  list, and the list numbers itself from `entries.length + 1`. */
const entries = [
  {
    href: "/work/ai-orchestration",
    title: "AI Agent Orchestration",
    role: "Creator & Architect",
    visual: <WorkflowGraph variant="card" />,
  },
  {
    href: "/work/causal-inference",
    title: "Agentic Causal Inference",
    role: "Data Science Lead",
    visual: <CausalTree variant="card" />,
  },
  {
    href: "/work/metric-decomposition",
    title: "Metric Decomposition",
    role: "Data Science Lead",
    visual: <DecompWaterfall variant="card" />,
  },
];

const comingSoon = [
  "Graphical NER and News Event Detection",
  "NLP Patent Infringement Detection",
  "ML Sales Recommendations with Shapely Values",
  "No-Code ML",
  "Agent Context Standards",
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
          <h1 className="text-3xl font-medium leading-snug tracking-tight text-zinc-900 sm:text-4xl">
            Hi, I&apos;m Charlie - a multidisciplinary data scientist
            specializing in architecting and scaling AI, ML, and measurement
            systems across organizations.
          </h1>
          <p className="text-xl text-zinc-600">Currently Freelancing</p>
          <p className="text-xl text-zinc-600">
            Previously a senior data scientist at @Meta, @Amazon, and @IBM
          </p>
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
                <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
                  <h2 className="text-2xl font-medium text-zinc-900 sm:text-3xl">
                    {entry.title}
                  </h2>
                  <span className="shrink-0 font-mono text-sm uppercase tracking-wide text-zinc-500">
                    {entry.role}
                  </span>
                </div>
                {entry.visual}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          className="text-2xl text-zinc-500"
        >
          Coming soon…
        </motion.p>

        <ol className="flex w-full flex-col gap-8">
          {comingSoon.map((title, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 + i * 0.08 }}
              className="flex items-baseline gap-6 border-b border-zinc-200 pb-8 text-left"
            >
              <span className="font-mono text-lg text-zinc-400">
                {String(i + entries.length + 1).padStart(2, "0")}
              </span>
              <span className="text-2xl text-zinc-700">{title}</span>
            </motion.li>
          ))}
        </ol>
      </main>
    </div>
  );
}
