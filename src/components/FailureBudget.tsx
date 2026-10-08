/**
 * FailureBudget.tsx: the tiers, drawn as the question every team answered:
 * out of 100 outputs, how many can fail this criterion?
 *
 * Role in the system: the figure under "How often is it OK for this to
 * fail?" on the launch-bar entry. Each tier is a 10 by 10 grid of outputs with
 * its tolerated failures marked, beside the pass rate that implies and an
 * example criterion. Track-only criteria get a grid with no budget at all,
 * because they never gate.
 *
 * Key design decisions:
 *   - **Counts out of 100, not percentages.** "1 in 100" is the framing teams
 *     were asked to think in; a grid of dots makes the difference between 1,
 *     5, and 10 failures visible at a glance in a way 99%, 95%, and 90% are not.
 *   - **Amber marks the tolerated failures**, the site's "something is wrong"
 *     color; passes are light gray so the budget stands out.
 *   - **Illustrative thresholds from `lib/launchBar`**, labeled as such. Each
 *     team set its own per criterion and per stage.
 *   - **Examples are named in full**, with their workflow ("Reads as one
 *     argument" in the client presentation), because a bare "e.g." under a tier read as
 *     a description of the tier rather than a criterion in it.
 *   - **A server component.** Static content, no state.
 */

import {
  CRITERIA,
  TIERS,
  TIER_ORDER,
  WORKFLOWS,
  type Tier,
} from "@/lib/launchBar";

/** An example criterion for each tier, by id, taken from the grid above. */
const EXAMPLE: Record<Tier, string> = {
  critical: "spend",
  high: "story",
  standard: "grammar",
  track: "sentiment",
};

/**
 * A 10 by 10 grid of outputs with the first `fail` of them marked as failures.
 *
 * @param fail Tolerated failures out of 100, or null for a track-only grid.
 */
function Grid({ fail }: { fail: number | null }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-24 w-24 shrink-0"
      role="img"
      aria-label={
        fail === null
          ? "100 outputs, no failure budget: measured only"
          : `${fail} of 100 outputs allowed to fail`
      }
    >
      {Array.from({ length: 100 }, (_, i) => {
        // Failures fill from the bottom-right, so the eye reads them as the
        // small remainder rather than the start of the grid.
        const idx = 99 - i;
        const failed = fail !== null && idx < fail;
        return (
          <circle
            key={i}
            cx={5 + (i % 10) * 10}
            cy={5 + Math.floor(i / 10) * 10}
            r={3.4}
            fill={fail === null ? "#e4e4e7" : failed ? "#d97706" : "#d4d4d8"}
          />
        );
      })}
    </svg>
  );
}

/** One row per tier: the grid, the bar it implies, and an example. */
export default function FailureBudget() {
  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TIER_ORDER.map((tier) => {
          const t = TIERS[tier];
          const fail = t.failOneIn === null ? null : 100 / t.failOneIn;
          const example = CRITERIA.find((c) => c.id === EXAMPLE[tier]);
          return (
            <div
              key={tier}
              className="flex gap-5 rounded-xl border border-zinc-200 bg-white p-5"
            >
              <Grid fail={fail} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                  {t.label}
                </span>
                <span className="text-lg font-medium leading-snug text-zinc-900">
                  {fail === null
                    ? "Never gates"
                    : `${fail} in 100 may fail`}
                  {t.threshold !== null && (
                    <span className="font-mono text-sm font-normal text-zinc-500">
                      {" "}
                      · bar {t.threshold}%
                    </span>
                  )}
                </span>
                <span className="text-sm leading-relaxed text-zinc-600">
                  {t.meaning}
                </span>
                {example && (
                  <span className="mt-1 text-sm leading-relaxed text-zinc-500">
                    <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                      Example criterion
                    </span>
                    <br />
                    &ldquo;{example.name}&rdquo;{" "}
                    {example.workflows.length === WORKFLOWS.length
                      ? "in every workflow"
                      : `in the ${WORKFLOWS.find((w) => w.id === example.workflows[0])?.name.toLowerCase()}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Each grid is 100 outputs; amber marks how many may fail before the
        criterion blocks launch. Tiers and numbers are illustrative: every team
        set its own threshold for each criterion at each stage.
      </figcaption>
    </figure>
  );
}
