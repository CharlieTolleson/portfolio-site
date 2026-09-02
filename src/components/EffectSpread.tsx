"use client";

/**
 * EffectSpread.tsx: subgroup effects against the single average effect.
 *
 * Role in the system: this is the argument of the case study in one picture.
 * The average treatment effect is a real number and a useless instruction. The
 * same lever that moves the metric by roughly five points in one subgroup moves
 * it backwards in another, and a reader should be able to see that gap without
 * being told.
 *
 * Key design decisions:
 *   - Dot-and-interval rather than bars. The intervals are the reason to trust
 *     the ordering, and bars invite reading the area rather than the estimate.
 *   - The average is drawn as a vertical line across every row rather than as an
 *     eighth row, so it reads as the thing each subgroup is being compared
 *     against instead of another subgroup.
 *   - Population share is printed per row. A large effect in a subgroup holding
 *     6% of accounts is a different business decision than the same effect
 *     across a quarter of them, and the figure would mislead without it.
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { scaleLinear } from "@visx/scale";
import { LEAVES, ADJUSTED_ATE, effectColor } from "@/lib/causalDemo";

const VIEW_W = 1240;
// Wide enough for the longest subgroup rule, which is a three-clause
// conjunction. Narrower and the labels overflow the canvas and get clipped.
const LABEL_W = 415;
const RIGHT_PAD = 92;
const ROW_H = 42;
// Headroom for the "average" callout, which sits above the top row.
const TOP = 62;
const PLOT_H = LEAVES.length * ROW_H;
const VIEW_H = TOP + PLOT_H + 52;

/** Axis padding so the widest interval never touches the plot edge. */
const lo = Math.min(...LEAVES.map((l) => l.effect - 1.96 * l.se)) - 0.4;
const hi = Math.max(...LEAVES.map((l) => l.effect + 1.96 * l.se)) + 0.4;

const x = scaleLinear<number>({
  domain: [Math.min(lo, 0), hi],
  range: [LABEL_W, VIEW_W - RIGHT_PAD],
});

/** Whole-number ticks across the domain, always including zero. */
const TICKS = (() => {
  const out: number[] = [];
  for (let t = Math.ceil(Math.min(lo, 0)); t <= Math.floor(hi); t++) out.push(t);
  return out;
})();

export default function EffectSpread() {
  const ref = useRef<HTMLDivElement>(null);
  // Below the fold: intervals draw themselves only once the reader is here.
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-5">
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[1120px]">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Estimated treatment effects for seven subgroups, ranging from ${LEAVES[0].effect.toFixed(
              1
            )} to ${LEAVES[LEAVES.length - 1].effect.toFixed(
              1
            )} index points, against a single average effect of ${ADJUSTED_ATE.toFixed(
              1
            )}.`}
          >
            {TICKS.map((t) => (
              <g key={`tick-${t}`}>
                <line
                  x1={x(t)}
                  x2={x(t)}
                  y1={TOP - 10}
                  y2={TOP + PLOT_H}
                  stroke={t === 0 ? "#a1a1aa" : "#f4f4f5"}
                  strokeWidth={t === 0 ? 1.5 : 1}
                />
                <text
                  x={x(t)}
                  y={TOP + PLOT_H + 22}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#a1a1aa"
                  fontFamily="var(--font-geist-mono, monospace)"
                >
                  {t > 0 ? `+${t}` : t}
                </text>
              </g>
            ))}

            {/* The average, drawn through every row. */}
            <line
              x1={x(ADJUSTED_ATE)}
              x2={x(ADJUSTED_ATE)}
              y1={TOP - 22}
              y2={TOP + PLOT_H}
              stroke="#18181b"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text
              x={x(ADJUSTED_ATE)}
              y={TOP - 28}
              textAnchor="middle"
              fontSize={13}
              fill="#18181b"
              fontFamily="var(--font-geist-mono, monospace)"
            >
              average {ADJUSTED_ATE > 0 ? "+" : ""}
              {ADJUSTED_ATE.toFixed(2)}
            </text>

            {LEAVES.map((leaf, i) => {
              const y = TOP + i * ROW_H + ROW_H / 2;
              const color = effectColor(leaf.effect);
              const left = x(leaf.effect - 1.96 * leaf.se);
              const right = x(leaf.effect + 1.96 * leaf.se);
              return (
                <g key={leaf.id}>
                  <text
                    x={LABEL_W - 16}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={12.5}
                    fill="#52525b"
                    fontFamily="var(--font-geist-mono, monospace)"
                  >
                    {leaf.path.join("  ·  ")}
                  </text>

                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    transition={{ duration: 0.35, delay: 0.07 * i }}
                  >
                    <line
                      x1={left}
                      x2={right}
                      y1={y}
                      y2={y}
                      stroke={color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    <circle cx={x(leaf.effect)} cy={y} r={6.5} fill={color} />
                    <text
                      x={VIEW_W - RIGHT_PAD + 16}
                      y={y + 4}
                      fontSize={12.5}
                      fill="#a1a1aa"
                      fontFamily="var(--font-geist-mono, monospace)"
                    >
                      {(leaf.share * 100).toFixed(0)}%
                    </text>
                  </motion.g>

                  <title>{`${leaf.path.join("; ")}: ${leaf.effect.toFixed(
                    2
                  )} points (95% CI ${(leaf.effect - 1.96 * leaf.se).toFixed(
                    2
                  )} to ${(leaf.effect + 1.96 * leaf.se).toFixed(2)}), n=${
                    leaf.n
                  }`}</title>
                </g>
              );
            })}

            <text
              x={x(0)}
              y={TOP + PLOT_H + 42}
              textAnchor="middle"
              fontSize={11.5}
              fill="#a1a1aa"
              fontFamily="var(--font-geist-mono, monospace)"
            >
              effect on the metric, index points
            </text>
            <text
              x={VIEW_W - RIGHT_PAD + 16}
              y={TOP - 12}
              fontSize={11}
              fill="#a1a1aa"
              fontFamily="var(--font-geist-mono, monospace)"
            >
              share
            </text>
          </svg>
        </div>
      </div>

      <p className="font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Every subgroup the tree found, with 95% intervals, against the single
        population average. Reporting the average alone would tell a sales team
        to run this play everywhere, including the{" "}
        {(LEAVES[0].share * 100).toFixed(0)}% of accounts where the estimate is
        negative and the interval excludes zero. Simulated data.
      </figcaption>
    </figure>
  );
}
