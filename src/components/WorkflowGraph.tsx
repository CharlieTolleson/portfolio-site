"use client";

import { motion } from "motion/react";

type NodeKind = "plan" | "work" | "synthesize";

type GraphNode = {
  id: string;
  label: string;
  agent: string;
  kind: NodeKind;
  x: number;
  y: number;
  w: number;
  wave: number;
};

type GraphEdge = {
  from: string;
  to: string;
};

const NODE_H = 58;

// Real shape of Hyperion's "idea-council" workflow: 5 independent research
// angles fan into one synthesizer, which fans out to 4 specialist passes,
// which converge through an assessor into a single verdict node. Coordinates
// and per-node widths are hand-placed (one-off diagram, not a generic layout
// engine) — widths are sized to each label so text never clips or overlaps
// the kind tag.
const nodes: GraphNode[] = [
  { id: "market-sizing", label: "Market Sizing", agent: "researcher", kind: "work", x: 7, y: 20, w: 140, wave: 0 },
  { id: "domain-expert", label: "Domain Expert", agent: "researcher", kind: "work", x: 171, y: 20, w: 140, wave: 0 },
  { id: "legal-expert", label: "Legal Expert", agent: "researcher", kind: "work", x: 335, y: 20, w: 140, wave: 0 },
  { id: "market-trends", label: "Market Trends", agent: "researcher", kind: "work", x: 499, y: 20, w: 140, wave: 0 },
  { id: "competitive-landscape", label: "Competitive Landscape", agent: "researcher", kind: "work", x: 663, y: 20, w: 210, wave: 0 },

  { id: "research-synthesizer", label: "Research Synthesis", agent: "synthesizer", kind: "synthesize", x: 345, y: 168, w: 190, wave: 1 },

  { id: "critic", label: "Critic", agent: "critic", kind: "work", x: 100, y: 316, w: 140, wave: 2 },
  { id: "advocate", label: "Advocate", agent: "synthesizer", kind: "work", x: 280, y: 316, w: 140, wave: 2 },
  { id: "planner", label: "Planner", agent: "planner", kind: "plan", x: 460, y: 316, w: 140, wave: 2 },
  { id: "developer", label: "Developer", agent: "developer", kind: "plan", x: 640, y: 316, w: 140, wave: 2 },

  { id: "assessor", label: "Assessor", agent: "critic", kind: "synthesize", x: 185, y: 464, w: 150, wave: 3 },

  { id: "verdict", label: "Verdict", agent: "synthesizer", kind: "synthesize", x: 405, y: 580, w: 190, wave: 4 },
];

const edges: GraphEdge[] = [
  { from: "market-sizing", to: "research-synthesizer" },
  { from: "domain-expert", to: "research-synthesizer" },
  { from: "legal-expert", to: "research-synthesizer" },
  { from: "market-trends", to: "research-synthesizer" },
  { from: "competitive-landscape", to: "research-synthesizer" },
  { from: "research-synthesizer", to: "critic" },
  { from: "research-synthesizer", to: "advocate" },
  { from: "research-synthesizer", to: "planner" },
  { from: "research-synthesizer", to: "developer" },
  { from: "critic", to: "assessor" },
  { from: "advocate", to: "assessor" },
  { from: "planner", to: "verdict" },
  { from: "assessor", to: "verdict" },
  { from: "developer", to: "verdict" },
];

const KIND_COLOR: Record<NodeKind, { border: string; tag: string; tagBg: string }> = {
  plan: { border: "#a78bfa", tag: "#c4b5fd", tagBg: "rgba(167,139,250,0.15)" },
  work: { border: "#60a5fa", tag: "#93c5fd", tagBg: "rgba(96,165,250,0.15)" },
  synthesize: { border: "#34d399", tag: "#6ee7b7", tagBg: "rgba(52,211,153,0.15)" },
};

const byId = new Map(nodes.map((n) => [n.id, n]));

function elbowPath(from: GraphNode, to: GraphNode) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + NODE_H;
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}

const WAVE_DELAY = 0.16;

export default function WorkflowGraph({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "card";
  className?: string;
}) {
  const viewW = 880;
  const viewH = 656;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full h-auto"
        role="img"
        aria-label="Hyperion idea-council workflow: five parallel research nodes feed a synthesizer, which fans out to critic, advocate, planner, and developer nodes, converging through an assessor into a final verdict node."
      >
        {edges.map((e, i) => {
          const from = byId.get(e.from)!;
          const to = byId.get(e.to)!;
          const delay = to.wave * WAVE_DELAY - WAVE_DELAY / 2;
          return (
            <motion.path
              key={`${e.from}-${e.to}-${i}`}
              d={elbowPath(from, to)}
              fill="none"
              stroke="#3f3f46"
              strokeWidth={1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: Math.max(delay, 0), ease: "easeOut" }}
            />
          );
        })}

        {nodes.map((n) => {
          const color = KIND_COLOR[n.kind];
          const delay = n.wave * WAVE_DELAY;
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, y: n.y + 8 }}
              animate={{ opacity: 1, y: n.y }}
              transition={{ duration: 0.4, delay, ease: "easeOut" }}
            >
              <rect
                x={n.x}
                y={0}
                width={n.w}
                height={NODE_H}
                rx={8}
                fill="#18181b"
                stroke={color.border}
                strokeOpacity={0.6}
                strokeWidth={1.5}
              />
              <text
                x={n.x + 10}
                y={19}
                fill="#71717a"
                fontSize={10.5}
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {n.agent}
              </text>
              <rect
                x={n.x + n.w - 10 - n.kind.length * 6.4 - 12}
                y={8}
                width={n.kind.length * 6.4 + 12}
                height={17}
                rx={8.5}
                fill={color.tagBg}
              />
              <text
                x={n.x + n.w - 16 - (n.kind.length * 6.4) / 2}
                y={20}
                fill={color.tag}
                fontSize={9.5}
                textAnchor="middle"
                letterSpacing={0.4}
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {n.kind}
              </text>
              <text
                x={n.x + 10}
                y={42}
                fill="#f4f4f5"
                fontSize={variant === "card" ? 13 : 14}
                fontWeight={600}
                fontFamily="var(--font-geist-sans, sans-serif)"
              >
                {n.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {variant === "full" && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
          {(Object.keys(KIND_COLOR) as NodeKind[]).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: KIND_COLOR[k].border }}
              />
              <span className="font-mono">{k}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
