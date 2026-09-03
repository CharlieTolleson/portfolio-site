"use client";

/**
 * RunTimeline.tsx: Gantt chart of one real Hyperion run.
 *
 * Role in the system: this is the case study's evidence exhibit. The workflow
 * graph next to it shows the *shape* of an orchestration; this shows what that
 * shape actually did on the clock, using measured spans from the run trace store
 * (see `lib/hyperionRun.ts`).
 *
 * Key design decisions:
 *   - Bars are colored by **routing target**, not by node role. The page's
 *     thesis is that different steps deserve different models, so the reader
 *     should be able to see the mix at a glance rather than read it out of a
 *     table.
 *   - Bars carry the target the trace store recorded, which for two nodes is a
 *     role alias (`smart`, `worker`) rather than a vendor model. The store does
 *     not record which member of an alias pool served the call, so the chart
 *     does not guess. The indirection is explained in prose beside the settings
 *     screenshot.
 *   - The footer bar compares measured wall clock against the summed node spans.
 *     That contrast is the single most persuasive number on the page, so it gets
 *     its own visual rather than living in prose.
 *
 * Built with `@visx/scale` + `@visx/group` over hand-written SVG. visx supplies
 * the scale math while the marks stay explicit, which keeps the chart small and
 * avoids shipping a full charting runtime for one figure.
 */

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { scaleLinear } from "@visx/scale";
import { Group } from "@visx/group";
import {
  RUN_NODES,
  RUN_WALL_SECONDS,
  RUN_SEQUENTIAL_SECONDS,
  MODELS,
  FEATURED_RUN_ID,
} from "@/lib/hyperionRun";

const VIEW_W = 1200;
const LABEL_W = 190;
const PLOT_R = 24;
const ROW_H = 26;
const ROW_GAP = 6;
const TOP = 8;
const AXIS_H = 46;
const PLOT_H = RUN_NODES.length * (ROW_H + ROW_GAP);
const VIEW_H = TOP + PLOT_H + AXIS_H;

/**
 * Bar colors keyed by the routing target recorded on the trace row.
 *
 * Chosen from Tailwind's 600 steps so they hold contrast against the zinc-50
 * page ground and stay distinguishable for the most common forms of color
 * vision deficiency (blue/green/violet/amber rather than a red-green pair).
 */
const MODEL_COLOR: Record<string, string> = {
  "gpt-4o": "#2563eb",
  "gemini-2.5-pro": "#059669",
  smart: "#7c3aed",
  worker: "#d97706",
};

const xScale = scaleLinear<number>({
  domain: [0, RUN_WALL_SECONDS],
  range: [LABEL_W, VIEW_W - PLOT_R],
});

/** Axis ticks every 60s, plus the run's exact end so the total is readable. */
const TICKS = [0, 60, 120, 180, 240, RUN_WALL_SECONDS];

/** Formats seconds as `m:ss`, matching how a reader would describe a 4-minute run. */
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

export default function RunTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  // Bars grow from t=0 only once the figure is actually on screen. Animating on
  // mount would waste the reveal: the chart sits well below the fold, so a
  // reader scrolling down would arrive to an already-finished chart.
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-5">
      {/* Horizontal scroll keeps the chart legible on narrow screens instead of
          scaling twelve labelled rows down to unreadable pixel heights. */}
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[1040px] sm:min-w-[720px]">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Timeline of Hyperion run ${FEATURED_RUN_ID}: nodes grouped into execution waves, completing in ${Math.round(
              RUN_WALL_SECONDS
            )} seconds of wall clock, against ${Math.round(
              RUN_SEQUENTIAL_SECONDS
            )} seconds of summed node time.`}
          >
            {/* Vertical gridlines, drawn first so bars sit on top of them. */}
            {TICKS.map((t) => (
              <line
                key={`grid-${t}`}
                x1={xScale(t)}
                x2={xScale(t)}
                y1={TOP}
                y2={TOP + PLOT_H}
                stroke="#e4e4e7"
                strokeWidth={1}
              />
            ))}

            {RUN_NODES.map((n, i) => {
              const y = TOP + i * (ROW_H + ROW_GAP);
              const x = xScale(n.start);
              const w = Math.max(xScale(n.end) - x, 3);
              const color = MODEL_COLOR[n.model] ?? "#71717a";
              const dim = hovered !== null && hovered !== n.id;
              return (
                <Group
                  key={n.id}
                  onMouseEnter={() => setHovered(n.id)}
                  onMouseLeave={() =>
                    setHovered((cur) => (cur === n.id ? null : cur))
                  }
                >
                  <text
                    x={LABEL_W - 12}
                    y={y + ROW_H / 2 + 4}
                    textAnchor="end"
                    fontSize={13}
                    fill={dim ? "#a1a1aa" : "#3f3f46"}
                    fontFamily="var(--font-geist-sans, sans-serif)"
                  >
                    {n.label}
                  </text>

                  {/* Full-width hover target so thin bars stay easy to hit. */}
                  <rect
                    x={LABEL_W}
                    y={y}
                    width={VIEW_W - PLOT_R - LABEL_W}
                    height={ROW_H}
                    fill="transparent"
                  />

                  <motion.rect
                    x={x}
                    y={y + 3}
                    height={ROW_H - 6}
                    rx={4}
                    fill={color}
                    fillOpacity={dim ? 0.25 : 0.9}
                    initial={{ width: 0 }}
                    animate={inView ? { width: w } : { width: 0 }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                      delay: 0.06 * i,
                    }}
                  />

                  <motion.text
                    x={xScale(n.end) + 8}
                    y={y + ROW_H / 2 + 4}
                    fontSize={11.5}
                    fill={dim ? "#d4d4d8" : "#71717a"}
                    fontFamily="var(--font-geist-mono, monospace)"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.06 * i + 0.5, duration: 0.3 }}
                  >
                    {n.model}
                  </motion.text>

                  <title>{`${n.label}: ${n.model}, ${(
                    n.end - n.start
                  ).toFixed(1)}s, ${n.calls} call${
                    n.calls > 1 ? "s" : ""
                  }, ${n.tokens.toLocaleString()} tokens`}</title>
                </Group>
              );
            })}

            {/* Time axis. */}
            <line
              x1={LABEL_W}
              x2={VIEW_W - PLOT_R}
              y1={TOP + PLOT_H + 10}
              y2={TOP + PLOT_H + 10}
              stroke="#d4d4d8"
              strokeWidth={1}
            />
            {TICKS.map((t) => (
              <text
                key={`tick-${t}`}
                x={xScale(t)}
                y={TOP + PLOT_H + 28}
                textAnchor="middle"
                fontSize={11.5}
                fill="#a1a1aa"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {fmt(t)}
              </text>
            ))}
            <text
              x={LABEL_W}
              y={TOP + PLOT_H + 44}
              fontSize={11}
              fill="#a1a1aa"
              fontFamily="var(--font-geist-mono, monospace)"
            >
              elapsed
            </text>
          </svg>
        </div>
      </div>

      <p className="mt-2 font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>

      {/* Model legend, annotated with the provider behind each model so the
          three-provider spread is legible without counting. */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
        {Object.keys(MODEL_COLOR).map((m) => (
          <span key={m} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: MODEL_COLOR[m] }}
            />
            <span className="font-mono">{m}</span>
            <span className="text-zinc-400">{MODELS[m]?.provider}</span>
          </span>
        ))}
      </div>

      <SequentialComparison />

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Run <span className="font-mono text-zinc-600">{FEATURED_RUN_ID}</span>,
        recorded 2026-06-23. Timings are measured from Hyperion&apos;s trace
        store, one row per LLM call; each bar is labeled with the routing
        target that call requested. Two nodes name a role alias rather than a
        model, and the store does not record which member of the pool served
        them. Research nodes span more than one call because they run a capped
        search-and-reason loop, so their bars include tool time between calls.
      </figcaption>
    </figure>
  );
}

/**
 * The headline comparison: measured wall clock against summed node spans.
 *
 * Rendered as two proportional bars rather than a sentence, because the ratio is
 * the claim and a reader should be able to check it by eye.
 */
function SequentialComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const pct = (RUN_WALL_SECONDS / RUN_SEQUENTIAL_SECONDS) * 100;

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white px-5 py-4"
    >
      <Bar
        label="One node at a time"
        value={`${fmt(RUN_SEQUENTIAL_SECONDS)}`}
        widthPct={100}
        color="#d4d4d8"
        inView={inView}
        delay={0}
      />
      <Bar
        label="As a graph"
        value={`${fmt(RUN_WALL_SECONDS)}`}
        widthPct={pct}
        color="#18181b"
        inView={inView}
        delay={0.25}
      />
      <p className="text-sm text-zinc-500">
        Same nodes, same models.{" "}
        <span className="font-medium text-zinc-700">
          {(RUN_SEQUENTIAL_SECONDS / RUN_WALL_SECONDS).toFixed(1)}× faster
        </span>{" "}
        because independent work runs at the same time.
      </p>
    </div>
  );
}

/**
 * One row of the comparison chart.
 *
 * @param label Row caption shown above the bar.
 * @param value Formatted duration printed at the bar's end.
 * @param widthPct Bar width as a percentage of the container.
 * @param color Fill color.
 * @param inView Whether the parent has scrolled into view; gates the animation.
 * @param delay Seconds to stagger this bar behind the previous one.
 */
function Bar({
  label,
  value,
  widthPct,
  color,
  inView,
  delay,
}: {
  label: string;
  value: string;
  widthPct: number;
  color: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-zinc-600">{label}</span>
        <span className="font-mono text-zinc-500">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${widthPct}%` } : { width: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay }}
        />
      </div>
    </div>
  );
}
