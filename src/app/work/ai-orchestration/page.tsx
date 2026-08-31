import WorkflowGraph from "@/components/WorkflowGraph";

export const metadata = {
  title: "Interactive AI Agent Orchestration Suite — Charlie Tolleson",
};

export default function AiOrchestrationPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-900 font-sans">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-32 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Interactive AI Agent Orchestration Suite
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-zinc-400">
            Creator &amp; Architect — Hyperion, personal AI workspace
          </p>
        </div>

        <div className="max-w-3xl text-lg leading-relaxed text-zinc-300">
          <p>
            Hyperion is the multi-agent orchestration layer of my personal AI
            workspace — a service that takes a request, researches it, and
            synthesizes a report. It started as a fixed three-step CrewAI
            pipeline, but that couldn&apos;t express the workflows I actually
            wanted: researching several angles on an idea in parallel,
            critiquing and advocating for it from different perspectives, and
            arriving at one verdict. Below is the real shape of that
            workflow — click through it to see how a run actually executes.
          </p>
        </div>

        <WorkflowGraph variant="full" />

        <div className="grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-medium text-zinc-100">Challenges</h2>
            <ol className="flex flex-col gap-2 text-zinc-400">
              <li>1. A fixed pipeline can&apos;t fan out or fan back in</li>
              <li>2. A hung model call could wedge an entire run</li>
              <li>3. CrewAI&apos;s framework silently ate the safeguards I built on top of it</li>
              <li>4. A failing component degraded silently instead of visibly</li>
            </ol>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-medium text-zinc-100">What I built</h2>
            <ol className="flex flex-col gap-2 text-zinc-400">
              <li>1. An owned agent execution loop, replacing CrewAI entirely</li>
              <li>2. Real per-request timeouts and working stop/cancel for a run in flight</li>
              <li>3. Wave-based parallel execution across independent branches</li>
              <li>4. Observability on every fail-soft path</li>
            </ol>
          </div>
        </div>

        <div className="flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium text-zinc-100">
              An owned execution loop
            </h3>
            <p className="leading-relaxed text-zinc-400">
              CrewAI&apos;s executor silently overwrote my usage-logging
              callbacks and swallowed exceptions I raised to enforce spend
              caps — bugs that were hard to see because a framework layer sat
              between me and the model call. I replaced it with a small owned
              loop directly on LiteLLM&apos;s function-calling API, so both
              problems disappeared: there was no longer a framework fighting
              my own instrumentation.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-medium text-zinc-100">
              Timeouts, cancellation, and parallel waves
            </h3>
            <p className="leading-relaxed text-zinc-400">
              A stage-level timeout can&apos;t cancel a blocking call already
              running in a thread, so I threaded a real deadline down to each
              request instead, and gave every run a way to be cancelled
              outright with an immediate status flip rather than waiting on an
              orphaned thread. The workflow itself runs as topologically
              sorted waves — independent nodes in a wave run concurrently,
              exactly as shown above — with each node&apos;s prompt built from
              its upstream neighbors&apos; actual output instead of shared files.
            </p>
          </div>
        </div>

        <p className="max-w-3xl leading-relaxed text-zinc-300">
          The orchestrator now runs workflows like this in production for my
          own daily use. The rebuild removed CrewAI entirely while the test
          suite grew from 82 to 139 passing tests, and a silent reranker
          bottleneck went from timing out on more than half its calls to
          zero, at a third of the latency. The rule I now apply everywhere in
          this system: every fail-soft path needs a signal.
        </p>
      </main>
    </div>
  );
}
