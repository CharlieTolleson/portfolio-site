/**
 * Agentic Causal Inference: case study page.
 *
 * Role in the system: the second built portfolio entry. The underlying work was
 * done inside Meta and is proprietary, so this page can carry no real data,
 * metric name, or result. It solves that by demonstrating the method instead of
 * describing it: every figure runs the actual estimation pipeline over a
 * simulated population defined in `lib/causalDemo.ts`.
 *
 * Key design decisions:
 *   - Simulation is treated as a feature, not an apology. Because the true
 *     effect is known, the page can put the naive estimate, the adjusted
 *     estimate, and the truth on one axis, which no real dataset allows.
 *   - Every number in the prose is imported from the same module the figures
 *     read, so the text cannot drift from the charts if the simulation changes.
 *   - The confidentiality boundary is stated once, near the top, in a form a
 *     recruiter or a hiring manager can check at a glance.
 */

import Link from "next/link";
import CausalTree from "@/components/CausalTree";
import EffectSpread from "@/components/EffectSpread";
import BalanceCheck from "@/components/BalanceCheck";
import {
  NAIVE_DIFF,
  ADJUSTED_ATE,
  TRUE_ATE,
  EFFECT_RANGE,
  BIAS_REMOVED,
  N_UNITS,
  LEAVES,
} from "@/lib/causalDemo";

export const metadata = {
  title: "Agentic Causal Inference",
  description:
    "Meta Sales changed its north star metric without knowing how to move it. Live experiments cost a quarter each, so I built a causal forest framework, wrapped it in an agent, and turned a week of analysis into minutes.",
  openGraph: {
    title: "Agentic Causal Inference | Charlie Tolleson",
    description:
      "Causal forests over observational data, wrapped in an agent. Turning a week of analysis per hypothesis into minutes of prompting.",
    type: "article",
    url: "https://charlietolleson.com/work/causal-inference",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic Causal Inference | Charlie Tolleson",
    description:
      "Which levers move the metric, and for whom. Causal forests, wrapped in an agent.",
  },
};

/** Fact rows shown under the title, so the technical read is instant. */
const META: [string, string][] = [
  ["Role", "Senior data scientist: framing, method, framework, recommendations"],
  ["Context", "Meta Sales analytics, generalized here"],
  ["Approach", "Causal forests over observational data, wrapped in an agent"],
  ["Status", "In use by my team; expanding into a multi-method agent"],
];

/**
 * Methods the planned multi-method agent chooses between, with the data
 * signature that makes each one the right call.
 */
const METHODS: [string, string][] = [
  [
    "Causal forest",
    "Many units, rich covariates, and a real chance the effect differs across them.",
  ],
  [
    "Difference in differences",
    "A staged rollout, where some groups get the change before others and you have history on both.",
  ],
  [
    "Synthetic control",
    "One market or segment switched, and the comparison has to be built from a weighted blend of the ones that did not.",
  ],
  [
    "Regression discontinuity",
    "Eligibility turns on at a threshold, so units either side of the cutoff are otherwise alike.",
  ],
  [
    "Instrumental variables",
    "Something shifts treatment without touching the outcome directly, which buys identification selection alone cannot.",
  ],
];

export default function CausalInferencePage() {
  const [lo, hi] = EFFECT_RANGE;
  const negativeShare = LEAVES[0].share;

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
            Agentic Causal Inference
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            Sales had a new north star metric and no idea what moved it. The
            rigorous answer cost a quarter per question. I built the fast one,
            then handed it to an agent.
          </p>

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
              A note on what is and is not here.
            </span>{" "}
            This work was done inside Meta. No proprietary data, metric name, or
            result appears on this page. Every figure below runs the real
            estimation pipeline over a simulated population of{" "}
            {N_UNITS.toLocaleString()} accounts written for this page, where the
            true effect is known. The method is exactly what I used. The numbers
            are not Meta&apos;s.
          </p>
        </div>

        {/* ---- Problem ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            A goal with no map
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            When I joined, Meta Sales had just moved to a new north star metric.
            The metric was chosen, the goals against it were set, and the
            organization&apos;s funding case rested on hitting them. What nobody
            had done was establish how the metric responded to anything sales
            actually did. No experiments, no causal work, no sensitivity
            analysis behind it.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            That is a worse position than it sounds. Leadership could see the
            number move and could not attribute the movement to any decision
            they had made. Every planning conversation came down to conviction
            about which plays mattered, and every quarter&apos;s result came down
            to whether that conviction happened to be right. An organization can
            be perfectly disciplined about a number it has no way to influence
            and still miss it.
          </p>
        </section>

        {/* ---- Constraint ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The rigorous answer takes a quarter
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            The question landed on my team: which levers can sales pull to move
            this metric, and by how much?
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The textbook answer is live experimentation, and it is the right
            answer. It is also the slow one. A sales experiment needs a full
            quarter to read out, and a quarter buys you one hypothesis. A
            business at Meta&apos;s scale is not going to hold still for three
            months per question, and we had dozens of questions.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            So the requirement was never just &quot;measure this.&quot; It was:
            measure it with data we already have, repeatably, on a timeline where
            the answer still changes a decision.
          </p>
        </section>

        {/* ---- Reconstructing the experiment ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Rebuilding an experiment out of history
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              Causal inference is the family of methods for exactly that
              constraint. The techniques vary, but they are all variations on one
              idea: take data where the treatment was never randomly assigned,
              and reconstruct the comparison a randomized experiment would have
              handed you.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The obstacle is always selection. The accounts that got a given
              play were not a random sample. They were the ones a rep chose to
              spend time on, which means they skewed larger, healthier, and
              further along to begin with. Compare them to everyone else and you
              measure the head start, not the play.
            </p>
            <p className="text-lg leading-relaxed text-zinc-600">
              The fix is mechanical: model each unit&apos;s probability of having
              been treated from its covariates, weight the two groups so they
              look alike on everything you can observe, and then check that they
              actually do. The check is the part that matters. An effect estimate
              is worth precisely as much as the balance diagnostics behind it,
              which is why they belong in the figure rather than an appendix.
            </p>
          </div>

          <BalanceCheck />

          <div className="flex max-w-3xl flex-col gap-6">
            <p className="text-lg leading-relaxed text-zinc-600">
              On this simulated population the raw comparison reports{" "}
              <span className="font-mono text-zinc-800">
                +{NAIVE_DIFF.toFixed(2)}
              </span>{" "}
              when the truth is{" "}
              <span className="font-mono text-zinc-800">
                +{TRUE_ATE.toFixed(2)}
              </span>
              . Nearly two thirds of that headline is the head start. Weighting
              recovers {(BIAS_REMOVED * 100).toFixed(0)}% of the error and lands
              at{" "}
              <span className="font-mono text-zinc-800">
                +{ADJUSTED_ATE.toFixed(2)}
              </span>
              , which is close, and not exact: the residual bias is larger than
              the confidence interval around it. That gap is honest and worth
              stating, because it is the reason a live experiment stays the
              tiebreaker rather than a formality.
            </p>
          </div>
        </section>

        {/* ---- Heterogeneity ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              One average effect is a bad instruction
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              The simplest causal methods return a single number for the whole
              population: this play lifts the metric by so much. That is a fine
              sentence and a poor instruction. Meta&apos;s advertiser base is not
              one population. It spans regions, sizes, verticals, and wildly
              different levels of product maturity, and a play that lands in one
              segment can do nothing in the next and cost you in a third.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              Average those together and you get a recommendation that is
              technically correct and operationally useless. What a sales team
              can act on is not one effect. It is which accounts to run the play
              on.
            </p>
          </div>

          <EffectSpread />

          <p className="max-w-3xl text-lg leading-relaxed text-zinc-600">
            The average here is{" "}
            <span className="font-mono text-zinc-800">
              +{ADJUSTED_ATE.toFixed(2)}
            </span>
            . The subgroups underneath it run from{" "}
            <span className="font-mono text-zinc-800">{lo.toFixed(2)}</span> to{" "}
            <span className="font-mono text-zinc-800">+{hi.toFixed(2)}</span>.
            Acting on the average means running the play across{" "}
            {(negativeShare * 100).toFixed(0)}% of accounts where it measurably
            costs you, and under-investing in the segment where it is worth more
            than twice what the headline promised.
          </p>
        </section>

        {/* ---- Causal forests ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Causal forests: the tree trick, pointed at effects
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              A causal forest is a random forest aimed one step sideways. An
              ordinary tree splits the data to separate units with different{" "}
              <em>outcomes</em>. A causal tree splits it to separate units with
              different <em>responses to treatment</em>. What comes out is not a
              prediction of the metric. It is a map of where the lever works.
            </p>
            <p className="text-lg leading-relaxed text-zinc-600">
              Two properties made it the right choice for this problem:
            </p>
            <ul className="flex flex-col gap-4 text-lg leading-relaxed text-zinc-600">
              <li className="border-l-2 border-zinc-200 pl-5">
                <span className="font-medium text-zinc-800">Honesty.</span> One
                half of the sample chooses the splits; the other half estimates
                the effect inside each leaf. Skip that and a tree will hunt down
                the subgroup where noise happened to look like a large effect,
                then report the same noise back as a finding. Honest estimation
                is what makes the intervals mean anything, and it is the
                difference between a subgroup analysis and a fishing expedition.
              </li>
              <li className="border-l-2 border-zinc-200 pl-5">
                <span className="font-medium text-zinc-800">
                  It is an ensemble.
                </span>{" "}
                A single tree is fragile: resample the data and the cut points
                move. Averaging over many trees means what survives is structure
                rather than one lucky partition, and the parts that do not
                survive show up as wider intervals instead of quiet errors.
              </li>
            </ul>
          </div>

          <CausalTree variant="full" />

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
              <CausalTree variant="card" />
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-zinc-500">
              The same fit on three bootstrap resamples. Every one of them splits
              on product adoption first and isolates the same underperforming
              region, and every one of them puts the cut point somewhere
              different. That is the argument for the forest in one image: trust
              the structure that repeats, not the thresholds of any single tree.
            </p>
          </div>
        </section>

        {/* ---- What I built ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The framework, and then the agent
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            The estimator itself is published research. The work is everything
            around it, and that is where the week actually went: preparing and
            validating the data, fitting the nuisance models, tuning the forest,
            running the diagnostics, and turning the output into something a
            non-specialist could act on. I built a Python framework in fbsource
            that handles all of it end to end.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            Then I wrapped the framework in a Claude Code skill. An analyst
            states a hypothesis in plain language, and the skill runs the full
            analysis and returns an executive brief: what the effect is, where it
            concentrates, how confident we are, and what the diagnostics say
            about whether to believe any of it.
          </p>
          <p className="text-lg leading-relaxed text-zinc-600">
            The trade-off is the obvious one. Making a causal estimate cheap to
            produce also makes a bad causal estimate cheap to produce, and a weak
            analysis dressed in a subgroup table is very persuasive to a room
            that wants good news. So the diagnostics travel with the answer
            rather than sitting behind it: balance, overlap, leaf sizes, interval
            widths. A brief should let a reader see the estimate and the reasons
            to doubt it at the same time.
          </p>
        </section>

        {/* ---- Result ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            What changed
          </h2>
          <p className="text-xl leading-relaxed text-zinc-700">
            A hypothesis that took upwards of a week of setup, fitting, and
            writing became a few minutes of prompting and reviewing. That turned
            testing into something the team did in parallel rather than in
            sequence: we worked through dozens of hypotheses, and I took the
            strongest findings to sales leadership as strategic recommendations
            with the evidence attached.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            The honest framing of the result is not that this replaced
            experimentation. Live experiments still validate, and they should.
            What changed is which experiments get run. Instead of spending a
            quarter to discover a hypothesis was never promising, we spend an
            afternoon ranking the whole set and spend the quarter on the one
            worth it. Causal inference did not replace the experiment. It made
            the experiment queue an informed decision, and that is a capability
            any business can use.
          </p>
        </section>

        {/* ---- Next ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              What&apos;s next: Causal Forge
            </h2>
            <p className="text-xl leading-relaxed text-zinc-700">
              Causal forests were right for this problem. They are not right for
              every problem. The shape of the data and the shape of the question
              decide the method, and choosing it is where the judgment lives. My
              framework still assumes that choice has already been made.
            </p>
            <p className="text-xl leading-relaxed text-zinc-700">
              The next version, which I have aligned on with the broader org, is
              what we are calling Causal Forge: a specialist agent that reads the
              data and the question, picks the technique, defends the choice,
              runs it, and reports its own diagnostics.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METHODS.map(([name, when]) => (
              <li
                key={name}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5"
              >
                <span className="font-mono text-sm text-zinc-800">{name}</span>
                <span className="text-sm leading-relaxed text-zinc-500">
                  {when}
                </span>
              </li>
            ))}
          </ul>

          <p className="max-w-3xl text-lg leading-relaxed text-zinc-600">
            It is the same problem as the one in my{" "}
            <Link
              href="/work/ai-orchestration"
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              orchestration work
            </Link>
            , one level up. There, the mistake is picking one model and forcing
            every step of a task through it. Here, it is picking one estimator
            and forcing every question through it. Both are solved the same way:
            choose per problem, and make the choice inspectable afterwards.
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">
            About the figures
          </h2>
          <p className="text-base leading-relaxed text-zinc-600">
            The tree, the subgroup effects, and the balance diagnostics on this
            page are not illustrations. They are the output of a working
            pipeline, run in the browser over a simulated population: a logistic
            propensity model, inverse probability weights, an outcome model for
            local centering, and an honest causal tree fit on split samples.
            Because the population is simulated, the true effect is known, which
            is the only reason a page like this can show you an estimate and its
            error at the same time.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-200 pt-6 text-base">
            <span className="text-zinc-600">
              Happy to talk about any of this.
            </span>
            <a
              href="mailto:charlietolleson@gmail.com"
              className="font-mono text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              charlietolleson@gmail.com
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
