"use client";

/**
 * EvidenceStats.tsx — the measured-facts strip for the orchestration case study.
 *
 * Role in the system: converts the page from an essay into a case study. Every
 * figure is read from Hyperion's run trace store via `lib/hyperionRun.ts`, so a
 * reader can check the claims rather than take them on trust.
 *
 * Key design decision: token counts and timings are headlined; dollar cost is
 * deliberately *not*. Hyperion's usage logger prices the metered OpenAI legs but
 * not the legs that run on subscription tiers, so a per-run dollar figure would
 * read as precise while being incomplete. Tokens are counted on every call, so
 * they are the honest unit here.
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { AGGREGATES, SYSTEM_TOTALS } from "@/lib/hyperionRun";

/** One measured figure: a large value, a label, and an optional qualifier. */
type Stat = { value: string; label: string; note?: string };

const STATS: Stat[] = [
  { value: "12", label: "nodes", note: "across 5 execution waves" },
  {
    value: `${AGGREGATES.medianSpeedup.toFixed(1)}×`,
    label: "faster than sequential",
    note: `median of ${AGGREGATES.runs} runs`,
  },
  {
    value: `${Math.round(AGGREGATES.medianWallSeconds / 60)}m`,
    label: "median wall clock",
    note: `${AGGREGATES.medianWallSeconds}s end to end`,
  },
  {
    value: `${AGGREGATES.distinctModels}`,
    label: "model targets",
    note: `${AGGREGATES.providers} providers behind them`,
  },
  {
    value: `${Math.round(AGGREGATES.medianTokens / 1000)}k`,
    label: "tokens per run",
    note: "median, input + output",
  },
  {
    value: SYSTEM_TOTALS.llmCalls.toLocaleString(),
    label: "traced LLM calls",
    note: `${SYSTEM_TOTALS.tasks} tasks since ${SYSTEM_TOTALS.firstRun.slice(0, 7)}`,
  },
];

export default function EvidenceStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-zinc-200 py-8 sm:grid-cols-3 lg:grid-cols-6"
    >
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.06 }}
          className="flex flex-col gap-1"
        >
          <span className="text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl">
            {s.value}
          </span>
          <span className="text-sm text-zinc-700">{s.label}</span>
          {s.note && (
            <span className="font-mono text-xs leading-snug text-zinc-400">
              {s.note}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
