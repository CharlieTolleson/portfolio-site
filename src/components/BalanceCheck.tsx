"use client";

/**
 * BalanceCheck.tsx: the diagnostics that decide whether an estimate counts.
 *
 * Role in the system: the modelling is the easy half. The half that decides
 * whether a number deserves the word "causal" is whether the treated and
 * untreated groups were made comparable, and this figure is that audit. It
 * pairs the standard balance plot with what the adjustment did to the headline
 * number, because those two panels only mean something together: balance
 * without a change in the estimate looks like wasted effort, and a change in
 * the estimate without balance is just a different wrong answer.
 *
 * Key design decision: the second panel plots the *truth* alongside the two
 * estimates. That is only possible because the data is simulated, and it is the
 * strongest reason to simulate: a reader can see how much of the naive error
 * the adjustment removes, and also see that it does not remove all of it.
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { scaleLinear } from "@visx/scale";
import {
  BALANCE,
  NAIVE_DIFF,
  ADJUSTED_ATE,
  ADJUSTED_SE,
  TRUE_ATE,
  BIAS_REMOVED,
  WORST_AFTER,
} from "@/lib/causalDemo";

const VIEW_W = 1000;
const LABEL_W = 190;
const RIGHT_PAD = 40;
const ROW_H = 38;
const TOP = 40;
const PLOT_H = BALANCE.length * ROW_H;
const VIEW_H = TOP + PLOT_H + 50;

/** Symmetric domain, so a positive and negative imbalance of equal size look
 *  equally bad rather than one being visually closer to the axis. */
const BOUND = 0.75;

const x = scaleLinear<number>({
  domain: [-BOUND, BOUND],
  range: [LABEL_W, VIEW_W - RIGHT_PAD],
});

/** The conventional "close enough to randomized" threshold for standardized
 *  mean differences. Drawn so the reader can check the claim, not take it. */
const THRESHOLD = 0.1;

export default function BalanceCheck() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-6">
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[900px]">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Covariate balance before and after weighting. The largest standardized mean difference falls from ${Math.max(
              ...BALANCE.map((b) => Math.abs(b.before))
            ).toFixed(2)} to ${WORST_AFTER.toFixed(2)}.`}
          >
            {/* Acceptable-imbalance band. */}
            <rect
              x={x(-THRESHOLD)}
              y={TOP - 12}
              width={x(THRESHOLD) - x(-THRESHOLD)}
              height={PLOT_H + 12}
              fill="#f4f4f5"
            />
            {[-THRESHOLD, THRESHOLD].map((t) => (
              <line
                key={`thr-${t}`}
                x1={x(t)}
                x2={x(t)}
                y1={TOP - 12}
                y2={TOP + PLOT_H}
                stroke="#d4d4d8"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
            <line
              x1={x(0)}
              x2={x(0)}
              y1={TOP - 12}
              y2={TOP + PLOT_H}
              stroke="#a1a1aa"
              strokeWidth={1.5}
            />
            <text
              x={x(0)}
              y={TOP - 20}
              textAnchor="middle"
              fontSize={12}
              fill="#71717a"
              fontFamily="var(--font-geist-mono, monospace)"
            >
              balanced
            </text>

            {BALANCE.map((row, i) => {
              const y = TOP + i * ROW_H + ROW_H / 2;
              return (
                <g key={row.label}>
                  <text
                    x={LABEL_W - 16}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={13.5}
                    fill="#52525b"
                    fontFamily="var(--font-geist-sans, sans-serif)"
                  >
                    {row.label}
                  </text>

                  {/* The move from raw to weighted, drawn as travel. */}
                  <motion.line
                    x1={x(row.before)}
                    y1={y}
                    y2={y}
                    stroke="#d4d4d8"
                    strokeWidth={1.5}
                    initial={{ x2: x(row.before) }}
                    animate={{ x2: inView ? x(row.after) : x(row.before) }}
                    transition={{ duration: 0.7, delay: 0.06 * i, ease: "easeOut" }}
                  />
                  <circle
                    cx={x(row.before)}
                    cy={y}
                    r={6}
                    fill="#ffffff"
                    stroke="#a1a1aa"
                    strokeWidth={2}
                  />
                  <motion.circle
                    cy={y}
                    r={6}
                    fill="#18181b"
                    initial={{ cx: x(row.before), opacity: 0 }}
                    animate={{
                      cx: inView ? x(row.after) : x(row.before),
                      opacity: inView ? 1 : 0,
                    }}
                    transition={{ duration: 0.7, delay: 0.06 * i, ease: "easeOut" }}
                  />

                  <title>{`${row.label}: standardized mean difference ${row.before.toFixed(
                    2
                  )} before weighting, ${row.after.toFixed(2)} after`}</title>
                </g>
              );
            })}

            {[-0.6, -0.3, 0, 0.3, 0.6].map((t) => (
              <text
                key={`ax-${t}`}
                x={x(t)}
                y={TOP + PLOT_H + 22}
                textAnchor="middle"
                fontSize={12}
                fill="#a1a1aa"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {t.toFixed(1)}
              </text>
            ))}
            <text
              x={x(0)}
              y={TOP + PLOT_H + 42}
              textAnchor="middle"
              fontSize={11.5}
              fill="#a1a1aa"
              fontFamily="var(--font-geist-mono, monospace)"
            >
              standardized mean difference, treated minus untreated
            </text>
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-400 bg-white" />
          raw comparison
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-zinc-900" />
          after weighting
        </span>
        <span className="text-zinc-400">
          shaded band is the conventional ±0.1 threshold
        </span>
      </div>

      <EstimateLadder />

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Weighting closes most of the gap between the accounts that got the lever
        and the ones that did not, and closing that gap is what moves the
        estimate from {NAIVE_DIFF.toFixed(2)} to {ADJUSTED_ATE.toFixed(2)}. It
        does not close all of it: account size and adoption still sit at{" "}
        {WORST_AFTER.toFixed(2)}, just outside the threshold, and the remaining
        bias is larger than the confidence interval around the estimate.
        Simulated data, where the true effect is known to be{" "}
        {TRUE_ATE.toFixed(2)}.
      </figcaption>
    </figure>
  );
}

/**
 * The three-number panel: what the naive comparison says, what the adjusted
 * estimate says, and what is actually true.
 *
 * Rendered on its own axis rather than as text because the point is a ratio.
 * The naive answer is not slightly wrong, it is nearly three times the truth,
 * and that is a distance a reader should see rather than compute.
 */
function EstimateLadder() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const max = Math.max(NAIVE_DIFF, TRUE_ATE) * 1.15;
  const pct = (v: number) => `${(v / max) * 100}%`;

  const rows = [
    {
      label: "Naive: treated vs untreated",
      value: NAIVE_DIFF,
      color: "#d97706",
      note: "what the raw comparison reports",
    },
    {
      label: "Adjusted: weighted estimate",
      value: ADJUSTED_ATE,
      color: "#2563eb",
      note: `95% confidence interval ±${(1.96 * ADJUSTED_SE).toFixed(2)}`,
    },
    {
      label: "Truth",
      value: TRUE_ATE,
      color: "#18181b",
      note: "known, because the data is simulated",
    },
  ];

  return (
    <div
      ref={ref}
      className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-white px-5 py-5"
    >
      {rows.map((r, i) => (
        <div key={r.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-zinc-700">{r.label}</span>
            <span className="shrink-0 font-mono text-zinc-500">
              {r.value > 0 ? "+" : ""}
              {r.value.toFixed(2)}{" "}
              <span className="text-zinc-400">{r.note}</span>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: r.color }}
              initial={{ width: 0 }}
              animate={{ width: inView ? pct(r.value) : 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 * i }}
            />
          </div>
        </div>
      ))}
      <p className="text-sm text-zinc-500">
        The adjustment removes{" "}
        <span className="font-medium text-zinc-700">
          {(BIAS_REMOVED * 100).toFixed(0)}%
        </span>{" "}
        of the naive comparison&apos;s error. The remainder is the part no
        amount of weighting recovers, and it is the reason a live experiment
        stays the tiebreaker.
      </p>
    </div>
  );
}
