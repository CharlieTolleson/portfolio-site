"use client";

/**
 * CausalTree.tsx: the fitted honest causal tree, drawn.
 *
 * Role in the system: the signature visual for the causal-inference entry. The
 * `card` variant is the thumbnail on the home page and draws three trees from
 * the bootstrap ensemble, because a forest is the actual method and a single
 * tree would misrepresent it. The `full` variant draws the featured tree with
 * labels, hover detail, and a scroll-triggered grow animation.
 *
 * Key design decisions:
 *   - The tree is not hand-drawn. Structure, thresholds, leaf counts, and leaf
 *     effects all come from `lib/causalDemo.ts`, which fits the tree on
 *     simulated data at module load. Changing the simulation changes the
 *     picture, which is the property that makes it worth drawing at all.
 *   - Leaves are colored on a diverging effect scale rather than labelled only
 *     with numbers, so the finding (one subgroup where the lever backfires) is
 *     visible before any text is read.
 *   - Layout is computed from the tree's own shape rather than positioned by
 *     hand, so a different fit still renders correctly.
 */

import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { TREE, FOREST, effectColor, type TreeNode } from "@/lib/causalDemo";

/** A node placed on the canvas, in viewBox units. */
type Placed = {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
  /** Branch label on the edge coming into this node, if any. */
  edgeLabel?: string;
  parent?: { x: number; y: number };
};

/**
 * Assigns coordinates to every node of a tree.
 *
 * Leaves are spread evenly across the width in left-to-right order and each
 * internal node is centered over its children, which is the standard tidy-tree
 * arrangement and keeps edges from crossing.
 *
 * @param root Tree to lay out.
 * @param width Canvas width in viewBox units.
 * @param rowH Vertical distance between depths.
 * @param top Y coordinate of the root row.
 * @returns Every node with its position.
 */
function layout(
  root: TreeNode,
  width: number,
  rowH: number,
  top: number
): Placed[] {
  const out: Placed[] = [];
  let leafIndex = 0;

  // Counting leaves first gives the horizontal slot width, so a tree of any
  // shape fills the canvas rather than clustering at one side.
  const countLeaves = (n: TreeNode): number =>
    n.kind === "leaf" ? 1 : countLeaves(n.yes) + countLeaves(n.no);
  const total = countLeaves(root);
  const slot = width / total;

  const walk = (
    n: TreeNode,
    depth: number,
    edgeLabel: string | undefined,
    parent: { x: number; y: number } | undefined
  ): number => {
    const y = top + depth * rowH;

    if (n.kind === "leaf") {
      const x = slot * (leafIndex + 0.5);
      leafIndex += 1;
      out.push({ node: n, x, y, depth, edgeLabel, parent });
      return x;
    }

    // Children are walked before the parent is placed, because the parent's x
    // is the midpoint of its two children.
    const placeholder = out.length;
    out.push({ node: n, x: 0, y, depth, edgeLabel, parent });
    const lx = walk(n.yes, depth + 1, n.rule, { x: 0, y });
    const rx = walk(n.no, depth + 1, n.ruleNo, { x: 0, y });
    const x = (lx + rx) / 2;
    out[placeholder].x = x;
    // Rewrite the children's parent anchors now that the true x is known.
    for (const p of out.slice(placeholder + 1)) {
      if (p.parent && p.parent.y === y && p.parent.x === 0) p.parent.x = x;
    }
    return x;
  };

  walk(root, 0, undefined, undefined);
  return out;
}

/**
 * Renders the fitted causal tree.
 *
 * @param variant `card` draws the three-tree ensemble as an unlabelled
 *   thumbnail; `full` draws the featured tree with labels and interaction.
 */
export default function CausalTree({
  variant = "full",
}: {
  variant?: "card" | "full";
}) {
  if (variant === "card") return <ForestCard />;
  return <FullTree />;
}

// --- Card variant ----------------------------------------------------------

const CARD_W = 1200;
const CARD_H = 244;
const CARD_ROW_H = 78;

/**
 * The home-page thumbnail: three bootstrap trees side by side.
 *
 * Split nodes stay unlabelled at this scale, where a covariate name would be
 * noise, but the leaves carry their estimated effect. The number is what makes
 * the picture legible as a result rather than as decoration, and it is large
 * enough to read at card size.
 */
function ForestCard() {
  const each = CARD_W / FOREST.length;

  return (
    <svg
      viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Three causal trees from a bootstrap ensemble. Each splits the population into subgroups whose leaves are colored by the size of the estimated treatment effect."
    >
      {FOREST.map((tree, i) => {
        const placed = layout(tree, each - 90, CARD_ROW_H, 34);
        const dx = i * each + 45;
        return (
          <g key={i} transform={`translate(${dx}, 0)`}>
            {placed.map((p) =>
              p.parent ? (
                <path
                  key={`e-${p.node.id}`}
                  d={`M ${p.parent.x} ${p.parent.y + 12} C ${p.parent.x} ${
                    p.parent.y + 48
                  }, ${p.x} ${p.y - 46}, ${p.x} ${p.y - 12}`}
                  fill="none"
                  stroke="#d4d4d8"
                  strokeWidth={2}
                />
              ) : null
            )}
            {placed.map((p) =>
              p.node.kind === "leaf" ? (
                <g key={p.node.id}>
                  <rect
                    x={p.x - 40}
                    y={p.y - 16}
                    width={80}
                    height={32}
                    rx={7}
                    fill={effectColor(p.node.effect)}
                  />
                  <text
                    x={p.x}
                    y={p.y + 6}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={600}
                    fill="#ffffff"
                    fontFamily="var(--font-geist-mono, monospace)"
                  >
                    {p.node.effect > 0 ? "+" : ""}
                    {p.node.effect.toFixed(1)}
                  </text>
                </g>
              ) : (
                <circle
                  key={p.node.id}
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill="#fafafa"
                  stroke="#71717a"
                  strokeWidth={2}
                />
              )
            )}
          </g>
        );
      })}
    </svg>
  );
}

// --- Full variant ----------------------------------------------------------

const FULL_W = 1180;
const ROW_H = 118;
const TOP = 44;
const NODE_W = 132;

/**
 * The featured tree at full size.
 *
 * Hovering or focusing a leaf reveals the subgroup rule and its interval; the
 * grow animation is scroll-triggered rather than mount-triggered because the
 * figure sits well below the fold and a mount animation would always be over
 * before a reader arrived.
 */
function FullTree() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [active, setActive] = useState<string | null>(null);

  const placed = useMemo(() => layout(TREE, FULL_W - 120, ROW_H, TOP), []);
  const maxDepth = Math.max(...placed.map((p) => p.depth));
  // Bottom padding reserves the band the hover panel occupies, so the layout
  // does not shift when a leaf is focused.
  const viewH = TOP + maxDepth * ROW_H + 100;
  const activeNode = placed.find((p) => p.node.id === active);

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-5">
      {/* A 1180-unit canvas scaled to a phone would render labels at a few
          pixels. Scrolling the canvas keeps them legible instead. */}
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="relative min-w-[1040px]">
          <svg
            viewBox={`0 0 ${FULL_W} ${viewH}`}
            className="h-auto w-full"
            role="img"
            aria-label="A fitted causal tree. The population splits first on product adoption, then on account size and region, into seven subgroups whose estimated treatment effects range from negative to strongly positive."
          >
            <g transform="translate(60, 0)">
              {placed.map((p, i) =>
                p.parent ? (
                  <motion.path
                    key={`edge-${p.node.id}`}
                    d={`M ${p.parent.x} ${p.parent.y + 16} C ${p.parent.x} ${
                      p.parent.y + 60
                    }, ${p.x} ${p.y - 60}, ${p.x} ${p.y - 22}`}
                    fill="none"
                    stroke="#d4d4d8"
                    strokeWidth={2}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                      inView
                        ? { pathLength: 1, opacity: 1 }
                        : { pathLength: 0, opacity: 0 }
                    }
                    transition={{
                      duration: 0.5,
                      delay: 0.12 * p.depth,
                      ease: "easeOut",
                    }}
                  />
                ) : (
                  <g key={`edge-none-${i}`} />
                )
              )}

              {/* Branch labels, offset onto the edge midpoint. */}
              {placed.map((p) =>
                p.parent && p.edgeLabel ? (
                  <motion.text
                    key={`lab-${p.node.id}`}
                    x={(p.parent.x + p.x) / 2 + (p.x < p.parent.x ? -8 : 8)}
                    y={p.y - ROW_H / 2 + 6}
                    textAnchor={p.x < p.parent.x ? "end" : "start"}
                    fontSize={12}
                    fill="#71717a"
                    fontFamily="var(--font-geist-mono, monospace)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: 0.12 * p.depth + 0.3 }}
                  >
                    {p.edgeLabel}
                  </motion.text>
                ) : null
              )}

              {placed.map((p) => {
                const dim = active !== null && active !== p.node.id;

                if (p.node.kind === "split") {
                  return (
                    <motion.g
                      key={p.node.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={
                        inView
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0, scale: 0.8 }
                      }
                      transition={{ duration: 0.35, delay: 0.12 * p.depth }}
                      style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                    >
                      <rect
                        x={p.x - NODE_W / 2}
                        y={p.y - 18}
                        width={NODE_W}
                        height={36}
                        rx={18}
                        fill="#ffffff"
                        stroke="#a1a1aa"
                        strokeWidth={1.5}
                      />
                      <text
                        x={p.x}
                        y={p.y + 5}
                        textAnchor="middle"
                        fontSize={14}
                        fill="#3f3f46"
                        fontFamily="var(--font-geist-sans, sans-serif)"
                      >
                        {/* The node names the covariate; the two edges leaving
                            it carry the actual comparison, so repeating the
                            threshold here would just be noise. */}
                        {p.node.rule.split(" ")[0]}
                      </text>
                    </motion.g>
                  );
                }

                const leaf = p.node;
                return (
                  <motion.g
                    key={leaf.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Subgroup ${leaf.path.join(
                      ", "
                    )}: effect ${leaf.effect.toFixed(1)} points`}
                    className="cursor-pointer focus:outline-none"
                    onMouseEnter={() => setActive(leaf.id)}
                    onMouseLeave={() =>
                      setActive((c) => (c === leaf.id ? null : c))
                    }
                    onFocus={() => setActive(leaf.id)}
                    onBlur={() => setActive((c) => (c === leaf.id ? null : c))}
                    initial={{ opacity: 0, y: 10 }}
                    animate={
                      inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                    }
                    transition={{ duration: 0.4, delay: 0.12 * p.depth + 0.1 }}
                  >
                    <rect
                      x={p.x - 62}
                      y={p.y - 24}
                      width={124}
                      height={52}
                      rx={8}
                      fill={effectColor(leaf.effect)}
                      fillOpacity={dim ? 0.3 : 1}
                      stroke={active === leaf.id ? "#18181b" : "transparent"}
                      strokeWidth={2}
                    />
                    <text
                      x={p.x}
                      y={p.y - 3}
                      textAnchor="middle"
                      fontSize={19}
                      fontWeight={600}
                      fill="#ffffff"
                      fillOpacity={dim ? 0.5 : 1}
                      fontFamily="var(--font-geist-mono, monospace)"
                    >
                      {leaf.effect > 0 ? "+" : ""}
                      {leaf.effect.toFixed(1)}
                    </text>
                    <text
                      x={p.x}
                      y={p.y + 17}
                      textAnchor="middle"
                      fontSize={11.5}
                      fill="#ffffff"
                      fillOpacity={dim ? 0.4 : 0.85}
                      fontFamily="var(--font-geist-mono, monospace)"
                    >
                      ±{(1.96 * leaf.se).toFixed(1)} · n={leaf.n}
                    </text>
                  </motion.g>
                );
              })}
            </g>
          </svg>

          {/* Detail panel for the focused leaf. Rendered as HTML rather than
              SVG text so it can wrap a multi-clause rule without manual
              line-breaking. */}
          {activeNode && activeNode.node.kind === "leaf" ? (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center">
              <div className="max-w-2xl rounded-lg border border-zinc-200 bg-white/95 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <span className="font-mono text-zinc-500">
                  {activeNode.node.path.join("  ·  ")}
                </span>
                <span className="ml-3 text-zinc-800">
                  {(activeNode.node.share * 100).toFixed(0)}% of accounts, effect{" "}
                  <span className="font-medium">
                    {activeNode.node.effect > 0 ? "+" : ""}
                    {activeNode.node.effect.toFixed(2)}
                  </span>{" "}
                  <span className="text-zinc-500">
                    (95% CI {(
                      activeNode.node.effect -
                      1.96 * activeNode.node.se
                    ).toFixed(2)}{" "}
                    to{" "}
                    {(
                      activeNode.node.effect +
                      1.96 * activeNode.node.se
                    ).toFixed(2)}
                    )
                  </span>
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <p className="font-mono text-xs text-zinc-400 sm:hidden">
        scroll the tree sideways →
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: effectColor(-1) }}
          />
          lever costs you
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: effectColor(0.2) }}
          />
          no measurable effect
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: effectColor(5) }}
          />
          lever works
        </span>
        <span className="text-zinc-400">
          hover a leaf for the full subgroup rule
        </span>
      </div>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        One tree from the ensemble, fit on simulated data. Splits were chosen on
        one half of the sample and every effect above was estimated on the other
        half, so no subgroup is reported by the same data that went looking for
        it. Numbers are effects on the outcome in index points, with 95%
        intervals.
      </figcaption>
    </figure>
  );
}
