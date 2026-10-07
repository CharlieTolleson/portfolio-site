"use client";

/**
 * CriteriaGrid.tsx: a sample of the eval criteria, which workflow each one
 * applies to, what kind of eval checks it, and how much it matters.
 *
 * Role in the system: the first figure on the launch-bar entry. It makes the
 * scale of the problem visible (shared criteria every workflow needs, plus
 * each workflow's own) and previews the two ideas the page develops next:
 * code checks versus LLM judges, and tiers.
 *
 * Key design decisions:
 *   - **Color carries the eval type, fill carries whether it gates.** Blue is
 *     a code check, emerald an LLM judge, and a hollow ring is track only
 *     (`EvalTypeDot`, shared with the other figures). An earlier version
 *     used square versus circle in one color, which was hard to read at this
 *     size.
 *   - **Legend first.** The key sits above the grid so a reader learns the
 *     encoding before meeting it, not after scanning fourteen rows.
 *   - **Hover or focus a row for its definition.** Fourteen one-line
 *     definitions inline would bury the grid, so one shows at a time in a
 *     panel under it. Rows are buttons, so this works by keyboard and tap.
 *   - **Data from `lib/launchBar`**, the same criteria the dashboard uses.
 */

import { useState } from "react";
import {
  CRITERIA,
  TIERS,
  WORKFLOWS,
  type Criterion,
} from "@/lib/launchBar";
import EvalTypeDot, { TYPE_LABEL } from "@/components/EvalTypeDot";

/** Row groups, in display order: shared criteria, then each workflow's own. */
const GROUPS: { label: string; rows: Criterion[] }[] = [
  {
    label: "Shared by every workflow",
    rows: CRITERIA.filter((c) => c.workflows.length === WORKFLOWS.length),
  },
  ...WORKFLOWS.map((w) => ({
    label: w.name,
    rows: CRITERIA.filter(
      (c) => c.workflows.length === 1 && c.workflows[0] === w.id
    ),
  })),
];

/** The criteria grid with a hover-for-definition panel. */
export default function CriteriaGrid() {
  const [active, setActive] = useState<Criterion>(
    CRITERIA.find((c) => c.id === "ranked") ?? CRITERIA[0]
  );

  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
          <span className="flex items-center gap-2">
            <EvalTypeDot type="code" /> {TYPE_LABEL.code}
          </span>
          <span className="flex items-center gap-2">
            <EvalTypeDot type="judge" /> {TYPE_LABEL.judge}
          </span>
          <span className="flex items-center gap-2">
            <EvalTypeDot type="judge" tracked color="#a1a1aa" /> Hollow: track
            only, never gates
          </span>
        </div>

        <div className="flex flex-col">
          {/* Column headings. */}
          <div
            aria-hidden
            className="grid grid-cols-[1fr_4.5rem_repeat(3,2.75rem)] items-end gap-x-2 border-b border-zinc-200 pb-2 font-mono text-[11px] uppercase tracking-wide text-zinc-400 sm:grid-cols-[1fr_6rem_repeat(3,5.5rem)] sm:text-xs"
          >
            <span>Criterion</span>
            <span>Tier</span>
            {WORKFLOWS.map((w) => (
              <span key={w.id} className="text-center">
                {w.short}
              </span>
            ))}
          </div>

          {GROUPS.map((g) => (
            <div key={g.label} className="flex flex-col">
              <div className="pt-4 pb-1 text-xs font-medium text-zinc-500">
                {g.label}
              </div>
              {g.rows.map((c) => {
                const gated = c.tier !== "track";
                const on = active.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`${c.name}: ${c.type === "code" ? "code check" : "LLM judge"}, ${TIERS[c.tier].label.toLowerCase()}, applies to ${WORKFLOWS.filter((w) => c.workflows.includes(w.id)).map((w) => w.name.toLowerCase()).join(", ")}`}
                    onMouseEnter={() => setActive(c)}
                    onFocus={() => setActive(c)}
                    onClick={() => setActive(c)}
                    aria-pressed={on}
                    className={`grid grid-cols-[1fr_4.5rem_repeat(3,2.75rem)] items-center gap-x-2 rounded-md py-1.5 text-left transition-colors sm:grid-cols-[1fr_6rem_repeat(3,5.5rem)] ${
                      on ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span className="pl-1 text-sm text-zinc-800">
                      {c.name}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500 sm:text-xs">
                      {TIERS[c.tier].label}
                    </span>
                    {WORKFLOWS.map((w) => (
                      <span key={w.id} className="flex justify-center">
                        {c.workflows.includes(w.id) ? (
                          <EvalTypeDot type={c.type} tracked={!gated} size={16} />
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-zinc-200" />
                        )}
                      </span>
                    ))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* The definition of whichever row is active. */}
        <div
          aria-live="polite"
          className="mt-5 flex flex-col gap-1 rounded-lg bg-zinc-50 px-4 py-3"
        >
          <span className="text-sm font-medium text-zinc-900">
            {active.name}
          </span>
          <span className="text-sm leading-relaxed text-zinc-600">
            {active.detail}{" "}
            <span className="text-zinc-500">
              {TYPE_LABEL[active.type]}
              {active.tier === "track"
                ? ", track only."
                : `, ${TIERS[active.tier].label.toLowerCase()} tier.`}
            </span>
          </span>
        </div>

      </div>

      <figcaption className="text-sm leading-relaxed text-zinc-500">
        A sample of the criteria for three of the seven workflows. Across all
        seven there were close to 100. Hover or tap a row for its definition.
        Criteria and tiers are representative, not Meta&apos;s actual list.
      </figcaption>
    </figure>
  );
}
