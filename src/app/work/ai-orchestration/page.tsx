import WorkflowGraph from "@/components/WorkflowGraph";

export const metadata = {
  title: "Interactive AI Agent Orchestration Suite — Charlie Tolleson",
};

export default function AiOrchestrationPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 pb-40 sm:px-10 lg:px-20">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Interactive AI Agent Orchestration Suite
          </h1>
          <p className="font-mono text-sm uppercase tracking-wide text-zinc-500">
            Creator &amp; Architect — Hyperion, personal AI workspace
          </p>
        </div>

        <div className="max-w-4xl text-2xl leading-relaxed text-zinc-700">
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

        <div className="grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-zinc-900">Challenges</h2>
            <ol className="flex flex-col gap-3 text-lg text-zinc-600">
              <li>1. A fixed pipeline can&apos;t fan out or fan back in</li>
              <li>2. A hung model call could wedge an entire run</li>
              <li>3. CrewAI&apos;s framework silently ate the safeguards I built on top of it</li>
              <li>4. A failing component degraded silently instead of visibly</li>
            </ol>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-medium text-zinc-900">What I built</h2>
            <ol className="flex flex-col gap-3 text-lg text-zinc-600">
              <li>1. An owned agent execution loop, replacing CrewAI entirely</li>
              <li>2. Real per-request timeouts and working stop/cancel for a run in flight</li>
              <li>3. Wave-based parallel execution across independent branches</li>
              <li>4. Observability on every fail-soft path</li>
            </ol>
          </div>
        </div>

        <div className="flex max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-medium text-zinc-900">
              An owned execution loop
            </h3>
            <p className="text-lg leading-relaxed text-zinc-600">
              CrewAI&apos;s executor silently overwrote my usage-logging
              callbacks and swallowed exceptions I raised to enforce spend
              caps — bugs that were hard to see because a framework layer sat
              between me and the model call. I replaced it with a small owned
              loop directly on LiteLLM&apos;s function-calling API, so both
              problems disappeared: there was no longer a framework fighting
              my own instrumentation.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-medium text-zinc-900">
              Timeouts, cancellation, and parallel waves
            </h3>
            <p className="text-lg leading-relaxed text-zinc-600">
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

        <p className="max-w-4xl text-2xl leading-relaxed text-zinc-700">
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
