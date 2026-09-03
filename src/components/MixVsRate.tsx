"use client";

/**
 * MixVsRate.tsx: the case where every part improves and the whole gets worse.
 *
 * Role in the system: this is the figure that justifies the entire framework to
 * a non-technical reader. Anyone will accept that a total is the average of its
 * parts. This shows a dataset where all three parts improve by a full percentage
 * point and the total falls by 227 basis points, then decomposes it to show
 * exactly where the missing points went. Once a reader has seen that, "just look
 * at the subgroup rates" stops sounding like a sufficient answer.
 *
 * Key design decisions:
 *   - **Two panels, one argument.** The left panel poses the contradiction and
 *     the right panel resolves it. Splitting them means the reader gets a beat to
 *     be surprised before being handed the explanation.
 *   - **The mix is drawn, not described.** A first version encoded each tier's
 *     share as the weight of its slope line, which turned out to be unreadable:
 *     shares between 18% and 50% produce stroke widths nobody can rank by eye.
 *     It is now an explicit pair of stacked bars, with the weakest tier in amber
 *     so the growth that costs the money is the block that visibly swells.
 *   - **Rate and mix are drawn from a shared zero.** They routinely point in
 *     opposite directions, which a stacked bar would hide by netting them out.
 */

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { scaleLinear } from "@visx/scale";
import {
  PARADOX,
  PARADOX_TIERS,
  PARADOX_RATE_BPS,
  PARADOX_MIX_BPS,
  PARADOX_TOTAL_BPS,
  bps,
  signedBps,
} from "@/lib/decompDemo";

const ROWS = PARADOX_TIERS;

/** Tier fills, shared by the slope labels and the mix bars so the two halves of
 *  the left panel are read as the same three things. Amber marks the tier whose
 *  growth is what costs the money. */
const TIER_FILL: Record<string, string> = {
  Premium: "#3f3f46",
  Core: "#71717a",
  Value: "#d97706",
};

/* -------------------------- slope panel -------------------------- */

const S_W = 430;
const S_H = 360;
const S_LEFT = 96;
const S_RIGHT = 300;
const S_TOP = 40;
const S_BOTTOM = 250;

/** Mix bar geometry, occupying the band under the slope chart. */
const MIX_X0 = 96;
const MIX_X1 = 406;
const MIX_TOP = 296;
const MIX_ROW = 24;
const MIX_BAR_H = 16;

const sy = scaleLinear<number>({
  // Padded past the extremes so the total line and its label clear the frame.
  domain: [0.555, 0.845],
  range: [S_BOTTOM, S_TOP],
});

/**
 * Slope chart of the three tier rates and the overall rate, over a pair of
 * stacked bars showing how the mix of views moved between the two periods.
 *
 * @param inView Whether the figure has scrolled into view, which gates the draw.
 */
function SlopePanel({ inView }: { inView: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${S_W} ${S_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Slope chart: all three customer tiers improve their rate by a full percentage point while the overall rate falls ${Math.abs(
        PARADOX_TOTAL_BPS
      ).toFixed(
        0
      )} basis points, because the weakest tier grows from 20% to 35% of views.`}
    >
      {/* Three gridlines only. A denser axis collides with the "overall" label,
          and the exact levels are not what this panel is arguing about. */}
      {[0.6, 0.7, 0.8].map((t) => (
        <g key={t}>
          <line
            x1={S_LEFT - 8}
            x2={S_RIGHT + 8}
            y1={sy(t)}
            y2={sy(t)}
            stroke="#f4f4f5"
            strokeWidth={1}
          />
          <text
            x={S_LEFT - 16}
            y={sy(t) + 4}
            textAnchor="end"
            fontSize={11}
            fill="#a1a1aa"
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {(t * 100).toFixed(0)}%
          </text>
        </g>
      ))}

      <text x={S_LEFT} y={S_TOP - 18} textAnchor="middle" fontSize={11.5} fill="#a1a1aa">
        last quarter
      </text>
      <text x={S_RIGHT} y={S_TOP - 18} textAnchor="middle" fontSize={11.5} fill="#a1a1aa">
        this quarter
      </text>

      {ROWS.map((r, i) => (
        <motion.g
          key={r.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.1 * i }}
        >
          <line
            x1={S_LEFT}
            x2={S_RIGHT}
            y1={sy(r.ratePre)}
            y2={sy(r.rateCur)}
            stroke="#60a5fa"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text
            x={S_RIGHT + 14}
            y={sy(r.rateCur) + 4}
            fontSize={12}
            fill={TIER_FILL[r.key]}
            fontWeight={500}
          >
            {r.key}
          </text>
          <text
            x={S_RIGHT + 14}
            y={sy(r.rateCur) + 19}
            fontSize={10.5}
            fill="#2563eb"
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {signedBps(bps(r.rateCur - r.ratePre), 0)} bps
          </text>
        </motion.g>
      ))}

      {/* The overall rate, drawn last and dashed so it reads as the aggregate
          rather than as a fourth tier. */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <line
          x1={S_LEFT}
          x2={S_RIGHT}
          y1={sy(PARADOX.ratePre)}
          y2={sy(PARADOX.rateCur)}
          stroke="#18181b"
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />
        <circle cx={S_LEFT} cy={sy(PARADOX.ratePre)} r={4} fill="#18181b" />
        <circle cx={S_RIGHT} cy={sy(PARADOX.rateCur)} r={4} fill="#18181b" />
        <text
          x={S_LEFT - 16}
          y={sy(PARADOX.ratePre) - 11}
          textAnchor="end"
          fontSize={11.5}
          fontWeight={600}
          fill="#18181b"
        >
          overall
        </text>
      </motion.g>

      {/* The mix, which is the variable the slope chart cannot show. */}
      <text x={4} y={MIX_TOP - 12} fontSize={11} fill="#71717a">
        and the mix of views
      </text>

      {(["sharePre", "shareCur"] as const).map((field, row) => {
        let cursor = MIX_X0;
        const y = MIX_TOP + row * MIX_ROW;
        return (
          <g key={field}>
            <text
              x={S_LEFT - 16}
              y={y + MIX_BAR_H - 4}
              textAnchor="end"
              fontSize={10.5}
              fill="#a1a1aa"
            >
              {row === 0 ? "last" : "this"}
            </text>
            {ROWS.map((r, i) => {
              const w = (MIX_X1 - MIX_X0) * r[field];
              const x = cursor;
              cursor += w;
              return (
                <motion.g
                  key={r.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: 0.55 + 0.06 * i }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(w - 2, 1)}
                    height={MIX_BAR_H}
                    fill={TIER_FILL[r.key]}
                    rx={2}
                  />
                  <text
                    x={x + w / 2 - 1}
                    y={y + MIX_BAR_H - 4.5}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#ffffff"
                    fontFamily="var(--font-geist-mono, monospace)"
                  >
                    {(r[field] * 100).toFixed(0)}%
                  </text>
                </motion.g>
              );
            })}
          </g>
        );
      })}

      <text x={4} y={S_H - 8} fontSize={11.5} fill="#71717a">
        Every tier up a full point. The total down{" "}
        {Math.abs(PARADOX_TOTAL_BPS).toFixed(0)} bps.
      </text>
    </svg>
  );
}

/* -------------------------- effect panel -------------------------- */

const E_W = 430;
// Sized to land within a few units of the slope panel's height, so the two cards
// in the grid balance instead of one trailing a band of white.
const E_H = 344;
const E_LEFT = 78;
const E_TOP = 44;
const E_ROW = 74;

const ex = scaleLinear<number>({
  domain: [-215, 70],
  range: [E_LEFT, E_W - 24],
});

/**
 * Diverging bars splitting each tier's contribution into its rate part and its
 * mix part, with the net printed alongside.
 *
 * @param inView Whether the figure has scrolled into view, which gates the draw.
 */
function EffectPanel({ inView }: { inView: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${E_W} ${E_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Each tier's contribution split into a rate effect and a mix effect. Rate effects total ${signedBps(
        PARADOX_RATE_BPS,
        0
      )} basis points and mix effects total ${signedBps(
        PARADOX_MIX_BPS,
        0
      )}.`}
    >
      <line
        x1={ex(0)}
        x2={ex(0)}
        y1={E_TOP - 18}
        y2={E_TOP + ROWS.length * E_ROW - 16}
        stroke="#d4d4d8"
        strokeWidth={1}
      />
      <text
        x={ex(0)}
        y={E_TOP - 26}
        textAnchor="middle"
        fontSize={11}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        0 bps
      </text>

      {/* Legend: within each row the upper bar is the rate effect and the lower
          one the mix effect, which nothing else on the panel says. */}
      <g>
        <rect x={4} y={E_TOP - 32} width={10} height={10} fill="#2563eb" rx={1.5} />
        <text x={19} y={E_TOP - 23} fontSize={10.5} fill="#71717a">
          rate
        </text>
        <rect x={54} y={E_TOP - 32} width={10} height={10} fill="#d97706" rx={1.5} />
        <text x={69} y={E_TOP - 23} fontSize={10.5} fill="#71717a">
          mix
        </text>
      </g>

      {ROWS.map((r, i) => {
        const yTop = E_TOP + i * E_ROW;
        const parts = [
          { label: "rate", v: bps(r.rateEffect), fill: "#2563eb", dy: 0 },
          { label: "mix", v: bps(r.mixEffect), fill: "#d97706", dy: 17 },
        ];
        return (
          <g key={r.key}>
            <text x={4} y={yTop + 13} fontSize={12} fill="#3f3f46">
              {r.key}
            </text>
            <text
              x={4}
              y={yTop + 29}
              fontSize={11}
              fill={bps(r.total) >= 0 ? "#2563eb" : "#d97706"}
              fontFamily="var(--font-geist-mono, monospace)"
            >
              {signedBps(bps(r.total), 0)}
            </text>

            {parts.map((p) => (
              <motion.rect
                key={p.label}
                y={yTop + p.dy}
                height={13}
                initial={{ x: ex(0), width: 0 }}
                animate={{
                  x: inView ? Math.min(ex(0), ex(p.v)) : ex(0),
                  width: inView ? Math.abs(ex(p.v) - ex(0)) : 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 * i }}
                fill={p.fill}
                rx={1.5}
              />
            ))}
          </g>
        );
      })}

      {/* Totals strip: the two forces, and what is left after they cancel. */}
      <g transform={`translate(0, ${E_TOP + ROWS.length * E_ROW + 6})`}>
        <line x1={4} x2={E_W - 24} y1={0} y2={0} stroke="#e4e4e7" strokeWidth={1} />
        <text x={4} y={22} fontSize={11.5} fill="#2563eb">
          performance {signedBps(PARADOX_RATE_BPS, 0)}
        </text>
        <text x={168} y={22} fontSize={11.5} fill="#d97706">
          mix {signedBps(PARADOX_MIX_BPS, 0)}
        </text>
        <text x={4} y={44} fontSize={12.5} fontWeight={600} fill="#18181b">
          net {signedBps(PARADOX_TOTAL_BPS, 0)} bps
        </text>
      </g>
    </svg>
  );
}

/**
 * The mix-versus-rate figure: a Simpson's paradox posed and then resolved.
 */
export default function MixVsRate() {
  const ref = useRef<HTMLDivElement>(null);
  // Below the fold, so the bars draw when the reader arrives rather than before.
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-wide text-zinc-400">
            The contradiction
          </p>
          <SlopePanel inView={inView} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-wide text-zinc-400">
            The resolution
          </p>
          <EffectPanel inView={inView} />
        </div>
      </div>

      <figcaption className="max-w-3xl text-sm leading-relaxed text-zinc-500">
        Left: three customer tiers, each improving its own rate by a full
        percentage point, and the overall rate falling anyway. Right: the same
        data decomposed. Performance was worth{" "}
        {signedBps(PARADOX_RATE_BPS, 0)} basis points and the shift in mix cost{" "}
        {Math.abs(PARADOX_MIX_BPS).toFixed(0)}, because the growth landed almost
        entirely in the weakest tier. No amount of staring at subgroup rates
        produces that second number. Synthetic data.
      </figcaption>
    </figure>
  );
}
