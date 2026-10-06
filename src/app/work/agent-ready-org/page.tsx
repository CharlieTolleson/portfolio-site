/**
 * Making an Org Agent-Ready: case study page (context standards at Meta).
 *
 * Role in the system: the fifth built portfolio entry, covering the paper
 * Charlie wrote and presented to Meta's data science org proposing standards
 * and a governance framework for agent context, metric definitions, and
 * Skills, and what the org built from it.
 *
 * Key design decisions:
 *   - **Written for a director or VP, higher-level than the other entries.**
 *     The takeaway a leader should leave with is "he could lead our AI
 *     transformation", so the page argues stakes, framework, and outcomes, and
 *     stays out of implementation detail (no YAML, no SQL, no eval mechanics).
 *   - **Outcomes are the ones Charlie confirmed, stated without inflation:** the
 *     paper was presented to a 50+ person org and led to a metric spec
 *     repository with specs for 25+ metrics and data fields, 30+ Skills built
 *     to its guidelines, a Skill discovery dashboard, and agent-led
 *     documentation cleanup in several repositories. None of it was mandated;
 *     teams adopted it on their own, which is the point for a leader reading.
 *   - **The Skills count is the org's, not Charlie's.** The page never singles
 *     out which Skills he built himself (Charlie, 2026-10-06): the stronger
 *     claim is that he created the scope others built into.
 *   - **The closing looks forward ("my next team")** rather than back at Meta,
 *     so the page ends on what a reader would be hiring.
 *   - **Synthetic examples, same rule as the other entries.** The paper is
 *     internal, so every figure reads from `lib/agentReadyOrg`, and the
 *     revenue numbers quoted in the prose are imported from it, not typed.
 */

import Link from "next/link";
import EntrySummary from "@/components/EntrySummary";
import CopyEmailButton from "@/components/CopyEmailButton";
import AnswerSpread from "@/components/AnswerSpread";
import ContextLevels from "@/components/ContextLevels";
import GovernanceTiers from "@/components/GovernanceTiers";
import { SPREAD, MAX_OVERSTATEMENT_PCT, money } from "@/lib/agentReadyOrg";

export const metadata = {
  title: "Making an Org Agent-Ready",
  description:
    "Agents trust everything they read. At Meta I wrote the standards and governance framework that made our data science org's context worth trusting, and the org built on it.",
  openGraph: {
    title: "Making an Org Agent-Ready | Charlie Tolleson",
    description:
      "The standards and governance an organization needs before it can trust its agents with decisions, from a framework I proposed at Meta.",
    type: "article",
    url: "https://charlietolleson.com/work/agent-ready-org",
  },
  twitter: {
    card: "summary_large_image",
    title: "Making an Org Agent-Ready | Charlie Tolleson",
    description:
      "The standards and governance an organization needs before it can trust its agents with decisions.",
  },
};

/** Fact rows shown under the title, so the scope is legible at a glance. */
const META: [string, string][] = [
  ["Role", "Author of the framework; set the standards the org built to"],
  ["Audience", "A 50+ person data science org supporting Meta's Ads Sales"],
  ["Scope", "Metric definitions, shared context, Skills, and their governance"],
  [
    "Outcome",
    "Adopted by teams without a mandate: specs for 25+ metrics and data fields, and 30+ Claude Skills built to its guidelines",
  ],
];

/** What the org built after the paper, in the order a leader would weigh it. */
const OUTCOMES: string[] = [
  "A metric spec repository became the home for decision-grade definitions, with specs for more than 25 metrics and data fields, and existing queries were rewritten on top of those specs instead of carrying their own logic.",
  "Teams designed more than 30 Claude Skills to the paper's guidelines.",
  "A Skill discovery dashboard gave everyone one place to find, share, and reuse them.",
  "Several repositories adopted autonomous cleanup jobs, in which agents find redundant documentation and remove it before another agent can read it.",
];

/** The rollout, as numbered steps: each pays off alone and unlocks the next. */
const ROLLOUT: [string, string][] = [
  [
    "Define the numbers that drive decisions",
    "Start with the metrics leadership reviews every week. Give each one a spec and an owner, and point every agent at it.",
  ],
  [
    "Give knowledge a home",
    "Stand up the company, org, team, and individual levels, and have them link to the definitions instead of restating them.",
  ],
  [
    "Turn proven work into shared Skills",
    "Catalog the Skills people already rely on, give each an owner, and test them before they're shared.",
  ],
  [
    "Automate the upkeep",
    "Add the checks and cleanup agents that keep everything true without a standing meeting.",
  ],
];

const P = "text-xl leading-relaxed text-zinc-700";
const H2 = "text-3xl font-semibold tracking-tight text-zinc-900";
const LINK =
  "text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500";

export default function AgentReadyOrgPage() {
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
            Making an Org Agent-Ready @Meta
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            The standards and governance an organization needs before it can
            trust its agents with decisions.
          </p>

          <EntrySummary
            intro="Agents made every analyst in our org faster almost overnight. They also exposed a quieter problem: an agent is only as reliable as what it reads, and what our org had written down was scattered, duplicated, and often out of date. Two people could ask the same question and get two different numbers, each delivered with full confidence. At Meta, I traced where this came from, wrote a paper proposing a set of standards and a governance framework to fix it, and presented it to our 50+ person data science org. Nothing was mandated, and teams adopted it anyway: a shared metric spec repository, more than 30 Skills built to its guidelines, and agents that clean up after other agents."
            pairs={[
              [
                "The same metric was defined differently in different places, and agents could not tell which version was true.",
                "One source of truth for every definition, set once and linked everywhere else.",
              ],
              [
                "How any given number was calculated was buried in layers of queries, so neither people nor agents could check it.",
                "A clear, owned spec for every number that drives a decision.",
              ],
              [
                "Domain knowledge was stuck in individuals' personal notes, out of reach of everyone else's agents.",
                "A shared hierarchy, so what one person learns reaches the whole team.",
              ],
              [
                "When definitions changed, the old versions stayed behind and agents kept using them.",
                "Named owners and a change process for everything agents rely on.",
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
            The paper and everything built from it are internal to Meta, so the
            examples on this page are synthetic. The framework is the one I
            proposed.
          </p>
        </div>

        {/* ---- Stakes ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>The bottleneck isn&apos;t the model</h2>
          <p className={P}>
            Most AI transformations stall on context, not capability. The
            models are good enough. What holds them back is what they are given
            to read. A person searching the wiki skips the outdated page on the
            fourth screen of results. An agent finds it by keyword and trusts it
            as much as anything else.
          </p>
          <p className={P}>
            That makes everything an agent can reach a production input, as
            consequential as code or data. My paper&apos;s central argument was
            that context should be managed the same way: as an asset with
            owners, standards, and a lifecycle, not as documentation that gets
            written once and forgotten.
          </p>
        </section>

        {/* ---- One definition ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>One answer to every question</h2>
            <p className={P}>
              Every number that influences a decision gets a single definition
              that people and agents can both read: what it measures, where it
              comes from, and who owns it. Those numbers get the strictest
              governance in the framework, because they are the ones leaders act
              on.
            </p>
            <p className={P}>
              Here is what the alternative looks like. Three people ask their
              agents for last quarter&apos;s revenue.
            </p>
          </div>

          <div className="max-w-4xl">
            <AnswerSpread />
          </div>

          <div className="flex max-w-3xl flex-col gap-6">
            <p className={P}>
              Nobody in that picture did anything wrong. The dashboard reports
              bookings because that is its job, the notebook predates a cleanup,
              and the wiki page was right last year. Their agents found
              different definitions and reported answers up to{" "}
              <span className="font-mono text-zinc-800">{money(SPREAD)}</span>{" "}
              apart, the highest being{" "}
              <span className="font-mono text-zinc-800">
                {MAX_OVERSTATEMENT_PCT}%
              </span>{" "}
              above the governed number.
            </p>
            <p className={P}>
              The payoff of a single definition is not just accuracy, it is
              trust. Without one, a wrong answer looks exactly like a right one.
              With one, the agent either gets it right or says it can&apos;t
              answer.
            </p>
          </div>
        </section>

        {/* ---- Specs shrink evals ---- */}
        {/* Deliberately "shrink", not "eliminate": a spec makes the
            calculation testable once, but whether the agent picked the right
            metric, and what it does with a question no spec covers, still need
            evaluating. An expert reader would catch the stronger claim. */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>Test the definition, not every answer</h2>
          <p className={P}>
            Most teams make agents trustworthy by grading their output: write a
            set of questions, run the agent, and have people or another model
            score the answers. Those evaluations are expensive to build, never
            finished, and only as good as their coverage, because every new
            question is a new chance to be wrong.
          </p>
          <p className={P}>
            A spec changes what needs testing. When the agent&apos;s job is to
            pick the right metric rather than to work out the calculation, the
            calculation can be tested once, the way software is, with a known
            input and a known answer, and every question that lands on that
            metric inherits the result. What&apos;s left to evaluate narrows to
            one question: did the agent pick the right metric? And when no spec
            fits, it says so instead of improvising.
          </p>
          <p className={P}>
            Well-kept context doesn&apos;t make evaluation disappear. It turns
            most of it into ordinary tests that pass or fail, and leaves few
            enough judgment calls to check properly.
          </p>
        </section>

        {/* ---- Hierarchy ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>Knowledge that belongs to the team</h2>
            <p className={P}>
              The most valuable context in an org starts in one person&apos;s
              head: which data to trust, which exception everyone forgets. Left
              in personal notes, it makes one person&apos;s agent smarter, leaves
              everyone else&apos;s guessing, and leaves the company when they do.
            </p>
            <p className={P}>
              The framework organizes context in levels that mirror the org
              chart. Teams can tailor how work gets done, but definitions are set
              once and never overridden lower down. Useful knowledge gets
              promoted upward, so the organization gets smarter, not just the
              individuals in it.
            </p>
          </div>

          <div className="max-w-4xl">
            <ContextLevels />
          </div>
        </section>

        {/* ---- Skills ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>Skills as shared infrastructure</h2>
          <p className={P}>
            Skills package repeatable work, like a causal analysis or a weekly
            business review, so an agent does it the same way every time.
            Treated as one-off scripts, they multiply and drift. Treated as
            shared infrastructure, they compound.
          </p>
          <p className={P}>
            The paper asked for Skills to be built the way good software is:
            each does one job and builds on the ones beneath it, each has an
            owner, each is tested before it&apos;s shared, and all of them sit
            in one catalog where anyone can find them. A Skill nobody can find
            gets rebuilt by the next team that needs it.
          </p>
        </section>

        {/* ---- Governance ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className={H2}>Governance proportional to the stakes</h2>
            <p className={P}>
              Governance is what keeps all of this true after launch day, and it
              only works if it is light enough that people follow it. So the
              framework scales process to the stakes rather than applying the
              same rules to everything.
            </p>
          </div>

          <div className="max-w-4xl">
            <GovernanceTiers />
          </div>

          <p className={`max-w-3xl ${P}`}>
            When a definition changes, outdated versions are updated or removed,
            not just flagged, because an agent that never reads the warning will
            use the old number anyway. And because people miss things, automated
            checks look for the stale copies they leave behind.
          </p>
        </section>

        {/* ---- Outcomes ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>What came of it</h2>
          <p className={P}>
            I presented the paper to the full data science org, more than 50
            people. Nothing was mandated, and nobody had to adopt it. Teams
            put it to work on their own.
          </p>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"
                />
                <span className={P}>{o}</span>
              </li>
            ))}
          </ul>
          <p className={P}>
            The last one is the clearest sign the idea landed. Once teams saw
            stale context as a production risk, they put agents to work keeping
            it clean.
          </p>
        </section>

        {/* ---- Rollout ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>How I&apos;ll roll it out on my next team</h2>
          <ol className="m-0 flex list-none flex-col gap-6 p-0">
            {ROLLOUT.map(([title, body], i) => (
              <li key={title} className="flex gap-5">
                <span className="shrink-0 pt-1 font-mono text-base text-zinc-400">
                  {i + 1}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-xl font-medium text-zinc-900">
                    {title}
                  </span>
                  <span className="text-lg leading-relaxed text-zinc-600">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className={P}>
            Each step pays off on its own, and each makes the next one easier.
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">
            About the figures
          </h2>
          <p className="text-base leading-relaxed text-zinc-600">
            The paper and the repositories it led to are internal to Meta, so
            every figure here was built for this page. The revenue example is
            computed from a synthetic quarter of a few thousand ad accounts, and
            the three answers differ only in which definition each agent found.
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
