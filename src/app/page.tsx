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
    <div className="flex flex-1 flex-col items-center bg-black font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center gap-16 px-8 py-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Charlie Tolleson
          </h1>
          <p className="text-lg text-zinc-400">Coming soon…</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          className="w-full"
        >
          <Link
            href="/work/ai-orchestration"
            className="group block rounded-xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-zinc-700"
          >
            <WorkflowGraph variant="card" />
            <div className="mt-6 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-medium text-zinc-100 group-hover:text-white">
                Interactive AI Agent Orchestration Suite
              </h2>
              <span className="shrink-0 font-mono text-xs uppercase tracking-wide text-zinc-500">
                Creator &amp; Architect
              </span>
            </div>
          </Link>
        </motion.div>

        <ol className="flex w-full flex-col gap-6">
          {comingSoon.map((title, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 + i * 0.08 }}
              className="flex items-baseline gap-4 border-b border-zinc-800 pb-6 text-left"
            >
              <span className="font-mono text-sm text-zinc-600">
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
