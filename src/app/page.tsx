"use client";

import Link from "next/link";
import { motion } from "motion/react";
import WorkflowGraph from "@/components/WorkflowGraph";

const comingSoon = [
  "Agentic Auto-Causal Inference",
  "Metric Decomposition for Root Cause Analysis and Decision Making",
  "Graphical NER and News Event Detection",
  "NLP Patent Infringement Detection",
  "ML Sales Recommendations with Shapely Values",
  "No-Code ML",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-900 font-sans">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-32 sm:px-10 lg:px-16">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl"
        >
          Charlie Tolleson
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <Link
            href="/work/ai-orchestration"
            className="group block rounded-xl border border-zinc-700 bg-zinc-800/60 p-6 transition-colors hover:border-zinc-500 sm:p-8"
          >
            <WorkflowGraph variant="card" />
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-xl font-medium text-zinc-100 group-hover:text-white">
                Interactive AI Agent Orchestration Suite
              </h2>
              <span className="shrink-0 font-mono text-xs uppercase tracking-wide text-zinc-400">
                Creator &amp; Architect
              </span>
            </div>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
          className="text-lg text-zinc-400"
        >
          Coming soon…
        </motion.p>

        <ol className="flex w-full flex-col gap-6">
          {comingSoon.map((title, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 + i * 0.08 }}
              className="flex items-baseline gap-4 border-b border-zinc-700 pb-6 text-left"
            >
              <span className="font-mono text-sm text-zinc-500">
                {String(i + 2).padStart(2, "0")}
              </span>
              <span className="text-base text-zinc-200">{title}</span>
            </motion.li>
          ))}
        </ol>
      </main>
    </div>
  );
}
