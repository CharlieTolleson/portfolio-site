/**
 * About: the bio page, linked from the site header.
 *
 * Role in the system: visitors reach this page after the work has already
 * convinced them, so it answers the next question, "who is this person and how
 * do they work?", rather than re-selling the case studies. It stays short and
 * ends in the same contact call-to-action as the home page.
 *
 * Key design decision: every career figure here matches the resume and the
 * case-study cards (Meta eval scope, Amazon Price Competitiveness, IBM award),
 * so a recruiter cross-checking the two never finds a mismatch.
 */

import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "Charlie Tolleson: data scientist building AI agents, ML models, and measurement systems. Previously Meta, Amazon, IBM.",
};

/** One line per role, newest first. */
const TIMELINE: { org: string; role: string; line: string }[] = [
  {
    org: "Independent",
    role: "AI systems builder",
    line: "Building Hyperion, a multi-agent orchestrator that routes each step of a task to the model that fits it, with every call traced.",
  },
  {
    org: "Meta",
    role: "Senior Data Scientist, Ads Sales",
    line: "Led evals across 7 production AI workflows serving 5,000+ sellers, coordinating a group of 30+, and shipped 15 Claude Code Skills to a 50+ person data science org.",
  },
  {
    org: "Amazon",
    role: "Senior Data Scientist, Pricing",
    line: "Worldwide owner of the Price Competitiveness north star metric, which moved +10 bps against a 7 bps goal.",
  },
  {
    org: "IBM",
    role: "Senior Data Scientist",
    line: "Built a framework that turns a single YAML file into a full ETL and ML pipeline, halving deployment time and earning an Outstanding Technical Achievement Award.",
  },
];

/** How I work, stated as habits a teammate would actually notice. */
const PRINCIPLES: [string, string][] = [
  [
    "Measure before arguing.",
    "A claim about a model or a metric should come with the number that would prove it wrong.",
  ],
  [
    "Make the analysis self-serve.",
    "The best analysis I can do is the one nobody has to wait on me for, so I ship frameworks and agents, not one-off decks.",
  ],
  [
    "Show the failure rate.",
    "Every system has one. Reporting it is what makes the rest of the numbers believable.",
  ],
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-32 sm:px-10 lg:px-20">
        <div className="flex max-w-3xl flex-col gap-6">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            About
          </h1>
          <p className="text-2xl leading-snug text-zinc-500">
            I work on the question every organization eventually asks: why did
            the number move, and what will move it next?
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            I&apos;m a data scientist who builds the systems that answer it:
            causal inference that finds which levers actually work, decomposition
            that accounts for a metric move exactly, and AI agents that put both
            in the hands of people who aren&apos;t data scientists. I&apos;ve done
            that at IBM, Amazon, and Meta, usually as the lead on a small team
            with VP-level stakeholders waiting on the answer.
          </p>
          <p className="text-xl leading-relaxed text-zinc-700">
            Lately that work has moved deep into LLMs: evaluating multi-agent
            workflows in production at Meta, and building my own orchestrator to
            keep working on the problem with my hands on the whole stack.
          </p>
        </div>

        <section className="flex max-w-4xl flex-col gap-6">
          <h2 className="font-mono text-xs uppercase tracking-wide text-zinc-400">
            Experience
          </h2>
          <ol className="flex flex-col">
            {TIMELINE.map((t) => (
              <li
                key={t.org}
                className="grid grid-cols-1 gap-x-10 gap-y-1 border-t border-zinc-200 py-6 sm:grid-cols-[10rem_1fr]"
              >
                <span className="text-xl font-medium text-zinc-900">
                  {t.org}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-sm uppercase tracking-wide text-zinc-500">
                    {t.role}
                  </span>
                  <span className="text-lg leading-relaxed text-zinc-600">
                    {t.line}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="font-mono text-xs uppercase tracking-wide text-zinc-400">
            How I work
          </h2>
          <ul className="flex flex-col gap-5">
            {PRINCIPLES.map(([head, body]) => (
              <li
                key={head}
                className="border-l-2 border-zinc-200 pl-5 text-lg leading-relaxed text-zinc-600"
              >
                <span className="font-medium text-zinc-900">{head}</span>{" "}
                {body}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <p className="text-xl text-zinc-700">
            Open to full-time AI and data science roles, and select freelance
            projects.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="mailto:charlietolleson@gmail.com"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Get in touch
            </a>
            <Link
              href="/"
              className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              See the work
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
