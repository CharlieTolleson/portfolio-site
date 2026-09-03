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
 *   - **Prose, then paired rows.** A first version used a bordered card of
 *     labelled rows, which read as a widget bolted onto a page made of prose.
 *     This shape instead reuses the page's own type: one intro paragraph at body
 *     size, then challenges and responses side by side.
 *   - **One grid, not two lists.** Challenge 3 and response 3 are read as a pair,
 *     so they have to sit on the same line. Two independent columns let the
 *     numbering drift apart as soon as one item wraps to a different height,
 *     which is exactly what a reader uses to tell which response answers which
 *     challenge. Making each pair a grid row ties their baselines together and
 *     the row grows to fit the longer of the two.
 *   - **A description list.** The pairing is the semantic content, so `dt` and
 *     `dd` carry it for anyone not reading visually.
 *   - **Pairs, not two arrays.** The prop is an array of [challenge, response]
 *     tuples, so the one-to-one mapping is enforced by the type and visible at
 *     the call site.
 *   - **A server component.** No state and no animation, so it stays out of the
 *     client bundle.
 */

import { Fragment } from "react";

/** Column headings. Fixed here so every entry frames its opening the same way. */
const HEADINGS = ["Challenges", "What I did"] as const;

/** Shared grid template, so the headings line up with the columns below them. */
const COLUMNS = "grid-cols-1 gap-x-14 lg:grid-cols-2";

/**
 * The opening of a case study: a scene-setting paragraph over a challenge and
 * response pair list.
 *
 * @param intro One paragraph carrying the tension, my role, and what I did. Sits
 *   directly under the hero's premise line, so it should not repeat it.
 * @param pairs Challenge and response, in order. Each pair renders as one row
 *   with matching numbers, so the two halves must read as a genuine pair.
 */
export default function EntrySummary({
  intro,
  pairs,
}: {
  intro: string;
  pairs: [string, string][];
}) {
  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-3xl text-xl leading-relaxed text-zinc-700">{intro}</p>

      <div className="max-w-4xl">
        {/* Headings sit in their own grid rather than in the list, so their
            height never participates in the first pair's row. */}
        <div className={`hidden ${COLUMNS} lg:grid`}>
          {HEADINGS.map((h) => (
            <h2
              key={h}
              className="font-mono text-xs uppercase tracking-wide text-zinc-400"
            >
              {h}
            </h2>
          ))}
        </div>

        <dl className={`m-0 mt-5 grid ${COLUMNS} gap-y-7`}>
          {pairs.map(([challenge, response], i) => (
            <Fragment key={challenge}>
              <dt className="flex gap-4">
                <Marker n={i + 1} />
                <Body label={HEADINGS[0]} text={challenge} />
              </dt>
              <dd className="m-0 flex gap-4">
                <Marker n={i + 1} />
                <Body label={HEADINGS[1]} text={response} />
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** The pair number, shown against both halves so a row reads as one item. */
function Marker({ n }: { n: number }) {
  return (
    <span className="shrink-0 pt-0.5 font-mono text-sm text-zinc-400">{n}</span>
  );
}

/**
 * One half of a pair.
 *
 * @param label Column name, shown only below the large breakpoint. Stacked into
 *   a single column there is no header row, so each item has to say which side
 *   of the pair it is.
 * @param text The item itself.
 */
function Body({ label, text }: { label: string; text: string }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-wide text-zinc-400 lg:hidden">
        {label}
      </span>
      <span className="text-lg leading-relaxed text-zinc-600">{text}</span>
    </span>
  );
}
