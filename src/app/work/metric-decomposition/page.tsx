/**
 * Metric Forensics: case study page (metric decomposition at Amazon and Meta).
 *
 * Role in the system: the third built portfolio entry, covering the measurement
 * work done at Amazon (Contribution to Change over a retail rate metric) and
 * then at Meta (extending it with LMDI to cover absolute funnel metrics, and
 * wrapping both in an agent).
 *
 * Key design decisions:
 *   - **Written for an executive, not for a methods reviewer.** The audience
 *     that decides whether this capability is worth funding does not want an
 *     index-number literature review; it wants to know what the answer looks
 *     like and how fast it arrives. The formulas are named and their behavior is
 *     shown, but no derivation appears on the page.
 *   - **Both frameworks are implemented, not illustrated.** The underlying work
 *     is proprietary, so `lib/decompDemo.ts` runs the real math over synthetic
 *     datasets and every figure and number on this page reads out of it.
 *   - **The residual is a headline, not a footnote.** "The parts sum exactly to
 *     the whole" is the property that separates this from a dashboard scan, so
 *     the page states it and the figures print the proof.
 */

import Link from "next/link";
import EntrySummary from "@/components/EntrySummary";
import CopyEmailButton from "@/components/CopyEmailButton";
import DecompWaterfall from "@/components/DecompWaterfall";
import MixVsRate from "@/components/MixVsRate";
import FunnelLMDI from "@/components/FunnelLMDI";
import {
  HEADLINE_BPS,
  RATE_PRE,
  RATE_CUR,
  TOTAL_VIEWS_PRE,
  LATAM_ROW,
  NA_ROW,
  WORST_LEAF,
  WORST_LEAF_SHARE,
  PARADOX_RATE_BPS,
  PARADOX_MIX_BPS,
  PARADOX_TOTAL_BPS,
  FUNNEL,
  BEST_FACTOR,
  WORST_FACTOR,
  WORST_FACTOR_CONCENTRATION,
  bps,
  signedBps,
  signedMillions,
} from "@/lib/decompDemo";

export const metadata = {
  title: "Metric Forensics",
  description:
    "Why did the number move? At Amazon and Meta I replaced the open-ended data dive with two decomposition frameworks that answer it exactly, then wrapped them in an agent so anyone could ask.",
  openGraph: {
    title: "Metric Forensics | Charlie Tolleson",
    description:
      "Metric decomposition at Amazon and Meta. Contribution to Change and LMDI: turning the most expensive question in analytics into arithmetic that adds up.",
    type: "article",
    url: "https://charlietolleson.com/work/metric-decomposition",
  },
  twitter: {
    card: "summary_large_image",
    title: "Metric Forensics | Charlie Tolleson",
    description:
      "Why did the number move? Metric decomposition that gives an exact answer, in minutes, for anyone who asks.",
  },
};

/** Fact rows shown under the title, so the scope is legible at a glance. */
const META: [string, string][] = [
  ["Role", "Data science lead: framework, tooling, and the executive read"],
  [
    "Ownership",
    "Worldwide single-threaded owner and coordinator for this work at Amazon",
  ],
  ["Context", "Amazon retail pricing, then Meta ads sales. Generalized here"],
  [
    "Approach",
    "Contribution to Change for rate metrics, LMDI for absolute funnel metrics",
  ],
  ["Delivery", "Python modules behind Claude Code skills, self-serve to the org"],
  ["Outcome", "Met Price Competitiveness goals at Amazon"],
];

/**
 * The two frameworks side by side, so a reader can tell at a glance which one
 * applies to a metric they own.
 */
const FRAMEWORKS: [string, string, string][] = [
  [
    "Contribution to Change",
    "Ratio metrics",
    "Anything shaped like a percentage: conversion, competitiveness, attach rate, on-time delivery. Splits a move into what each subgroup's rate did and what the shifting mix of subgroups did.",
  ],
  [
    "Logarithmic Mean Divisia Index",
    "Absolute metrics",
    "Anything that is a chain of factors multiplied together: revenue, bookings, total spend, hours delivered. Splits a move into one exact contribution per factor in the chain.",
  ],
];

export default function MetricDecompositionPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-32 sm:px-10 lg:px-20">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="w-fit font-mono text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Work
          </Link>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Metric Forensics @Amazon &amp; @Meta
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            &quot;Why did the number move?&quot; might be the most expensive
            question in analytics.
          </p>

          <EntrySummary
            intro="Most organizations answer it by searching: someone opens a notebook and hunts through tables until they find an anomaly large enough to blame. As the worldwide owner of this problem at Amazon, and later rebuilding it for Meta's ads funnel, I replaced that dive with two decomposition frameworks that account for a metric move exactly, then wrapped them in agents so anyone could run the analysis without waiting on my team."
            pairs={[
              [
                "A metric moves and the best answer available is a plausible culprit, with no way to know whether it explains most of the change or a tenth of it.",
                "Contribution to Change, which splits the move into per-subgroup pieces that sum to the total exactly, with no residual.",
              ],
              [
                "The real cause usually hides several dimensions deep, where a top-down dashboard scan dilutes it into ordinary noise.",
                "Layered drilling, from region down to the single cell responsible, reconciling at every level of the descent.",
              ],
              [
                "Half the movement comes from shifts in mix that no amount of staring at subgroup rates will ever reveal.",
                "A mix effect reported beside the rate effect, so a subgroup that grew while performing below average becomes visible.",
              ],
              [
                "Revenue is not a rate, so the framework explained part of a miss and left the rest unattributed.",
                "LMDI for absolute funnel metrics, which decomposes a chain of multiplied factors and still leaves nothing over.",
              ],
            ]}
          />

          <dl className="mt-2 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-3 border-t border-zinc-200 pt-6 sm:grid-cols-2">
            {META.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                  {k}
                </dt>
                <dd className="m-0 text-base text-zinc-700">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-3xl border-l-2 border-amber-500 pl-5 text-base leading-relaxed text-zinc-600">
            <span className="font-medium text-zinc-800">
              A note on the numbers.
            </span>{" "}
            This work was done inside Amazon and Meta, so no real data, target,
            or result appears here. Every figure below runs the actual
            decomposition formulas over datasets written for this page. The
            methods are exactly the ones I used and the arithmetic is live. The
            businesses in the charts are not.
          </p>
        </div>

        {/* ---- Problem ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The question that costs the most to answer
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            Measurement is the instrument panel of a large business. Amazon runs
            on how competitively it prices; Meta runs on how efficiently its ads
            business converts demand into revenue. In both places, the number on
            the dashboard is not decoration. Funding, headcount, and the shape of
            next year&apos;s plan follow it.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            So when a metric moves, one question follows immediately, and it is
            always the same question: why. It sounds like a small ask. In a
            business with millions of transactions across dozens of regions,
            hundreds of categories, and several channels, the number of places
            the answer could be hiding runs into the thousands.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The cost of not answering it well is not the analyst&apos;s time. It
            is that leadership either acts on a guess or waits, and both of those
            are decisions with a price tag.
          </p>
        </section>

        {/* ---- Anti-pattern ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The default answer is a search party
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            The response I have seen most often from data science teams is to go
            looking. Someone opens a notebook and starts slicing tables, hunting
            for an anomaly large enough to be plausibly blamed. Sometimes it
            works. More often it becomes an open-ended dive with no definition of
            done, because nothing in the process says when you have found enough.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The deeper problem is that the output of a search is a story. A story
            names a plausible culprit and stops. It cannot tell you whether that
            culprit accounts for most of the movement or a tenth of it, and it
            cannot tell you what accounts for the rest. Presented to an
            executive, a story invites the only reasonable follow-up question:
            how do you know that is the whole picture? There is usually no good
            answer.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            What a decision-maker needs is not a suspect. It is a ledger: every
            part of the business, the exact amount each one moved the number, and
            a total that reconciles.
          </p>
        </section>

        {/* ---- CtC ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Make the arithmetic do the searching
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              At Amazon I owned this work worldwide, using a framework we
              called Contribution to Change. The idea behind it is almost
              embarrassingly simple, which is exactly why it holds up in a room
              full of executives: a percentage metric is just the weighted
              average of its parts, so a movement in the whole can only come
              from two places. Either the parts changed, or the mix of them did.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Split every subgroup&apos;s movement into those two pieces and
              something useful happens. The pieces add up. Not approximately: the
              contributions across every region, category, and channel sum to the
              company-wide number exactly, with nothing left over. That turns
              root cause analysis from a search problem into a sorting problem.
              You are no longer looking for the cause. You have all of them, and
              you are ranking them.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Below is a working example on a synthetic retail dataset:{" "}
              {(TOTAL_VIEWS_PRE / 1_000_000).toFixed(1)} million product page
              views, and a price competitiveness rate that fell from{" "}
              <span className="font-mono text-zinc-800">
                {(RATE_PRE * 100).toFixed(2)}%
              </span>{" "}
              to{" "}
              <span className="font-mono text-zinc-800">
                {(RATE_CUR * 100).toFixed(2)}%
              </span>
              , a drop of{" "}
              <span className="font-mono text-zinc-800">
                {Math.abs(HEADLINE_BPS).toFixed(0)} basis points
              </span>
              . Click any bar to go a level deeper.
            </p>
          </div>

          <DecompWaterfall variant="full" />

          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-xl leading-relaxed text-zinc-700">
              Two clicks is the whole investigation. LATAM alone accounts for{" "}
              <span className="font-mono text-zinc-800">
                {Math.abs(bps(LATAM_ROW.total)).toFixed(0)} basis points
              </span>{" "}
              of decline, which is more than the company-wide number, because
              the other regions partly offset it. Inside LATAM it is electronics.
              Inside electronics it is the marketplace channel, where
              third-party sellers set their own prices. That one cell holds{" "}
              <span className="font-mono text-zinc-800">
                {(WORST_LEAF.shareCur * 100).toFixed(1)}%
              </span>{" "}
              of all traffic and accounts for{" "}
              <span className="font-mono text-zinc-800">
                {(WORST_LEAF_SHARE * 100).toFixed(0)}%
              </span>{" "}
              of the company-wide decline on its own.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              That is a finding an executive can act on the same afternoon,
              because it names a region, a category, and a channel. It is also a
              finding that a top-down dashboard scan will never produce, because
              at every level above it the signal is diluted into something that
              looks like ordinary noise.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The layering is the part that scales. Because the formula is a
              single expression rather than a report, dimensions stack freely:
              region by category by channel by seller tier by whatever else the
              data holds. The arithmetic does not care how deep you go, and it
              still reconciles at every level.
            </p>
          </div>
        </section>

        {/* ---- Mix effect ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              The half of the answer nobody goes looking for
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              Splitting the movement in two is not a bookkeeping nicety. The
              second half, the mix, is the half that gets missed, and it is
              routinely the half that matters.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              A subgroup can drag the company number down without anything about
              it getting worse. It only has to grow while performing below
              average. That is not a hypothetical: in the retail example above,
              North America improved its own rate and still gave back{" "}
              <span className="font-mono text-zinc-800">
                {Math.abs(bps(NA_ROW.mixEffect)).toFixed(1)}
              </span>{" "}
              basis points, purely because it is the strongest region and its
              share of the mix shrank. LATAM did the reverse and was
              punished twice: its own rate falling cost{" "}
              <span className="font-mono text-zinc-800">
                {Math.abs(bps(LATAM_ROW.rateEffect)).toFixed(0)}
              </span>{" "}
              basis points, and its growth into a below-average position cost
              another{" "}
              <span className="font-mono text-zinc-800">
                {Math.abs(bps(LATAM_ROW.mixEffect)).toFixed(0)}
              </span>
              .
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Taken far enough, this produces a result that looks impossible.
              Here is a business where every single customer tier improved and
              the overall number fell hard.
            </p>
          </div>

          <MixVsRate />

          <p className="max-w-3xl text-xl leading-relaxed text-zinc-700">
            Performance was worth{" "}
            <span className="font-mono text-zinc-800">
              {signedBps(PARADOX_RATE_BPS, 0)}
            </span>{" "}
            basis points. The shift in mix cost{" "}
            <span className="font-mono text-zinc-800">
              {Math.abs(PARADOX_MIX_BPS).toFixed(0)}
            </span>
            , leaving a net of{" "}
            <span className="font-mono text-zinc-800">
              {signedBps(PARADOX_TOTAL_BPS, 0)}
            </span>
            . An analyst who reports that every tier improved is not wrong. They
            have simply answered a different question than the one that was
            asked, and the business would go into the next quarter believing it
            had a growth problem when what it had was a targeting problem. Those
            two diagnoses lead to opposite decisions.
          </p>
        </section>

        {/* ---- LMDI ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              At Meta, the metric stopped being a rate
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              When I moved to Meta, the framework hit its limit on the first
              question I pointed it at. Ads sales does not run on a percentage.
              It runs on revenue, and revenue is not an average of anything. It
              is a chain of factors multiplied together: how many accounts we
              work, how many opportunities each one yields, how often we win
              them, and what a win is worth.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Contribution to Change could explain the rate links in that chain
              and nothing else, which meant it could explain part of a revenue
              miss and leave the rest unattributed. That is worse than useless in
              a review, because a decomposition that does not reconcile invites
              exactly the doubt it was meant to remove.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The method that closes the gap is the Logarithmic Mean Divisia
              Index. It was developed for energy and emissions accounting, where
              analysts needed to say how much of a change in national emissions
              came from output growth versus efficiency versus fuel mix, and have
              the pieces sum to the actual change. That is the same problem shape
              as a sales funnel. LMDI weights each factor by the logarithmic mean
              of the segment&apos;s revenue in the two periods, and that specific
              choice of weight is what makes it come out exact. Older index
              methods leave a residual that grows with the size of the move,
              which is to say they fail hardest precisely when the question is
              most urgent.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              What a leader gets out of it is a sentence with no hedging in it:
              this much of the revenue change came from the size of the book,
              this much from win rate, this much from deal size.
            </p>
          </div>

          <FunnelLMDI />

          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-xl leading-relaxed text-zinc-700">
              The example above is a quarter that grew{" "}
              <span className="font-mono text-zinc-800">
                {signedMillions(FUNNEL.delta)}
              </span>{" "}
              and should not be celebrated.{" "}
              {BEST_FACTOR.label} contributed{" "}
              <span className="font-mono text-zinc-800">
                {signedMillions(BEST_FACTOR.value)}
              </span>{" "}
              while {WORST_FACTOR.label.toLowerCase()} gave back{" "}
              <span className="font-mono text-zinc-800">
                ${Math.abs(WORST_FACTOR.value / 1_000_000).toFixed(1)}M
              </span>
              . The book grew because more accounts were worked, not because the
              business got better at converting them, and{" "}
              {(WORST_FACTOR_CONCENTRATION.share * 100).toFixed(0)}% of the
              conversion damage sits in {WORST_FACTOR_CONCENTRATION.name}, the
              segment that expanded the most.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              A revenue number alone says the quarter was fine. The
              decomposition says the growth was bought rather than earned, names
              the segment, and quantifies it. Those are different briefings and
              they lead to different plans.
            </p>
          </div>
        </section>

        {/* ---- The frameworks together ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Two frameworks, one question, one agent
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              I built Python modules around both methods, then wrapped them in
              Claude Code skills. That second step is what turned a technique
              into a capability, and it is the part I would repeat anywhere.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {FRAMEWORKS.map(([name, kind, when]) => (
              <li
                key={name}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-6"
              >
                <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                  {kind}
                </span>
                <span className="text-lg font-medium text-zinc-900">{name}</span>
                <span className="text-base leading-relaxed text-zinc-600">
                  {when}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-xl leading-relaxed text-zinc-700">
              The skill runs the two in sequence, because that is the order the
              question decomposes in. LMDI first, to establish which link in the
              funnel moved the money. Contribution to Change second, aimed at
              that link, to find the specific corner of the business responsible.
              The output is a root cause analysis with the waterfall charts and
              the reconciliation tables already in it, written for someone who
              will read it once before a meeting.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The design decision underneath it is that the analysis is
              deterministic and the agent is not. The math is not something a
              language model is asked to perform or approximate; it runs in tested
              Python that either reconciles or raises. What the agent contributes
              is the part it is genuinely good at: understanding a question posed
              in a business&apos;s own vocabulary, picking the right
              decomposition and the right dimensions, and turning a table of
              contributions into the four sentences a leader actually needs.
            </p>
          </div>
        </section>

        {/* ---- Result ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            What changed
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            At Amazon the effect was operational. Pricing problems were caught,
            attributed, and remediated before customers noticed they were not
            getting the best price. When goals were missed, the CEO and the board
            did not receive a narrative. They received a list: each challenge
            that came up, exactly what it cost in basis points, and what was done
            about it. A reconciling number ends an argument that a story only
            starts.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            At Meta the effect was structural. Recurring reporting became
            automatic, with the visualizations a leader needed already built into
            the brief. More importantly, the analysis stopped being gated on my
            team. Anyone with an agent could ask what happened to their line of
            business and get a clear, objective, reconciled answer without
            filing a request or waiting for a queue.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            That is the outcome I care about most. The routine question was the
            one consuming the most analyst capacity and generating the least
            insight, and it was the one most amenable to being solved once.
            Handing it back to the people who own the metrics returned data
            science time to problems that actually needed a data scientist.
          </p>
        </section>

        {/* ---- Bridge to causal inference ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Where decomposition stops
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            Decomposition is accounting, and it is worth being precise about what
            that means. It tells you exactly where a change came from. It does
            not tell you what would have happened otherwise, and it cannot tell
            you whether a proposed fix will work. Marketplace electronics in
            LATAM is where the points went; whether repricing that catalog would
            bring them back is a different question and needs a different method.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            That is the seam between this work and my{" "}
            <Link
              href="/work/causal-inference"
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              causal inference work
            </Link>
            . Decomposition tells you what happened, with no assumptions and no
            residual. Causal inference tells you what to do about it, with
            assumptions that have to be stated and checked. A measurement
            organization needs both, and it needs to know which one it is holding
            at any given moment. Most of the bad decisions I have watched get
            made came from mistaking one for the other.
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">
            About the figures
          </h2>
          <p className="text-base leading-relaxed text-zinc-600">
            Nothing on this page is a mockup. Both decompositions are implemented
            in the browser and run over synthetic datasets: the waterfall
            re-solves the Contribution to Change formula every time you drill,
            and the funnel chart is a live LMDI fit over four segments and four
            factors. The residuals printed under each chart are computed, not
            typed, which is the only honest way to make the claim these methods
            rest on.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-200 pt-6 text-base">
            <span className="text-zinc-600">
              Happy to talk about any of this.
            </span>
            <CopyEmailButton />
            <a
              href="https://www.linkedin.com/in/charlietolleson"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              LinkedIn
            </a>
            <Link
              href="/"
              className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              More work
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
