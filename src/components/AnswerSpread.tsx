"use client";

/**
 * AnswerSpread.tsx: one question, three agents, three different answers.
 *
 * Role in the system: the opening argument of the agent-ready-org entry in one
 * picture. Three people ask their agents for last quarter's revenue; each
 * agent finds a different written definition and reports a different number
 * with equal confidence. Switching to "After" points every agent at the metric
 * spec and the three answers collapse onto one.
 *
 * Key design decisions:
 *   - **Bars start at zero.** The gaps are a few percent to about a fifth of
 *     the total, and a truncated axis would exaggerate them. The dashed line at
 *     the governed value carries the comparison instead.
 *   - **HTML bars for the full figure, SVG for the card.** The full figure has
 *     to wrap labels and definitions on a phone, which HTML does for free. The
 *     card is a fixed 3:1 thumbnail like the other home cards, so it is SVG.
 *   - **Every number comes from `lib/agentReadyOrg`**, computed from the same
 *     synthetic accounts, so the gaps are arithmetic rather than typed values.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { SOURCES, SPEC, money } from "@/lib/agentReadyOrg";

/** Disagreeing answers: amber, the site's "something is wrong" color. */
const CONFLICT = "#d97706";
/** The governed answer: blue, the site's "this is right" color. */
const GOVERNED = "#2563eb";

/** Axis maximum: a little headroom over the largest answer. The value label's
 *  room comes from the track's right margin, not from here. */
const AXIS_MAX = Math.max(...SOURCES.map((s) => s.value)) * 1.02;

/**
 * Percent of the bar track a dollar value spans, rounded so server and
 * browser render byte-identical style strings.
 *
 * @param v Whole dollars.
 * @returns A percentage in [0, 100], to two decimals.
 */
const pct = (v: number) => Math.round((v / AXIS_MAX) * 10000) / 100;

const SPEC_PCT = pct(SPEC.value);

/**
 * The conflicting-answers figure.
 *
 * @param variant `card` for the static home-page thumbnail, `full` for the
 *   before/after figure on the case-study page.
 */
export default function AnswerSpread({
  variant = "full",
}: {
  variant?: "card" | "full";
}) {
  const [after, setAfter] = useState(false);

  if (variant === "card") return <Card />;

  return (
    <figure className="m-0 flex flex-col gap-6">
      <div
        role="group"
        aria-label="Show answers before or after a shared definition"
        className="flex w-fit gap-1 rounded-full border border-zinc-200 bg-white p-1 font-mono text-sm"
      >
        {/* The detail after the colon is dropped below `sm`, where the full
            labels wrap the pill onto two lines. */}
        {[
          { on: false, label: "Before", detail: "three definitions" },
          { on: true, label: "After", detail: "one spec" },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => setAfter(b.on)}
            aria-pressed={after === b.on}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              after === b.on
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {b.label}
            <span className="hidden sm:inline">: {b.detail}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-7 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <p className="font-mono text-sm text-zinc-500">
          &quot;What was revenue last quarter?&quot;
        </p>

        {SOURCES.map((s) => {
          const value = after ? SPEC.value : s.value;
          return (
            <div
              key={s.id}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[11rem_1fr] sm:gap-6"
            >
              <div className="flex flex-col">
                <span className="text-base font-medium text-zinc-900">
                  {s.asker}
                </span>
                <span className="text-sm text-zinc-500">
                  {after ? SPEC.foundIn : s.foundIn}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {/* The right margin is room for the value label, which sits
                    just past the bar end and would otherwise run off the card
                    on the longest bar. */}
                <div className="relative mr-24 h-8">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-r"
                    initial={false}
                    animate={{
                      width: `${pct(value)}%`,
                      backgroundColor: after ? GOVERNED : CONFLICT,
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                  {/* The governed value, drawn through every row. */}
                  <div
                    aria-hidden
                    className="absolute -inset-y-1 border-l-2 border-dashed border-zinc-900"
                    style={{ left: `${SPEC_PCT}%` }}
                  />
                  <motion.span
                    className="absolute inset-y-0 flex items-center pl-3 font-mono text-sm font-medium text-zinc-900"
                    initial={false}
                    animate={{ left: `${pct(value)}%` }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    {money(value)}
                  </motion.span>
                </div>
                <span className="text-sm text-zinc-600">
                  {after ? SPEC.definition : s.definition}
                </span>
              </div>
            </div>
          );
        })}

        <div className="flex items-start gap-3 border-t border-zinc-100 pt-5 text-sm text-zinc-500">
          <span
            aria-hidden
            className="mt-0.5 inline-block h-4 shrink-0 border-l-2 border-dashed border-zinc-900"
          />
          <span>
            The governed answer:{" "}
            <span className="font-mono text-zinc-900">{money(SPEC.value)}</span>
            , {SPEC.definition.toLowerCase()}
          </span>
        </div>
      </div>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Every answer is computed from the same synthetic quarter of ad revenue
        across a few thousand accounts. Nothing about the data differs between
        the rows, only the definition each agent happened to find.
      </figcaption>
    </figure>
  );
}

/* ---- Home-page card ---------------------------------------------------- */

/** Card canvas, at the same 3:1 aspect ratio as the other entry cards. */
const CARD_W = 1200;
const CARD_H = 400;
const LABEL_W = 250;
const RIGHT_PAD = 150;
const ROW_H = 92;
const TOP = 58;

/**
 * Card x position for a dollar value, rounded for clean hydration.
 *
 * @param v Whole dollars.
 * @returns x in viewBox units.
 */
const cx = (v: number) =>
  Math.round((LABEL_W + (v / AXIS_MAX) * (CARD_W - LABEL_W - RIGHT_PAD)) * 100) /
  100;

/** The static thumbnail: the three disagreeing answers against the spec line. */
function Card() {
  const specX = cx(SPEC.value);
  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-x-visible sm:px-0">
      <div className="min-w-[720px] sm:min-w-0">
        <svg
          viewBox={`0 0 ${CARD_W} ${CARD_H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Three agents report last quarter's revenue as ${SOURCES.map(
            (s) => money(s.value)
          ).join(", ")}; the governed answer is ${money(SPEC.value)}.`}
        >
          {SOURCES.map((s, i) => {
            const y = TOP + i * ROW_H;
            return (
              <g key={s.id}>
                <text
                  x={LABEL_W - 24}
                  y={y + 34}
                  textAnchor="end"
                  fontSize={24}
                  fill="#3f3f46"
                >
                  {s.asker}
                </text>
                <rect
                  x={LABEL_W}
                  y={y + 10}
                  width={cx(s.value) - LABEL_W}
                  height={36}
                  rx={4}
                  fill={CONFLICT}
                />
                <text
                  x={cx(s.value) + 14}
                  y={y + 36}
                  fontSize={22}
                  fill="#18181b"
                  fontFamily="var(--font-geist-mono, monospace)"
                >
                  {money(s.value)}
                </text>
              </g>
            );
          })}
          <line
            x1={specX}
            x2={specX}
            y1={TOP - 14}
            y2={TOP + 3 * ROW_H - 20}
            stroke="#18181b"
            strokeWidth={2.5}
            strokeDasharray="7 6"
          />
          <text
            x={specX}
            y={TOP + 3 * ROW_H + 14}
            textAnchor="middle"
            fontSize={20}
            fill={GOVERNED}
            fontFamily="var(--font-geist-mono, monospace)"
          >
            the spec: {money(SPEC.value)}
          </text>
        </svg>
      </div>
    </div>
  );
}
