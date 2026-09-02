/**
 * AI Agent Orchestration — case study page.
 *
 * Role in the system: the first built portfolio entry, linked from the home
 * page. It argues that multi-agent orchestration is a routing and observability
 * problem, and backs that argument with measured data from a real system rather
 * than description alone.
 *
 * Key design decision: every quantitative claim on this page resolves to
 * `lib/hyperionRun.ts`, which is read out of Hyperion's own trace store. The
 * page names concrete models and exact timings on purpose — an AI audience reads
 * hedged language ("a fast general-purpose model") as either vagueness or
 * inexperience, and the specifics are the credential.
 */

import Link from "next/link";
import WorkflowGraph from "@/components/WorkflowGraph";
import RunTimeline from "@/components/RunTimeline";
import EvidenceStats from "@/components/EvidenceStats";
import Figure from "@/components/Figure";
import { AGGREGATES, FEATURED_RUN_ID, SYSTEM_TOTALS } from "@/lib/hyperionRun";

const REPO = "https://github.com/CharlieTolleson/personal-agent";
/** Deep link into the orchestrator rather than the monorepo root. */
const HYPERION_DIR = `${REPO}/tree/main/agents/hyperion`;
/** The wave-grouping function that turns a DAG into parallel execution waves. */
const WAVE_EXECUTOR = `${REPO}/blob/main/agents/hyperion/src/hyperion/crews/runner.py#L745`;
/** Per-role model handles and the single fallback retry. */
const ROUTING_SRC = `${REPO}/blob/main/agents/hyperion/src/hyperion/llms.py`;

export const metadata = {
  title: "AI Agent Orchestration",
  description:
    "Building a multi-agent orchestrator that routes each step of a task to the model that fits it — and measuring what that actually buys you. 12 nodes, 2.6× faster than sequential, traced end to end.",
  openGraph: {
    title: "AI Agent Orchestration — Charlie Tolleson",
    description:
      "A multi-agent orchestrator that routes each step to the model that fits it. 12 nodes across 5 execution waves, 2.6× faster than sequential, every call traced.",
    type: "article",
    url: "https://charlietolleson.com/work/ai-orchestration",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Agent Orchestration — Charlie Tolleson",
    description:
      "A multi-agent orchestrator that routes each step to the model that fits it. Measured, not described.",
  },
};

/** Fact rows shown under the title, so the technical read is instant. */
const META: [string, string][] = [
  ["Role", "Creator & architect — design, build, operations"],
  ["Project", "Hyperion, the orchestration layer of my personal AI workspace"],
  ["Stack", "Python · FastAPI · LiteLLM · Qdrant · Langfuse · Next.js"],
  ["Status", "Running daily since May 2026"],
];

export default function AiOrchestrationPage() {
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
            AI Agent Orchestration
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            Most agent systems pick one model and route everything through it.
            This one treats model choice as a property of each step — and
            measures what that buys.
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
        </div>

        <EvidenceStats />

        {/* ---- The problem ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            The problem: evals explode
          </h2>

          <p className="text-xl leading-relaxed text-zinc-700">
            A single prompt to a modern AI agent doesn&apos;t trigger one model
            call. It triggers several, sometimes dozens, of sub-agents working
            together.
          </p>

          <p className="text-xl leading-relaxed text-zinc-700">
            Anyone who has re-run the same prompt knows LLMs are
            nondeterministic. That variance compounds as sub-agents chain
            together, each one building on an already-uncertain upstream output.
            So evals increasingly have to happen at the sub-agent level, not
            just on the final answer — and the number of things you have to
            measure grows with the graph, not with the feature.
          </p>

          <p className="text-xl leading-relaxed text-zinc-700">
            This is a big reason organizations still don&apos;t trust AI for
            high-stakes work like client-facing documents or reported metrics,
            and it&apos;s what makes enterprise-ready agentic tools expensive to
            ship.
          </p>

          <p className="border-l-2 border-zinc-900 pl-5 text-xl leading-relaxed text-zinc-900">
            I led evals through this problem at Meta, across seven sales
            workflows and a group of about thirty — seven data scientists, seven
            data engineers, seven PMs, and ten software engineers. Hyperion is
            what I built to keep working on the same problem with my hands on the
            whole stack: orchestration, routing, and the traces underneath.
          </p>
        </section>

        {/* ---- What it is ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Workflows you can open up
            </h2>

            <p className="text-xl leading-relaxed text-zinc-700">
              Point Hyperion at a prompt and it drafts a workflow on its own. But
              a workflow is never a black box: I can open any of them in a
              graphical builder, rewire which nodes feed which, swap the model or
              persona behind a node, and save the result as a reusable template.
            </p>

            <p className="text-xl leading-relaxed text-zinc-700">
              Below is the real shape of one — five research angles running in
              parallel, converging into a synthesis step, splitting into
              specialist review passes, and resolving into a single verdict.
              Hover or focus a node to see its persona and the model it ran on.
            </p>
          </div>

          <WorkflowGraph variant="full" />
        </section>

        <Figure
          src="/work/hyperion-builder.png"
          width={2800}
          height={1866}
          alt="The Idea Council workflow open in Hyperion's builder. Twelve nodes are laid out on a canvas connected by dependency arrows, with the advocate node selected and a side panel showing its slug, role, agent, approval gate, and instruction override."
          caption="The same workflow in the builder, with the advocate node selected. Nodes are dragged into place and wired by dragging between handles — an edge means the source must finish first — and the panel edits that node's role, agent, approval gate, and instruction. The editor rejects any connection that would close a cycle, so a workflow always stays a DAG the runner can schedule."
        />

        {/* ---- Personas ---- */}
        <section className="flex max-w-3xl flex-col gap-5">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            A team of specialists
          </h2>
          <p className="text-lg leading-relaxed text-zinc-600">
            Every node is a persona, not just a model call. The market-sizing
            node reasons like a market analyst. The critic argues like someone
            whose only job is finding the hole in the plan. The assessor weighs
            critique against advocacy like a partner deciding whether to
            greenlight a deal.
          </p>
          <p className="text-lg leading-relaxed text-zinc-600">
            Stacked together, a workflow behaves less like a single assistant and
            more like a small, focused team: each member narrowly scoped, briefed
            with just enough context to do its job, and reporting up to whoever
            synthesizes the final call.
          </p>
        </section>

        <Figure
          src="/work/hyperion-dashboard-agents.png"
          width={2800}
          height={1480}
          alt="Hyperion's dashboard: a task input at the top with a workflow picker, above a grid of agent cards. Each card shows the agent's role, description, model badge, and tool count, and is marked active or inactive."
          caption="The agent registry. Each card carries the model that role runs on — the researcher on gpt-4o, the synthesizer on gemini-2.5-pro, the planner and developer on the smart and worker aliases — plus how many tools it can reach. Agents can be switched off without editing any workflow that references them."
        />

        {/* ---- Routing ---- */}
        <section className="flex flex-col gap-8">
          <div className="flex max-w-3xl flex-col gap-5">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Routing each step to the model that fits
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              Research that fans out into five parallel angles rewards breadth
              over depth, so those nodes run on{" "}
              <span className="font-mono text-zinc-800">gpt-4o</span> with a
              capped search-and-reason loop. The steps that have to hold a lot of
              context at once and produce long prose — research synthesis, the
              advocate, the final verdict — run on{" "}
              <span className="font-mono text-zinc-800">gemini-2.5-pro</span>.
            </p>
            <p className="text-lg leading-relaxed text-zinc-600">
              The planner and developer nodes don&apos;t name a model at all.
              They point at{" "}
              <span className="font-mono text-zinc-800">smart</span> and{" "}
              <span className="font-mono text-zinc-800">worker</span> — logical
              roles chosen by intent, not by vendor. Each role resolves to an
              alias, and each alias is an ordered chain across providers:{" "}
              <span className="font-mono text-zinc-800">smart</span> tries
              claude-opus-4-6, then gemini-2.5-pro, then gpt-4o, and takes the
              first that answers.
            </p>
            <p className="text-lg leading-relaxed text-zinc-600">
              That indirection is what makes the routing claim more than a
              preference. Reordering a chain re-routes every node pointed at it,
              across every workflow, without touching code, and a provider outage
              degrades a run instead of ending it — the node falls to the next
              model in its chain and keeps going.
            </p>
          </div>

          <Figure
            maxWidth="max-w-2xl"
            src="/work/hyperion-aliases.png"
            width={2000}
            height={1760}
            alt="Hyperion's alias settings. Each alias — smart, worker, cheap — lists an ordered chain of models with controls to reorder, remove, or add entries."
            caption="The alias editor. smart tries claude-opus-4-6, then gemini-2.5-pro, then gpt-4o; worker and cheap have their own chains. Reordering here re-routes every node pointed at that alias, across every workflow, without touching a line of code."
          />

          <div className="max-w-3xl">
            <p className="text-lg leading-relaxed text-zinc-600">
              Here is what that mix did on the clock — twelve nodes, four
              models, three providers, one run. Bars are colored by model.
            </p>
          </div>

          <RunTimeline />
        </section>

        {/* ---- Graph vs pipeline ---- */}
        <section className="flex max-w-3xl flex-col gap-5">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Why a graph, not a pipeline
          </h2>
          <p className="text-lg leading-relaxed text-zinc-600">
            A fixed linear pipeline forces every step through the same path in
            the same order. Building the orchestrator around an arbitrary
            directed graph instead means a workflow&apos;s shape can match the
            task: the runner groups nodes into{" "}
            <a
              href={WAVE_EXECUTOR}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
            >
              execution waves
            </a>
            , fires each wave concurrently, and only advances once every node in
            it has finished. Across {AGGREGATES.runs} recorded runs that&apos;s
            worth a median{" "}
            <span className="font-medium text-zinc-800">
              {AGGREGATES.medianSpeedup.toFixed(1)}×
            </span>{" "}
            against running the same nodes one at a time.
          </p>
          <p className="text-lg leading-relaxed text-zinc-600">
            The flexibility has real costs. A graph is harder to reason about
            than a straight line. Mixing models means each node carries a
            slightly different voice and judgment style that the synthesis step
            has to reconcile. And more parallelism means more surface area for
            one slow node to become the bottleneck everyone waits on — in the run
            above, the whole first wave waits on{" "}
            <span className="font-mono text-zinc-800">market-trends</span> at
            135.6s while four sibling nodes sit finished and idle.
          </p>
        </section>

        {/* ---- Reliability ---- */}
        <section className="flex max-w-3xl flex-col gap-5">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            What happens when a node misbehaves
          </h2>
          <p className="text-lg leading-relaxed text-zinc-600">
            Fanning work out to a dozen model calls means a dozen things that can
            hang, loop, or quietly burn budget. Of{" "}
            {SYSTEM_TOTALS.tasks} runs to date, 38 finished, 11 failed and 3 were
            cancelled — and the researcher, the role that makes by far the most
            calls, carries a 27% error rate. Those are the numbers the next three
            mechanisms exist to bound. Each one was added because something
            actually went wrong first.
          </p>
          <ul className="flex flex-col gap-4 text-lg leading-relaxed text-zinc-600">
            <li className="border-l-2 border-zinc-200 pl-5">
              <span className="font-medium text-zinc-800">
                A per-request timeout, not just a wall-clock budget.
              </span>{" "}
              An overall deadline can&apos;t interrupt a worker thread already
              blocked inside a completion call. Each node gets a hard{" "}
              <span className="font-mono">timeout</span> of{" "}
              <span className="font-mono">min(remaining budget, 180s)</span>{" "}
              handed to LiteLLM itself — the only knob that can actually kill a
              stalled upstream from inside the executor.
            </li>
            <li className="border-l-2 border-zinc-200 pl-5">
              <span className="font-medium text-zinc-800">
                Per-agent token caps checked before the call, not after.
              </span>{" "}
              A researcher stuck in a search loop is stopped by a pre-flight
              check against its accumulated input and output tokens, so a runaway
              node fails fast instead of finishing expensive.
            </li>
            <li className="border-l-2 border-zinc-200 pl-5">
              <span className="font-medium text-zinc-800">
                One fallback retry per node.
              </span>{" "}
              When a primary completion raises, the node retries once against its
              fallback target. Combined with the alias groups, a provider outage
              degrades a run instead of ending it.
            </li>
          </ul>
          <p className="text-lg leading-relaxed text-zinc-600">
            Every call — model, tokens, cost, duration, and the node it belongs
            to — is written to a trace store and grouped into one Langfuse
            session per run. That store is where every number on this page came
            from.
          </p>
        </section>

        <Figure
          src="/work/hyperion-monitoring.png"
          width={2800}
          height={1520}
          alt="Hyperion's monitoring view: a run tally at the top, per-agent cards showing run counts, error counts, error rate and token usage against caps, and a table of recent runs with status and a link to each trace."
          caption={`The monitoring view, reporting against itself: run tallies, per-agent error rates, and token usage against each agent's cap. Every row links out to the full Langfuse trace. This store — and the per-node rows behind it — is where run ${FEATURED_RUN_ID} and every other number on this page came from.`}
        />

        {/* ---- Next ---- */}
        <section className="flex max-w-3xl flex-col gap-5">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            What&apos;s next
          </h2>
          <p className="text-lg leading-relaxed text-zinc-600">
            Deciding which model belongs on which node is still mostly judgment.
            I have cost, latency, and token counts per node; I don&apos;t yet
            have <em>quality</em> per node. The next iteration closes that loop —
            running evals against each node&apos;s output to score models against
            the specific job that node does, so the routing table becomes a
            measured argument instead of a defensible guess.
          </p>
          <p className="text-lg leading-relaxed text-zinc-600">
            Which lands back on the problem this started with: making sub-agent
            behavior legible enough that someone could trust the output.
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-6 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">The code</h2>
          <ul className="flex flex-col gap-3 font-mono text-base">
            <li>
              <a
                href={HYPERION_DIR}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
              >
                agents/hyperion ↗
              </a>
              <span className="ml-3 font-sans text-sm text-zinc-500">
                the orchestrator
              </span>
            </li>
            <li>
              <a
                href={WAVE_EXECUTOR}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
              >
                runner.py — wave grouping ↗
              </a>
              <span className="ml-3 font-sans text-sm text-zinc-500">
                the DAG-to-parallel-waves core
              </span>
            </li>
            <li>
              <a
                href={ROUTING_SRC}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
              >
                llms.py — per-node routing ↗
              </a>
              <span className="ml-3 font-sans text-sm text-zinc-500">
                model handles, caps, fallback
              </span>
            </li>
          </ul>

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
