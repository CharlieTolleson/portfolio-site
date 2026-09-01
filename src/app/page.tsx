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
            specializing in architecting AI, ML, and measurement systems that
            scale across organizations.
          </h1>
          <p className="text-xl text-zinc-600">Currently Freelancing</p>
          <p className="text-xl text-zinc-600">
            Previously a senior data scientist at @Meta, @Amazon, and @IBM
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        >
          <Link
            href="/work/ai-orchestration"
            className="group block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-zinc-300 sm:p-10"
          >
            <WorkflowGraph variant="card" />
            <div className="mt-8 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-2xl font-medium text-zinc-900 sm:text-3xl">
                Interactive AI Agent Orchestration Suite
              </h2>
              <span className="shrink-0 font-mono text-sm uppercase tracking-wide text-zinc-500">
                Creator &amp; Architect
              </span>
            </div>
          </Link>
        </motion.div>

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
                {String(i + 2).padStart(2, "0")}
              </span>
              <span className="text-2xl text-zinc-700">{title}</span>
            </motion.li>
          ))}
        </ol>
      </main>
    </div>
  );
}
