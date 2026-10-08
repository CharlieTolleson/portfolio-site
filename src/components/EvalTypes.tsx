/**
 * EvalTypes.tsx: the three kinds of eval the teams used, when each one is the
 * right call, and what it costs.
 *
 * Role in the system: the second figure on the launch-bar entry, under "Code
 * where there's an answer, a judge where there isn't". A one-line decision
 * rule sits on top (is there a source of truth?), then one card per eval type
 * with its use, its examples from the three workflows, and its trade-off.
 *
 * Key design decisions:
 *   - **Human labels are a type, not an afterthought.** They grade nothing in
 *     routine runs, but they are what the judges are tuned and checked
 *     against, so leaving them out would hide where a judge's authority comes
 *     from.
 *   - **Examples are the page's own criteria**, so a reader can connect each
 *     card back to the grid above it.
 *   - **Same colored dots as the criteria grid** (`EvalTypeDot`), so the two
 *     figures read as one key.
 *   - **A server component.** Static content, no state.
 */

import EvalTypeDot from "@/components/EvalTypeDot";

/** One eval type and how to use it. */
type EvalTypeCard = {
  name: string;
  /** The mark used for this type in the criteria grid, repeated as a key. */
  mark: "code" | "judge" | "person";
  useWhen: string;
  examples: string[];
  tradeOff: string;
};

const TYPES: EvalTypeCard[] = [
  {
    name: "Code check",
    mark: "code",
    useWhen: "The right answer exists in a system of record.",
    examples: [
      "Spend in the email against the billing record",
      "Recipient against the meeting record",
      "Pitched products against the recommendation model's output",
    ],
    tradeOff:
      "Exact, cheap, and fails with a precise reason. Only as good as the source of truth behind it.",
  },
  {
    name: "LLM judge",
    mark: "judge",
    useWhen:
      "There's no single right answer, but a person could still call it pass or fail.",
    examples: [
      "The presentation reads as one argument",
      "The email's next steps match the call",
      "The tone fits the relationship",
    ],
    tradeOff:
      "Handles nuance code can't. Takes several rounds of prompt work to match people, and has to be watched for drift.",
  },
  {
    name: "Human labels",
    mark: "person",
    useWhen: "You need the ground truth a judge is tuned and checked against.",
    examples: [
      "A golden set of labeled examples per workflow",
      "The labels every judge was tuned on, with a held-out share it was scored on and never tuned against",
    ],
    tradeOff:
      "The most trustworthy and the slowest, so it's spent on calibration rather than routine grading.",
  },
];

/**
 * The small glyph for each type: the criteria grid's colored dot for the two
 * automated types, and a person for human labels.
 *
 * @param mark Which glyph to draw.
 */
function Glyph({ mark }: { mark: EvalTypeCard["mark"] }) {
  if (mark !== "person") return <EvalTypeDot type={mark} size={20} />;
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden>
      <circle cx={10} cy={6.5} r={3.5} fill="#18181b" />
      <path d="M3.5 18 a6.5 6.5 0 0 1 13 0 z" fill="#18181b" />
    </svg>
  );
}

/** The decision rule, then one card per eval type. */
export default function EvalTypes() {
  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
          The rule
        </span>
        <p className="m-0 text-base leading-relaxed text-zinc-800">
          Is there a source of truth for the answer?{" "}
          <span className="font-medium">Yes:</span> check it with code.{" "}
          <span className="font-medium">No:</span> ask an LLM judge one
          pass-or-fail question, tuned against human labels.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {TYPES.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center gap-2.5">
              <Glyph mark={t.mark} />
              <span className="text-lg font-medium text-zinc-900">
                {t.name}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                Use it when
              </span>
              <span className="text-sm leading-relaxed text-zinc-700">
                {t.useWhen}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                In these workflows
              </span>
              <ul className="m-0 flex list-disc flex-col gap-1 pl-4 text-sm leading-relaxed text-zinc-700 marker:text-zinc-300">
                {t.examples.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
            <div className="mt-auto flex flex-col gap-1 border-t border-zinc-100 pt-3">
              <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                Trade-off
              </span>
              <span className="text-sm leading-relaxed text-zinc-600">
                {t.tradeOff}
              </span>
            </div>
          </div>
        ))}
      </div>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        The three kinds of eval behind every criterion, with examples from the
        three workflows on this page.
      </figcaption>
    </figure>
  );
}
