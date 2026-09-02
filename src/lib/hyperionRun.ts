/**
 * hyperionRun.ts — real measured data from Hyperion's run trace store.
 *
 * Role in the system: this is the single source of truth for every number shown
 * on the AI Agent Orchestration case-study page. Nothing here is illustrative or
 * rounded for effect — each value was read out of Hyperion's SQLite trace store
 * (`agents/hyperion/tasks/state.db`, table `trace_events`), which the orchestrator
 * writes one row per LLM call with model, token counts, cost and duration.
 *
 * Key design decision: the page keeps its claims falsifiable. Because every
 * figure traces back to a specific recorded run, the copy can name exact models
 * and exact timings instead of hedging with "a fast general-purpose model". The
 * trade-off is that this file must be regenerated when the numbers go stale —
 * see REGENERATE below.
 *
 * REGENERATE: re-run the aggregation in `agents/hyperion` against `state.db` and
 * paste the results here. Update `CAPTURED_AT` whenever you do.
 */

/** Date the figures below were read out of the trace store. */
export const CAPTURED_AT = "2026-09-01";

/** The specific run the timeline visualizes. */
export const FEATURED_RUN_ID = "47349fd3";

/**
 * A model target as recorded on the trace row.
 *
 * Hyperion nodes can point either at a concrete model id (`gpt-4o`) or at a
 * LiteLLM *alias group* (`smart`, `worker`) that lists several providers in
 * priority order and fails over between them. The distinction matters on the
 * page: alias nodes are the ones that demonstrate provider-independent routing.
 */
export type ModelRef = {
  /** Value as recorded in the trace store. */
  id: string;
  /** True when `id` is a LiteLLM alias group rather than a concrete model. */
  isAlias: boolean;
  /** For alias groups, the providers tried in priority order. */
  group?: string[];
};

export const MODELS: Record<string, ModelRef> = {
  "gpt-4o": { id: "gpt-4o", isAlias: false },
  "gemini-2.5-pro": { id: "gemini-2.5-pro", isAlias: false },
  smart: {
    id: "smart",
    isAlias: true,
    group: ["claude-opus-4-6", "gemini-2.5-pro", "gpt-4o"],
  },
  worker: {
    id: "worker",
    isAlias: true,
    group: ["claude-sonnet-4-6", "gemini-2.5-pro", "gpt-4o"],
  },
};

/**
 * One node's measured span within the featured run.
 *
 * `start`/`end` are seconds relative to the first LLM call of the run. A node
 * can span several calls because researcher nodes run a capped ReAct loop
 * (search → read → reason), so `calls` is often > 1 and the span includes tool
 * time between calls, not just model time.
 */
export type RunNode = {
  id: string;
  label: string;
  role: string;
  model: string;
  /** Seconds from run start. */
  start: number;
  /** Seconds from run start. */
  end: number;
  /** LLM calls made inside this node. */
  calls: number;
  /** Input + output tokens across those calls. */
  tokens: number;
};

/**
 * Measured node spans for run 47349fd3 (idea-council, 2026-06-23).
 *
 * Ordered by start time, which makes the four execution waves visible: five
 * research nodes at t=0, the synthesizer at 135.6, four specialist passes at
 * 170.7, then assessor and verdict. Every node in a wave starts within ~20ms of
 * its siblings — that simultaneity is what the timeline is there to show.
 */
export const RUN_NODES: RunNode[] = [
  { id: "competitive-landscape", label: "Competitive Landscape", role: "researcher", model: "gpt-4o", start: 0.0, end: 86.0, calls: 3, tokens: 9586 },
  { id: "domain-expert", label: "Domain Expert", role: "researcher", model: "gpt-4o", start: 0.0, end: 101.0, calls: 2, tokens: 7216 },
  { id: "legal-expert", label: "Legal Expert", role: "researcher", model: "gpt-4o", start: 0.0, end: 102.0, calls: 2, tokens: 6952 },
  { id: "market-sizing", label: "Market Sizing", role: "researcher", model: "gpt-4o", start: 0.0, end: 96.9, calls: 2, tokens: 7472 },
  { id: "market-trends", label: "Market Trends", role: "researcher", model: "gpt-4o", start: 0.0, end: 135.6, calls: 2, tokens: 8274 },
  { id: "research-synthesizer", label: "Research Synthesis", role: "synthesizer", model: "gemini-2.5-pro", start: 135.6, end: 170.7, calls: 1, tokens: 8562 },
  { id: "critic", label: "Critic", role: "critic", model: "gpt-4o", start: 170.7, end: 176.5, calls: 1, tokens: 3482 },
  { id: "advocate", label: "Advocate", role: "synthesizer", model: "gemini-2.5-pro", start: 170.7, end: 182.2, calls: 1, tokens: 4481 },
  { id: "planner", label: "Planner", role: "planner", model: "smart", start: 170.7, end: 204.4, calls: 1, tokens: 7170 },
  { id: "developer", label: "Developer", role: "developer", model: "worker", start: 170.7, end: 222.4, calls: 1, tokens: 8991 },
  { id: "assessor", label: "Assessor", role: "critic", model: "gpt-4o", start: 222.4, end: 227.2, calls: 1, tokens: 2471 },
  { id: "verdict", label: "Verdict", role: "synthesizer", model: "gemini-2.5-pro", start: 227.3, end: 259.9, calls: 1, tokens: 10651 },
];

/** Wall-clock seconds for the featured run, first call start to last call end. */
export const RUN_WALL_SECONDS = 259.9;

/**
 * Summed node spans for the featured run.
 *
 * This is what the same twelve nodes would have cost end-to-end if each had
 * waited for the one before it. The ratio against RUN_WALL_SECONDS is the
 * concurrency win the graph executor actually delivered.
 */
export const RUN_SEQUENTIAL_SECONDS = 696.6;

/**
 * Aggregates across every *completed* idea-council run in the trace store.
 *
 * Medians rather than means: the sample is small (9 runs) and one outlier run
 * with a long research phase would drag a mean noticeably.
 */
export const AGGREGATES = {
  /** Completed idea-council runs the medians are computed over. */
  runs: 9,
  /** Nodes per run (the workflow gained a node partway through the sample). */
  nodesPerRun: "11–12",
  medianSpeedup: 2.64,
  medianWallSeconds: 179,
  medianTokens: 61097,
  /** Distinct model targets across the workflow. */
  distinctModels: 4,
  /** Providers reachable behind those targets via LiteLLM. */
  providers: 3,
};

/** Whole-system totals across every task Hyperion has run, not just this workflow. */
export const SYSTEM_TOTALS = {
  tasks: 52,
  llmCalls: 821,
  totalTokens: 3014333,
  firstRun: "2026-05-29",
  lastRun: "2026-08-28",
};
