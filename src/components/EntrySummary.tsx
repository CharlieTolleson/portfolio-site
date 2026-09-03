/**
 * EntrySummary.tsx: the always-visible short version at the top of a case study.
 *
 * Role in the system: the case studies are long on purpose, because depth is the
 * thing a portfolio has to demonstrate. But most readers give a page well under a
 * minute, and a reader who leaves at that point should still leave knowing what
 * the work was and what it changed. This block is what they read.
 *
 * Key design decisions:
 *   - **Visible, never collapsed.** A closed disclosure is only opened by readers
 *     who were already committed, which is exactly the audience that does not
 *     need a summary. Hiding it would mean doing the work and reaching nobody it
 *     was written for.
 *   - **Fixed three-part shape, enforced by the props.** Problem, build, outcome,
 *     in that order, on every entry. Taking three named strings rather than an
 *     open list of rows is deliberate: it stops the entries from drifting into
 *     three different summary formats as more get written.
 *   - **Subordinate to the hero.** Body type rather than heading type, inside a
 *     bordered card, so it reads as the first piece of content rather than
 *     competing with the title above it.
 *   - **A server component.** No state and no animation, so it stays out of the
 *     client bundle.
 */

/** Row labels, fixed so every entry summarizes itself the same way. */
const LABELS = ["The problem", "What I built", "What changed"] as const;

/**
 * The short version of a case study, rendered under the hero subtitle.
 *
 * @param problem What was wrong, and why it was expensive to leave alone.
 * @param built What I made, in one sentence a non-specialist can follow.
 * @param changed The outcome, in concrete terms rather than adjectives.
 */
export default function EntrySummary({
  problem,
  built,
  changed,
}: {
  problem: string;
  built: string;
  changed: string;
}) {
  const rows: [string, string][] = [
    [LABELS[0], problem],
    [LABELS[1], built],
    [LABELS[2], changed],
  ];

  return (
    <section
      aria-label="Summary"
      className="max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 sm:p-7"
    >
      <p className="mb-5 font-mono text-xs uppercase tracking-wide text-zinc-400">
        In short
      </p>
      <dl className="flex flex-col gap-4">
        {rows.map(([label, text]) => (
          <div key={label} className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <dt className="shrink-0 font-mono text-xs uppercase tracking-wide text-zinc-400 sm:w-32 sm:pt-2">
              {label}
            </dt>
            <dd className="m-0 text-lg leading-relaxed text-zinc-700">{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
