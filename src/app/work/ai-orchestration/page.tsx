import Link from "next/link";
import WorkflowGraph from "@/components/WorkflowGraph";

export const metadata = {
  title: "Interactive AI Agent Orchestration Suite — Charlie Tolleson",
};

export default function AiOrchestrationPage() {
  return (
    <div className="flex flex-1 justify-center bg-black font-sans">
      <main className="flex w-full max-w-2xl flex-col gap-16 px-8 py-24">
        <Link
          href="/"
          className="w-fit text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Charlie Tolleson
        </Link>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Interactive AI Agent Orchestration Suite
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">
            Creator &amp; Architect — Hyperion, personal AI workspace
          </p>
        </div>

        <p className="text-lg leading-relaxed text-zinc-300">
          Hyperion is the multi-agent orchestration layer of my personal AI
          workspace: a persistent service that takes a request, researches it
          across the web and my own notes, and synthesizes a report — reachable
          from a chat UI, an MCP server, a raw HTTP API, or its own console.
          Below is the actual shape of one of its workflows, redrawn from the
          live system: five research angles running in parallel, converging
          through a synthesizer, splitting into specialist passes, and
          resolving into a single verdict.
        </p>

        <WorkflowGraph variant="full" />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Situation
          </h2>
          <p className="leading-relaxed text-zinc-300">
            Hyperion started as a fixed three-step pipeline built on CrewAI: a
            planner handed off to a researcher, which handed off to a
            synthesizer. That was enough to answer one research question at a
            time, but it couldn&apos;t express the workflows I actually wanted to
            run — for example, evaluating a business idea by researching its
            market size, domain fit, legal exposure, trends, and competitive
            landscape all at once, then feeding all five into a critique and an
            advocacy pass, and arriving at one verdict. A fixed linear pipeline
            has no way to fan out or fan back in.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Task
          </h2>
          <p className="leading-relaxed text-zinc-300">
            Rebuild the orchestrator around an arbitrary directed-acyclic
            workflow instead of a fixed pipeline, without losing the
            reliability a simple linear pipeline gets almost by accident: a
            hung upstream model call can&apos;t wedge the whole run, a run in
            progress can actually be stopped, and a failure degrades loudly
            instead of silently returning something wrong.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Action
          </h2>
          <ol className="flex flex-col gap-2 text-zinc-300">
            <li>1. Replaced CrewAI with an owned agent execution loop</li>
            <li>2. Made per-request timeouts actually interrupt hung calls</li>
            <li>3. Built real stop/cancel for a run already in flight</li>
            <li>4. Ran independent branches of a workflow in parallel</li>
            <li>5. Turned a silent failure mode into an observable one</li>
          </ol>

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
            <h3 className="text-base font-medium text-zinc-100">
              1) Replacing CrewAI with an owned agent loop
            </h3>
            <p className="leading-relaxed text-zinc-400">
              CrewAI&apos;s per-node executor made two categories of bug hard to
              see: it silently overwrote my custom usage-logging callbacks
              whenever it configured its own LLM client, and its pre-call hook
              swallowed exceptions I deliberately raised to enforce per-agent
              spend caps. Rather than work around a framework fighting my own
              instrumentation, I wrote a small owned execution loop
              (<code className="text-zinc-300">agent_loop.py</code>) directly
              on top of LiteLLM&apos;s function-calling API: a plain dataclass
              for an agent (system prompt, tools, iteration budget) and a loop
              that drives completion → tool dispatch → tool result until the
              model stops calling tools or the budget runs out. Both bug
              classes disappeared because there was no longer a framework
              layer to fight — spend caps are checked directly before each
              call, and usage logging is registered once, globally, by code I
              control.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
            <h3 className="text-base font-medium text-zinc-100">
              2) Timeouts that can actually stop a hung call
            </h3>
            <p className="leading-relaxed text-zinc-400">
              Wrapping a stage in <code className="text-zinc-300">asyncio.wait_for</code> can
              time out at the stage level, but it can&apos;t cancel a blocking
              LLM call already running in an executor thread — the thread just
              keeps running, wasted, in the background. The fix was to thread
              a real deadline down to the call itself: each node computes its
              own per-request timeout as the smaller of a fixed per-call cap
              and whatever wall-clock budget the whole run has left, so a
              retry after a fallback-model failure can&apos;t resurrect a hang or
              blow past the original budget. If the remaining budget is
              already exhausted, the timeout collapses to effectively zero
              instead of being treated as unlimited.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
            <h3 className="text-base font-medium text-zinc-100">
              3) Stop/cancel for a run already in flight
            </h3>
            <p className="leading-relaxed text-zinc-400">
              Cancelling an <code className="text-zinc-300">asyncio.Task</code> doesn&apos;t
              kill a blocking call already executing in an executor thread —
              so a naive cancel leaves the UI showing a run that&apos;s
              technically still working. Every spawned run is registered in a
              task table keyed by run id; stopping a run cancels that task{" "}
              <em>and</em> writes the cancelled status to the database
              immediately, so the UI gets a correct answer right away while
              the orphaned thread drains harmlessly in the background and its
              result is discarded.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
            <h3 className="text-base font-medium text-zinc-100">
              4) Parallel branches, safely
            </h3>
            <p className="leading-relaxed text-zinc-400">
              A workflow is topologically sorted into waves, where a node&apos;s
              wave is one more than the latest wave among the nodes feeding
              it. Nodes within a wave run concurrently; waves themselves run
              in order. The diagram above is exactly this in practice: five
              root research nodes in wave zero, a synthesizer in wave one,
              four specialist nodes in wave two, and so on down to a single
              verdict. Each node&apos;s prompt is assembled from its upstream
              neighbors&apos; captured output rather than shared workspace files,
              which fixed a subtler bug where a root node with no upstream ran
              &quot;blind&quot; — it now gets the original request seeded directly as
              its context.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
            <h3 className="text-base font-medium text-zinc-100">
              5) Making a silent failure loud
            </h3>
            <p className="leading-relaxed text-zinc-400">
              The reranking model used to sort research results was silently
              timing out on more than half its calls under CPU-only load,
              quietly falling back to unranked order with no signal that
              anything had degraded. I swapped to a smaller reranker with
              equivalent quality, cutting per-batch latency by roughly 3.4x,
              and added metrics that count exactly how often a call succeeds,
              degrades, or times out — so a fail-soft path is now something
              you can see, not something that just happens.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Result
          </h2>
          <p className="leading-relaxed text-zinc-300">
            The orchestrator now runs arbitrary DAG-shaped workflows in
            production for my own daily use — including 12-node fan-out/fan-in
            workflows and sub-workflows that compose smaller workflows as
            single steps. The rebuild removed CrewAI and its dependency
            surface entirely while the test suite grew from 82 to 139 passing
            tests. Reranker call latency dropped from roughly 16 seconds to
            under 5 seconds per batch, with its timeout rate going from over
            half of all calls to zero. The clearest lasting result wasn&apos;t a
            number, though — it was a rule I now apply everywhere in this
            system: every fail-soft path needs a signal. If code catches an
            error and degrades gracefully, it also has to say so somewhere
            observable, or the degradation is indistinguishable from success
            until a user notices something is subtly wrong.
          </p>
        </section>
      </main>
    </div>
  );
}
