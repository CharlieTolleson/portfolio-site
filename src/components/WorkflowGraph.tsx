"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

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
};

type GraphEdge = {
  from: string;
  to: string;
};

const NODE_W = 200;
const NODE_H = 56;
const VIEW_W = 1160;
const VIEW_H = 420;

// Real shape of Hyperion's "idea-council" workflow, laid out left-to-right by
// execution wave (wave 0 on the left) so it reads well in a laptop-width
// aspect ratio: 5 independent research angles fan into one synthesizer,
// which fans out to 4 specialist passes, which converge through an assessor
// into a single verdict node. Coordinates are hand-placed for this one
// workflow, not computed by a generic layout engine. `dur` values are mock
// timings used only to pace the replay animation below.
const nodes: GraphNode[] = [
  { id: "market-sizing", label: "Market Sizing", agent: "researcher", kind: "work", x: 20, y: 20, dur: 1.8 },
  { id: "domain-expert", label: "Domain Expert", agent: "researcher", kind: "work", x: 20, y: 100, dur: 2.4 },
  { id: "legal-expert", label: "Legal Expert", agent: "researcher", kind: "work", x: 20, y: 180, dur: 1.2 },
  { id: "market-trends", label: "Market Trends", agent: "researcher", kind: "work", x: 20, y: 260, dur: 2.9 },
  { id: "competitive-landscape", label: "Competitive Landscape", agent: "researcher", kind: "work", x: 20, y: 340, dur: 2.1 },

  { id: "research-synthesizer", label: "Research Synthesis", agent: "synthesizer", kind: "synthesize", x: 250, y: 180, dur: 1.6 },

  { id: "critic", label: "Critic", agent: "critic", kind: "work", x: 480, y: 60, dur: 1.1 },
  { id: "advocate", label: "Advocate", agent: "synthesizer", kind: "work", x: 480, y: 140, dur: 1.4 },
  { id: "planner", label: "Planner", agent: "planner", kind: "plan", x: 480, y: 220, dur: 0.9 },
  { id: "developer", label: "Developer", agent: "developer", kind: "plan", x: 480, y: 300, dur: 2.2 },

  { id: "assessor", label: "Assessor", agent: "critic", kind: "synthesize", x: 710, y: 100, dur: 1.0 },

  { id: "verdict", label: "Verdict", agent: "synthesizer", kind: "synthesize", x: 940, y: 207, dur: 1.3 },
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
  plan: { border: "#c4b5fd", tag: "#ede9fe", tagBg: "rgba(196,181,253,0.22)" },
  work: { border: "#93c5fd", tag: "#e0f0ff", tagBg: "rgba(147,197,253,0.22)" },
  synthesize: { border: "#6ee7b7", tag: "#d3fbe8", tagBg: "rgba(110,231,183,0.22)" },
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

// Build a chronological mock trace: each node "starts" once every upstream
// node it depends on has "finished," same rule the real wave executor uses.
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

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}

export default function WorkflowGraph({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "card";
  className?: string;
}) {
  const interactive = variant === "full";
  const [status, setStatus] = useState<Record<string, NodeStatus>>({});
  const [trace, setTrace] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const play = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setTrace([]);
    setStatus({});
    setRunning(true);

    for (const ev of schedule) {
      const id = setTimeout(() => {
        setStatus((prev) => ({ ...prev, [ev.id]: ev.kind === "start" ? "running" : "done" }));
        const node = byId.get(ev.id)!;
        const line =
          ev.kind === "start"
            ? `[${formatTime(ev.t)}] ${node.id.padEnd(22)} started`
            : `[${formatTime(ev.t)}] ${node.id.padEnd(22)} done (${node.dur.toFixed(1)}s)`;
        setTrace((prev) => [...prev, line]);
      }, ev.t * 500);
      timeouts.current.push(id);
    }
    const lastT = schedule[schedule.length - 1].t;
    const endId = setTimeout(() => setRunning(false), lastT * 500 + 100);
    timeouts.current.push(endId);
  };

  useEffect(() => {
    if (!interactive) return;
    const kickoff = setTimeout(play, 0);
    return () => {
      clearTimeout(kickoff);
      timeouts.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [trace]);

  return (
    <div className={className}>
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
          const color = active ? KIND_COLOR[to.kind].border : "#6b7280";
          return (
            <motion.path
              key={`${e.from}-${e.to}-${i}`}
              d={elbowPath(from, to)}
              fill="none"
              stroke={color}
              strokeWidth={active ? 2 : 1.5}
              initial={interactive ? false : { pathLength: 0, opacity: 0 }}
              animate={interactive ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          );
        })}

        {nodes.map((n) => {
          const color = KIND_COLOR[n.kind];
          const st: NodeStatus = interactive ? status[n.id] ?? "pending" : "done";
          const stroke = st === "pending" ? "#71717a" : color.border;
          const fillOpacity = st === "pending" ? 0.5 : 1;
          return (
            <motion.g
              key={n.id}
              initial={interactive ? false : { opacity: 0, y: n.y + 8 }}
              animate={{ opacity: 1, y: n.y }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <rect
                x={n.x}
                y={0}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill="#3f3f46"
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeWidth={st === "running" ? 2.25 : 1.5}
              />
              {st === "done" && (
                <circle cx={n.x + NODE_W - 10} cy={10} r={5} fill={color.border} />
              )}
              <text x={n.x + 10} y={19} fill="#d4d4d8" fontSize={10.5} fontFamily="var(--font-geist-mono, monospace)">
                {n.agent}
              </text>
              <rect
                x={n.x + NODE_W - 10 - n.kind.length * 6.4 - 12}
                y={8}
                width={n.kind.length * 6.4 + 12}
                height={17}
                rx={8.5}
                fill={color.tagBg}
              />
              <text
                x={n.x + NODE_W - 16 - (n.kind.length * 6.4) / 2}
                y={20}
                fill={color.tag}
                fontSize={9.5}
                textAnchor="middle"
                letterSpacing={0.4}
                fontFamily="var(--font-geist-mono, monospace)"
              >
                {n.kind}
              </text>
              <text x={n.x + 10} y={42} fill="#fafafa" fontSize={variant === "card" ? 13 : 14} fontWeight={600} fontFamily="var(--font-geist-sans, sans-serif)">
                {n.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {interactive && (
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400">
              {(Object.keys(KIND_COLOR) as NodeKind[]).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: KIND_COLOR[k].border }} />
                  <span className="font-mono">{k}</span>
                </div>
              ))}
            </div>
            <button
              onClick={play}
              disabled={running}
              className="shrink-0 rounded-md border border-zinc-600 px-3 py-1.5 font-mono text-xs text-zinc-200 transition-colors hover:border-zinc-400 hover:text-white disabled:opacity-50"
            >
              {running ? "Running…" : "Run example"}
            </button>
          </div>
          <div
            ref={logRef}
            className="h-32 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950/60 p-3 font-mono text-[11px] leading-relaxed text-zinc-400"
          >
            {trace.length === 0 && <span className="text-zinc-600">Waiting to run…</span>}
            {trace.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
