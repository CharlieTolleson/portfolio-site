/**
 * decompDemo.ts: working metric-decomposition math over synthetic business data.
 *
 * Role in the system: the "Metric Decomposition" case study describes work done
 * inside Amazon and Meta, so no real data can appear on the page. Instead of
 * drawing pictures of the two frameworks and asserting they add up, this module
 * implements both of them and runs them over datasets written for this page.
 * Every figure and every number in the prose reads its values out of here.
 *
 * The two frameworks:
 *
 *   1. **Contribution to Change (CtC)** for ratio metrics. A rate metric is a
 *      share-weighted average of its subgroup rates, so a movement in the total
 *      has exactly two sources: subgroup rates moved, or the mix of subgroups
 *      moved. `decompose()` splits any change into those two parts per subgroup,
 *      with no residual. Based on the formula in Shao Zhifei's write-up:
 *      https://medium.com/@shaozhifei/metric-decomposition-formula-to-understand-metric-trend-e693b7a4c8cf
 *
 *   2. **Logarithmic Mean Divisia Index (LMDI)** for absolute metrics that are
 *      products of factors. Revenue written as accounts x coverage x win rate x
 *      deal size can be split into one contribution per factor, again with no
 *      residual, using the logarithmic mean as the weight.
 *
 * Key design decisions:
 *   - **Both decompositions are exact, and the page proves it.** Each result
 *     carries a `residual` field computed as (sum of parts) minus (actual
 *     change). It is zero to floating-point precision, and the figures print it.
 *     That is the entire selling point of these methods versus eyeballing a
 *     dashboard, so it should be verifiable rather than claimed.
 *   - **The margin constant makes CtC nest.** Because the mix term is measured
 *     against a constant (the prior overall rate), decomposing at any depth
 *     yields rows that sum to the parent's own contribution. Drill from region
 *     to category to channel and the arithmetic never drifts. `decompose()`
 *     therefore always takes the full universe for its constants and a subset
 *     for its rows.
 *   - **Seeded, deterministic RNG.** Client components import these values, so
 *     the browser recomputes exactly what the server prerendered. Any use of
 *     `Math.random` or the clock would produce a hydration mismatch.
 *
 * Everything here runs in well under a millisecond at module load.
 */

/**
 * Deterministic 32-bit PRNG (Mulberry32). Stable across environments, which is
 * required because the server prerender and the client hydration must agree.
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

/* ------------------------------------------------------------------ */
/* Part 1: Contribution to Change, for ratio metrics                    */
/* ------------------------------------------------------------------ */

/**
 * One leaf cell of the ratio-metric dataset. The metric is wins / views, so a
 * cell carries a numerator and a denominator in each period rather than a rate.
 * Storing counts rather than rates is what lets any grouping be re-aggregated
 * correctly; averaging rates across cells would silently weight them equally.
 */
export type Cell = {
  region: string;
  category: string;
  channel: string;
  viewsPre: number;
  viewsCur: number;
  winsPre: number;
  winsCur: number;
};

/** One subgroup's row in a decomposition, with every quantity a figure needs. */
export type Row = {
  /** Subgroup label, as grouped. */
  key: string;
  /** Subgroup rate in the prior period. */
  ratePre: number;
  /** Subgroup rate in the current period. */
  rateCur: number;
  /** Subgroup's share of total views, prior period. */
  sharePre: number;
  /** Subgroup's share of total views, current period. */
  shareCur: number;
  /**
   * Part of the total change caused by this subgroup's own rate moving:
   * `shareCur * (rateCur - ratePre)`. Scaled by the current share because a
   * subgroup that no longer exists cannot move the total no matter what its
   * rate did.
   */
  rateEffect: number;
  /**
   * Part of the total change caused by this subgroup's share of the mix moving:
   * `(shareCur - sharePre) * (ratePre - overallRatePre)`. The second factor is
   * the subgroup's margin: growing a below-average subgroup drags the total down
   * even when nothing about that subgroup got worse.
   */
  mixEffect: number;
  /** `rateEffect + mixEffect`. Rows sum exactly to the parent's change. */
  total: number;
};

/** The full result of one decomposition, including the proof that it closes. */
export type Decomposition = {
  /** Aggregate rate of the decomposed subset in the prior period. */
  ratePre: number;
  /** Aggregate rate of the decomposed subset in the current period. */
  rateCur: number;
  /**
   * The change this decomposition explains, in overall-metric units. For a
   * subset it is the subset's contribution to the whole, not its own rate move.
   */
  delta: number;
  /** Subgroup rows, ordered most negative contribution first. */
  rows: Row[];
  /** Sum of row totals minus `delta`. Zero to floating-point precision. */
  residual: number;
};

/**
 * Decompose a ratio metric's change into per-subgroup rate and mix effects.
 *
 * The identity, with P for share of the denominator and M for the subgroup rate:
 *
 *   dM_total = sum_x [ P_x_cur * (M_x_cur - M_x_pre)
 *                    + (P_x_cur - P_x_pre) * (M_x_pre - K) ]
 *
 * The first term is the rate effect and the second the mix effect. K is any
 * constant, because subgroup shares sum to one in both periods and so the share
 * deltas sum to zero. Setting K to the prior overall rate is what turns the
 * second term into something interpretable: a subgroup's margin above or below
 * the company average. It is also what makes the decomposition nest, since the
 * same K is used at every depth.
 *
 * @param universe All cells in the dataset. Defines the denominators and K, so
 *   that a subset's rows are expressed in overall-metric units.
 * @param subset The cells to decompose. Pass `universe` for a top-level view, or
 *   a filtered slice to drill into one branch.
 * @param key Groups cells into subgroups, e.g. `(c) => c.region`.
 * @returns Rows summing to the subset's contribution, plus the residual.
 */
export function decompose(
  universe: Cell[],
  subset: Cell[],
  key: (c: Cell) => string
): Decomposition {
  const totalViewsPre = universe.reduce((s, c) => s + c.viewsPre, 0);
  const totalViewsCur = universe.reduce((s, c) => s + c.viewsCur, 0);
  const totalWinsPre = universe.reduce((s, c) => s + c.winsPre, 0);
  // K: the prior overall rate, against which every subgroup's margin is judged.
  const overallPre = totalWinsPre / totalViewsPre;

  const groups = new Map<string, Cell[]>();
  for (const c of subset) {
    const k = key(c);
    const g = groups.get(k);
    if (g) g.push(c);
    else groups.set(k, [c]);
  }

  const rows: Row[] = [];
  for (const [k, cells] of groups) {
    const vPre = cells.reduce((s, c) => s + c.viewsPre, 0);
    const vCur = cells.reduce((s, c) => s + c.viewsCur, 0);
    const wPre = cells.reduce((s, c) => s + c.winsPre, 0);
    const wCur = cells.reduce((s, c) => s + c.winsCur, 0);

    const ratePre = wPre / vPre;
    const rateCur = wCur / vCur;
    const sharePre = vPre / totalViewsPre;
    const shareCur = vCur / totalViewsCur;

    const rateEffect = shareCur * (rateCur - ratePre);
    const mixEffect = (shareCur - sharePre) * (ratePre - overallPre);

    rows.push({
      key: k,
      ratePre,
      rateCur,
      sharePre,
      shareCur,
      rateEffect,
      mixEffect,
      total: rateEffect + mixEffect,
    });
  }

  rows.sort((a, b) => a.total - b.total);

  // The subset's own aggregate rates, for display.
  const sPre = subset.reduce((s, c) => s + c.viewsPre, 0);
  const sCur = subset.reduce((s, c) => s + c.viewsCur, 0);
  const sWinsPre = subset.reduce((s, c) => s + c.winsPre, 0);
  const sWinsCur = subset.reduce((s, c) => s + c.winsCur, 0);

  // The change the rows explain: the subset's contribution to the overall
  // metric, which for the full universe reduces to the plain metric change.
  const delta =
    sWinsCur / totalViewsCur -
    sWinsPre / totalViewsPre -
    overallPre * (sCur / totalViewsCur - sPre / totalViewsPre);

  const summed = rows.reduce((s, r) => s + r.total, 0);

  return {
    ratePre: sWinsPre / sPre,
    rateCur: sWinsCur / sCur,
    delta,
    rows,
    residual: summed - delta,
  };
}

/* ------------------------------------------------------------------ */
/* The synthetic retail dataset                                         */
/* ------------------------------------------------------------------ */

/**
 * Region-level shape of the dataset. `dRate` is the intended change in the
 * region's own rate and `growth` the change in its traffic; the generator
 * distributes both across categories and channels below.
 */
const REGION_SPEC = [
  { name: "North America", views: 4_200_000, rate: 0.742, dRate: 0.0009, growth: 1.01 },
  { name: "Europe", views: 2_400_000, rate: 0.718, dRate: -0.0021, growth: 1.0 },
  { name: "LATAM", views: 1_100_000, rate: 0.664, dRate: -0.018, growth: 1.3 },
  { name: "APAC", views: 1_700_000, rate: 0.706, dRate: 0.0042, growth: 0.94 },
] as const;

/**
 * Categories, with a standing rate offset each. Electronics is the most price
 * transparent category and so the hardest to win, which is what the negative
 * offset encodes.
 */
const CATEGORY_SPEC = [
  { name: "Electronics", weight: 0.26, offset: -0.055 },
  { name: "Home", weight: 0.22, offset: 0.012 },
  { name: "Apparel", weight: 0.2, offset: 0.03 },
  { name: "Grocery", weight: 0.19, offset: 0.018 },
  { name: "Beauty", weight: 0.13, offset: -0.004 },
] as const;

/** Selling channel. Third-party marketplace offers are priced by sellers rather
 *  than by us, so they win the buy box on price less often. */
const CHANNEL_SPEC = [
  { name: "First-party", weight: 0.58, offset: 0.026 },
  { name: "Marketplace", weight: 0.42, offset: -0.036 },
] as const;

/**
 * Where each region's rate movement is concentrated, as a multiplier on the
 * region's `dRate`. The generator normalizes these to a weighted mean of one, so
 * changing the shape here never changes the region's aggregate move.
 *
 * LATAM is the case the page is built around: its whole decline lives in
 * marketplace electronics, which is invisible at the region level and is exactly
 * the kind of finding a manual data dive misses.
 */
function rateConcentration(region: string, category: string, channel: string): number {
  if (region === "LATAM") {
    if (category !== "Electronics") return 0.35;
    return channel === "Marketplace" ? 5.4 : 0.9;
  }
  if (region === "Europe") return category === "Grocery" ? 1.9 : 0.85;
  if (region === "APAC") return channel === "First-party" ? 1.3 : 0.6;
  return category === "Apparel" ? 1.6 : 0.85;
}

/**
 * Where each region's traffic growth is concentrated, as a multiplier on the
 * region's `growth` deviation from one. Same normalization as the rate side.
 *
 * LATAM's traffic grows fastest in the same cell where its rate is collapsing,
 * which is what makes its mix effect and its rate effect point the same way.
 */
function growthConcentration(region: string, category: string, channel: string): number {
  if (region === "LATAM") {
    if (category !== "Electronics") return 0.7;
    return channel === "Marketplace" ? 2.4 : 1.1;
  }
  if (region === "APAC") return category === "Electronics" ? 1.5 : 0.85;
  return 1;
}

/**
 * Build the leaf-level retail dataset.
 *
 * Cells are generated from the region, category, and channel specs, then the
 * intended region-level rate move and traffic growth are spread over the cells
 * using the concentration functions and normalized so the region aggregates
 * still land where the spec says. Light seeded noise keeps the data from looking
 * machine-perfect without moving any aggregate materially.
 *
 * @returns One cell per region x category x channel combination.
 */
function buildCells(): Cell[] {
  const rand = mulberry32(20260902);
  const cells: Cell[] = [];

  for (const region of REGION_SPEC) {
    // First pass: unnormalized weights, so the normalizers can be computed.
    const draft: {
      category: string;
      channel: string;
      views: number;
      ratePre: number;
      rateMult: number;
      growthMult: number;
    }[] = [];

    for (const cat of CATEGORY_SPEC) {
      for (const chan of CHANNEL_SPEC) {
        // +/- 6% jitter on cell size, and +/- 0.6pp on the cell's base rate.
        const sizeNoise = 0.94 + 0.12 * rand();
        const rateNoise = (rand() - 0.5) * 0.012;
        draft.push({
          category: cat.name,
          channel: chan.name,
          views: region.views * cat.weight * chan.weight * sizeNoise,
          ratePre: region.rate + cat.offset + chan.offset + rateNoise,
          rateMult: rateConcentration(region.name, cat.name, chan.name),
          growthMult: growthConcentration(region.name, cat.name, chan.name),
        });
      }
    }

    const viewsPreTotal = draft.reduce((s, d) => s + d.views, 0);
    // Normalize so that the views-weighted mean multiplier is exactly one, which
    // is what preserves the region-level rate move and growth from the spec.
    const rateNorm =
      draft.reduce((s, d) => s + d.views * d.rateMult, 0) / viewsPreTotal;
    const growthNorm =
      draft.reduce((s, d) => s + d.views * d.growthMult, 0) / viewsPreTotal;

    for (const d of draft) {
      const viewsPre = d.views;
      const growth = 1 + (region.growth - 1) * (d.growthMult / growthNorm);
      const viewsCur = viewsPre * growth;
      const ratePre = d.ratePre;
      const rateCur = ratePre + region.dRate * (d.rateMult / rateNorm);

      cells.push({
        region: region.name,
        category: d.category,
        channel: d.channel,
        viewsPre: Math.round(viewsPre),
        viewsCur: Math.round(viewsCur),
        winsPre: Math.round(viewsPre * ratePre),
        winsCur: Math.round(viewsCur * rateCur),
      });
    }
  }

  return cells;
}

/** The full leaf-level retail dataset: 4 regions x 5 categories x 2 channels. */
export const CELLS: Cell[] = buildCells();

/** The dimensions the page can drill through, in order. */
export const DIMENSIONS = ["region", "category", "channel"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** Human label for each drill level, used in the figure's breadcrumb. */
export const DIMENSION_LABEL: Record<Dimension, string> = {
  region: "Region",
  category: "Category",
  channel: "Channel",
};

/**
 * Decompose the retail dataset at a chosen depth, filtered by a drill path.
 *
 * @param path Values already drilled into, in `DIMENSIONS` order. An empty path
 *   groups the whole dataset by region; `["LATAM"]` groups LATAM by category.
 * @returns The decomposition for that level, in overall-metric units.
 */
export function drill(path: string[]): Decomposition {
  const subset = CELLS.filter((c) =>
    path.every((v, i) => c[DIMENSIONS[i]] === v)
  );
  const nextDim = DIMENSIONS[path.length];
  return decompose(CELLS, subset, (c) => c[nextDim]);
}

/** Total page views in the prior period, for scale in the prose. */
export const TOTAL_VIEWS_PRE = CELLS.reduce((s, c) => s + c.viewsPre, 0);

/** Top-level decomposition: the whole dataset, grouped by region. */
export const BY_REGION = drill([]);

/** LATAM broken out by category, the first drill step the page walks through. */
export const LATAM_BY_CATEGORY = drill(["LATAM"]);

/** LATAM electronics broken out by channel: the actionable leaf. */
export const LATAM_ELECTRONICS_BY_CHANNEL = drill(["LATAM", "Electronics"]);

/** The overall metric change being explained, in basis points. */
export const HEADLINE_BPS = bps(BY_REGION.delta);

/** Overall rate in each period, as percentages. */
export const RATE_PRE = BY_REGION.ratePre;
export const RATE_CUR = BY_REGION.rateCur;

/** The single worst leaf: region, category, and channel, with its contribution. */
export const WORST_LEAF = (() => {
  const d = decompose(
    CELLS,
    CELLS,
    (c) => `${c.region} · ${c.category} · ${c.channel}`
  );
  return d.rows[0];
})();

/**
 * The worst leaf's share of the entire company-wide move. This is the number the
 * page is built around: one cell of forty accounts for most of the headline
 * while holding a small single-digit share of the traffic, which is precisely
 * the finding that a top-down dashboard scan cannot surface.
 */
export const WORST_LEAF_SHARE = WORST_LEAF.total / BY_REGION.delta;

/** The LATAM region row, referenced directly in the prose. */
export const LATAM_ROW = BY_REGION.rows.find((r) => r.key === "LATAM")!;

/** The North America region row, whose rate rose while its contribution shrank. */
export const NA_ROW = BY_REGION.rows.find((r) => r.key === "North America")!;

/* ------------------------------------------------------------------ */
/* The Simpson's paradox illustration                                   */
/* ------------------------------------------------------------------ */

/**
 * A deliberately small dataset where every subgroup's rate improves and the
 * total still falls. This is the case that makes the mix term worth explaining:
 * a reader who accepts that a metric is the average of its parts will predict
 * the total went up, and be wrong by more than three hundred basis points.
 *
 * Shape: the two strongest tiers shrink and the weakest tier nearly doubles.
 */
const PARADOX_SPEC = [
  { name: "Premium", viewsPre: 300_000, ratePre: 0.82, viewsCur: 180_000, rateCur: 0.83 },
  { name: "Core", viewsPre: 500_000, ratePre: 0.71, viewsCur: 470_000, rateCur: 0.72 },
  { name: "Value", viewsPre: 200_000, ratePre: 0.58, viewsCur: 350_000, rateCur: 0.59 },
] as const;

const PARADOX_CELLS: Cell[] = PARADOX_SPEC.map((s) => ({
  region: s.name,
  category: s.name,
  channel: s.name,
  viewsPre: s.viewsPre,
  viewsCur: s.viewsCur,
  winsPre: Math.round(s.viewsPre * s.ratePre),
  winsCur: Math.round(s.viewsCur * s.rateCur),
}));

/** The paradox dataset decomposed by tier. */
export const PARADOX = decompose(
  PARADOX_CELLS,
  PARADOX_CELLS,
  (c) => c.region
);

/** Total of the rate effects across the paradox tiers, in basis points. */
export const PARADOX_RATE_BPS = bps(
  PARADOX.rows.reduce((s, r) => s + r.rateEffect, 0)
);

/** Total of the mix effects across the paradox tiers, in basis points. */
export const PARADOX_MIX_BPS = bps(
  PARADOX.rows.reduce((s, r) => s + r.mixEffect, 0)
);

/** The paradox headline: the overall change, in basis points. */
export const PARADOX_TOTAL_BPS = bps(PARADOX.delta);

/** Tiers in business order rather than contribution order, for the figures that
 *  read top to bottom by rate. */
export const PARADOX_TIERS = ["Premium", "Core", "Value"].map(
  (t) => PARADOX.rows.find((r) => r.key === t)!
);

/* ------------------------------------------------------------------ */
/* Part 2: LMDI, for absolute metrics that are products of factors      */
/* ------------------------------------------------------------------ */

/** One sales segment, described by the four factors whose product is revenue. */
export type Segment = {
  name: string;
  /** Prior-period factor values, in `FACTORS` order. */
  pre: number[];
  /** Current-period factor values, in `FACTORS` order. */
  cur: number[];
};

/**
 * The funnel written as a product. Any absolute metric that can be expressed
 * this way is decomposable by LMDI, which is what made the framework portable
 * from a retail rate metric to an ads revenue metric.
 */
export const FACTORS = [
  { key: "accounts", label: "Accounts", unit: "count" },
  { key: "coverage", label: "Opportunities per account", unit: "ratio" },
  { key: "winRate", label: "Win rate", unit: "rate" },
  { key: "dealSize", label: "Revenue per win", unit: "usd" },
] as const;

/**
 * Synthetic quarterly funnel. The shape encodes the finding the page discusses:
 * the book grew because more accounts were worked, while the rate at which those
 * accounts converted fell, and fell hardest in the segment that grew the most.
 */
export const SEGMENTS: Segment[] = [
  { name: "Agency", pre: [900, 3.6, 0.47, 91_000], cur: [910, 3.5, 0.465, 92_500] },
  { name: "Enterprise", pre: [1_200, 2.4, 0.42, 58_000], cur: [1_240, 2.5, 0.43, 57_000] },
  { name: "Mid-market", pre: [5_400, 1.9, 0.36, 19_500], cur: [5_600, 1.95, 0.345, 19_800] },
  { name: "SMB", pre: [24_000, 1.3, 0.28, 4_200], cur: [26_500, 1.35, 0.238, 4_050] },
];

/**
 * Logarithmic mean of two positive numbers: (a - b) / (ln a - ln b).
 *
 * This is the weight that makes LMDI exact. An arithmetic mean would leave an
 * unexplained residual that grows with the size of the change, which is the
 * defect in the older Laspeyres-style index methods.
 *
 * @param a First value, strictly positive.
 * @param b Second value, strictly positive.
 * @returns The logarithmic mean, or `a` when the two are equal.
 */
function logMean(a: number, b: number): number {
  if (a === b) return a;
  return (a - b) / (Math.log(a) - Math.log(b));
}

/** One factor's contribution to the revenue change, with its per-segment split. */
export type FactorContribution = {
  /** Factor label, from `FACTORS`. */
  label: string;
  /** Contribution to the revenue change, in dollars. */
  value: number;
  /** The same contribution split by segment, summing to `value`. */
  bySegment: { name: string; value: number }[];
};

/** The full LMDI result for the funnel, including the proof that it closes. */
export type Lmdi = {
  /** Revenue in the prior period. */
  pre: number;
  /** Revenue in the current period. */
  cur: number;
  /** Actual revenue change. */
  delta: number;
  /** One entry per factor, ordered most positive first. */
  factors: FactorContribution[];
  /** Sum of factor contributions minus `delta`. Zero to floating-point precision. */
  residual: number;
};

/**
 * Additive LMDI decomposition of a product-form aggregate.
 *
 * With revenue V = sum over segments i of the product over factors k of x[k][i],
 * the change decomposes with no residual as:
 *
 *   dV = sum_k sum_i L(V_i_cur, V_i_pre) * ln( x_k_i_cur / x_k_i_pre )
 *
 * where L is the logarithmic mean. Each term is the dollars of the revenue
 * change attributable to one factor moving in one segment, which is why the
 * result can be read either as a factor waterfall or as a segment breakdown of
 * any single factor.
 *
 * @param segments Segments with prior and current factor values.
 * @returns Per-factor contributions in dollars, plus the residual.
 */
export function lmdi(segments: Segment[]): Lmdi {
  const revenue = (v: number[]) => v.reduce((a, b) => a * b, 1);

  const pre = segments.reduce((s, g) => s + revenue(g.pre), 0);
  const cur = segments.reduce((s, g) => s + revenue(g.cur), 0);

  const factors: FactorContribution[] = FACTORS.map((f, k) => {
    const bySegment = segments.map((g) => ({
      name: g.name,
      value:
        logMean(revenue(g.cur), revenue(g.pre)) *
        Math.log(g.cur[k] / g.pre[k]),
    }));
    return {
      label: f.label,
      value: bySegment.reduce((s, b) => s + b.value, 0),
      bySegment,
    };
  });

  factors.sort((a, b) => b.value - a.value);

  const summed = factors.reduce((s, f) => s + f.value, 0);
  return { pre, cur, delta: cur - pre, factors, residual: summed - (cur - pre) };
}

/** The funnel decomposition the page's LMDI figure renders. */
export const FUNNEL = lmdi(SEGMENTS);

/** The factor that cost the most, which is where the page's drill-down starts. */
export const WORST_FACTOR = FUNNEL.factors[FUNNEL.factors.length - 1];

/** The factor that contributed the most. */
export const BEST_FACTOR = FUNNEL.factors[0];

/** Share of the worst factor's damage concentrated in its worst segment. */
export const WORST_FACTOR_CONCENTRATION = (() => {
  const worst = [...WORST_FACTOR.bySegment].sort((a, b) => a.value - b.value)[0];
  return { name: worst.name, value: worst.value, share: worst.value / WORST_FACTOR.value };
})();

/* ------------------------------------------------------------------ */
/* Shared formatting helpers                                            */
/* ------------------------------------------------------------------ */

/**
 * Convert a fractional metric change to basis points.
 *
 * Rate metrics move in fractions of a percentage point, so percentages round to
 * nothing and read as noise. Basis points are the unit these reviews are
 * actually conducted in.
 *
 * @param x A change expressed as a fraction, e.g. 0.0038.
 * @returns The same change in basis points, e.g. 38.
 */
export function bps(x: number): number {
  return x * 10_000;
}

/**
 * Format a basis-point value with an explicit sign.
 *
 * @param x Value in basis points.
 * @param digits Decimal places. Defaults to one.
 * @returns A signed string such as "+2.2" or "-44.0".
 */
export function signedBps(x: number, digits = 1): string {
  return `${x >= 0 ? "+" : ""}${x.toFixed(digits)}`;
}

/**
 * Format a residual for display in basis points.
 *
 * Exists only to avoid printing "-0.00", which a reader reasonably reads as a
 * real negative quantity rounded away rather than as floating-point dust. The
 * residual is the credibility claim of this whole page, so it has to render
 * unambiguously.
 *
 * @param x A residual expressed as a fraction of the metric.
 * @returns A two-decimal basis-point string, never signed-zero.
 */
export function residualBps(x: number): string {
  const v = bps(x);
  return Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2);
}

/**
 * Format a dollar amount in millions with an explicit sign.
 *
 * @param x Dollars.
 * @returns A signed string such as "+$10.1M".
 */
export function signedMillions(x: number): string {
  return `${x >= 0 ? "+" : "-"}$${Math.abs(x / 1_000_000).toFixed(1)}M`;
}

/**
 * Diverging color for a contribution. Deliberately blue and amber rather than
 * green and red: the page is read on projectors and by colorblind readers, and
 * the sign is already carried by the bar's direction.
 *
 * @param x Any signed contribution.
 * @returns A hex color string.
 */
export function contribColor(x: number): string {
  return x >= 0 ? "#2563eb" : "#d97706";
}
