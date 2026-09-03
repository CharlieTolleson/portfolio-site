"use client";

/**
 * DecompWaterfall.tsx: the Contribution to Change decomposition, as a waterfall.
 *
 * Role in the system: this is the case study's argument in one control. A single
 * metric movement is broken into bars that sum exactly to it, and clicking any
 * bar re-runs the same formula one level deeper. The point a reader should take
 * away is not that waterfalls are pretty, it is that the drill never loses the
 * arithmetic: the bars at every depth still add up to the number above them, and
 * the printed residual proves it.
 *
 * Key design decisions:
 *   - **Drilling is real, not staged.** Every level calls `drill()` in
 *     `lib/decompDemo`, which re-runs the decomposition over the filtered cells.
 *     There is no precomputed script of screens.
 *   - **A table sits under the chart.** Waterfall bars communicate size and sign;
 *     they cannot show a subgroup's rate and share moving in opposite directions,
 *     which is the whole subtlety of the method. The table carries that, and it
 *     is HTML rather than SVG text so it wraps and stays readable on a phone.
 *   - **Two variants.** `card` is the static home-page thumbnail on the same 3:1
 *     canvas the other entry cards use, so the cards render at matching height.
 *     `full` is the interactive figure on the case-study page.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { scaleLinear } from "@visx/scale";
import {
  drill,
  DIMENSIONS,
  DIMENSION_LABEL,
  BY_REGION,
  bps,
  signedBps,
  residualBps,
  contribColor,
  type Decomposition,
  type Row,
} from "@/lib/decompDemo";

/** Card canvas, at the same 3:1 aspect ratio as the other entry cards so the
 *  home page stacks them at equal height without a fixed-height wrapper. */
const CARD_W = 1200;
const CARD_H = 400;

/** Full-figure canvas. Narrower than the content column on purpose: the SVG
 *  scales up to fill it, which enlarges the labels rather than stranding them. */
const FULL_W = 900;
const FULL_H = 380;

/** One bar of the waterfall, positioned on the running cumulative total. */
type Bar = {
  key: string;
  value: number;
  /** Cumulative total before this bar, in basis points. */
  start: number;
  /** Cumulative total after this bar, in basis points. */
  end: number;
  /** True for the anchored summary bar at the right edge. */
  isTotal: boolean;
};

/**
 * Lay a decomposition out as waterfall bars.
 *
 * Contributions are ordered most positive first so the chain steps downward into
 * the total, which is how these are read in a business review: start with what
 * helped, end with what it cost.
 *
 * @param d A decomposition from `lib/decompDemo`.
 * @returns Bars in draw order, with the anchored total last.
 */
function toBars(d: Decomposition): Bar[] {
  const ordered = [...d.rows].sort((a, b) => b.total - a.total);
  const bars: Bar[] = [];
  let cum = 0;
  for (const r of ordered) {
    const v = bps(r.total);
    bars.push({ key: r.key, value: v, start: cum, end: cum + v, isTotal: false });
    cum += v;
  }
  bars.push({ key: "Total", value: cum, start: 0, end: cum, isTotal: true });
  return bars;
}

/**
 * The waterfall chart itself, shared by both variants.
 *
 * @param d The decomposition to draw.
 * @param width Canvas width in viewBox units.
 * @param height Canvas height in viewBox units.
 * @param onSelect Called with a subgroup key when its bar is activated. Omit to
 *   render a static, non-interactive chart.
 * @param animateKey Changing this value replays the grow animation, which is how
 *   a drill step reads as a new chart rather than a mutated one.
 * @param headline Optional two-line caption drawn into the empty quadrant under
 *   the positive bars. A waterfall dominated by one negative contribution leaves
 *   a large hole there, and on the home-page card that space is better spent
 *   telling a visitor what the entry is about.
 */
function Waterfall({
  d,
  width,
  height,
  onSelect,
  animateKey,
  headline,
}: {
  d: Decomposition;
  width: number;
  height: number;
  onSelect?: (key: string) => void;
  animateKey?: string;
  headline?: [string, string];
}) {
  const bars = toBars(d);
  const top = 46;
  const bottom = height - 54;

  const levels = bars.flatMap((b) => [b.start, b.end]).concat(0);
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  // Pad the domain so the value labels above and below the bars have room.
  const pad = Math.max((hi - lo) * 0.1, 2);
  const y = scaleLinear<number>({
    domain: [lo - pad, hi + pad],
    range: [bottom, top],
  });

  const left = 54;
  const right = width - 20;
  const slot = (right - left) / bars.length;
  const barW = Math.min(slot * 0.56, 118);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Waterfall of contributions to a ${signedBps(
        bps(d.delta)
      )} basis point change, broken into ${d.rows.length} subgroups that sum to it.`}
    >
      {/* Zero line: the reference every contribution is measured from. */}
      <line
        x1={left - 14}
        x2={right}
        y1={y(0)}
        y2={y(0)}
        stroke="#d4d4d8"
        strokeWidth={1}
      />
      <text
        x={left - 20}
        y={y(0) + 4}
        textAnchor="end"
        fontSize={11}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        0
      </text>

      {bars.map((b, i) => {
        const cx = left + slot * i + slot / 2;
        const x0 = cx - barW / 2;
        const yTop = y(Math.max(b.start, b.end));
        const h = Math.max(Math.abs(y(b.start) - y(b.end)), 1.5);
        const color = b.isTotal ? "#18181b" : contribColor(b.value);
        const clickable = Boolean(onSelect) && !b.isTotal;
        // Keep the value label outside the bar so a thin bar still reads.
        const labelY = b.value >= 0 ? yTop - 9 : yTop + h + 17;

        return (
          <g
            key={`${animateKey}-${b.key}`}
            onClick={clickable ? () => onSelect?.(b.key) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(b.key);
                    }
                  }
                : undefined
            }
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? "button" : undefined}
            className={
              clickable
                ? "cursor-pointer outline-none [&:focus-visible>rect]:stroke-zinc-900 [&:hover>rect]:opacity-75"
                : undefined
            }
          >
            {/* Connector from the previous bar's top, so the chain reads as one
                running total rather than as independent columns. */}
            {i > 0 && !b.isTotal && (
              <line
                x1={left + slot * (i - 1) + slot / 2 + barW / 2}
                x2={x0}
                y1={y(b.start)}
                y2={y(b.start)}
                stroke="#e4e4e7"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            <motion.rect
              x={x0}
              width={barW}
              initial={{ y: y(0), height: 0 }}
              animate={{ y: yTop, height: h }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 * i }}
              fill={color}
              rx={2}
              strokeWidth={2}
            />

            <text
              x={cx}
              y={labelY}
              textAnchor="middle"
              fontSize={13}
              fontWeight={b.isTotal ? 600 : 400}
              fill={b.isTotal ? "#18181b" : color}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {signedBps(b.value)}
            </text>

            <text
              x={cx}
              y={bottom + 26}
              textAnchor="middle"
              fontSize={12.5}
              fill={b.isTotal ? "#18181b" : "#52525b"}
              fontWeight={b.isTotal ? 500 : 400}
            >
              {b.key}
            </text>

            {clickable && (
              <text
                x={cx}
                y={bottom + 42}
                textAnchor="middle"
                fontSize={10.5}
                fill="#c4c4cc"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                drill in
              </text>
            )}
          </g>
        );
      })}

      <text
        x={left - 20}
        y={top - 22}
        textAnchor="end"
        fontSize={11}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        bps
      </text>

      {headline && (
        <g transform={`translate(${left + 56}, ${y(0) + 84})`}>
          <text fontSize={32} fontWeight={600} fill="#18181b">
            {headline[0]}
          </text>
          <text y={34} fontSize={16} fill="#71717a">
            {headline[1]}
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * The per-subgroup detail table under the chart.
 *
 * Every column here answers a question the bars cannot: whether a subgroup hurt
 * because it got worse, because it grew while below average, or both.
 *
 * @param rows Decomposition rows, in the same order as the bars.
 */
function DetailTable({ rows }: { rows: Row[] }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-zinc-200 font-mono text-[11px] uppercase tracking-wide text-zinc-400">
            <th className="py-2 pr-4 font-normal">Subgroup</th>
            <th className="py-2 pr-4 text-right font-normal">Rate</th>
            {/* "Mix share" rather than "share": it pairs the state column with
                the "mix effect" column derived from it, and mix shift is the
                concept a business reader already has a name for. */}
            <th className="py-2 pr-4 text-right font-normal">Mix share</th>
            <th className="py-2 pr-4 text-right font-normal">Rate effect</th>
            <th className="py-2 pr-4 text-right font-normal">Mix effect</th>
            <th className="py-2 text-right font-normal">Contribution</th>
          </tr>
        </thead>
        <tbody className="font-mono text-[13px] text-zinc-600">
          {[...rows]
            .sort((a, b) => b.total - a.total)
            .map((r) => (
              <tr key={r.key} className="border-b border-zinc-100">
                <td className="py-2 pr-4 font-sans text-zinc-800">{r.key}</td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">
                  {(r.ratePre * 100).toFixed(1)} → {(r.rateCur * 100).toFixed(1)}%
                </td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">
                  {(r.sharePre * 100).toFixed(1)} → {(r.shareCur * 100).toFixed(1)}%
                </td>
                <td className="py-2 pr-4 text-right">
                  {signedBps(bps(r.rateEffect))}
                </td>
                <td className="py-2 pr-4 text-right">
                  {signedBps(bps(r.mixEffect))}
                </td>
                <td
                  className="py-2 text-right font-medium"
                  style={{ color: contribColor(r.total) }}
                >
                  {signedBps(bps(r.total))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Contribution to Change, rendered as an interactive waterfall.
 *
 * @param variant `card` for the static home-page thumbnail, `full` for the
 *   drillable figure on the case-study page.
 */
export default function DecompWaterfall({
  variant = "full",
}: {
  variant?: "card" | "full";
}) {
  // The drill path, in DIMENSIONS order. Empty means "group everything by region".
  const [path, setPath] = useState<string[]>([]);

  if (variant === "card") {
    return (
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-x-visible sm:px-0">
        <div className="min-w-[720px] sm:min-w-0">
          <Waterfall
            d={BY_REGION}
            width={CARD_W}
            height={CARD_H}
            // Deliberately not a question: the card's own subtitle already
            // opens with one, and two stacked questions read as a stutter.
            headline={[
              "Nothing left over.",
              `${Math.abs(bps(BY_REGION.delta)).toFixed(
                0
              )} basis points of decline, split across four regions that sum exactly to the total.`,
            ]}
          />
        </div>
      </div>
    );
  }

  const d = drill(path);
  // The deepest dimension has no level below it, so its bars stop being drillable.
  const canDrill = path.length < DIMENSIONS.length - 1;
  const crumbs = ["All traffic", ...path];

  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-baseline gap-2">
            {i > 0 && <span className="text-zinc-300">›</span>}
            {i < crumbs.length - 1 ? (
              <button
                type="button"
                onClick={() => setPath(path.slice(0, i))}
                className="text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900"
              >
                {c}
              </button>
            ) : (
              <span className="text-zinc-900">{c}</span>
            )}
          </span>
        ))}
        <span className="ml-auto text-zinc-400">
          split by {DIMENSION_LABEL[DIMENSIONS[path.length]].toLowerCase()}
        </span>
      </div>

      <p className="text-base text-zinc-600">
        {path.length === 0 ? (
          <>
            Price competitiveness moved from{" "}
            <span className="font-mono text-zinc-800">
              {(d.ratePre * 100).toFixed(2)}%
            </span>{" "}
            to{" "}
            <span className="font-mono text-zinc-800">
              {(d.rateCur * 100).toFixed(2)}%
            </span>
            , a change of{" "}
            <span className="font-mono text-zinc-800">
              {signedBps(bps(d.delta))} bps
            </span>
            . These four regions explain all of it.
          </>
        ) : (
          <>
            <span className="text-zinc-800">{path[path.length - 1]}</span>{" "}
            contributed{" "}
            <span className="font-mono text-zinc-800">
              {signedBps(bps(d.delta))} bps
            </span>{" "}
            to the company-wide change. These bars explain all of that, and they
            still sum into the level above.
          </>
        )}
      </p>

      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[680px]">
          <Waterfall
            d={d}
            width={FULL_W}
            height={FULL_H}
            animateKey={path.join("/")}
            onSelect={canDrill ? (k) => setPath([...path, k]) : undefined}
          />
        </div>
      </div>

      <p className="font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>

      <DetailTable rows={d.rows} />

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs text-zinc-400">
        <span>
          {d.rows.length} rows sum to {signedBps(bps(d.delta), 2)} bps
        </span>
        <span>residual {residualBps(d.residual)} bps</span>
      </div>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        {canDrill
          ? "Click any bar to split it by the next dimension. "
          : "This is the deepest level in the dataset. "}
        The residual is the check that matters: the parts are not an
        approximation of the whole, they are the whole, re-expressed. Synthetic
        data.
      </figcaption>
    </figure>
  );
}
