/**
 * causalDemo.ts: a working causal-inference pipeline over simulated data.
 *
 * Role in the system: the Meta work behind the "Agentic Causal Inference" case
 * study is proprietary, so no real data, metric name, or result can appear on
 * the page. Rather than draw pictures of methods and assert they work, this
 * module builds a synthetic population with a *known* heterogeneous treatment
 * effect and then actually runs the estimation: a propensity model, inverse
 * probability weights, a local-centering residualization, and an honest causal
 * tree. Every figure on the page reads its numbers out of here.
 *
 * Key design decisions:
 *   - **Simulated data, real math.** A reader can verify the story by eye:
 *     because the true effect function is known, the page can show the naive
 *     estimate, the adjusted estimate, and the truth side by side. That
 *     comparison is impossible with real data and is the clearest way to show
 *     what confounding actually costs.
 *   - **Seeded, deterministic RNG.** Client components import these values, so
 *     the browser recomputes what the prerender computed. Any use of
 *     `Math.random` or the clock would produce a hydration mismatch.
 *   - **Transformed outcome with local centering** (Y residualized on X, then
 *     scaled by the propensity residual) is used as the single estimator
 *     everywhere. Uncentered inverse-probability weighting is unbiased too, but
 *     its variance at n-per-leaf is large enough that the leaf intervals would
 *     swamp the real heterogeneity and the figure would teach the wrong lesson.
 *   - **Honesty is enforced, not described.** Splits are chosen on one half of
 *     the sample and leaf effects estimated on the other, which is the property
 *     that separates a causal tree from a regression tree pointed at effects.
 *
 * Everything here runs in a few milliseconds at module load.
 */

/** Number of simulated accounts. Sized so leaf standard errors stay well under
 *  the effect spread; smaller populations make the heterogeneity unreadable. */
const POP_SIZE = 12000;

/** Regions are the categorical covariate; region D is where the lever backfires. */
const REGIONS = ["A", "B", "C", "D"] as const;

/**
 * Deterministic 32-bit PRNG (Mulberry32). Small, fast, and stable across
 * environments, which matters because server and client must agree exactly.
 *
 * @param seed Any integer seed.
 * @returns A function returning uniform draws in [0, 1).
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
 * Standard normal draw via Box-Muller, using the supplied uniform generator.
 *
 * @param rand Uniform generator from `mulberry32`.
 * @returns One draw from N(0, 1).
 */
function normal(rand: () => number): number {
  // Guard against log(0), which Box-Muller would turn into Infinity.
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** One simulated account. Covariates are on 0..1 scales and formatted for
 *  display at the point of use. */
type Unit = {
  /** Account size percentile. */
  size: number;
  /** Existing product adoption, the main driver of effect heterogeneity. */
  adoption: number;
  /** Account tenure, rescaled to years for display. */
  tenure: number;
  /** Index into `REGIONS`. */
  region: number;
  /** Treatment indicator: whether the lever was pulled on this account. */
  w: number;
  /** Observed outcome, in index points of the north star metric. */
  y: number;
  /** The true effect for this unit. Known only because the data is simulated. */
  tau: number;
  /** Estimated propensity score, filled in after the logistic fit. */
  e: number;
  /** Locally centered transformed outcome; an unbiased estimate of `tau`. */
  star: number;
};

/**
 * The true individual treatment effect.
 *
 * The lever helps most where there is headroom: large accounts with low
 * existing adoption. It does nothing where adoption is already saturated, and
 * in region D it is actively counterproductive. That shape is the entire point
 * of the case study, so it is deliberately strong enough to be recoverable.
 *
 * @param u Covariates of one unit.
 * @returns The unit's treatment effect in metric index points.
 */
function trueTau(u: { size: number; adoption: number; region: number }): number {
  const headroom = 1 - u.adoption;
  const reach = 0.3 + 0.9 * u.size;
  const regionPenalty = u.region === 3 ? 2.0 : 0;
  return 7.5 * headroom * reach - regionPenalty;
}

/** Region-level baseline shifts in the outcome, unrelated to the treatment. */
const REGION_BASE = [0, 1.8, -1.1, 0.6];

/**
 * Builds the population.
 *
 * Treatment assignment is confounded on purpose: bigger, more-adopted accounts
 * are far more likely to have been treated, and those same accounts have higher
 * baseline outcomes. A naive treated-versus-untreated comparison therefore
 * overstates the effect, which is what makes the adjustment worth showing.
 */
function buildPopulation(): Unit[] {
  const rand = mulberry32(20260902);
  const units: Unit[] = [];

  for (let i = 0; i < POP_SIZE; i++) {
    const size = rand();
    const adoption = rand();
    const tenure = rand();
    const region = Math.floor(rand() * 4);

    // Selection into treatment. Sales pursued the accounts that already looked
    // healthy, which is the usual reason observational estimates are wrong.
    const logit =
      -0.35 + 2.6 * (size - 0.5) + 2.4 * (adoption - 0.5) + 0.7 * (tenure - 0.5);
    const p = 1 / (1 + Math.exp(-logit));
    const w = rand() < p ? 1 : 0;

    const tau = trueTau({ size, adoption, region });
    const baseline =
      12 + 14 * size + 9 * adoption + 4 * tenure + REGION_BASE[region];
    const y = baseline + tau * w + 2.5 * normal(rand);

    units.push({ size, adoption, tenure, region, w, y, tau, e: 0.5, star: 0 });
  }

  return units;
}

/**
 * Design matrix row for both nuisance models: intercept, three continuous
 * covariates, and three region dummies (region A is the reference level).
 */
function design(u: Unit): number[] {
  return [
    1,
    u.size,
    u.adoption,
    u.tenure,
    u.region === 1 ? 1 : 0,
    u.region === 2 ? 1 : 0,
    u.region === 3 ? 1 : 0,
  ];
}

const N_FEATURES = 7;

/**
 * Fits a logistic regression by full-batch gradient ascent on the log
 * likelihood.
 *
 * Gradient ascent rather than Newton-Raphson because the design is small and
 * well conditioned, and this avoids needing a matrix inverse that could go
 * singular on a degenerate subsample.
 *
 * @param units Training units.
 * @returns Fitted coefficients, aligned with `design`.
 */
function fitLogistic(units: Unit[]): number[] {
  const beta = new Array<number>(N_FEATURES).fill(0);
  const lr = 0.35;
  const n = units.length;

  for (let iter = 0; iter < 600; iter++) {
    const grad = new Array<number>(N_FEATURES).fill(0);
    for (const u of units) {
      const x = design(u);
      let z = 0;
      for (let k = 0; k < N_FEATURES; k++) z += beta[k] * x[k];
      const p = 1 / (1 + Math.exp(-z));
      const r = u.w - p;
      for (let k = 0; k < N_FEATURES; k++) grad[k] += r * x[k];
    }
    for (let k = 0; k < N_FEATURES; k++) beta[k] += (lr * grad[k]) / n;
  }

  return beta;
}

/**
 * Solves `A x = b` by Gaussian elimination with partial pivoting.
 *
 * @param A Square coefficient matrix, modified in place.
 * @param b Right-hand side, modified in place.
 * @returns The solution vector.
 */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];

    const d = A[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / d;
      if (f === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / A[r][r];
  }
  return x;
}

/**
 * Fits `E[Y | X]` by ordinary least squares via the normal equations.
 *
 * This is the local-centering step. Residualizing the outcome on the covariates
 * before forming the transformed outcome removes the variance driven by
 * baseline differences, which is what makes per-leaf intervals tight enough to
 * be informative.
 *
 * @param units Training units.
 * @returns Fitted coefficients, aligned with `design`.
 */
function fitOutcome(units: Unit[]): number[] {
  const XtX: number[][] = Array.from({ length: N_FEATURES }, () =>
    new Array<number>(N_FEATURES).fill(0)
  );
  const Xty = new Array<number>(N_FEATURES).fill(0);

  for (const u of units) {
    const x = design(u);
    for (let i = 0; i < N_FEATURES; i++) {
      Xty[i] += x[i] * u.y;
      for (let j = 0; j < N_FEATURES; j++) XtX[i][j] += x[i] * x[j];
    }
  }

  // Small ridge term so the solve stays stable if a region is thinly populated.
  for (let i = 0; i < N_FEATURES; i++) XtX[i][i] += 1e-6;

  return solve(XtX, Xty);
}

/** Propensities are trimmed before dividing, so a single near-zero score can't
 *  dominate an estimate. Standard practice, and it bounds the weights. */
const TRIM = 0.08;

const POPULATION = buildPopulation();

// --- Nuisance models -------------------------------------------------------

const propBeta = fitLogistic(POPULATION);
const outBeta = fitOutcome(POPULATION);

for (const u of POPULATION) {
  const x = design(u);
  let z = 0;
  let m = 0;
  for (let k = 0; k < N_FEATURES; k++) {
    z += propBeta[k] * x[k];
    m += outBeta[k] * x[k];
  }
  const raw = 1 / (1 + Math.exp(-z));
  u.e = Math.min(1 - TRIM, Math.max(TRIM, raw));
  // Transformed outcome with local centering. Its expectation given X is the
  // conditional average treatment effect, so a plain mean over any subgroup
  // estimates that subgroup's effect.
  u.star = ((u.y - m) * (u.w - u.e)) / (u.e * (1 - u.e));
}

/**
 * Mean and standard error of the transformed outcome over a set of units.
 *
 * @param units Units in the subgroup.
 * @returns Point estimate of the subgroup effect and its standard error.
 */
function effectOf(units: Unit[]): { effect: number; se: number } {
  const n = units.length;
  if (n === 0) return { effect: 0, se: 0 };
  let sum = 0;
  for (const u of units) sum += u.star;
  const mean = sum / n;
  let ss = 0;
  for (const u of units) ss += (u.star - mean) ** 2;
  return { effect: mean, se: Math.sqrt(ss / (n - 1) / n) };
}

// --- Headline estimates ----------------------------------------------------

const treated = POPULATION.filter((u) => u.w === 1);
const control = POPULATION.filter((u) => u.w === 0);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** What a plain treated-versus-untreated comparison reports. Biased upward
 *  here, because the accounts that got the lever were healthier to begin with. */
export const NAIVE_DIFF =
  mean(treated.map((u) => u.y)) - mean(control.map((u) => u.y));

const adjusted = effectOf(POPULATION);

/** The adjusted average effect across the whole population. */
export const ADJUSTED_ATE = adjusted.effect;
/** Standard error of `ADJUSTED_ATE`. */
export const ADJUSTED_SE = adjusted.se;

/** The truth. Available only because the population is simulated; this is the
 *  target the adjusted estimate is trying to recover. */
export const TRUE_ATE = mean(POPULATION.map((u) => u.tau));

/** Share of the simulated population that was treated. */
export const TREATED_SHARE = treated.length / POPULATION.length;

/**
 * Fraction of the naive estimate's error that the adjustment removes.
 *
 * Reported rather than hidden: the adjustment does not land exactly on the
 * truth, and the residual gap is larger than the estimate's own confidence
 * interval. That is the honest state of any weighting approach with imperfect
 * balance, and the page says so.
 */
export const BIAS_REMOVED =
  1 - Math.abs(ADJUSTED_ATE - TRUE_ATE) / Math.abs(NAIVE_DIFF - TRUE_ATE);

/** Population size, exported for captions. */
export const N_UNITS = POPULATION.length;

// --- Covariate balance -----------------------------------------------------

/** One row of the balance plot: how different treated and untreated accounts
 *  are on a covariate, before and after weighting. */
export type BalanceRow = {
  label: string;
  /** Standardized mean difference in the raw comparison. */
  before: number;
  /** Standardized mean difference after inverse probability weighting. */
  after: number;
};

/**
 * Standardized mean difference for one covariate, optionally weighted.
 *
 * SMD is the field's standard balance diagnostic because it is unitless: it
 * expresses the treated/untreated gap in pooled standard deviations, so
 * covariates on different scales can be read on one axis. Under about 0.1 is
 * the conventional threshold for "close enough to a randomized comparison".
 *
 * @param get Extracts the covariate value from a unit.
 * @param weighted Whether to apply inverse probability weights.
 * @returns The standardized mean difference.
 */
function smd(get: (u: Unit) => number, weighted: boolean): number {
  const wt = (u: Unit) =>
    weighted ? (u.w === 1 ? 1 / u.e : 1 / (1 - u.e)) : 1;

  const stats = (units: Unit[]) => {
    let sw = 0;
    let sx = 0;
    for (const u of units) {
      const w = wt(u);
      sw += w;
      sx += w * get(u);
    }
    const m = sx / sw;
    let sv = 0;
    for (const u of units) sv += wt(u) * (get(u) - m) ** 2;
    return { m, v: sv / sw };
  };

  const t = stats(treated);
  const c = stats(control);
  const pooled = Math.sqrt((t.v + c.v) / 2);
  return pooled === 0 ? 0 : (t.m - c.m) / pooled;
}

/** Balance diagnostics, one row per covariate, in the order shown on the page. */
export const BALANCE: BalanceRow[] = [
  { label: "Account size", get: (u: Unit) => u.size },
  { label: "Product adoption", get: (u: Unit) => u.adoption },
  { label: "Tenure", get: (u: Unit) => u.tenure },
  { label: "Region A", get: (u: Unit) => (u.region === 0 ? 1 : 0) },
  { label: "Region B", get: (u: Unit) => (u.region === 1 ? 1 : 0) },
  { label: "Region C", get: (u: Unit) => (u.region === 2 ? 1 : 0) },
  { label: "Region D", get: (u: Unit) => (u.region === 3 ? 1 : 0) },
].map(({ label, get }) => ({
  label,
  before: smd(get, false),
  after: smd(get, true),
}));

/** Largest remaining imbalance after weighting, quoted in the prose. */
export const WORST_AFTER = Math.max(...BALANCE.map((b) => Math.abs(b.after)));
/** Largest imbalance in the raw comparison. */
export const WORST_BEFORE = Math.max(...BALANCE.map((b) => Math.abs(b.before)));

// --- Honest causal tree ----------------------------------------------------

/**
 * Adds an English ordinal suffix, so percentile cuts read as "51st percentile"
 * rather than "51th percentile".
 *
 * @param n A whole number.
 * @returns The number with its ordinal suffix.
 */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** Covariates the tree is allowed to split on, with display formatting. */
const SPLIT_FEATURES = [
  {
    key: "adoption" as const,
    label: "Adoption",
    kind: "num" as const,
    fmt: (t: number) => `${Math.round(t * 100)}%`,
  },
  {
    key: "size" as const,
    label: "Size",
    kind: "num" as const,
    // Spelled out rather than abbreviated: these strings are read by a general
    // audience in figure labels, where "pct" is ambiguous.
    fmt: (t: number) => `${ordinal(Math.round(t * 100))} percentile`,
  },
  {
    key: "tenure" as const,
    label: "Tenure",
    kind: "num" as const,
    fmt: (t: number) => `${(t * 8).toFixed(1)} years`,
  },
  { key: "region" as const, label: "Region", kind: "cat" as const, fmt: () => "" },
];

/** A node of the fitted tree. Leaves carry the honest estimate. */
export type TreeNode =
  | {
      kind: "split";
      id: string;
      /** Human-readable test, e.g. "Adoption < 47%". */
      rule: string;
      /** The same test negated, e.g. "Adoption ≥ 47%", for the "no" branch. */
      ruleNo: string;
      /** Units reaching this node, counted on the estimation half. */
      n: number;
      /** Branch taken when the rule is true. */
      yes: TreeNode;
      /** Branch taken when the rule is false. */
      no: TreeNode;
    }
  | {
      kind: "leaf";
      id: string;
      n: number;
      /** Honest estimate of this subgroup's treatment effect. */
      effect: number;
      /** Standard error of `effect`. */
      se: number;
      /** The conjunction of rules that defines this subgroup. */
      path: string[];
      /** Share of the estimation sample landing here. */
      share: number;
    };

/** Candidate split: a predicate plus the labels shown on each branch. */
type Candidate = { rule: string; ruleNo: string; test: (u: Unit) => boolean };

/**
 * Enumerates candidate splits for a node.
 *
 * Continuous covariates are cut at deciles of the values present in the node,
 * which keeps the candidate set small and guarantees each cut has mass on both
 * sides. Region is split one level at a time against the rest.
 *
 * @param units Units at this node (splitting half only).
 * @returns Candidate splits to score.
 */
function candidates(units: Unit[]): Candidate[] {
  const out: Candidate[] = [];

  for (const f of SPLIT_FEATURES) {
    if (f.kind === "num") {
      const key = f.key as "adoption" | "size" | "tenure";
      const vals = units.map((u) => u[key]).sort((a, b) => a - b);
      for (let q = 1; q <= 9; q++) {
        const t = vals[Math.floor((q / 10) * vals.length)];
        if (t === undefined) continue;
        out.push({
          rule: `${f.label} < ${f.fmt(t)}`,
          ruleNo: `${f.label} ≥ ${f.fmt(t)}`,
          test: (u: Unit) => u[key] < t,
        });
      }
    } else {
      for (let r = 0; r < REGIONS.length; r++) {
        out.push({
          rule: `Region = ${REGIONS[r]}`,
          ruleNo: `Region ≠ ${REGIONS[r]}`,
          test: (u: Unit) => u.region === r,
        });
      }
    }
  }

  return out;
}

/** Minimum units on each side of a split, enforced on both halves. */
const MIN_CHILD = 350;

/**
 * Scores a split by how much of the transformed outcome's variance it explains.
 *
 * Maximizing between-child variance in the mean of the transformed outcome is
 * equivalent to searching for the split that most separates treatment effects,
 * which is what distinguishes this from an ordinary regression tree.
 *
 * @param left Units taking the "yes" branch.
 * @param right Units taking the "no" branch.
 * @returns Heterogeneity score; higher is a better split.
 */
function splitScore(left: Unit[], right: Unit[]): number {
  const ml = mean(left.map((u) => u.star));
  const mr = mean(right.map((u) => u.star));
  const n = left.length + right.length;
  // Weighted squared gap between child effect estimates.
  return ((left.length * right.length) / (n * n)) * (ml - mr) ** 2;
}

/**
 * Grows an honest causal tree.
 *
 * `splitUnits` chooses the structure; `estUnits` produces every reported
 * number. Using one sample for both is what makes ordinary trees overstate
 * heterogeneity: the split is chosen because the gap looked large, and then the
 * same noise that made it look large is reported as the finding.
 *
 * @param splitUnits Half of the sample, used only to pick splits.
 * @param estUnits The other half, used only to estimate leaf effects.
 * @param depth Remaining depth budget.
 * @param path Rules accumulated on the way down.
 * @param id Stable node id, used as a React key.
 * @param totalEst Size of the full estimation half, for leaf shares.
 * @returns The fitted subtree.
 */
function grow(
  splitUnits: Unit[],
  estUnits: Unit[],
  depth: number,
  path: string[],
  id: string,
  totalEst: number
): TreeNode {
  const leaf = (): TreeNode => {
    const { effect, se } = effectOf(estUnits);
    return {
      kind: "leaf",
      id,
      n: estUnits.length,
      effect,
      se,
      path,
      share: estUnits.length / totalEst,
    };
  };

  if (depth === 0 || splitUnits.length < MIN_CHILD * 2) return leaf();

  let best: { c: Candidate; score: number } | null = null;
  for (const c of candidates(splitUnits)) {
    const l = splitUnits.filter(c.test);
    const r = splitUnits.filter((u) => !c.test(u));
    if (l.length < MIN_CHILD || r.length < MIN_CHILD) continue;
    // The same split must be viable on the estimation half, or the leaf it
    // creates would be too small to estimate honestly.
    const el = estUnits.filter(c.test).length;
    if (el < MIN_CHILD || estUnits.length - el < MIN_CHILD) continue;

    const score = splitScore(l, r);
    if (!best || score > best.score) best = { c, score };
  }

  if (!best) return leaf();

  const { c } = best;
  return {
    kind: "split",
    id,
    rule: c.rule,
    ruleNo: c.ruleNo,
    n: estUnits.length,
    yes: grow(
      splitUnits.filter(c.test),
      estUnits.filter(c.test),
      depth - 1,
      [...path, c.rule],
      `${id}L`,
      totalEst
    ),
    no: grow(
      splitUnits.filter((u) => !c.test(u)),
      estUnits.filter((u) => !c.test(u)),
      depth - 1,
      [...path, c.ruleNo],
      `${id}R`,
      totalEst
    ),
  };
}

/**
 * Splits a sample in two using a seeded shuffle.
 *
 * @param units Units to divide.
 * @param seed RNG seed, varied to give each forest tree a different partition.
 * @returns The splitting half and the estimation half.
 */
function halve(units: Unit[], seed: number): [Unit[], Unit[]] {
  const rand = mulberry32(seed);
  const shuffled = units
    .map((u) => ({ u, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.u);
  const mid = Math.floor(shuffled.length / 2);
  return [shuffled.slice(0, mid), shuffled.slice(mid)];
}

const [splitHalf, estHalf] = halve(POPULATION, 7331);

/** The featured tree, shown in full on the case study page. */
export const TREE: TreeNode = grow(
  splitHalf,
  estHalf,
  3,
  [],
  "root",
  estHalf.length
);

/**
 * Flattens a tree to its leaves, left to right.
 *
 * @param node Root of the subtree.
 * @returns Every leaf beneath `node`.
 */
export function leavesOf(node: TreeNode): Extract<TreeNode, { kind: "leaf" }>[] {
  if (node.kind === "leaf") return [node];
  return [...leavesOf(node.yes), ...leavesOf(node.no)];
}

/** Leaves of `TREE`, sorted by estimated effect for the dot plot. */
export const LEAVES = leavesOf(TREE).sort((a, b) => a.effect - b.effect);

/**
 * Share of the estimation sample sitting in leaves with a negative estimated
 * effect, i.e. the accounts the lever measurably costs you.
 *
 * Summed over every negative leaf rather than read off the lowest one: today
 * only one leaf is below zero, so the two agree, but a reseed that produced a
 * second negative leaf would silently understate the figure the page quotes.
 */
export const NEGATIVE_SHARE = LEAVES.filter((l) => l.effect < 0).reduce(
  (s, l) => s + l.share,
  0
);

/** Spread between the weakest and strongest subgroup the tree found. */
export const EFFECT_RANGE: [number, number] = [
  LEAVES[0].effect,
  LEAVES[LEAVES.length - 1].effect,
];

/**
 * A handful of shallow trees grown on bootstrap resamples.
 *
 * A single tree is a fragile object: change the sample and the splits move. The
 * ensemble is the point of a forest, and these are what the card visual on the
 * home page draws.
 */
export const FOREST: TreeNode[] = [11, 23, 47].map((seed) => {
  const rand = mulberry32(seed);
  const boot: Unit[] = [];
  for (let i = 0; i < POPULATION.length; i++) {
    boot.push(POPULATION[Math.floor(rand() * POPULATION.length)]);
  }
  const [s, e] = halve(boot, seed * 13 + 1);
  return grow(s, e, 2, [], `t${seed}`, e.length);
});

/**
 * Maps an effect to a color on the page's diverging scale.
 *
 * Blue for a lever that works, zinc for one that does nothing, amber for one
 * that costs you. Deliberately not red/green, which is the pairing most often
 * lost to color vision deficiency.
 *
 * @param effect Estimated effect in metric index points.
 * @returns A CSS color.
 */
export function effectColor(effect: number): string {
  if (effect <= 0) return "#d97706";
  const t = Math.min(effect / 6, 1);
  // Interpolate zinc-400 to blue-600 as the effect grows.
  const from = [161, 161, 170];
  const to = [37, 99, 235];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
