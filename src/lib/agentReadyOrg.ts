/**
 * agentReadyOrg.ts: the single source of truth for the "Making an Org
 * Agent-Ready" entry.
 *
 * Role in the system: every figure and every number on
 * `/work/agent-ready-org` reads from this module, the same rule the other
 * entries follow, so the prose cannot drift from the charts.
 *
 * What lives here:
 *   - **The conflicting-answers example.** A synthetic quarter of ad revenue
 *     across a few thousand accounts, plus three definitions of "revenue" that
 *     an agent might plausibly find (a dashboard, a notebook, a retired wiki
 *     page) and the one governed definition a metric spec would hold. Each
 *     answer is computed from the same rows, so the gaps between them are real
 *     arithmetic rather than typed numbers.
 *   - **The context levels and governance tiers**, as data, so the figures and
 *     the page copy describe the same framework.
 *
 * Key design decisions:
 *   - **Integer dollars and `+ - * /` only.** Everything here is computed at
 *     module scope and prerendered, then recomputed in the browser. Integer
 *     sums are exact on both sides, so the figures hydrate cleanly. (See the
 *     determinism notes in `newsGraph.ts` for why `Math.log`/`exp` are avoided.)
 *   - **Seeded RNG.** Same `mulberry32` as the other demo libs, so the dataset
 *     is identical on every render.
 *   - **Executive-level vocabulary.** The definitions are written the way a
 *     leader would hear them ("net of refunds, test accounts excluded"), not as
 *     SQL, because the page is written for a director or VP.
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

/** One advertiser account's quarter, in whole dollars. */
type Account = {
  gross: number;
  refunds: number;
  kind: "external" | "test" | "internal";
};

/** Number of synthetic accounts. Large enough that the totals read as a real
 *  business quarter (roughly $100M+) rather than a toy. */
const N_ACCOUNTS = 2400;

/** Shares of non-customer accounts. Test accounts are the sandbox campaigns
 *  engineers and sales engineers run; internal accounts are the company
 *  advertising its own products. Both are real spend in the logs and neither
 *  is customer revenue, which is exactly why definitions disagree about them. */
const TEST_SHARE = 0.035;
const INTERNAL_SHARE = 0.06;

const ACCOUNTS: Account[] = (() => {
  const rand = mulberry32(20260930);
  const out: Account[] = [];
  for (let i = 0; i < N_ACCOUNTS; i++) {
    // The product of two uniforms gives a right-skewed spend distribution (many
    // small advertisers, a few large ones) without needing log or exp.
    const gross = 5000 + Math.floor(rand() * rand() * 180000);
    // Refunds and make-goods run up to about 14% of an account's gross.
    const refunds = Math.floor(gross * rand() * 0.14);
    const r = rand();
    const kind: Account["kind"] =
      r < TEST_SHARE ? "test" : r < TEST_SHARE + INTERNAL_SHARE ? "internal" : "external";
    out.push({ gross, refunds, kind });
  }
  return out;
})();

/** Which accounts a definition counts, and whether it nets out refunds. */
type Rule = {
  net: boolean;
  includeTest: boolean;
  includeInternal: boolean;
};

/**
 * Total revenue under one definition.
 *
 * @param rule The definition to apply.
 * @returns Whole dollars.
 */
function total(rule: Rule): number {
  let sum = 0;
  for (const a of ACCOUNTS) {
    if (a.kind === "test" && !rule.includeTest) continue;
    if (a.kind === "internal" && !rule.includeInternal) continue;
    sum += rule.net ? a.gross - a.refunds : a.gross;
  }
  return sum;
}

/** The governed definition: what a metric spec would hold. */
const SPEC_RULE: Rule = { net: true, includeTest: false, includeInternal: false };

/** One place an agent might find a definition of revenue, and what it says. */
export type Source = {
  id: string;
  /** Who is asking, in plain words. */
  asker: string;
  /** Where that person's agent found its definition. */
  foundIn: string;
  /** The definition, the way a leader would hear it. */
  definition: string;
  /** The answer that definition produces, in whole dollars. */
  value: number;
};

/**
 * Three agents, one question ("what was revenue last quarter?"), three
 * definitions. Each is a mistake a real org makes without anyone being careless:
 * a sales dashboard reports bookings, a notebook forgot the test accounts, and a
 * wiki page still describes last year's definition.
 */
export const SOURCES: Source[] = [
  {
    id: "dashboard",
    asker: "Sales leader",
    foundIn: "A sales dashboard",
    definition: "Gross bookings, every account",
    value: total({ net: false, includeTest: true, includeInternal: true }),
  },
  {
    id: "notebook",
    asker: "Finance partner",
    foundIn: "A teammate's notebook",
    definition: "Net of refunds, test accounts left in",
    value: total({ net: true, includeTest: true, includeInternal: false }),
  },
  {
    id: "wiki",
    asker: "Product analyst",
    foundIn: "A wiki page from last year",
    definition: "Gross bookings, customers only (the old definition)",
    value: total({ net: false, includeTest: false, includeInternal: false }),
  },
];

/** The governed answer, and the definition the spec states. */
export const SPEC = {
  foundIn: "The metric spec",
  definition: "Net of refunds, customers only",
  owner: "Named metric owner",
  value: total(SPEC_RULE),
};

/** The widest disagreement between any two answers, in whole dollars. */
export const SPREAD =
  Math.max(...SOURCES.map((s) => s.value)) - Math.min(...SOURCES.map((s) => s.value));

/**
 * How far the most inflated answer sits above the governed one, as a whole
 * percentage. Rounded here so prose and figure print the same number.
 */
export const MAX_OVERSTATEMENT_PCT = Math.round(
  ((Math.max(...SOURCES.map((s) => s.value)) - SPEC.value) * 100) / SPEC.value
);

/**
 * Whole dollars as a short money label, e.g. `$118.4M`.
 *
 * Formatted by hand rather than with `Intl.NumberFormat`, because server and
 * browser can ship different ICU data and a formatting difference is a
 * hydration mismatch.
 *
 * @param dollars Whole dollars.
 * @returns The value in millions, one decimal place.
 */
export function money(dollars: number): string {
  const tenths = Math.round(dollars / 100000);
  return `$${Math.floor(tenths / 10)}.${tenths % 10}M`;
}

/* ------------------------------------------------------------------------ */
/* The framework                                                            */
/* ------------------------------------------------------------------------ */

/** One level of the context hierarchy, widest first. */
export type Level = {
  name: string;
  /** What belongs at this level, in a few words. */
  holds: string;
  /** Who keeps it true. */
  owner: string;
};

/**
 * The context hierarchy, company first. Definitions are set at the top and
 * never overridden below; preferences cascade down with the most specific
 * level winning; proven knowledge is promoted up.
 */
export const LEVELS: Level[] = [
  {
    name: "Company",
    holds: "Metric definitions, data policies, the terms everyone shares",
    owner: "Metric owners and data governance",
  },
  {
    name: "Org",
    holds: "Shared Skills, standards, how the org reviews work",
    owner: "Org leads",
  },
  {
    name: "Team",
    holds: "Which data to trust, team conventions, known exceptions",
    owner: "The team",
  },
  {
    name: "Individual",
    holds: "Personal notes, drafts, work in progress",
    owner: "Each person",
  },
];

/** One governance tier: a kind of context and the process it gets. */
export type Tier = {
  kind: string;
  /** 1 to 4: how much process this tier carries. Drives the weight marker. */
  weight: number;
  owner: string;
  review: string;
  onChange: string;
};

/**
 * Governance scaled to the stakes, heaviest first. The point of the figure is
 * the gradient: decision-grade numbers get real process and personal notes get
 * none, which is what keeps the whole thing light enough to be followed.
 */
export const TIERS: Tier[] = [
  {
    kind: "Numbers that drive decisions",
    weight: 4,
    owner: "A named metric owner",
    review: "Every change, before it ships",
    onChange: "Versioned; every old copy updated or removed",
  },
  {
    kind: "Shared Skills",
    weight: 3,
    owner: "The author or owning team",
    review: "Tested before sharing, re-tested on change",
    onChange: "New version, catalog updated",
  },
  {
    kind: "Team context",
    weight: 2,
    owner: "The team",
    review: "Periodic, plus automated staleness checks",
    onChange: "Edited in place; links to definitions, never restates them",
  },
  {
    kind: "Personal notes",
    weight: 1,
    owner: "Each person",
    review: "None until promoted",
    onChange: "Whatever proves useful moves up a level",
  },
];
