/**
 * Setting the Launch Bar for AI: case study page (evals for Meta's ad-seller
 * agent workflows).
 *
 * Role in the system: the seventh built portfolio entry, and the first card on
 * the home page. Charlie was the data scientist on the four-person team set up
 * to align seven workflow teams' evals: criteria, eval types, tiered
 * thresholds, a three-stage launch gate, and a shared dashboard.
 *
 * Key design decisions:
 *   - **Accurate about the outcome.** The workflows were still working toward
 *     launch when Charlie left Meta, so the page reports alignment and the
 *     system the teams built to, never launch results or production numbers.
 *     The departure is stated plainly and never explained.
 *   - **Checked against current eval practice (2026-10-07).** Every practice
 *     claimed here is one Charlie confirmed: binary judges tuned on
 *     human-labeled golden sets with a train/test split (no judge scored on
 *     an example it was tuned on), golden sets run several times each,
 *     shadow traffic for volume, track-only criteria, criteria drawn from
 *     seller interviews and from reviewing outputs.
 *   - **Synthetic figures from `lib/launchBar`**, said so in a note near the
 *     top and in every caption, the same rule as the other entries.
 *   - **Written for an AI hiring manager**, more technical than the
 *     agent-ready entry but still organized around decisions rather than code.
 */

import Link from "next/link";
import EntrySummary from "@/components/EntrySummary";
import CopyEmailButton from "@/components/CopyEmailButton";
import CriteriaGrid from "@/components/CriteriaGrid";
import EvalTypes from "@/components/EvalTypes";
import FailureBudget from "@/components/FailureBudget";
import LaunchGates from "@/components/LaunchGates";
import EvalDashboard from "@/components/EvalDashboard";
import { CRITERIA_TOTAL, WORKFLOW_COUNT } from "@/lib/launchBar";

export const metadata = {
  title: "Setting the Launch Bar for AI",
  description:
    "Seven teams were building AI agent workflows for Meta's ad sellers. I led the alignment of their evals: criteria, code checks and LLM judges, tiered thresholds, a three-stage launch gate, and one dashboard.",
  openGraph: {
    title: "Setting the Launch Bar for AI | Charlie Tolleson",
    description:
      "How seven teams agreed on what good enough to launch means for an AI agent, and how they'd prove it.",
    type: "article",
    url: "https://charlietolleson.com/work/launch-bar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Setting the Launch Bar for AI | Charlie Tolleson",
    description:
      "Evals for seven AI agent workflows at Meta: one bar, three gates, one dashboard.",
  },
};

/** Fact rows shown under the title, so the scope is legible at a glance. */
const META: [string, string][] = [
  [
    "Role",
    "Data scientist on the program's alignment team: eval methodology, gating, and the dashboard",
  ],
  [
    "Teams",
    `${WORKFLOW_COUNT} workflow teams (a PM, data scientist, data engineer, and engineers each), plus our team of four; 30+ people`,
  ],
  ["Built for", "An AI agent for thousands of Meta's ad sellers"],
  ["Scope", `${WORKFLOW_COUNT} workflows, ${CRITERIA_TOTAL} eval criteria`],
  [
    "Outcome",
    "Every team building to the same gates, eval types, and dashboard",
  ],
  ["Status", "Pre-launch when I left Meta"],
];

const P = "text-xl leading-relaxed text-zinc-700";
const H2 = "text-3xl font-semibold tracking-tight text-zinc-900";
const LINK =
  "text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500";

export default function LaunchBarPage() {
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
            Setting the Launch Bar for AI @Meta
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            How seven teams agreed on what &ldquo;good enough to launch&rdquo;
            means for an AI agent, and how they&apos;d prove it.
          </p>

          <EntrySummary
            intro="Meta's ad sellers had an AI agent to help with their work, but nothing defined what it should do well, and nothing proved that it did. So the org defined seven workflows for it, gave each one a team, and required every workflow to pass its own evals before it could reach sellers. I was the data scientist on the small team set up over all seven, and my job was to make their evals add up to one standard: one way to define quality, one way to measure it, one bar to clear, and one place to see it all."
            pairs={[
              [
                "Seven teams were about to invent seven definitions of good enough, each with its own vocabulary and its own bar.",
                "One gating process, one set of eval types, and one dashboard, so a number meant the same thing on every team.",
              ],
              [
                "Close to 100 things could go wrong across the workflows, from the wrong name on an email to a product the recommendation model never picked.",
                "Every criterion its own pass-or-fail eval: a code check wherever a source of truth existed, a tuned LLM judge where one didn't.",
              ],
              [
                "A typo and a wrong dollar figure are not the same failure, but a single pass rate treats them as if they were.",
                "Thresholds tiered by stakes, set by asking every team the same question: how often is it OK for this to fail?",
              ],
              [
                "A hand-labeled set can't predict live traffic, and a workflow that launches clean can still drift.",
                "Three gates: a human-labeled golden set, two weeks of shadow traffic, then monitoring that can pull a workflow.",
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
              A note on the examples.
            </span>{" "}
            The workflows, evals, and dashboard are internal to Meta, so every
            example, number, and screen on this page is synthetic. The structure
            is the one the teams built to.
          </p>
        </div>

        {/* ---- Situation ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>An agent nobody could vouch for</h2>
          <p className={P}>
            Meta&apos;s ad sellers had an AI agent to help with their work, but
            it had no defined workflows and no evals to say whether it did any of
            them well. For a tool that drafts what an advertiser reads, that is a
            risk nobody can size.
          </p>
          <p className={P}>
            So the org defined {WORKFLOW_COUNT} workflows for the agent to own,
            three of which carry the examples on this page: drafting a follow-up
            email to an advertiser after a call, recommending which products
            to pitch, and building the client presentation itself. Each workflow
            got its own team, a PM, a data scientist, a data engineer, and at
            least one software engineer, to build both the workflow and the evals that
            would gate its launch. An eighth team of four, a PM, a data engineer,
            a software engineer, and me as its data scientist, sat over all seven to make
            sure those evals added up to something.
          </p>
          <p className={P}>
            The risk was easy to see. Left alone, seven teams build seven eval
            systems: different words for the same failure, different bars for the
            same risk, and no way to say whether one workflow was closer to
            launch than another.
          </p>
        </section>

        {/* ---- Criteria ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>What good looks like, workflow by workflow</h2>
            <p className={P}>
              I started with a working session with each team: what goes in,
              what comes out, and which parts of the output can&apos;t be wrong.
              The teams brought what they&apos;d learned from talking with
              sellers about what matters in their work, and reviewing the
              workflows&apos; early outputs surfaced failures nobody had thought
              to list.
            </p>
            <p className={P}>
              Some criteria were common to every workflow: grammar, tone, factual
              accuracy. The specific ones mattered most. A follow-up email has to
              be addressed to the person who was actually on the call, and every
              number it repeats has to match what was said. A presentation has to
              read as one argument, not a stack of slides. And the products the
              agent pitches have to be the ones the recommendation model put at
              the top, not ones the agent found plausible.
            </p>
          </div>

          <div className="max-w-4xl">
            <CriteriaGrid />
          </div>

          <p className={`max-w-3xl ${P}`}>
            Across the {WORKFLOW_COUNT} workflows, that came to{" "}
            {CRITERIA_TOTAL} criteria, and not all of them deserved to hold a
            launch back. Teams could mark a criterion track only: measured and
            charted on the dashboard, but never gated on. Generic measures like
            sentiment often landed there, where they could inform the work
            without blocking it.
          </p>
        </section>

        {/* ---- Eval types ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>
              Code where there&apos;s an answer, a judge where there isn&apos;t
            </h2>
            <p className={P}>
              Every criterion became its own eval with a pass or fail verdict, and
              the most consequential decision about each one was what kind of
              eval it should be.
            </p>
            <p className={P}>
              Where a source of truth exists, the check should be code. An
              advertiser&apos;s spend is in a database, so the figure in the email
              can be compared against it exactly. The recipient is in the meeting
              record. The recommendation model&apos;s output is logged, so a pitched
              product is either near the top of it or it isn&apos;t. Checks like
              these are cheap to run, never disagree with themselves, and fail
              with an exact reason.
            </p>
            <p className={P}>
              Where there&apos;s no single right answer, like whether a presentation flows
              or an email&apos;s tone fits the relationship, the check is an LLM
              judge. Each judge asks one narrow question and returns a binary
              verdict, and each was tuned against a human-labeled golden set
              until its verdicts matched people&apos;s, then scored on labels
              held out from tuning, so no judge was ever graded on an example
              it had been tuned on. Judges handle nuance code can&apos;t, but they take several rounds of prompt work to get right
              and have to be watched for drift, so they were the tool for what
              code couldn&apos;t do, not the default.
            </p>
          </div>

          <div className="max-w-5xl">
            <EvalTypes />
          </div>

          <div className="flex max-w-3xl flex-col gap-6">
            <p className={P}>
              The same question decides how the workflow itself should be built.
              If a value can be checked against a source of truth, the agent
              usually shouldn&apos;t be writing it at all. Let code insert the
              spend figure from the database, and a whole class of failures
              disappears, along with the eval that was watching for it. The
              model&apos;s job narrows to what only a model can do: the language
              around the facts, not the facts.
            </p>
            <p className={P}>
              It&apos;s the line I draw in{" "}
              <Link href="/work/metric-decomposition" className={LINK}>
                my metric forensics work
              </Link>{" "}
              too: the math is deterministic, and the agent is not.
            </p>
          </div>
        </section>

        {/* ---- Thresholds ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>How often is it OK for this to fail?</h2>
            <p className={P}>
              A single pass rate treats every failure the same, and they
              aren&apos;t. A clumsy sentence and a wrong dollar figure in front of
              an advertiser are different kinds of mistake, and a launch bar that
              can&apos;t tell them apart is either so strict no workflow can
              clear it or so loose nobody can trust it.
            </p>
            <p className={P}>
              So I gave every team a rubric to set a threshold for each gated
              criterion at each stage of the launch process. Instead of asking
              for a target pass rate, which invites round numbers, it asked one
              question per criterion: how often is it OK for this not to pass?
              Framed that way, every team was reasoning about the same thing, the
              cost of a failure reaching a seller, and a threshold on one team
              meant the same thing on any other.
            </p>
          </div>

          <div className="max-w-4xl">
            <FailureBudget />
          </div>

          <p className={`max-w-3xl ${P}`}>
            The thresholds went into the dashboard beside the live pass rates, so
            the distance between every criterion and its bar was always visible.
            That made prioritizing a matter of reading: the next piece of work
            was the gated criterion furthest below its line, and progress reports
            wrote themselves.
          </p>
        </section>

        {/* ---- Gates ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>Three gates to production</h2>
            <p className={P}>
              No test set predicts live traffic, so the bar had to be cleared on
              samples that got bigger and more realistic each time. Each
              workflow&apos;s golden set of human-labeled examples was run
              several times over, so the pass rate reflects how much the agent
              varies from run to run. Two weeks of shadow traffic then supply
              the volume a hand-labeled set can&apos;t, which is where a
              threshold set on curated examples meets the real distribution.
            </p>
          </div>

          <div className="max-w-5xl">
            <LaunchGates />
          </div>
        </section>

        {/* ---- Dashboard ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>One dashboard for seven teams</h2>
            <p className={P}>
              {CRITERIA_TOTAL[0].toUpperCase() + CRITERIA_TOTAL.slice(1)}{" "}
              criteria across seven teams is too much to hold in anyone&apos;s
              head, so I built a dashboard in JavaScript to hold it instead. It
              tracked how far along each team was in building its evals, charted
              every eval&apos;s pass rate over time against its threshold, and
              was built for diagnosing regressions: segment by workflow or by a
              single eval, then open the agent traces and telemetry behind a
              failing run to see exactly where it went wrong.
            </p>
          </div>

          <div className="max-w-6xl">
            <EvalDashboard />
          </div>

          <p className={`max-w-3xl ${P}`}>
            Because every team&apos;s evals shared the same verdicts, tiers, and
            thresholds, one dashboard could show all seven side by side, and
            &ldquo;how close is this workflow to launch?&rdquo; became a question
            anyone could answer without asking.
          </p>
        </section>

        {/* ---- Outcome ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>Where it stood</h2>
          <p className={P}>
            By the time I left Meta, all seven teams were building to the same
            gates, the same kinds of evals, and the same dashboard, and the
            workflows were still building toward launch. What the program had was
            the part that&apos;s hardest to retrofit: an agreed definition of good
            enough, a way to measure it that every team trusted, and a path to
            production that didn&apos;t depend on anyone&apos;s confidence.
          </p>
          <p className={P}>
            I&apos;m building the same discipline into{" "}
            <Link href="/work/building-in-stealth" className={LINK}>
              my own product
            </Link>{" "}
            from the first commit: every change to the agent is versioned, gated
            by evals, and released in stages. Evals cost the least when
            they&apos;re designed in from the start, rather than retrofitted onto
            a system people already depend on.
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">
            About the figures
          </h2>
          <p className="text-base leading-relaxed text-zinc-600">
            The workflows, criteria, and dashboard are internal to Meta, so every
            figure here was built for this page. The criteria are representative
            of the kinds the teams wrote, the thresholds are illustrative, and the
            dashboard is an illustrative example running on synthetic pass rates, with a
            fictional advertiser in the failing run.
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
              className={LINK}
            >
              LinkedIn
            </a>
            <Link href="/" className={LINK}>
              More work
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
