/**
 * EntrySummary.tsx: the opening of a case study, before the deep sections.
 *
 * Role in the system: the case studies are long on purpose, because depth is
 * what a portfolio has to demonstrate. But most readers give a page well under a
 * minute, and one who leaves at that point should still leave knowing what the
 * work was and what it took. This is what they read.
 *
 * Key design decisions:
 *   - **Visible, never collapsed.** A closed disclosure is only opened by readers
 *     who were already committed, which is exactly the audience that does not
 *     need a summary.
 *   - **Prose, then two parallel numbered lists.** A first version used a
 *     bordered card of labelled rows, which read as a widget bolted onto a page
 *     made of prose. This shape instead reuses the page's own type: one intro
 *     paragraph at body size, then challenges and responses side by side. The
 *     numbering is what carries the argument, because challenge 3 and response 3
 *     are read as a pair.
 *   - **Pairs, not two lists.** The prop is an array of [challenge, response]
 *     tuples rather than two arrays, so the one-to-one mapping is enforced by the
 *     type and is visible at the call site. Two independent arrays would drift
 *     out of alignment the first time anyone edited one of them.
 *   - **A server component.** No state and no animation, so it stays out of the
 *     client bundle.
 */

/** Column headings. Fixed here so every entry frames its opening the same way. */
const HEADINGS = ["Challenges", "What I did"] as const;

/**
 * The opening of a case study: a scene-setting paragraph over a challenge and
 * response pair list.
 *
 * @param intro One paragraph carrying the tension, my role, and what I did. Sits
 *   directly under the hero's premise line, so it should not repeat it.
 * @param pairs Challenge and response, in order. Each pair renders as matching
 *   numbers in the two columns, so they must read as a genuine pair.
 */
export default function EntrySummary({
  intro,
  pairs,
}: {
  intro: string;
  pairs: [string, string][];
}) {
  const columns: [string, string[]][] = [
    [HEADINGS[0], pairs.map((p) => p[0])],
    [HEADINGS[1], pairs.map((p) => p[1])],
  ];

  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-xl leading-relaxed text-zinc-700">{intro}</p>

      <div className="grid max-w-4xl grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-2">
        {columns.map(([heading, items]) => (
          <div key={heading} className="flex flex-col gap-5">
            <h2 className="font-mono text-xs uppercase tracking-wide text-zinc-400">
              {heading}
            </h2>
            <ol className="flex flex-col gap-4">
              {items.map((text, i) => (
                <li key={text} className="flex gap-4">
                  <span className="shrink-0 pt-0.5 font-mono text-sm text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-relaxed text-zinc-600">
                    {text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
