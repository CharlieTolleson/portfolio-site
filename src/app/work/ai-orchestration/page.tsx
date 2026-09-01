import WorkflowGraph from "@/components/WorkflowGraph";

export const metadata = {
  title: "Interactive AI Agent Orchestration Suite | Charlie Tolleson",
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
            Creator &amp; Architect · Hyperion, personal AI workspace
          </p>
        </div>

        <div className="max-w-4xl text-2xl leading-relaxed text-zinc-700">
          <p>
            Hyperion is the multi-agent orchestration layer of my personal AI
            workspace. Point it at a single prompt and it will draft a
            workflow on its own, but a workflow is never a black box: I can
            open any of them in a graphical builder, rewire which nodes feed
            which, swap the model or persona behind a node, and save the
            result as a reusable template. Auto-generated or hand-built, the
            same idea runs underneath: no single model is the right choice
            for every step of a task, so each role gets whichever model
            actually fits it best. Below is the real shape of one workflow:
            five research angles running in parallel, converging into a
            synthesis step, splitting into specialist review passes, and
            resolving into a single verdict. Hover a node to see its persona
            and instruction.
          </p>
        </div>

        <WorkflowGraph variant="full" />

        <div className="flex max-w-4xl flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-medium text-zinc-900">
              A team of specialists
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              Every node in a workflow is a persona, not just a model call.
              The market-sizing node reasons like a market analyst. The
              critic argues like someone whose only job is finding the hole
              in the plan. The assessor weighs critique against advocacy like
              a partner deciding whether to greenlight a deal. Stacked
              together, a workflow behaves less like a single assistant and
              more like a small, elite team: each member narrowly focused on
              one job, briefed with just enough context to do it well, and
              reporting up to whoever synthesizes the final call.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-medium text-zinc-900">
              Balancing strengths and cost
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              Every model has its own balance of capability, speed, and
              price. Research that fans out into five parallel angles does
              not need the most expensive model available, since the value
              there comes from breadth rather than depth, so those nodes run
              on a fast general-purpose model. The step that matters most,
              turning five independent research threads into one coherent
              judgment, runs on the model best suited to synthesis. The
              planner and the specialist review nodes each get whatever tier
              fits their role. All of it routes through LiteLLM, so moving a
              node from one provider to another is a one-line config change
              rather than a rewrite.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-medium text-zinc-900">
              Why a graph, not a pipeline
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              A fixed linear pipeline forces every step through the same path
              in the same order, which means every step pays the same cost
              whether it needed to or not. Building the orchestrator around
              an arbitrary directed graph instead means a workflow&apos;s
              shape can actually match the task: independent research runs in
              parallel, review happens once synthesis is done, and the model
              assigned to each step is a property of that role rather than a
              global default. That flexibility comes with real trade-offs. A
              graph is harder to reason about than a straight line, mixing
              models means each node can carry a slightly different voice or
              judgment style that the synthesis step has to reconcile, and
              more parallelism means more surface area for one slow node to
              become the bottleneck everyone else is waiting on.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-medium text-zinc-900">
              What&apos;s next
            </h2>
            <p className="text-lg leading-relaxed text-zinc-600">
              Right now, deciding which model belongs on which node is still
              mostly judgment. The next iteration is making that trade-off
              measurable: running evals against each node&apos;s output to
              score quality per model, and building a dashboard on top of the
              run traces the system already collects, so cost, latency, and
              quality per model are visible per workflow instead of
              anecdotal.
            </p>
          </div>
        </div>

        <div className="flex max-w-4xl flex-col gap-4 border-t border-zinc-200 pt-10">
          <p className="text-2xl leading-relaxed text-zinc-700">
            Hyperion runs workflows like this in production for my own daily
            use.
          </p>
          <a
            href="https://github.com/CharlieTolleson/personal-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit font-mono text-lg text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500"
          >
            View the code on GitHub ↗
          </a>
        </div>
      </main>
    </div>
  );
}
