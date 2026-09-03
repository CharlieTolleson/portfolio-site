"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

type NodeKind = "plan" | "work" | "synthesize";
type NodeStatus = "pending" | "running" | "done";

type GraphNode = {
  id: string;
  label: string;
  agent: string;
  kind: NodeKind;
  x: number;
  y: number;
  /** Mock run duration in seconds, used only to drive the replay animation. */
  dur: number;
  /** Short persona name and instruction, shown in the hover tooltip. */
  persona: string;
  prompt: string;
  /**
   * Model target this node actually ran on, as recorded in the trace store.
   * The routing target this node asks for: a model id, or a role alias
   * resolved to a provider pool at call time. See `lib/hyperionRun`.
   */
  model: string;
};

type GraphEdge = {
  from: string;
  to: string;
};

const NODE_W = 220;
const NODE_H = 56;
const VIEW_W = 1260;
const VIEW_H = 420;

// Real shape of Hyperion's "idea-council" workflow, laid out left-to-right by
// execution wave (wave 0 on the left) so it reads well in a laptop-width
// aspect ratio: 5 independent research angles fan into one synthesizer,
// which fans out to 4 specialist passes, which converge through an assessor
// into a single verdict node. Coordinates are hand-placed for this one
// workflow, not computed by a generic layout engine. `dur` is a mock value
// used only to pace the replay animation.
const nodes: GraphNode[] = [
  {
    id: "market-sizing", label: "Market Sizing", agent: "researcher", kind: "work", x: 20, y: 20, dur: 1.8,
    persona: "Market Analyst", prompt: "Size the market and growth rate for this idea.", model: "gpt-4o",
  },
  {
    id: "domain-expert", label: "Domain Expert", agent: "researcher", kind: "work", x: 20, y: 100, dur: 2.4,
    persona: "Domain Expert", prompt: "Judge technical feasibility.", model: "gpt-4o",
  },
  {
    id: "legal-expert", label: "Legal Expert", agent: "researcher", kind: "work", x: 20, y: 180, dur: 1.2,
    persona: "Legal Analyst", prompt: "Flag legal or compliance risk.", model: "gpt-4o",
  },
  {
    id: "market-trends", label: "Market Trends", agent: "researcher", kind: "work", x: 20, y: 260, dur: 2.9,
    persona: "Trend Researcher", prompt: "Identify relevant market trends.", model: "gpt-4o",
  },
  {
    id: "competitive-landscape", label: "Competitive Landscape", agent: "researcher", kind: "work", x: 20, y: 340, dur: 2.1,
    persona: "Competitive Analyst", prompt: "Map competitors and differentiation.", model: "gpt-4o",
  },
  {
    id: "research-synthesizer", label: "Research Synthesis", agent: "synthesizer", kind: "synthesize", x: 270, y: 180, dur: 1.6,
    persona: "Synthesizer", prompt: "Combine the five research threads into one brief.", model: "gemini-2.5-pro",
  },
  {
    id: "critic", label: "Critic", agent: "critic", kind: "work", x: 520, y: 60, dur: 1.1,
    persona: "Critic", prompt: "Argue against the idea.", model: "gpt-4o",
  },
  {
    id: "advocate", label: "Advocate", agent: "synthesizer", kind: "work", x: 520, y: 140, dur: 1.4,
    persona: "Advocate", prompt: "Argue for the idea.", model: "gemini-2.5-pro",
  },
  {
    id: "planner", label: "Planner", agent: "planner", kind: "plan", x: 520, y: 220, dur: 0.9,
    persona: "Planner", prompt: "Draft an execution plan.", model: "smart",
  },
  {
    id: "developer", label: "Developer", agent: "developer", kind: "plan", x: 520, y: 300, dur: 2.2,
    persona: "Technical Lead", prompt: "Estimate build effort.", model: "worker",
  },
  {
    id: "assessor", label: "Assessor", agent: "critic", kind: "synthesize", x: 770, y: 100, dur: 1.0,
    persona: "Assessor", prompt: "Weigh the critique against the advocacy.", model: "gpt-4o",
  },
  {
    id: "verdict", label: "Verdict", agent: "synthesizer", kind: "synthesize", x: 1020, y: 207, dur: 1.3,
    persona: "Verdict Writer", prompt: "Render a final recommendation.", model: "gemini-2.5-pro",
  },
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

// Tailwind's default violet/blue/emerald 600-700 steps on a zinc-neutral
// ground, dark enough to hold contrast on an off-white background.
const KIND_COLOR: Record<NodeKind, { border: string; tag: string; tagBg: string }> = {
  plan: { border: "#7c3aed", tag: "#5b21b6", tagBg: "#ede9fe" },
  work: { border: "#2563eb", tag: "#1d4ed8", tagBg: "#dbeafe" },
  synthesize: { border: "#059669", tag: "#047857", tagBg: "#d1fae5" },
};

const byId = new Map(nodes.map((n) => [n.id, n]));

function elbowPath(from: GraphNode, to: GraphNode) {
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}

// Schedule each node's mock start/finish so the replay animation follows the
// same rule the real wave executor uses: a node starts once every upstream
// node it depends on has finished.
function buildSchedule() {
  const upstream = new Map<string, string[]>();
  for (const n of nodes) upstream.set(n.id, []);
  for (const e of edges) upstream.get(e.to)!.push(e.from);

  const start = new Map<string, number>();
  const finish = new Map<string, number>();
  const order: string[] = [];
  const remaining = new Set(nodes.map((n) => n.id));

  while (remaining.size > 0) {
    const ready = [...remaining].filter((id) =>
      upstream.get(id)!.every((u) => finish.has(u))
    );
    const t = ready.reduce(
      (max, id) => Math.max(max, ...upstream.get(id)!.map((u) => finish.get(u)!)),
      0
    );
    for (const id of ready) {
      start.set(id, t);
      finish.set(id, t + byId.get(id)!.dur);
      remaining.delete(id);
      order.push(id);
    }
  }

  type Event = { t: number; id: string; kind: "start" | "done" };
  const events: Event[] = [];
  for (const id of order) {
    events.push({ t: start.get(id)!, id, kind: "start" });
    events.push({ t: finish.get(id)!, id, kind: "done" });
  }
  events.sort((a, b) => a.t - b.t);
  return events;
}

const schedule = buildSchedule();

export default function WorkflowGraph({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "card";
  className?: string;
}) {
  const interactive = variant === "full";
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, amount: 0.35 });
  const [status, setStatus] = useState<Record<string, NodeStatus>>({});
  const [running, setRunning] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const play = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setStatus({});
    setRunning(true);

    for (const ev of schedule) {
      const id = setTimeout(() => {
        setStatus((prev) => ({ ...prev, [ev.id]: ev.kind === "start" ? "running" : "done" }));
      }, ev.t * 500);
      timeouts.current.push(id);
    }
    const lastT = schedule[schedule.length - 1].t;
    const endId = setTimeout(() => setRunning(false), lastT * 500 + 100);
    timeouts.current.push(endId);
  };

  // The replay is the point of this figure, so it must not fire before anyone
  // can see it. The graph sits roughly a screen and a half down the page and the
  // animation lasts ~4s, so a mount-triggered play would always finish before a
  // reader arrived, leaving them a static, already-completed graph.
  useEffect(() => {
    if (!interactive || !inView) return;
    const kickoff = setTimeout(play, 250);
    return () => {
      clearTimeout(kickoff);
      timeouts.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const hovered = interactive && hoveredId ? byId.get(hoveredId)! : null;

  return (
    <div className={className} ref={wrapRef}>
      {/* At 375px the 1260-unit viewBox scales to ~0.26, which renders node
          labels at about 4px, which is illegible. Scrolling a min-width canvas keeps the
          diagram readable on phones instead of shrinking it past usefulness.
          980px is the narrowest width that still puts node labels above ~12px,
          the point where they stop straining on a phone. */}
      <div className="relative -mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-x-visible sm:px-0">
        <div className="relative min-w-[980px] sm:min-w-0">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto"
          role="img"
          aria-label="Hyperion idea-council workflow: five parallel research nodes feed a synthesizer, which fans out to critic, advocate, planner, and developer nodes, converging through an assessor into a final verdict node."
        >
          {edges.map((e, i) => {
            const from = byId.get(e.from)!;
            const to = byId.get(e.to)!;
            const active = interactive && status[e.from] === "done";
            const color = active ? KIND_COLOR[to.kind].border : "#d4d4d8";
            return (
              <motion.path
                key={`${e.from}-${e.to}-${i}`}
                d={elbowPath(from, to)}
                fill="none"
                stroke={color}
                strokeWidth={active ? 2.25 : 1.5}
                initial={interactive ? false : { pathLength: 0, opacity: 0 }}
                animate={interactive ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            );
          })}

          {nodes.map((n) => {
            const color = KIND_COLOR[n.kind];
            const st: NodeStatus = interactive ? status[n.id] ?? "pending" : "done";
            const stroke = st === "pending" ? "#d4d4d8" : color.border;
            const fill = st === "pending" ? "#fafafa" : "#ffffff";
            const labelColor = st === "pending" ? "#a1a1aa" : "#18181b";
            const agentColor = st === "pending" ? "#d4d4d8" : "#71717a";
            return (
              <motion.g
                key={n.id}
                initial={interactive ? false : { opacity: 0, y: n.y + 8 }}
                animate={{ opacity: 1, y: n.y }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onMouseEnter={() => interactive && setHoveredId(n.id)}
                onMouseLeave={() => interactive && setHoveredId((cur) => (cur === n.id ? null : cur))}
                // Focus handlers mirror the hover handlers so the tooltip is
                // reachable by keyboard, not just by pointer.
                onFocus={() => interactive && setHoveredId(n.id)}
                onBlur={() => interactive && setHoveredId((cur) => (cur === n.id ? null : cur))}
                tabIndex={interactive ? 0 : -1}
                role={interactive ? "button" : undefined}
                aria-label={interactive ? `${n.label}: ${n.persona}, routed to ${n.model}. ${n.prompt}` : undefined}
                style={{ cursor: interactive ? "default" : undefined }}
              >
                {/* Native SVG tooltip: covers touch long-press and any case where
                    the positioned HTML tooltip is unavailable. */}
                <title>{`${n.label}: ${n.persona} · ${n.model}`}</title>
                <rect
                  x={n.x}
                  y={0}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={st === "running" ? 2.5 : 1.5}
                />
                {st === "done" && (
                  <circle cx={n.x + NODE_W - 10} cy={10} r={5} fill={color.border} />
                )}
                <text x={n.x + 10} y={19} fill={agentColor} fontSize={11.5} fontFamily="var(--font-geist-mono, monospace)">
                  {n.agent}
                </text>
                <rect
                  x={n.x + NODE_W - 10 - n.kind.length * 7 - 12}
                  y={7}
                  width={n.kind.length * 7 + 12}
                  height={18}
                  rx={9}
                  fill={st === "pending" ? "#f4f4f5" : color.tagBg}
                />
                <text
                  x={n.x + NODE_W - 16 - (n.kind.length * 7) / 2}
                  y={20}
                  fill={st === "pending" ? "#a1a1aa" : color.tag}
                  fontSize={10.5}
                  textAnchor="middle"
                  letterSpacing={0.4}
                  fontFamily="var(--font-geist-mono, monospace)"
                >
                  {n.kind}
                </text>
                <text x={n.x + 10} y={43} fill={labelColor} fontSize={variant === "card" ? 14.5 : 15.5} fontWeight={600} fontFamily="var(--font-geist-sans, sans-serif)">
                  {n.label}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-60 -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-lg"
            style={{
              left: `${((hovered.x + NODE_W / 2) / VIEW_W) * 100}%`,
              // Nodes in the top row sit at y=20 of a 420-unit viewBox, so
              // anchoring the tooltip above them clipped it off the top. Flip it
              // below the node whenever there is not room above.
              top: `${((hovered.y + (hovered.y < 90 ? NODE_H + 8 : -8)) / VIEW_H) * 100}%`,
              transform: `translateX(-50%) ${hovered.y < 90 ? "" : "translateY(-100%)"}`,
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900">{hovered.persona}</span>
              <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                {hovered.model}
              </span>
            </div>
            <div className="mt-1 text-xs leading-snug text-zinc-500">{hovered.prompt}</div>
          </div>
        )}
        </div>
      </div>
      <p className="mt-2 font-mono text-xs text-zinc-400 sm:hidden">
        scroll the diagram sideways →
      </p>

      {interactive && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
              {(Object.keys(KIND_COLOR) as NodeKind[]).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: KIND_COLOR[k].border }} />
                  <span className="font-mono">{k}</span>
                </div>
              ))}
            </div>
            <button
              onClick={play}
              disabled={running}
              className="shrink-0 rounded-md border border-zinc-300 px-4 py-2 font-mono text-sm text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 disabled:opacity-50"
            >
              {running ? "Running…" : "Run example"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
