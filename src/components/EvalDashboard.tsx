"use client";

/**
 * EvalDashboard.tsx: an illustrative example of the eval dashboard Charlie built
 * for the seven workflow teams, on synthetic data.
 *
 * Role in the system: the centerpiece figure of the launch-bar entry, and (as
 * `variant="card"`) the home-page thumbnail. The real dashboard is internal to
 * Meta, so this rebuilds its three jobs on `lib/launchBar`: see every eval's
 * pass rate against its bar, spot a regression, and open the agent trace
 * behind a failing run to see exactly what went wrong.
 *
 * Key design decisions:
 *   - **Opens on the regression.** The default view is the follow-up email's
 *     "Numbers match the call" judge dipping below its bar on shadow days 8 to
 *     10, with the failing trace open, so a reader who never clicks still sees
 *     the dashboard do its job.
 *   - **Golden runs and shadow days share one axis**, split by a shaded band,
 *     because the point of the stages is a continuous read on one criterion as
 *     the sample grows.
 *   - **No production stage.** The workflows hadn't launched when Charlie left
 *     Meta, so the example doesn't invent one.
 *   - **Colors follow the site:** blue for at or above the bar, amber for below
 *     it, gray for track-only criteria that have no bar. Each list row also
 *     carries the page's eval-type dot (`EvalTypeDot`), so the type reads the
 *     same here as in the criteria grid.
 *   - **Every coordinate is rounded** so the server and browser render
 *     identical SVG.
 */

import { useState } from "react";
import {
  HISTORY,
  POINTS,
  REGRESSION,
  TIERS,
  TRACE,
  WORKFLOWS,
  GOLDEN_RUNS,
  GOLDEN_REPEATS,
  criteriaFor,
  type Criterion,
  type WorkflowId,
} from "@/lib/launchBar";
import EvalTypeDot from "@/components/EvalTypeDot";

const BLUE = "#2563eb";
const AMBER = "#d97706";
const GRAY = "#a1a1aa";

/** Round to two decimals, for SVG coordinates that must hydrate identically. */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** The pass-rate bar for a criterion, or null if it's track only. */
const barOf = (c: Criterion) => TIERS[c.tier].threshold;

/**
 * Y-axis bounds for a series: a little under its lowest point (or its bar, if
 * lower) up to 100.
 *
 * @param values The pass rates.
 * @param bar The criterion's bar, or null.
 * @returns [lo, hi] in percent.
 */
function domain(values: number[], bar: number | null): [number, number] {
  const min = Math.min(...values, bar ?? 100);
  return [Math.floor(min - 1), 100];
}

/** How many shadow days a criterion spent below its bar. */
function daysBelow(c: Criterion): number {
  const bar = barOf(c);
  if (bar === null) return 0;
  return HISTORY[c.id].filter(
    (v, i) => POINTS[i].stage === "shadow" && v < bar
  ).length;
}

/**
 * The status pill for a criterion: track only, below the bar at some point in
 * shadow, or holding above it.
 */
function status(c: Criterion): { label: string; className: string } {
  if (barOf(c) === null)
    return { label: "Track only", className: "bg-zinc-100 text-zinc-500" };
  const below = daysBelow(c);
  if (below > 0)
    return {
      label: `${below} days below`,
      className: "border border-amber-600 text-amber-700",
    };
  return { label: "Above bar", className: "bg-blue-50 text-blue-700" };
}

/**
 * A tiny trend line for the list, with the bar as a dashed rule.
 *
 * @param c The criterion to draw.
 */
function Sparkline({ c }: { c: Criterion }) {
  const values = HISTORY[c.id];
  const bar = barOf(c);
  const [lo, hi] = domain(values, bar);
  const W = 88;
  const H = 26;
  const x = (i: number) => r2((i / (values.length - 1)) * W);
  const y = (v: number) => r2(H - ((v - lo) / (hi - lo)) * H);
  const color = bar === null ? GRAY : daysBelow(c) > 0 ? AMBER : BLUE;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[26px] w-[88px] shrink-0" aria-hidden>
      {bar !== null && (
        <line
          x1={0}
          x2={W}
          y1={y(bar)}
          y2={y(bar)}
          stroke="#18181b"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
      )}
      <polyline
        points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
      />
    </svg>
  );
}

/* ---- Detail chart ------------------------------------------------------- */

const CW = 640;
const CH = 260;
const M = { left: 44, right: 16, top: 30, bottom: 30 };

/**
 * The full trend for one criterion: golden runs then shadow days, the bar as
 * a dashed line, and points below the bar in amber. Regression points are
 * buttons that open the failing trace.
 *
 * @param c The criterion.
 * @param onOpenTrace Called when a regression point is clicked.
 */
function TrendChart({
  c,
  onOpenTrace,
}: {
  c: Criterion;
  onOpenTrace: () => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = HISTORY[c.id];
  const bar = barOf(c);
  const [lo, hi] = domain(values, bar);
  const innerW = CW - M.left - M.right;
  const innerH = CH - M.top - M.bottom;
  const x = (i: number) => r2(M.left + (i / (values.length - 1)) * innerW);
  const y = (v: number) => r2(M.top + (1 - (v - lo) / (hi - lo)) * innerH);
  const range = hi - lo;
  const step = range > 12 ? 5 : range > 6 ? 2 : 1;
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);
  // The shaded golden band ends halfway between the last golden run and the
  // first shadow day.
  const splitX = r2((x(GOLDEN_RUNS - 1) + x(GOLDEN_RUNS)) / 2);
  const isRegression = c.id === REGRESSION.criterion;
  const color = bar === null ? GRAY : BLUE;

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          className="h-auto w-full min-w-[540px]"
          role="img"
          aria-label={`${c.name}: pass rate by golden run and shadow day${
            bar === null ? "" : `, against a bar of ${bar}%`
          }.`}
        >
          <rect
            x={M.left}
            y={M.top}
            width={r2(splitX - M.left)}
            height={innerH}
            fill="#f4f4f5"
          />
          <text x={M.left + 8} y={M.top - 10} fontSize={11} fill="#71717a" fontFamily="var(--font-geist-mono, monospace)">
            GOLDEN SET
          </text>
          <text x={splitX + 8} y={M.top - 10} fontSize={11} fill="#71717a" fontFamily="var(--font-geist-mono, monospace)">
            SHADOW TRAFFIC
          </text>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={CW - M.right} y1={y(t)} y2={y(t)} stroke="#f4f4f5" />
              <text
                x={M.left - 8}
                y={r2(y(t) + 4)}
                textAnchor="end"
                fontSize={11}
                fill="#a1a1aa"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {t}%
              </text>
            </g>
          ))}
          {bar !== null && (
            <g>
              <line
                x1={M.left}
                x2={CW - M.right}
                y1={y(bar)}
                y2={y(bar)}
                stroke="#18181b"
                strokeWidth={1.5}
                strokeDasharray="6 5"
              />
              {/* Labeled at the left, where the early golden runs sit well
                  below the bar, so the label never collides with the line. */}
              <text
                x={M.left + 8}
                y={r2(y(bar) - 6)}
                fontSize={11}
                fill="#18181b"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                bar {bar}%
              </text>
            </g>
          )}
          <polyline
            points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
          {values.map((v, i) => {
            // Only shadow days count as below the bar: golden runs start under
            // it by design, while the team is still iterating toward it.
            const below = bar !== null && v < bar && POINTS[i].stage === "shadow";
            const clickable = isRegression && below;
            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={clickable ? onOpenTrace : undefined}
                className={clickable ? "cursor-pointer" : undefined}
              >
                {/* A wide invisible hit area, so the points are easy to hover. */}
                <rect
                  x={r2(x(i) - innerW / (values.length - 1) / 2)}
                  y={M.top}
                  width={r2(innerW / (values.length - 1))}
                  height={innerH}
                  fill="transparent"
                />
                <circle
                  cx={x(i)}
                  cy={y(v)}
                  r={below ? 5 : 3}
                  fill={below ? AMBER : color}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
          {hover !== null && (
            <g pointerEvents="none">
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={M.top}
                y2={M.top + innerH}
                stroke="#d4d4d8"
              />
              <text
                x={x(hover) > CW - 160 ? r2(x(hover) - 8) : r2(x(hover) + 8)}
                y={M.top + innerH + 20}
                textAnchor={x(hover) > CW - 160 ? "end" : "start"}
                fontSize={11}
                fill="#18181b"
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {POINTS[hover].label}: {values[hover].toFixed(1)}%
              </text>
            </g>
          )}
        </svg>
      </div>
      <p className="m-0 font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>
    </div>
  );
}

/* ---- Trace -------------------------------------------------------------- */

/** The failing run behind the regression: steps, the evidence, and verdicts. */
function TracePanel({ onClose }: { onClose: () => void }) {
  const total = TRACE.steps.reduce((s, t) => s + t.ms, 0);
  const email = criteriaFor("email");
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
            Failing run
          </span>
          <span className="text-sm font-medium text-zinc-900">{TRACE.title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 font-mono text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
        >
          Close
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {TRACE.steps.map((s) => (
          <div
            key={s.name}
            className="grid grid-cols-[9.5rem_1fr] items-center gap-3 text-xs sm:grid-cols-[11rem_1fr_3.5rem]"
          >
            <span className="text-zinc-700">{s.name}</span>
            <span className="relative h-2 rounded-full bg-zinc-200">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-zinc-500"
                style={{ width: `${Math.round((s.ms / total) * 1000) / 10}%` }}
              />
            </span>
            <span className="hidden text-right font-mono text-zinc-500 sm:inline">
              {(s.ms / 1000).toFixed(1)}s
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-md bg-white p-3">
          <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
            On the call
          </span>
          <span className="text-sm leading-relaxed text-zinc-700">{TRACE.said}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-md bg-white p-3 ring-1 ring-amber-500">
          <span className="font-mono text-xs uppercase tracking-wide text-amber-700">
            In the draft
          </span>
          <span className="text-sm leading-relaxed text-zinc-700">{TRACE.drafted}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
          Verdicts on this run
        </span>
        <div className="flex flex-wrap gap-1.5">
          {email.map((c) => {
            const v = TRACE.verdicts[c.id];
            return (
              <span
                key={c.id}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  v?.pass
                    ? "bg-white text-zinc-600 ring-1 ring-zinc-200"
                    : "bg-amber-600 text-white"
                }`}
              >
                {v?.pass ? "Pass" : "Fail"} · {c.name}
              </span>
            );
          })}
        </div>
        {email.map((c) => TRACE.verdicts[c.id]).find((v) => v && !v.pass)?.reason && (
          <p className="m-0 text-sm leading-relaxed text-zinc-700">
            <span className="font-medium">Judge&apos;s reason:</span>{" "}
            {email.map((c) => TRACE.verdicts[c.id]).find((v) => v && !v.pass)?.reason}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---- Full figure -------------------------------------------------------- */

/**
 * The illustrative eval dashboard.
 *
 * @param variant `full` for the interactive figure, `card` for the static
 *   home-page thumbnail.
 */
export default function EvalDashboard({
  variant = "full",
}: {
  variant?: "full" | "card";
}) {
  const [workflow, setWorkflow] = useState<WorkflowId>(REGRESSION.workflow);
  const [selected, setSelected] = useState<string>(REGRESSION.criterion);
  const [traceOpen, setTraceOpen] = useState(true);

  if (variant === "card") return <Card />;

  const list = criteriaFor(workflow);
  const current = list.find((c) => c.id === selected) ?? list[0];
  const bar = barOf(current);
  const latest = HISTORY[current.id][POINTS.length - 1];
  const isRegression = current.id === REGRESSION.criterion;

  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {/* Header: the selected workflow, named outright, and the tabs that
            switch it. The name is repeated in the title because a dark pill
            alone was too easy to miss as "this is the email workflow". */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
              Eval dashboard
            </span>
            <span className="text-base font-medium text-zinc-900">
              Workflow: {WORKFLOWS.find((w) => w.id === workflow)?.name}
            </span>
          </span>
          <div
            role="group"
            aria-label="Workflow"
            className="flex w-fit flex-wrap gap-1 rounded-full border border-zinc-200 p-1 font-mono text-xs"
          >
            {WORKFLOWS.map((w) => (
              <button
                key={w.id}
                type="button"
                aria-pressed={workflow === w.id}
                onClick={() => {
                  setWorkflow(w.id);
                  const first =
                    w.id === REGRESSION.workflow
                      ? REGRESSION.criterion
                      : criteriaFor(w.id)[0].id;
                  setSelected(first);
                  setTraceOpen(w.id === REGRESSION.workflow);
                }}
                className={`rounded-full px-3 py-1 transition-colors ${
                  workflow === w.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {w.short}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr]">
          {/* Criteria list. */}
          <ul className="m-0 flex list-none flex-col border-b border-zinc-200 p-2 lg:border-r lg:border-b-0">
            {list.map((c) => {
              const s = status(c);
              const on = c.id === current.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(c.id);
                      setTraceOpen(c.id === REGRESSION.criterion);
                    }}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                      on ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm text-zinc-800">
                        {c.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                          <EvalTypeDot
                            type={c.type}
                            tracked={c.tier === "track"}
                            size={10}
                          />
                          {c.type === "code" ? "code" : "judge"} ·{" "}
                          {TIERS[c.tier].label.toLowerCase()}
                        </span>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-px font-mono text-[10px] ${s.className}`}
                        >
                          {s.label}
                        </span>
                      </span>
                    </span>
                    <Sparkline c={c} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Detail. */}
          <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="text-lg font-medium text-zinc-900">
                {current.name}
              </span>
              <span className="font-mono text-sm text-zinc-500">
                latest {latest.toFixed(1)}%
                {bar !== null ? ` · bar ${bar}%` : " · track only"}
              </span>
            </div>

            <TrendChart c={current} onOpenTrace={() => setTraceOpen(true)} />

            {isRegression ? (
              <div className="flex flex-col gap-2 rounded-lg border-l-2 border-amber-500 bg-amber-50/60 px-4 py-3 text-sm leading-relaxed text-zinc-700">
                <span>
                  <span className="font-medium text-zinc-900">
                    Below the bar on shadow days 8 to 10.
                  </span>{" "}
                  {REGRESSION.cause} {REGRESSION.fix}
                </span>
                {!traceOpen && (
                  <button
                    type="button"
                    onClick={() => setTraceOpen(true)}
                    className="w-fit font-mono text-xs text-amber-800 underline decoration-amber-300 underline-offset-4 hover:text-amber-900"
                  >
                    Open a failing run
                  </button>
                )}
              </div>
            ) : (
              <p className="m-0 text-sm leading-relaxed text-zinc-500">
                {bar === null
                  ? "Track only: charted so a shift is visible, but never blocks a launch."
                  : "Held above its bar through the golden set and every day of shadow traffic."}
              </p>
            )}

            {isRegression && traceOpen && (
              <TracePanel onClose={() => setTraceOpen(false)} />
            )}
          </div>
        </div>
      </div>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        An illustrative dashboard example on synthetic data; the real one is
        internal to Meta. Pick a workflow, then a criterion. Each golden run is the
        workflow&apos;s labeled set, run {GOLDEN_REPEATS} times; each shadow
        day is that day&apos;s live traffic. Amber points are below the bar, and
        on the regression they open the failing run.
      </figcaption>
    </figure>
  );
}

/* ---- Home-page card ----------------------------------------------------- */

/** The four email criteria the card shows, the last being the regression,
 *  with titles short enough for a quarter of the card. */
const CARD_PANELS: { id: string; title: string }[] = [
  { id: "facts", title: "Facts match sources" },
  { id: "recipient", title: "Right recipient" },
  { id: "next-steps", title: "Next steps match call" },
  { id: "call-numbers", title: "Numbers match call" },
];
const CARD_W = 1200;
const CARD_H = 400;
const PANEL_W = 264;
const PANEL_GAP = 24;
const PANEL_LEFT = (CARD_W - (4 * PANEL_W + 3 * PANEL_GAP)) / 2;

/** Four small trend panels, one dipping below its bar, like the dashboard. */
function Card() {
  const email = criteriaFor("email");
  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-x-visible sm:px-0">
      <div className="min-w-[720px] sm:min-w-0">
        <svg
          viewBox={`0 0 ${CARD_W} ${CARD_H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Four eval trends against their bars across the golden set and shadow traffic; one dips below its bar during shadow traffic."
        >
          {CARD_PANELS.map(({ id, title }, p) => {
            const c = email.find((e) => e.id === id) as Criterion;
            const values = HISTORY[id];
            const bar = barOf(c) as number;
            const [lo, hi] = domain(values, bar);
            const px = PANEL_LEFT + p * (PANEL_W + PANEL_GAP);
            const top = 110;
            const h = 220;
            const x = (i: number) => r2(px + 16 + (i / (values.length - 1)) * (PANEL_W - 32));
            const y = (v: number) => r2(top + (1 - (v - lo) / (hi - lo)) * h);
            const splitX = r2((x(GOLDEN_RUNS - 1) + x(GOLDEN_RUNS)) / 2);
            const bad = daysBelow(c) > 0;
            return (
              <g key={id}>
                <rect
                  x={px}
                  y={40}
                  width={PANEL_W}
                  height={320}
                  rx={10}
                  fill="#ffffff"
                  stroke={bad ? AMBER : "#e4e4e7"}
                  strokeWidth={2}
                />
                <text x={px + 16} y={72} fontSize={18} fill="#3f3f46">
                  {title}
                </text>
                <text
                  x={px + 16}
                  y={96}
                  fontSize={14}
                  fill={bad ? AMBER : "#71717a"}
                  fontFamily="var(--font-geist-mono, monospace)"
                >
                  {bad ? `${daysBelow(c)} days below bar` : `bar ${bar}%`}
                </text>
                <rect
                  x={px + 16}
                  y={top}
                  width={r2(splitX - px - 16)}
                  height={h}
                  fill="#f4f4f5"
                />
                <line
                  x1={px + 16}
                  x2={px + PANEL_W - 16}
                  y1={y(bar)}
                  y2={y(bar)}
                  stroke="#18181b"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                />
                <polyline
                  points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                  fill="none"
                  stroke={BLUE}
                  strokeWidth={2.5}
                />
                {values.map((v, i) =>
                  v < bar && POINTS[i].stage === "shadow" ? (
                    <circle key={i} cx={x(i)} cy={y(v)} r={6} fill={AMBER} stroke="#ffffff" strokeWidth={2} />
                  ) : null
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
