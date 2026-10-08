/**
 * launchBar.ts: the single source of truth for the "Setting the Launch Bar
 * for AI" entry (evals for Meta's ad-seller agent workflows).
 *
 * Role in the system: every figure and every number on `/work/launch-bar`
 * reads from this module, the same rule the other entries follow, so the
 * prose cannot drift from the charts.
 *
 * What lives here:
 *   - **Three of the seven workflows** (follow-up email, product
 *     recommendation, client presentation) and a sample of their eval criteria, each
 *     with its eval type (code check or LLM judge) and its tier.
 *   - **The tiers**, each defined by the question every team answered: how
 *     often is it OK for this criterion not to pass? Track-only criteria are
 *     measured but never gate.
 *   - **A synthetic pass-rate history** for every criterion across the golden
 *     set and two weeks of shadow traffic, with one regression and the failing
 *     trace behind it, for the illustrative dashboard.
 *
 * Key design decisions:
 *   - **Synthetic, and labeled so on the page.** The real criteria, thresholds,
 *     and dashboard are internal to Meta. The criteria named here are the kinds
 *     Charlie describes (right recipient, numbers that match the call, pitched
 *     products that are the recommendation model's top picks); the thresholds and
 *     pass rates are illustrative.
 *   - **No production stage in the history.** The workflows were still building
 *     toward launch when Charlie left Meta, so the example stops at shadow
 *     traffic rather than inventing a launch.
 *   - **Deterministic.** Seeded `mulberry32` per criterion and values rounded
 *     to one decimal, so the dashboard prerenders and hydrates identically.
 */

/**
 * Deterministic 32-bit PRNG (mulberry32).
 *
 * @param seed Any integer seed.
 * @returns A function yielding uniform draws in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A stable integer seed from a string, so each criterion gets its own series.
 *
 * @param s Any string (a criterion id).
 * @returns A 32-bit unsigned integer.
 */
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Round to one decimal place. */
const r1 = (v: number) => Math.round(v * 10) / 10;

/* ---- Workflows and criteria -------------------------------------------- */

export type WorkflowId = "email" | "solutions" | "deck";

/** The three workflows the page uses as examples, out of the program's seven. */
export const WORKFLOWS: { id: WorkflowId; name: string; short: string }[] = [
  { id: "email", name: "Follow-up email", short: "Email" },
  { id: "solutions", name: "Product recommendation", short: "Products" },
  { id: "deck", name: "Client presentation", short: "Slides" },
];

/** Total workflows in the program; only three are shown in detail. */
export const WORKFLOW_COUNT = 7;

/** Approximate number of unique eval criteria across all seven workflows. */
export const CRITERIA_TOTAL = "close to 100";

export type EvalType = "code" | "judge";
export type Tier = "critical" | "high" | "standard" | "track";

/**
 * What each tier means, defined by the tolerated failure rate. `threshold` is
 * the pass rate (percent) a gated criterion must reach; `failOneIn` is the
 * same bar said the way teams were asked to set it. Illustrative values.
 */
export const TIERS: Record<
  Tier,
  { label: string; failOneIn: number | null; threshold: number | null; meaning: string }
> = {
  critical: {
    label: "Critical",
    failOneIn: 100,
    threshold: 99,
    meaning: "A wrong fact, number, or person in front of an advertiser.",
  },
  high: {
    label: "High",
    failOneIn: 20,
    threshold: 95,
    meaning: "Usable, but a seller would have to fix it before sending.",
  },
  standard: {
    label: "Standard",
    failOneIn: 10,
    threshold: 90,
    meaning: "Polish a seller might not even notice.",
  },
  track: {
    label: "Track only",
    failOneIn: null,
    threshold: null,
    meaning: "Measured and charted on the dashboard, but never blocks a launch.",
  },
};

/** Tier order, most to least consequential. */
export const TIER_ORDER: Tier[] = ["critical", "high", "standard", "track"];

/** One eval criterion: a single question with a pass or fail answer. */
export type Criterion = {
  id: string;
  name: string;
  /** One line on what passing means, shown on hover in the criteria grid. */
  detail: string;
  workflows: WorkflowId[];
  type: EvalType;
  tier: Tier;
};

const ALL: WorkflowId[] = ["email", "solutions", "deck"];

/** A sample of the criteria: the shared ones first, then each workflow's own. */
export const CRITERIA: Criterion[] = [
  {
    id: "facts",
    name: "Facts match the sources",
    detail:
      "Every claim traces back to the call, the account record, or the model output it came from.",
    workflows: ALL,
    type: "judge",
    tier: "critical",
  },
  {
    id: "grammar",
    name: "Grammar and spelling",
    detail: "Clean, correct writing an advertiser would expect from Meta.",
    workflows: ALL,
    type: "judge",
    tier: "standard",
  },
  {
    id: "tone",
    name: "Tone fits the relationship",
    detail: "Professional, and pitched to how the seller and advertiser actually talk.",
    workflows: ALL,
    type: "judge",
    tier: "standard",
  },
  {
    id: "sentiment",
    name: "Sentiment",
    detail:
      "Measured on every output so a shift shows up on the dashboard, but never gates a launch.",
    workflows: ALL,
    type: "judge",
    tier: "track",
  },
  {
    id: "recipient",
    name: "Addressed to the right person",
    detail: "The recipient and greeting match the advertiser contact in the meeting record.",
    workflows: ["email"],
    type: "code",
    tier: "critical",
  },
  {
    id: "spend",
    name: "Spend figures match the database",
    detail: "Every figure about the advertiser's spend is compared exactly against the billing record.",
    workflows: ["email"],
    type: "code",
    tier: "critical",
  },
  {
    id: "call-numbers",
    name: "Numbers match the call",
    detail: "Any number said on the call appears in the draft exactly as it was said.",
    workflows: ["email"],
    type: "judge",
    tier: "critical",
  },
  {
    id: "next-steps",
    name: "Next steps match the call",
    detail: "The email commits to what was agreed on the call, and nothing that wasn't.",
    workflows: ["email"],
    type: "judge",
    tier: "high",
  },
  {
    id: "ranked",
    name: "Pitches the model's top-ranked products",
    detail:
      "Every product pitched sits near the top of the recommendation model's output for this advertiser, so none are invented.",
    workflows: ["solutions"],
    type: "code",
    tier: "critical",
  },
  {
    id: "available",
    name: "Products available to this advertiser",
    detail: "Each pitched product is offered in the advertiser's market and fits its account type.",
    workflows: ["solutions"],
    type: "code",
    tier: "critical",
  },
  {
    id: "rationale",
    name: "Rationale fits the advertiser's goals",
    detail: "The reason given for each product ties to a goal this advertiser actually has.",
    workflows: ["solutions"],
    type: "judge",
    tier: "high",
  },
  {
    id: "deck-numbers",
    name: "Charts use the advertiser's real numbers",
    detail: "Every chart and figure in the presentation is checked against the account data it claims to show.",
    workflows: ["deck"],
    type: "code",
    tier: "critical",
  },
  {
    id: "layout",
    name: "Clean formatting",
    detail: "No text overflowing a slide, broken layouts, or off-brand styles.",
    workflows: ["deck"],
    type: "code",
    tier: "high",
  },
  {
    id: "story",
    name: "Reads as one argument",
    detail: "The slides build a single case for this advertiser, in an order that makes sense.",
    workflows: ["deck"],
    type: "judge",
    tier: "high",
  },
];

/* ---- Pass-rate history -------------------------------------------------- */

/** Golden-set runs before shadow traffic; each is the full set, run repeatedly. */
export const GOLDEN_RUNS = 6;
/**
 * Synthetic set size, used only to snap golden pass rates to whole verdicts so
 * the chart looks like counts; it is not the real golden-set size, which the
 * page deliberately never states. Also how many times each run repeats them.
 */
export const GOLDEN_SIZE = 40;
export const GOLDEN_REPEATS = 5;
/** Days of shadow traffic. */
export const SHADOW_DAYS = 14;

/** X-axis labels: golden runs G1..G6, then shadow days D1..D14. */
export const POINTS: { label: string; stage: "golden" | "shadow" }[] = [
  ...Array.from({ length: GOLDEN_RUNS }, (_, i) => ({
    label: `Golden run ${i + 1}`,
    stage: "golden" as const,
  })),
  ...Array.from({ length: SHADOW_DAYS }, (_, i) => ({
    label: `Shadow day ${i + 1}`,
    stage: "shadow" as const,
  })),
];

/**
 * The one regression in the example: a prompt change on shadow day 8 made
 * the email draft paraphrase numbers from the call, the "Numbers match the
 * call" judge caught it, and the change was reverted on day 10.
 */
export const REGRESSION = {
  workflow: "email" as WorkflowId,
  criterion: "call-numbers",
  /** Indexes into POINTS (shadow days 8 to 10), with the pass rate on each. */
  points: [
    { index: GOLDEN_RUNS + 7, value: 96.1 },
    { index: GOLDEN_RUNS + 8, value: 94.8 },
    { index: GOLDEN_RUNS + 9, value: 97.2 },
  ],
  cause: "A prompt change on shadow day 8 started paraphrasing numbers from the call.",
  fix: "Reverted on day 10; back above the bar from day 11.",
};

/**
 * Where a criterion's golden-set pass rate starts and settles, relative to its
 * bar. Code checks start closer and vary less, because they fail for concrete,
 * fixable reasons; judges wander more from run to run.
 */
function profile(c: Criterion, rand: () => number) {
  const bar = TIERS[c.tier].threshold ?? 82;
  const ceiling = 100;
  const settle =
    c.type === "code"
      ? Math.min(ceiling, bar + 0.4 + rand() * 0.6)
      : Math.min(ceiling - 0.4, bar + 0.6 + rand() * 2.2);
  const start = settle - (c.type === "code" ? 3 + rand() * 4 : 7 + rand() * 9);
  const noise = c.type === "code" ? 0.25 : 0.9;
  return { start, settle, noise };
}

/**
 * Pass rates for one criterion across every point in `POINTS`.
 *
 * Golden runs climb from `start` toward `settle` as the team iterates, and are
 * snapped to the 0.5-point grid a 200-verdict run produces (the synthetic
 * `GOLDEN_SIZE` times `GOLDEN_REPEATS`). Shadow days hover around `settle`.
 * The regression, if this is its criterion, overwrites three shadow days.
 *
 * @param c The criterion.
 * @returns One pass rate (percent, one decimal) per point.
 */
function series(c: Criterion): number[] {
  const rand = mulberry32(seedOf(c.id));
  const { start, settle, noise } = profile(c, rand);
  const verdicts = GOLDEN_SIZE * GOLDEN_REPEATS;
  const out: number[] = [];
  for (let i = 0; i < GOLDEN_RUNS; i++) {
    const t = i / (GOLDEN_RUNS - 1);
    // Ease out: big gains early, small ones near the bar.
    const eased = 1 - (1 - t) * (1 - t);
    const v = start + (settle - start) * eased + (rand() - 0.5) * noise;
    const snapped = (Math.round((Math.min(100, v) / 100) * verdicts) / verdicts) * 100;
    out.push(r1(snapped));
  }
  for (let d = 0; d < SHADOW_DAYS; d++) {
    const v = settle + (rand() - 0.5) * noise * 1.4;
    out.push(r1(Math.min(100, v)));
  }
  if (c.id === REGRESSION.criterion) {
    for (const p of REGRESSION.points) out[p.index] = p.value;
  }
  return out;
}

/** Pass-rate history for every criterion, keyed by criterion id. */
export const HISTORY: Record<string, number[]> = Object.fromEntries(
  CRITERIA.map((c) => [c.id, series(c)])
);

/**
 * The criteria a workflow is evaluated on: the shared ones, then its own.
 *
 * @param w A workflow id.
 * @returns Criteria in display order.
 */
export function criteriaFor(w: WorkflowId): Criterion[] {
  return CRITERIA.filter((c) => c.workflows.includes(w));
}

/* ---- The failing trace -------------------------------------------------- */

/** One step of the agent's run, as the dashboard's trace view lists it. */
export type TraceStep = { name: string; detail: string; ms: number };

/**
 * A failing run from shadow day 9, opened from the regression. The advertiser
 * and every value are fictional.
 */
export const TRACE = {
  title: "Follow-up email · shadow day 9 · Harbor & Pine Outfitters",
  steps: [
    { name: "Fetch call transcript", detail: "38-minute call, 2 speakers", ms: 410 },
    { name: "Fetch account record", detail: "Contacts, spend, open opportunities", ms: 260 },
    { name: "Extract commitments", detail: "3 next steps, 2 numbers", ms: 2900 },
    { name: "Draft email", detail: "176 words", ms: 6100 },
    { name: "Run evals", detail: "8 criteria", ms: 3400 },
  ] satisfies TraceStep[],
  /** What was said, and what the draft said, around the failing number. */
  said: "…we're planning to raise the Q3 budget by about 15 percent, mostly into video…",
  drafted: "…as you plan to raise your Q3 budget by 50%, we'd suggest putting most of it into video…",
  /** Verdicts on this run, by criterion id; the one failure carries a reason. */
  verdicts: {
    facts: { pass: true },
    grammar: { pass: true },
    tone: { pass: true },
    sentiment: { pass: true },
    recipient: { pass: true },
    spend: { pass: true },
    "call-numbers": {
      pass: false,
      reason: "The draft says 50%; on the call the advertiser said about 15 percent.",
    },
    "next-steps": { pass: true },
  } as Record<string, { pass: boolean; reason?: string }>,
};
