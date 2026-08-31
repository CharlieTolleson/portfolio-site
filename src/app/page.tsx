"use client";

import { motion } from "motion/react";

const sections = [
  "Interactive AI Agent Orchestration Suite",
  "Agentic Auto-Causal Inference",
  "Metric Decomposition for Root Cause Analysis and Decision Making",
  "Graphical NER and News Event Detection",
  "NLP Patent Infringement Detection",
  "ML Sales Recommendations with Shapely Values",
];

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-black font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center gap-16 px-8 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Charlie Tolleson
          </h1>
          <p className="text-lg text-zinc-400">Coming soon…</p>
        </motion.div>

        <ol className="flex w-full flex-col gap-6">
          {sections.map((title, i) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 + i * 0.08 }}
              className="flex items-baseline gap-4 border-b border-zinc-800 pb-6 text-left"
            >
              <span className="font-mono text-sm text-zinc-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-base text-zinc-200">{title}</span>
            </motion.li>
          ))}
        </ol>
      </main>
    </div>
  );
}
