/**
 * LaunchGates.tsx: the three stages a workflow had to clear, each on a
 * bigger, more realistic sample than the last.
 *
 * Role in the system: the figure under "Three gates to production" on the
 * launch-bar entry. Two stages gate the launch; the third runs for as long as
 * the workflow does and can take it back out of production.
 *
 * Key design decisions:
 *   - **Sample size is the through-line.** Each card leads with what it
 *     measures on, because the reason for three stages is that a hand-labeled
 *     set is quick to check but imprecise and live traffic is precise but slow.
 *   - **The third stage looks different.** It is dashed and labeled "after
 *     launch", since it is a standing guard rather than a gate to pass once.
 *   - **Horizontal on wide screens, vertical on phones**, with arrows that turn
 *     to match.
 *   - **A server component.** Static content, no state.
 */


/** One stage of the launch process. */
type Stage = {
  n: number;
  name: string;
  sample: string;
  body: string;
  role: string;
  /** False for the post-launch stage, which guards rather than gates. */
  gate: boolean;
};

const STAGES: Stage[] = [
  {
    n: 1,
    name: "Golden set",
    sample: "Human-labeled examples, run several times each",
    body: "Run on every change. Repeating each example shows how much the agent varies from run to run, not just whether it passed once.",
    role: "Gates launch",
    gate: true,
  },
  {
    n: 2,
    name: "Shadow traffic",
    sample: "Two weeks of live requests",
    body: "The workflow runs silently beside sellers, and its outputs are compared against what they actually produced. This is where the volume is, and where the read gets precise.",
    role: "Gates launch",
    gate: true,
  },
  {
    n: 3,
    name: "Production monitoring",
    sample: "Every output, for as long as the workflow runs",
    body: "The same evals keep running. A gated criterion that falls below its bar sidelines the workflow until it's fixed.",
    role: "Can sideline it",
    gate: false,
  },
];

/** An arrow between stages: right on wide screens, down on phones. */
function Arrow() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center text-zinc-300 lg:px-1"
    >
      <span className="text-2xl leading-none lg:hidden">↓</span>
      <span className="hidden text-2xl leading-none lg:inline">→</span>
    </div>
  );
}

/** The three-stage pipeline. */
export default function LaunchGates() {
  return (
    <figure className="m-0 flex flex-col gap-5">
      <ol className="m-0 flex list-none flex-col gap-2 p-0 lg:flex-row lg:items-stretch">
        {STAGES.map((s, i) => (
          <li key={s.n} className="contents">
            {i > 0 && <Arrow />}
            <div
              className={`flex flex-1 flex-col gap-3 rounded-xl bg-white p-5 ${
                s.gate
                  ? "border border-zinc-200"
                  : "border-2 border-dashed border-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="whitespace-nowrap font-mono text-sm text-zinc-400">
                  {s.gate ? `Gate ${s.n}` : "After launch"}
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-xs ${
                    s.gate
                      ? "bg-blue-600 text-white"
                      : "border border-amber-600 text-amber-700"
                  }`}
                >
                  {s.role}
                </span>
              </div>
              <span className="text-lg font-medium text-zinc-900">
                {s.name}
              </span>
              <span className="text-sm font-medium text-zinc-700">
                {s.sample}
              </span>
              <span className="text-sm leading-relaxed text-zinc-600">
                {s.body}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Every stage runs the same evals against its own thresholds. The first
        two decide whether a workflow launches; the third decides whether it
        stays launched.
      </figcaption>
    </figure>
  );
}
