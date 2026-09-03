"use client";

/**
 * StreamPipeline.tsx: the ingestion path, and the one tuning decision inside it.
 *
 * Role in the system: the interesting part of this project is the event
 * detection, but none of it runs without a feed that has been deduplicated and
 * tagged first. This figure exists so the systems work is visible rather than
 * implied, and so the dedup threshold, which is the one knob on the pipeline
 * that changes what the graph looks like, gets shown rather than asserted.
 *
 * Key design decisions:
 *   - **The pipeline is HTML, the curve is SVG.** Stage descriptions are prose
 *     and need to wrap; the curve is geometry. Forcing either into the other's
 *     medium costs more than it saves.
 *   - **The curve is computed from the banding formula.** Each line is
 *     `1 - (1 - s^r)^b` evaluated across the similarity range, so the thresholds
 *     in the labels are properties of the configuration rather than numbers typed
 *     next to a drawing.
 *   - **One line is highlighted, the rest are context.** Three configurations
 *     with three hues would need a categorical palette and a legend to say one
 *     thing: this is the one we shipped. A single blue line against grey ones
 *     says it without either.
 */

const CURVE_W = 460;
const CURVE_H = 300;
const C_PAD_L = 46;
const C_PAD_R = 30;
const C_PAD_T = 34;
const C_PAD_B = 42;

const SERIES = "#2563eb";

/** Pipeline stages, in the order an article passes through them. */
const STAGES: { name: string; detail: string }[] = [
  {
    name: "Feed",
    detail:
      "Several hundred news and blog sources worldwide, arriving continuously.",
  },
  {
    name: "Kafka",
    detail:
      "One topic per stage, so a slow consumer applies backpressure instead of dropping articles.",
  },
  {
    name: "MinHash + LSH",
    detail:
      "Near-duplicate wire copy collapsed to one article before it can inflate a co-occurrence count.",
  },
  {
    name: "NER",
    detail:
      "Entities and key phrases tagged per article, which become the nodes.",
  },
  {
    name: "Elasticsearch",
    detail:
      "Articles and their entities, queryable by time window so any window can be rebuilt on demand.",
  },
];

/**
 * Banded LSH configurations.
 *
 * `b` bands of `r` rows each. The probability that a pair with true Jaccard
 * similarity `s` is retrieved as a candidate is `1 - (1 - s^r)^b`, and the
 * curve's midpoint sits near `(1 / b) ^ (1 / r)`, which is the effective
 * similarity threshold.
 */
const CONFIGS: { b: number; r: number; shipped: boolean }[] = [
  { b: 50, r: 4, shipped: false },
  { b: 20, r: 8, shipped: true },
  { b: 10, r: 16, shipped: false },
];

/**
 * Integer exponentiation by repeated multiplication.
 *
 * `Math.pow` is implementation-defined, and Node and the browser can return
 * results differing in the last bits. Those differences reach the rendered path
 * coordinates and become a hydration mismatch. Both exponents here are small
 * integers, so a plain loop is both exact and reproducible.
 */
function ipow(base: number, exp: number): number {
  let out = 1;
  for (let i = 0; i < exp; i++) out *= base;
  return out;
}

/** Candidate probability under banded LSH. */
const pCandidate = (s: number, b: number, r: number) =>
  1 - ipow(1 - ipow(s, r), b);

/**
 * Effective similarity threshold: where the curve crosses one half.
 *
 * This is a root rather than an integer power, so it is rounded to the two
 * decimals it is displayed at. That keeps the label text and the x position
 * derived from it identical on the server and in the browser.
 */
const threshold = (b: number, r: number) =>
  Math.round(Math.pow(1 / b, 1 / r) * 100) / 100;

const cx = (s: number) => C_PAD_L + s * (CURVE_W - C_PAD_L - C_PAD_R);
const cy = (p: number) => CURVE_H - C_PAD_B - p * (CURVE_H - C_PAD_T - C_PAD_B);

/** Sample count across the similarity range. Enough to keep the knee smooth. */
const SAMPLES = 160;

/** SVG path for one configuration's curve. */
function curvePath(b: number, r: number): string {
  let d = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES;
    d += `${i === 0 ? "M" : "L"} ${cx(s)} ${cy(pCandidate(s, b, r))}`;
  }
  return d;
}

/**
 * The deduplication threshold curve.
 *
 * Shows why the banding parameters are a product decision rather than a detail:
 * they set how similar two articles have to be before the system treats them as
 * the same story, and that choice lands directly on the graph.
 */
function DedupCurve() {
  return (
    <svg
      viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Probability that a pair of articles is retrieved as a near-duplicate candidate, against their true similarity, for three banding configurations."
    >
      {[0, 0.5, 1].map((p) => (
        <g key={p}>
          <line
            x1={C_PAD_L}
            x2={CURVE_W - C_PAD_R}
            y1={cy(p)}
            y2={cy(p)}
            stroke="#e4e4e7"
            strokeWidth={1}
          />
          <text
            x={C_PAD_L - 8}
            y={cy(p) + 4}
            textAnchor="end"
            fontSize={10.5}
            fill="#a1a1aa"
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {p.toFixed(1)}
          </text>
        </g>
      ))}

      {[0, 0.5, 1].map((s) => (
        <text
          key={`x${s}`}
          x={cx(s)}
          y={CURVE_H - C_PAD_B + 18}
          textAnchor="middle"
          fontSize={10.5}
          fill="#a1a1aa"
          fontFamily="var(--font-geist-mono, monospace)"
        >
          {s.toFixed(1)}
        </text>
      ))}

      {CONFIGS.map(({ b, r, shipped }) => (
        <g key={`${b}-${r}`}>
          <path
            d={curvePath(b, r)}
            fill="none"
            stroke={shipped ? SERIES : "#b8b8bf"}
            strokeWidth={shipped ? 2 : 1.5}
          />
          {/* Labelled at its own threshold rather than at the right edge. Every
              curve reaches probability one, so edge labels all land on the same
              line and print on top of each other; the thresholds are what
              separate these configurations, and they separate horizontally. The
              white halo keeps the text legible where it crosses a curve. */}
          <text
            x={cx(threshold(b, r))}
            y={cy(0.5) - 11}
            textAnchor="middle"
            fontSize={11}
            fill={shipped ? SERIES : "#71717a"}
            fontFamily="var(--font-geist-mono, monospace)"
            stroke="#ffffff"
            strokeWidth={3}
            paintOrder="stroke"
          >
            {b}×{r}
          </text>
          <text
            x={cx(threshold(b, r))}
            y={cy(0.5) + 15}
            textAnchor="middle"
            fontSize={10.5}
            fill={shipped ? SERIES : "#a1a1aa"}
            fontFamily="var(--font-geist-mono, monospace)"
            stroke="#ffffff"
            strokeWidth={3}
            paintOrder="stroke"
          >
            t≈{threshold(b, r).toFixed(2)}
          </text>
        </g>
      ))}

      <text
        x={cx(0.5)}
        y={CURVE_H - 6}
        textAnchor="middle"
        fontSize={11}
        fill="#71717a"
      >
        true similarity between two articles
      </text>
      {/* Left-aligned with the plot area: end-anchored at the tick column this
          title runs off the left edge of the viewBox and is clipped. */}
      <text
        x={C_PAD_L}
        y={C_PAD_T - 14}
        fontSize={10.5}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        P(treated as duplicate)
      </text>
    </svg>
  );
}

/**
 * The ingestion pipeline figure: the stages, and the dedup threshold curve.
 */
export default function StreamPipeline() {
  const shipped = CONFIGS.find((c) => c.shipped) as (typeof CONFIGS)[number];

  return (
    <figure className="m-0 flex flex-col gap-8">
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((s, i) => (
          <li
            key={s.name}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4"
          >
            <span className="font-mono text-[11px] uppercase tracking-wide text-zinc-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-base font-medium text-zinc-900">
              {s.name}
            </span>
            <span className="text-sm leading-relaxed text-zinc-600">
              {s.detail}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <h3 className="text-lg font-medium text-zinc-900">
            The one knob that changes the graph
          </h3>
          <p className="text-base leading-relaxed text-zinc-600">
            Wire copy is republished nearly verbatim across dozens of outlets. If
            those copies survive ingestion, every entity pair in a syndicated
            story gets counted dozens of times, and the loudest story in the feed
            is whichever one got syndicated hardest rather than whichever one
            matters.
          </p>
          <p className="text-base leading-relaxed text-zinc-600">
            MinHash with banded LSH fixes it without ever comparing two articles
            in full. The banding sets how similar two articles must be before the
            system calls them the same, and the curve is deliberately steep: pairs
            below the threshold are almost never considered, pairs above it almost
            always are. We shipped{" "}
            <span className="font-mono text-zinc-800">
              {shipped.b} bands of {shipped.r}
            </span>
            , a threshold near{" "}
            <span className="font-mono text-zinc-800">
              {threshold(shipped.b, shipped.r).toFixed(2)}
            </span>
            , which collapses syndicated reprints while leaving two outlets
            genuinely covering the same event as two articles.
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <DedupCurve />
        </div>
      </div>

      <figcaption className="max-w-3xl text-sm leading-relaxed text-zinc-500">
        The curves are the banding formula evaluated across the similarity range,
        so the thresholds shown are properties of each configuration rather than
        labels placed by hand.
      </figcaption>
    </figure>
  );
}
