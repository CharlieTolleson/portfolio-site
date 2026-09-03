"use client";

/**
 * StorySplit.tsx: the entity graph before and after persona splitting.
 *
 * Role in the system: this is the case study's central claim rendered as a
 * control. A reader steps through the algorithm one duplication at a time and
 * watches a single unreadable tangle resolve into separate stories, with the
 * entity being duplicated named and scored at every step. The argument is not
 * "graphs are pretty"; it is that the structure was always there and the
 * splitting is what exposes it.
 *
 * Key design decisions:
 *   - **The steps are computed, not staged.** Every frame comes from
 *     `lib/newsGraph`, which runs Brandes betweenness and the clustering for
 *     real. Nothing here is a stored picture of a result.
 *   - **Position carries identity; colour carries attention.** Components are
 *     separated by the force layout and wrapped in a hull, so the figure needs no
 *     categorical palette. Amber is spent on one thing only: the personas created
 *     by the step the reader is currently looking at.
 *   - **Only the prominent entities are labelled.** Labelling all thirty-two
 *     nodes produces an unreadable pile. Each component labels its target
 *     persona plus its three best-connected members, which is the same
 *     compromise the original poster made for the same reason.
 *   - **Step 0 labels nothing but the target.** The label rule keys off component
 *     size, so the tangle is left deliberately unreadable. That is the honest
 *     depiction of the problem, and it is what makes the last step land.
 */

import { useState } from "react";
import { motion } from "motion/react";
import {
  STEPS,
  STEP_LAYOUTS,
  CARD_LAYOUT,
  FIG_W,
  FIG_H,
  CARD_W,
  CARD_H,
  TARGET,
  type GNode,
  type Pos,
  type SplitStep,
} from "@/lib/newsGraph";

/** Ink for ordinary nodes and for the entity duplicated at the current step. */
const INK = "#3f3f46";
const HIGHLIGHT = "#d97706";

/** Components larger than this are treated as an unresolved tangle. */
const LEGIBLE_COMPONENT = 12;

/** Non-target entities labelled per component, chosen by weighted degree. */
const LABELS_PER_COMPONENT = 3;

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

/**
 * Euclidean length, without `Math.hypot`.
 *
 * `Math.hypot` is implementation-defined and can differ between Node and the
 * browser in the low bits, which is enough to make a prerendered path attribute
 * disagree with the hydrated one. `Math.sqrt` is required to be correctly
 * rounded, so it is the same everywhere.
 */
function dist(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convex hull by Andrew's monotone chain.
 *
 * @param pts Points to wrap.
 * @returns Hull vertices in counter-clockwise order.
 */
function hull(pts: Pos[]): Pos[] {
  if (pts.length < 3) return pts;
  const p = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o: Pos, a: Pos, b: Pos) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Pos[] = [];
  for (const q of p) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0
    ) {
      lower.pop();
    }
    lower.push(q);
  }
  const upper: Pos[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0
    ) {
      upper.pop();
    }
    upper.push(q);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * An SVG path wrapping a set of points, pushed outward from their centroid.
 *
 * Small components collapse to a line or a point, where a hull has no area and
 * would draw nothing. Those fall back to a circle so every component gets a
 * visible boundary.
 *
 * @param pts The component's node positions.
 * @param pad How far outside the nodes the boundary sits.
 */
function hullPath(pts: Pos[], pad = 26): string {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const h = hull(pts);

  if (h.length < 3) {
    const r =
      Math.max(...pts.map((p) => dist(p.x - cx, p.y - cy)), 0) + pad;
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${
      -r * 2
    } 0`;
  }

  const grown = h.map((p) => {
    const d = dist(p.x - cx, p.y - cy) || 1;
    return { x: p.x + ((p.x - cx) / d) * pad, y: p.y + ((p.y - cy) / d) * pad };
  });

  // Quadratic segments through edge midpoints round the corners off, so a
  // component reads as a soft region rather than a polygon with opinions.
  const mid = (a: Pos, b: Pos) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  let d = "";
  for (let i = 0; i < grown.length; i++) {
    const cur = grown[i];
    const next = grown[(i + 1) % grown.length];
    const m = mid(cur, next);
    if (i === 0) {
      const prev = grown[grown.length - 1];
      const m0 = mid(prev, cur);
      d += `M ${m0.x} ${m0.y}`;
    }
    d += ` Q ${cur.x} ${cur.y} ${m.x} ${m.y}`;
  }
  return `${d} Z`;
}

/* ------------------------------------------------------------------ *
 * Label selection
 * ------------------------------------------------------------------ */

/**
 * Choose which nodes carry a visible label.
 *
 * @param step The step being drawn.
 * @param highlight Label of the entity duplicated at this step, if any.
 * @returns Ids to label. Components too large to read get only their target.
 */
function labelledIds(step: SplitStep, highlight: string | null): Set<string> {
  const out = new Set<string>();
  const degree = new Map<string, number>();
  for (const e of step.graph.edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + e.w);
    degree.set(e.b, (degree.get(e.b) ?? 0) + e.w);
  }
  const byId = new Map(step.graph.nodes.map((n) => [n.id, n]));

  for (const comp of step.components) {
    const nodes = comp.map((id) => byId.get(id) as GNode);
    // The target is always named, so a reader can see the same entity standing
    // in several stories at once. That repetition is the result, not a glitch.
    for (const n of nodes) if (n.isTarget) out.add(n.id);

    // So are the copies made by the step being viewed. The caption names the
    // entity that was just duplicated, and an unlabelled highlighted node makes
    // the reader hunt for the thing the sentence is talking about.
    if (highlight !== null) {
      for (const n of nodes) if (n.isPersona && n.label === highlight) out.add(n.id);
    }

    if (comp.length > LEGIBLE_COMPONENT) continue;

    nodes
      .filter((n) => !n.isTarget)
      .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
      .slice(0, LABELS_PER_COMPONENT)
      .forEach((n) => out.add(n.id));
  }
  return out;
}

/** Approximate rendered width of a label, in viewBox units. */
function labelWidth(text: string): number {
  // The font is not measurable during render, and this only has to be good
  // enough to catch an overflow or an overlap, not to typeset anything.
  return text.length * 5.8 + 12;
}

/** Which side of its node a label sits on, and how far it is nudged down. */
type Placement = { side: 1 | -1; dy: number };

/**
 * Decide where each visible label goes.
 *
 * Two rules, in order. A label starts on the side of its own cluster the node
 * sits on, so the outer half of a component does not throw all its text across
 * the middle of it, and flips if that would run it off the canvas. Then any
 * label that would land on top of one already placed is nudged down until it
 * clears, which is the only way to keep a dense cluster legible: several nodes
 * inside one story routinely sit within a few pixels of the same baseline.
 *
 * @param step The step being drawn.
 * @param pos Node positions.
 * @param labels Ids that carry a visible label.
 * @param width Canvas width, for the edge test.
 * @returns Placement per labelled node id.
 */
function placeLabels(
  step: SplitStep,
  pos: Map<string, Pos>,
  labels: Set<string>,
  width: number
): Map<string, Placement> {
  const out = new Map<string, Placement>();
  const byId = new Map(step.graph.nodes.map((n) => [n.id, n]));

  for (const comp of step.components) {
    const pts = comp
      .map((id) => pos.get(id))
      .filter((p): p is Pos => Boolean(p));
    if (pts.length === 0) continue;
    const cx = pts.reduce((t, p) => t + p.x, 0) / pts.length;

    // Top to bottom, so a nudge always pushes into space not yet claimed.
    const members = comp
      .filter((id) => labels.has(id))
      .map((id) => ({ id, p: pos.get(id) as Pos }))
      .filter((m) => Boolean(m.p))
      .sort((a, b) => a.p.y - b.p.y);

    const placed: { x0: number; x1: number; y: number }[] = [];

    for (const { id, p } of members) {
      const node = byId.get(id);
      if (!node) continue;
      const w = labelWidth(node.label);
      const gap = (node.isTarget ? 7.5 : 4.5) + 5;

      let side: 1 | -1 = p.x >= cx ? 1 : -1;
      if (side === -1 && p.x - gap - w < 4) side = 1;
      else if (side === 1 && p.x + gap + w > width - 4) side = -1;

      const box = (dy: number) => ({
        x0: side === 1 ? p.x + gap : p.x - gap - w,
        x1: side === 1 ? p.x + gap + w : p.x - gap,
        y: p.y + dy,
      });

      const LINE_H = 13;
      const STEP = 3;
      const MAX_NUDGE = 30;
      let dy = 0;
      while (dy <= MAX_NUDGE) {
        const b = box(dy);
        const clash = placed.some(
          (q) => b.x0 < q.x1 && q.x0 < b.x1 && Math.abs(b.y - q.y) < LINE_H
        );
        if (!clash) break;
        dy += STEP;
      }

      placed.push(box(dy));
      out.set(id, { side, dy });
    }
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

/**
 * The graph itself.
 *
 * @param step The algorithm state to draw.
 * @param pos Node positions for this state.
 * @param width Canvas width in viewBox units.
 * @param height Canvas height in viewBox units.
 * @param showLabels Whether to draw entity names.
 * @param highlight Label of the entity duplicated at this step, if any.
 */
function GraphView({
  step,
  pos,
  width,
  height,
  showLabels,
  highlight,
}: {
  step: SplitStep;
  pos: Map<string, Pos>;
  width: number;
  height: number;
  showLabels: boolean;
  highlight: string | null;
}) {
  const labels = showLabels
    ? labelledIds(step, highlight)
    : new Set<string>();
  const maxW = Math.max(...step.graph.edges.map((e) => e.w), 1);
  const split = step.components.length > 1;

  const placement = placeLabels(step, pos, labels, width);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={
        split
          ? `Entity graph split into ${step.components.length} separate story components.`
          : `A single tangled entity graph of ${step.graph.nodes.length} entities.`
      }
    >
      {/* Component boundaries, drawn first so they sit behind everything. */}
      {split &&
        step.components.map((comp) => {
          const pts = comp
            .map((id) => pos.get(id))
            .filter((p): p is Pos => Boolean(p));
          if (pts.length === 0) return null;
          return (
            <path
              key={`hull-${comp.slice().sort().join("|")}`}
              d={hullPath(pts)}
              fill="#f4f4f5"
              stroke="#e4e4e7"
              strokeWidth={1}
            />
          );
        })}

      {step.graph.edges.map((e) => {
        const a = pos.get(e.a);
        const b = pos.get(e.b);
        if (!a || !b) return null;
        return (
          <motion.line
            key={`${e.a}~${e.b}`}
            initial={false}
            animate={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            stroke="#a1a1aa"
            // Weight maps to opacity rather than to stroke width: at these
            // line lengths a width difference of a pixel is invisible, and a
            // hairline keeps a dense component from filling in solid.
            strokeOpacity={0.25 + (e.w / maxW) * 0.5}
            strokeWidth={0.9}
          />
        );
      })}

      {step.graph.nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const isHot = highlight !== null && n.label === highlight && n.isPersona;
        const r = n.isTarget ? 7.5 : 4.5;
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: p.x, y: p.y }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <circle
              r={r}
              fill={isHot ? HIGHLIGHT : n.isTarget ? "#18181b" : INK}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            {labels.has(n.id) &&
              (() => {
                const place = placement.get(n.id) ?? { side: 1 as const, dy: 0 };
                const side = place.side;
                return (
                  <text
                    x={side * (r + 5)}
                    y={3.5 + place.dy}
                    textAnchor={side === 1 ? "start" : "end"}
                    fontSize={11}
                    fill={isHot ? HIGHLIGHT : "#52525b"}
                    fontWeight={n.isTarget ? 600 : 400}
                    // A white halo keeps a label readable where it crosses an
                    // edge, which is unavoidable inside a dense cluster.
                    stroke="#ffffff"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {n.label}
                  </text>
                );
              })()}
          </motion.g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Public component
 * ------------------------------------------------------------------ */

/**
 * The persona-splitting figure.
 *
 * @param variant `card` for the static home-page thumbnail, `full` for the
 *   interactive stepper on the case-study page.
 */
export default function StorySplit({
  variant = "full",
}: {
  variant?: "card" | "full";
}) {
  const [i, setI] = useState(0);

  if (variant === "card") {
    const last = STEPS[STEPS.length - 1];
    return (
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-x-visible sm:px-0">
        <div className="min-w-[720px] sm:min-w-0">
          <GraphView
            step={last}
            pos={CARD_LAYOUT}
            width={CARD_W}
            height={CARD_H}
            showLabels={false}
            highlight={null}
          />
        </div>
      </div>
    );
  }

  const step = STEPS[i];
  const pos = STEP_LAYOUTS[i];

  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setI(idx)}
            aria-current={idx === i}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
              idx === i
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            {idx === 0 ? "raw feed" : `split ${idx}`}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-zinc-400">
          {step.graph.nodes.length} nodes ·{" "}
          {step.components.length === 1
            ? "1 component"
            : `${step.components.length} components`}
        </span>
      </div>

      <p className="min-h-[3.5rem] max-w-3xl text-base leading-relaxed text-zinc-600">
        {step.splitLabel === null ? (
          <>
            The ego-network around{" "}
            <span className="font-medium text-zinc-900">{TARGET}</span>: every
            entity the feed mentioned alongside it, joined wherever two entities
            appeared in the same article. Five separate events are in here. None
            of them is visible.
          </>
        ) : (
          <>
            Duplicated{" "}
            <span className="font-medium" style={{ color: HIGHLIGHT }}>
              {step.splitLabel}
            </span>{" "}
            (betweenness{" "}
            <span className="font-mono text-zinc-800">
              {step.splitScore.toFixed(2)}
            </span>
            ) into {step.personas} copies, one per context it was bridging.{" "}
            {step.components.length === 1
              ? "The graph is still in one piece: the entity that mattered most was not the only thing holding it together."
              : `The graph now falls into ${step.components.length} pieces.`}
          </>
        )}
      </p>

      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[680px]">
          <GraphView
            step={step}
            pos={pos}
            width={FIG_W}
            height={FIG_H}
            showLabels
            highlight={step.splitLabel}
          />
        </div>
      </div>

      <p className="font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>

      <figcaption className="max-w-3xl text-sm leading-relaxed text-zinc-500">
        Each step duplicates the single highest-betweenness entity and hands each
        copy one of the contexts it was bridging. Nothing is deleted, so no
        co-occurrence is thrown away: the same entity simply ends up in several
        stories at once, which is what a real entity does. Labels are limited to
        each component&apos;s best-connected members. Synthetic feed, real
        algorithm.
      </figcaption>
    </figure>
  );
}
