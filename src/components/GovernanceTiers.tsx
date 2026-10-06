/**
 * GovernanceTiers.tsx: governance scaled to the stakes.
 *
 * Role in the system: the figure for "Governance proportional to the stakes"
 * in the agent-ready-org entry. A leader's first worry about any governance
 * framework is that it becomes bureaucracy nobody follows. This shows the
 * answer as a gradient: the numbers leaders act on carry real process, and
 * personal notes carry none.
 *
 * Key design decisions:
 *   - **A weight marker per row.** Four segments, filled to the tier's weight,
 *     so the gradient reads before any text does.
 *   - **A grid on desktop, cards on a phone.** Five columns of prose cannot fit
 *     a 375px screen, so below `lg` each tier becomes a labelled card.
 *   - **A server component.** Static; content comes from `TIERS` in
 *     `lib/agentReadyOrg`.
 */

import { TIERS } from "@/lib/agentReadyOrg";

const COLUMNS = ["Owner", "Review", "When it changes"] as const;

/** Shared grid template, so the header row lines up with the tiers below. */
const GRID = "lg:grid lg:grid-cols-[15rem_1fr_1fr_1fr] lg:gap-x-8";

/**
 * Four segments, `weight` of them filled.
 *
 * @param weight How much process the tier carries, 1 to 4.
 */
function Weight({ weight }: { weight: number }) {
  return (
    <span
      className="flex gap-1"
      role="img"
      aria-label={`Governance weight ${weight} of 4`}
    >
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-6 rounded-full ${
            i <= weight ? "bg-blue-600" : "bg-zinc-200"
          }`}
        />
      ))}
    </span>
  );
}

/** The governance tiers, heaviest first. */
export default function GovernanceTiers() {
  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div
          className={`hidden border-b border-zinc-100 pb-3 font-mono text-xs uppercase tracking-wide text-zinc-400 ${GRID}`}
        >
          <span>Kind of context</span>
          {COLUMNS.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>

        <ul className="m-0 flex list-none flex-col divide-y divide-zinc-100 p-0">
          {TIERS.map((t) => (
            <li key={t.kind} className={`flex flex-col gap-3 py-5 ${GRID}`}>
              <span className="flex flex-col gap-2">
                <span className="text-base font-medium text-zinc-900">
                  {t.kind}
                </span>
                <Weight weight={t.weight} />
              </span>
              {[t.owner, t.review, t.onChange].map((v, i) => (
                <span key={COLUMNS[i]} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-zinc-400 lg:hidden">
                    {COLUMNS[i]}
                  </span>
                  <span className="text-sm leading-relaxed text-zinc-600">{v}</span>
                </span>
              ))}
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Process follows stakes. The numbers leaders act on carry the most, and
        personal notes carry none until they prove useful enough to share.
      </figcaption>
    </figure>
  );
}
