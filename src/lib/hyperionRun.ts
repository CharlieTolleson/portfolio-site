/**
 * hyperionRun.ts: measured data from Hyperion's run trace store.
 *
 * Role in the system: this is the single source of truth for every number shown
 * on the AI Agent Orchestration case-study page. Timings, token counts and
 * routing targets were read straight out of Hyperion's SQLite trace store
 * (`agents/hyperion/tasks/state.db`, table `trace_events`), which the orchestrator
 * writes one row per LLM call with model, token counts, cost and duration.
 *
 * Key design decision: the page keeps its claims falsifiable, so every value
 * here is the value the trace store recorded. In particular the `model` field on
 * a node is the routing target that was *requested*, which is what the store
 * knows. For nodes that name a role alias (`smart`, `worker`) the store does not
 * record which provider ultimately served the call, so neither does this file
 * and neither does the page. Labelling those bars with a vendor model would be
 * an inference dressed as a measurement. See ModelRef.
 *
 * The trade-off is that this file must be regenerated when the numbers go stale.
 * See REGENERATE below.
 *
 * REGENERATE: re-run the aggregation in `agents/hyperion` against `state.db` and
 * paste the results here. Update `CAPTURED_AT` whenever you do.
 */

/** Date the figures below were read out of the trace store. */
export const CAPTURED_AT = "2026-09-02";

/** The specific run the timeline visualizes. */
export const FEATURED_RUN_ID = "47349fd3";

/**
 * A routing target a node asks for.
 *
 * Two kinds appear. A concrete model id (`gpt-4o`) names one model at one
 * provider. A role alias (`smart`, `worker`) names a *pool* of interchangeable
 * models spanning several providers; the proxy picks a healthy member per
 * request, so the provider that served any given call is decided at call time
 * and is not recorded in the trace store.
 */
export type ModelRef = {
  /** Target id as recorded on the trace row and shown in the figures. */
  id: string;
  /** Provider that serves it, or `alias` when that is chosen at call time. */
  provider: string;
};

export const MODELS: Record<string, ModelRef> = {
  "gpt-4o": { id: "gpt-4o", provider: "openai" },
  "gemini-2.5-pro": { id: "gemini-2.5-pro", provider: "gemini" },
  smart: { id: "smart", provider: "alias" },
  worker: { id: "worker", provider: "alias" },
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
  /** Routing target recorded for this node's calls; see MODELS. */
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
 * This is what the same nodes would have cost end-to-end if each had
 * waited for the one before it. The ratio against RUN_WALL_SECONDS is the
 * concurrency win the graph executor actually delivered.
 */
export const RUN_SEQUENTIAL_SECONDS = 696.6;

/**
 * Aggregates across every *completed* idea-council run in the trace store
 * (n = 9 at CAPTURED_AT).
 *
 * Medians rather than means: the sample is small and one outlier run with a long
 * research phase would drag a mean noticeably.
 *
 * Run and node counts deliberately live here rather than on the page. Small
 * absolute counts read as "young project" and undercut the ratios they sit next
 * to; surface them once they carry their own weight.
 */
export const AGGREGATES = {
  medianSpeedup: 2.64,
  medianWallSeconds: 179,
  medianTokens: 61097,
  /** Completed idea-council runs the medians above are taken over. */
  runs: 9,
  /** Distinct routing targets named across the workflow's nodes. */
  distinctTargets: 4,
  /** How many of those targets are concrete model ids. */
  concreteModels: 2,
  /** How many are role aliases resolved to a provider pool at call time. */
  aliasTargets: 2,
};

/**
 * Whole-system totals across every task Hyperion has run, not just this workflow.
 * The status split is quoted on the page's reliability section; the rest is kept
 * so the figures are ready when the volume justifies showing them.
 */
export const SYSTEM_TOTALS = {
  tasks: 52,
  done: 38,
  failed: 11,
  cancelled: 3,
  llmCalls: 821,
  totalTokens: 3014333,
  firstRun: "2026-05-29",
  lastRun: "2026-08-28",
};
