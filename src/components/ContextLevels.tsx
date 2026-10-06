/**
 * ContextLevels.tsx: the context hierarchy, company down to individual.
 *
 * Role in the system: the figure for "Knowledge that belongs to the team" in
 * the agent-ready-org entry. It has to make three rules legible at a glance to
 * a leader who will never open a context file: levels nest like the org chart,
 * preferences cascade down with the most specific winning, and proven
 * knowledge moves up.
 *
 * Key design decisions:
 *   - **Nested boxes, not a tree.** Each level literally contains the ones
 *     below it, which is how the rules work: an individual's agent reads every
 *     level above it too.
 *   - **The one exception is marked on the box it belongs to.** "Definitions
 *     are set here" sits on the company level, because the most important rule
 *     in the framework is the one that breaks the cascade.
 *   - **A server component.** Static and stateless, so it stays out of the
 *     client bundle. Content comes from `LEVELS` in `lib/agentReadyOrg`.
 */

import { LEVELS, type Level } from "@/lib/agentReadyOrg";

/**
 * One level and, inside it, every level below.
 *
 * @param levels The remaining levels, widest first.
 * @param depth How deep we are, for the background shade.
 */
function Nest({ levels, depth }: { levels: Level[]; depth: number }) {
  const [level, ...rest] = levels;
  if (!level) return null;
  // Shade deepens one step per level so the nesting reads without borders alone.
  const shade = ["bg-white", "bg-zinc-50", "bg-zinc-100/70", "bg-zinc-100"][depth];
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 sm:p-5 ${shade}`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-sm uppercase tracking-wide text-zinc-900">
            {level.name}
          </span>
          {depth === 0 && (
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-white">
              Definitions are set here
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-zinc-400">{level.owner}</span>
      </div>
      <span className="text-sm leading-relaxed text-zinc-600">{level.holds}</span>
      <Nest levels={rest} depth={depth + 1} />
    </div>
  );
}

/** The hierarchy figure: nested levels beside the three rules that govern them. */
export default function ContextLevels() {
  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_15rem] lg:gap-10">
        <Nest levels={LEVELS} depth={0} />

        <ul className="m-0 flex list-none flex-col gap-6 p-0 lg:justify-center">
          <Rule arrow="↓" title="Preferences cascade down">
            Each level can tailor how work gets done. The most specific level
            wins.
          </Rule>
          <Rule arrow="✕" title="Definitions never do">
            What a number means is set once, at the top, and linked from below
            rather than restated.
          </Rule>
          <Rule arrow="↑" title="Knowledge is promoted up">
            When one person&apos;s note proves useful to a second, it moves up a
            level.
          </Rule>
        </ul>
      </div>
      <figcaption className="text-sm leading-relaxed text-zinc-500">
        Every agent reads its own level and every level above it. The owner of
        each level is the person or group that keeps it true.
      </figcaption>
    </figure>
  );
}

/**
 * One of the hierarchy's rules.
 *
 * @param arrow A single glyph showing the direction of the rule.
 * @param title The rule in a few words.
 * @param children One sentence of explanation.
 */
function Rule({
  arrow,
  title,
  children,
}: {
  arrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 font-mono text-sm text-zinc-700"
      >
        {arrow}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-base font-medium text-zinc-900">{title}</span>
        <span className="text-sm leading-relaxed text-zinc-600">{children}</span>
      </span>
    </li>
  );
}
