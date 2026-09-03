"use client";

/**
 * FunnelLMDI.tsx: decomposing an absolute funnel metric by factor, then by segment.
 *
 * Role in the system: Contribution to Change explains ratio metrics. Revenue is
 * not a ratio, and a sales organization's revenue is a chain of factors
 * multiplied together, so a different tool is needed. This figure runs the
 * Logarithmic Mean Divisia Index over that chain and shows the two-stage answer
 * the agent produces: first which factor in the funnel moved the money, then
 * which part of the business moved that factor.
 *
 * Key design decisions:
 *   - **Horizontal bars.** Factor names are long phrases ("Opportunities per
 *     account"); vertical columns would either truncate them or rotate them.
 *   - **The axis shows the change, not the level.** A $4.6M move inside a $317M
 *     book is invisible on a zero-to-total axis. Every bar here is a contribution
 *     to the change, which is the only thing anyone is asking about.
 *   - **Selecting a factor is the whole point.** The second panel is the answer
 *     to the question the first panel raises, and the reader gets to ask it of
 *     any factor rather than being shown one prepared example.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { scaleLinear } from "@visx/scale";
import {
  FUNNEL,
  FACTORS,
  WORST_FACTOR,
  signedMillions,
  contribColor,
} from "@/lib/decompDemo";

/** Shared canvas width and label gutter, so the two stacked panels line up their
 *  row labels and read as one figure rather than two charts. */
const W = 900;
const LABEL_W = 230;
const RIGHT_PAD = 96;
const ROW_H = 46;

const FACTOR_H = FUNNEL.factors.length * ROW_H + ROW_H + 64;
const SEGMENT_H = FUNNEL.factors[0].bySegment.length * ROW_H + 52;

/** Contributions in millions of dollars, which is the unit the axis is drawn in. */
const M = 1_000_000;

/** One bar of the factor waterfall, on the running cumulative total. */
type Step = {
  label: string;
  value: number;
  start: number;
  end: number;
  isTotal: boolean;
};

/** The factor waterfall's steps, ordered most positive first. */
const STEPS: Step[] = (() => {
  const out: Step[] = [];
  let cum = 0;
  for (const f of FUNNEL.factors) {
    const v = f.value / M;
    out.push({ label: f.label, value: v, start: cum, end: cum + v, isTotal: false });
    cum += v;
  }
  out.push({ label: "Net change", value: cum, start: 0, end: cum, isTotal: true });
  return out;
})();

const LEVELS = STEPS.flatMap((s) => [s.start, s.end]).concat(0);
const X_PAD = (Math.max(...LEVELS) - Math.min(...LEVELS)) * 0.08;

const fx = scaleLinear<number>({
  domain: [Math.min(...LEVELS) - X_PAD, Math.max(...LEVELS) + X_PAD],
  range: [LABEL_W, W - RIGHT_PAD],
});

/**
 * The factor waterfall: which link in the funnel moved the money.
 *
 * @param selected Label of the currently selected factor, highlighted here.
 * @param onSelect Called with a factor label when its row is activated.
 */
function FactorPanel({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (label: string) => void;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${FACTOR_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Revenue change of ${signedMillions(
        FUNNEL.delta
      )} split into four funnel factors, the largest positive being ${
        FUNNEL.factors[0].label
      } and the largest negative being ${WORST_FACTOR.label}.`}
    >
      <line
        x1={fx(0)}
        x2={fx(0)}
        y1={18}
        y2={FACTOR_H - 40}
        stroke="#d4d4d8"
        strokeWidth={1}
      />
      <text
        x={fx(0)}
        y={13}
        textAnchor="middle"
        fontSize={11}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        $0
      </text>

      {STEPS.map((s, i) => {
        const y = 30 + i * ROW_H;
        const x0 = Math.min(fx(s.start), fx(s.end));
        const w = Math.max(Math.abs(fx(s.end) - fx(s.start)), 2);
        const color = s.isTotal ? "#18181b" : contribColor(s.value);
        const isSelected = !s.isTotal && s.label === selected;

        return (
          <g
            key={s.label}
            onClick={s.isTotal ? undefined : () => onSelect(s.label)}
            onKeyDown={
              s.isTotal
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(s.label);
                    }
                  }
            }
            tabIndex={s.isTotal ? undefined : 0}
            role={s.isTotal ? undefined : "button"}
            className={
              s.isTotal
                ? undefined
                : "cursor-pointer outline-none [&:focus-visible>rect:first-of-type]:fill-zinc-100 [&:hover>rect:first-of-type]:fill-zinc-50"
            }
          >
            {/* Full-width hit target, which also carries the selected highlight. */}
            <rect
              x={0}
              y={y - 6}
              width={W}
              height={ROW_H - 8}
              fill={isSelected ? "#f4f4f5" : "transparent"}
              rx={4}
            />

            {/* Connector from the previous step's running total. */}
            {i > 0 && !s.isTotal && (
              <line
                x1={fx(s.start)}
                x2={fx(s.start)}
                y1={y - 12}
                y2={y}
                stroke="#e4e4e7"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            <text
              x={LABEL_W - 18}
              y={y + 18}
              textAnchor="end"
              fontSize={13}
              fontWeight={s.isTotal ? 600 : 400}
              fill={s.isTotal ? "#18181b" : isSelected ? "#18181b" : "#52525b"}
            >
              {s.label}
            </text>

            <motion.rect
              y={y + 4}
              height={20}
              initial={{ x: fx(0), width: 0 }}
              animate={{ x: x0, width: w }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 * i }}
              fill={color}
              rx={2}
            />

            <text
              x={W - RIGHT_PAD + 14}
              y={y + 19}
              fontSize={13}
              fontWeight={s.isTotal ? 600 : 400}
              fill={s.isTotal ? "#18181b" : color}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {signedMillions(s.value * M)}
            </text>
          </g>
        );
      })}

      <text
        x={LABEL_W}
        y={FACTOR_H - 14}
        fontSize={11.5}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        contribution to the revenue change · residual $
        {Math.abs(FUNNEL.residual).toFixed(2)}
      </text>
    </svg>
  );
}

/**
 * The segment breakdown of one factor: which part of the business moved it.
 *
 * @param label The selected factor's label.
 */
function SegmentPanel({ label }: { label: string }) {
  const factor = FUNNEL.factors.find((f) => f.label === label)!;
  const rows = [...factor.bySegment].sort((a, b) => b.value - a.value);
  const extent = Math.max(...rows.map((r) => Math.abs(r.value / M)), 0.5) * 1.15;

  const sx = scaleLinear<number>({
    domain: [-extent, extent],
    range: [LABEL_W, W - RIGHT_PAD],
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${SEGMENT_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${label} broken down by sales segment, summing to ${signedMillions(
        factor.value
      )}.`}
    >
      <line
        x1={sx(0)}
        x2={sx(0)}
        y1={14}
        y2={SEGMENT_H - 36}
        stroke="#d4d4d8"
        strokeWidth={1}
      />

      {rows.map((r, i) => {
        const y = 22 + i * ROW_H;
        const v = r.value / M;
        const x0 = Math.min(sx(0), sx(v));
        const w = Math.max(Math.abs(sx(v) - sx(0)), 2);
        return (
          <g key={`${label}-${r.name}`}>
            <text
              x={LABEL_W - 18}
              y={y + 18}
              textAnchor="end"
              fontSize={13}
              fill="#52525b"
            >
              {r.name}
            </text>
            <motion.rect
              y={y + 4}
              height={20}
              initial={{ x: sx(0), width: 0 }}
              animate={{ x: x0, width: w }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 * i }}
              fill={contribColor(v)}
              rx={2}
            />
            <text
              x={W - RIGHT_PAD + 14}
              y={y + 19}
              fontSize={13}
              fill={contribColor(v)}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {signedMillions(r.value)}
            </text>
          </g>
        );
      })}

      <text
        x={LABEL_W}
        y={SEGMENT_H - 12}
        fontSize={11.5}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        {label.toLowerCase()} by segment · sums to {signedMillions(factor.value)}
      </text>
    </svg>
  );
}

/**
 * The funnel decomposition figure: factor waterfall over a segment breakdown.
 */
export default function FunnelLMDI() {
  // Defaults to the factor that cost the most, which is the question a reader
  // arrives with. Every other factor is one click away.
  const [selected, setSelected] = useState(WORST_FACTOR.label);

  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-zinc-500">
        <span className="rounded bg-zinc-900 px-2.5 py-1 text-white">Revenue</span>
        <span className="text-zinc-300">=</span>
        {/* Declaration order, not contribution order: this strip is the funnel
            itself, and a sales reader reads it left to right as a sequence. */}
        {FACTORS.map((f, i) => (
          <span key={f.key} className="flex items-center gap-x-3">
            {i > 0 && <span className="text-zinc-300">×</span>}
            <span className="rounded border border-zinc-200 bg-white px-2.5 py-1">
              {f.label}
            </span>
          </span>
        ))}
      </div>

      <p className="text-base text-zinc-600">
        Revenue moved from{" "}
        <span className="font-mono text-zinc-800">
          ${(FUNNEL.pre / M).toFixed(1)}M
        </span>{" "}
        to{" "}
        <span className="font-mono text-zinc-800">
          ${(FUNNEL.cur / M).toFixed(1)}M
        </span>
        , a change of{" "}
        <span className="font-mono text-zinc-800">
          {signedMillions(FUNNEL.delta)}
        </span>
        . Select any factor to see which segments moved it.
      </p>

      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="flex min-w-[680px] flex-col gap-2">
          <FactorPanel selected={selected} onSelect={setSelected} />
          <div className="border-t border-dashed border-zinc-200 pt-3">
            <SegmentPanel label={selected} />
          </div>
        </div>
      </div>

      <p className="font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>

      <figcaption className="max-w-3xl text-sm leading-relaxed text-zinc-500">
        The top panel answers which link in the funnel moved the money; the
        bottom answers which part of the business moved that link. Selecting{" "}
        {WORST_FACTOR.label.toLowerCase()} shows the finding this shape of
        analysis is built to surface: the book grew because more accounts were
        worked, while the rate at which they converted fell hardest in the
        segment that grew the most. Synthetic data.
      </figcaption>
    </figure>
  );
}
