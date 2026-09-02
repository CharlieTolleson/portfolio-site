/**
 * hyperionRun.ts: measured data from Hyperion's run trace store.
 *
 * Role in the system: this is the single source of truth for every number shown
 * on the AI Agent Orchestration case-study page. Timings and token counts were
 * read straight out of Hyperion's SQLite trace store
 * (`agents/hyperion/tasks/state.db`, table `trace_events`), which the orchestrator
 * writes one row per LLM call with model, token counts, cost and duration. The
 * only values not taken verbatim are two model labels: nodes that name a logical
 * role are shown as the model that role reaches for first (see MODELS).
 *
 * Key design decision: the page keeps its claims falsifiable. Because every
 * figure traces back to a specific recorded run, the copy can name exact models
 * and exact timings instead of hedging with "a fast general-purpose model". The
 * trade-off is that this file must be regenerated when the numbers go stale.
 * See REGENERATE below.
 *
 * REGENERATE: re-run the aggregation in `agents/hyperion` against `state.db` and
 * paste the results here. Update `CAPTURED_AT` whenever you do.
 */

/** Date the figures below were read out of the trace store. */
export const CAPTURED_AT = "2026-09-01";

/** The specific run the timeline visualizes. */
export const FEATURED_RUN_ID = "47349fd3";

/**
 * A model a node is configured to reach for.
 *
 * Two of the nodes don't name a model directly. They name a logical role that
 * resolves through a LiteLLM alias to an ordered provider chain. The figures
 * label those nodes with the first model in their chain, which is the model the
 * node is asking for; the role/alias indirection itself is explained in prose
 * and shown in the settings screenshot.
 */
export type ModelRef = {
  /** Model id as shown in the figures. */
  id: string;
  /** Provider that serves it, for the legend. */
  provider: string;
};

export const MODELS: Record<string, ModelRef> = {
  "gpt-4o": { id: "gpt-4o", provider: "openai" },
  "gemini-2.5-pro": { id: "gemini-2.5-pro", provider: "gemini" },
  "claude-opus-4-6": { id: "claude-opus-4-6", provider: "anthropic" },
  "claude-sonnet-4-6": { id: "claude-sonnet-4-6", provider: "anthropic" },
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
  /** Model this node is configured to use; see MODELS. */
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
 * its siblings, and that simultaneity is what the timeline is there to show.
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
  { id: "planner", label: "Planner", role: "planner", model: "claude-opus-4-6", start: 170.7, end: 204.4, calls: 1, tokens: 7170 },
  { id: "developer", label: "Developer", role: "developer", model: "claude-sonnet-4-6", start: 170.7, end: 222.4, calls: 1, tokens: 8991 },
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
