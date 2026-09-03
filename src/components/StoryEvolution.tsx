"use client";

/**
 * StoryEvolution.tsx: one story's size and vocabulary, day by day.
 *
 * Role in the system: splitting the graph finds stories in a snapshot. This
 * figure is the part that makes it an alert system: run the same split on
 * consecutive windows and a story becomes an object with a life, one that can be
 * watched growing, fading, and coming back. The IBM / Red Hat acquisition is the
 * example because both of its peaks are public record, so a reader can check the
 * dates against the events rather than taking the shape on trust.
 *
 * Key design decisions:
 *   - **The curve is derived, the annotations are not.** Component size is
 *     computed from the phrase windows in `lib/storyTimeline`; the event labels
 *     are placed on the dates the public record gives. The spikes were not told
 *     where to land, which is the whole reason the figure is worth showing.
 *   - **Selecting a day is the second half of the figure.** A size curve alone
 *     says a story got bigger. The point being made is that it came back *with
 *     different words*, and only the phrase panel can show that.
 *   - **One series, so no legend and no categorical colour.** Blue carries the
 *     measured series; amber is reserved for phrases that are new on the selected
 *     day, which is the comparison the figure exists to make.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { scaleLinear } from "@visx/scale";
import {
  STORY_DAYS,
  MAX_SIZE,
  EVENTS,
  DEFAULT_DAY,
  type StoryDay,
} from "@/lib/storyTimeline";

const W = 900;
const H = 320;
const PAD_L = 46;
const PAD_R = 26;
const PAD_T = 58;
const PAD_B = 44;

const SERIES = "#2563eb";
const NEW = "#d97706";

const x = scaleLinear<number>({
  domain: [0, STORY_DAYS.length - 1],
  range: [PAD_L, W - PAD_R],
});

const y = scaleLinear<number>({
  domain: [0, MAX_SIZE * 1.08],
  range: [H - PAD_B, PAD_T],
});

/**
 * Vertical rows for the event labels, so annotations on adjacent days do not
 * print on top of each other.
 *
 * @returns One row index per entry in `EVENTS`, in the same order.
 */
const EVENT_ROWS: number[] = (() => {
  const rows: number[] = [];
  EVENTS.forEach((e, i) => {
    const prev = EVENTS[i - 1];
    rows.push(prev && e.day - prev.day < 4 ? rows[i - 1] + 1 : 0);
  });
  return rows;
})();

/** Y gridlines. Three ticks is enough to read a magnitude off. */
const TICKS = [0, 20, 40].filter((t) => t <= MAX_SIZE * 1.08);

/**
 * The size-over-time chart.
 *
 * @param selected Index of the currently selected day.
 * @param onSelect Called with a day index when a point is activated.
 */
function Chart({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (i: number) => void;
}) {
  const line = STORY_DAYS.map(
    (d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.size)}`
  ).join(" ");
  const area = `${line} L ${x(STORY_DAYS.length - 1)} ${y(0)} L ${x(0)} ${y(
    0
  )} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Story size over ${STORY_DAYS.length} days, peaking when the EU cleared the acquisition and again, higher, when it closed.`}
    >
      {TICKS.map((t) => (
        <g key={t}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(t)}
            y2={y(t)}
            stroke="#e4e4e7"
            strokeWidth={1}
          />
          <text
            x={PAD_L - 10}
            y={y(t) + 4}
            textAnchor="end"
            fontSize={11}
            fill="#a1a1aa"
            fontFamily="var(--font-geist-mono, monospace)"
          >
            {t}
          </text>
        </g>
      ))}

      {/* Event annotations, behind the series so the data stays on top. */}
      {EVENTS.map((e, i) => (
        <g key={e.label}>
          <line
            x1={x(e.day)}
            x2={x(e.day)}
            y1={PAD_T - 34 + EVENT_ROWS[i] * 15}
            y2={H - PAD_B}
            stroke="#d4d4d8"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={x(e.day) + 6}
            y={PAD_T - 38 + EVENT_ROWS[i] * 15}
            fontSize={11.5}
            fill="#71717a"
          >
            {e.label}
          </text>
        </g>
      ))}

      <motion.path
        d={area}
        fill={SERIES}
        fillOpacity={0.08}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={SERIES}
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      {/* Selected-day marker. */}
      <line
        x1={x(selected)}
        x2={x(selected)}
        y1={y(0)}
        y2={y(STORY_DAYS[selected].size)}
        stroke={SERIES}
        strokeWidth={1.5}
        strokeOpacity={0.35}
      />

      {STORY_DAYS.map((d, i) => (
        <g
          key={d.iso}
          onClick={() => onSelect(i)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              onSelect(i);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${d.label}: ${d.size} phrases`}
          className="cursor-pointer outline-none [&:focus-visible>circle:first-of-type]:stroke-zinc-900"
        >
          {/* Invisible hit target, larger than the mark it selects. */}
          <circle cx={x(i)} cy={y(d.size)} r={13} fill="transparent" />
          <circle
            cx={x(i)}
            cy={y(d.size)}
            r={i === selected ? 5.5 : 3}
            fill={i === selected ? SERIES : "#ffffff"}
            stroke={SERIES}
            strokeWidth={2}
          />
        </g>
      ))}

      {/* Only the selected day is labelled with its value, so the chart never
          carries a number on every point. */}
      <text
        x={x(selected)}
        y={y(STORY_DAYS[selected].size) - 14}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill={SERIES}
        fontFamily="var(--font-geist-mono, monospace)"
      >
        {STORY_DAYS[selected].size}
      </text>

      {STORY_DAYS.map((d, i) =>
        i % 3 === 0 || i === selected ? (
          <text
            key={`t-${d.iso}`}
            x={x(i)}
            y={H - PAD_B + 20}
            textAnchor="middle"
            fontSize={11}
            fill={i === selected ? "#18181b" : "#a1a1aa"}
            fontWeight={i === selected ? 600 : 400}
          >
            {d.label}
          </text>
        ) : null
      )}

      {/* Left-aligned with the plot area rather than with the tick labels: an
          end-anchored title at this x runs off the left edge of the viewBox. */}
      <text
        x={PAD_L}
        y={PAD_T - 16}
        fontSize={11}
        fill="#a1a1aa"
        fontFamily="var(--font-geist-mono, monospace)"
      >
        phrases in component
      </text>
    </svg>
  );
}

/**
 * The selected day's vocabulary.
 *
 * @param day The day to list.
 */
function Phrases({ day }: { day: StoryDay }) {
  const isNew = new Set(day.entered);
  // New phrases lead, because the question this panel answers is what changed.
  const ordered = [
    ...day.phrases.filter((p) => isNew.has(p)),
    ...day.phrases.filter((p) => !isNew.has(p)),
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-lg font-medium text-zinc-900">{day.label}</span>
        <span className="font-mono text-xs text-zinc-500">
          {day.size} phrases
        </span>
        {day.entered.length > 0 && (
          <span className="font-mono text-xs" style={{ color: NEW }}>
            {day.entered.length} new
          </span>
        )}
        {day.exited.length > 0 && (
          <span className="font-mono text-xs text-zinc-400">
            {day.exited.length} dropped
          </span>
        )}
      </div>

      <ul className="flex flex-wrap gap-2">
        {ordered.map((p) => (
          <motion.li
            key={p}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            className={`rounded-md border px-2.5 py-1 text-sm ${
              isNew.has(p)
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            {p}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The story-evolution figure: a size curve over a per-day phrase list.
 */
export default function StoryEvolution() {
  const [day, setDay] = useState(DEFAULT_DAY);

  return (
    <figure className="m-0 flex flex-col gap-5">
      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[680px]">
          <Chart selected={day} onSelect={setDay} />
        </div>
      </div>

      <p className="font-mono text-xs text-zinc-400 sm:hidden">
        scroll the chart sideways →
      </p>

      <Phrases day={STORY_DAYS[day]} />

      <figcaption className="max-w-3xl text-sm leading-relaxed text-zinc-500">
        Select any day to see the phrases in the story component that morning,
        with the ones that arrived overnight marked. The dates and the events are
        the public record of the acquisition; the phrase set is reconstructed from
        the poster I presented internally, since the original outputs stayed at
        IBM.
      </figcaption>
    </figure>
  );
}
