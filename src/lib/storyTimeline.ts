/**
 * storyTimeline.ts: the IBM / Red Hat story, as the algorithm saw it evolve.
 *
 * Role in the system: the splitting algorithm finds stories in the graph as it
 * stands. The claim that makes it an alert system rather than a clustering toy
 * is that re-running the extraction against the same accumulating graph tracks
 * one story as it grows, fades, and comes back. This module is the data behind
 * that figure.
 *
 * Key design decisions:
 *   - **Keyword windows, not a hand-typed curve.** The size of a story on a given
 *     day is derived by counting which key phrases were live that day, so the
 *     line chart and the keyword panel underneath it cannot disagree. Writing the
 *     curve and the phrase lists as two separate arrays would let them drift the
 *     first time either was edited.
 *   - **A reconstruction, clearly labelled.** The underlying run was on IBM's
 *     internal deployment and those outputs are not mine to publish. The dates
 *     and the events are the public record of the acquisition; the phrase set is
 *     rebuilt from the poster I presented internally, and the shape of the curve
 *     is the shape I observed. It is not a re-run of the original job.
 *   - **Two peaks, not one.** The reason this example was worth presenting is the
 *     second peak. A story that decays and then returns with a *different*
 *     vocabulary is the case a keyword alert handles badly, and the case an
 *     accumulating graph handles naturally.
 */

/** First day of the observed window. Day indices below are offsets from here. */
const START = new Date(Date.UTC(2019, 5, 26));

/** Number of days in the window. */
const DAY_COUNT = 21;

/**
 * A key phrase and the inclusive range of days it was present in the story
 * component.
 */
type Phrase = { text: string; from: number; to: number };

/**
 * The story's vocabulary over the window.
 *
 * The three groups are the three phases: the entities that are always attached
 * to the companies, the burst of regulatory language when the EU cleared the
 * deal, and the entirely different burst of product and market language when the
 * deal actually closed twelve days later.
 */
const PHRASES: Phrase[] = [
  // Always present: the entities the story is about.
  { text: "IBM", from: 0, to: 20 },
  { text: "Red Hat", from: 0, to: 20 },
  { text: "International Business Machines Corp", from: 0, to: 20 },
  { text: "open source", from: 0, to: 20 },
  { text: "hybrid cloud", from: 0, to: 20 },
  { text: "cloud computing", from: 0, to: 20 },
  { text: "enterprise software", from: 0, to: 20 },
  { text: "software company", from: 0, to: 18 },

  // Phase one: the European Commission clears the acquisition.
  { text: "antitrust approval", from: 1, to: 6 },
  { text: "European Commission", from: 1, to: 5 },
  { text: "BRUSSELS", from: 1, to: 4 },
  { text: "EU regulators", from: 1, to: 5 },
  { text: "regulatory clearance", from: 1, to: 7 },
  { text: "acquisition of software company Red Hat", from: 1, to: 8 },
  { text: "merger review", from: 1, to: 4 },
  { text: "competition authority", from: 1, to: 3 },
  { text: "unconditional approval", from: 1, to: 3 },
  { text: "$34 billion", from: 1, to: 9 },
  { text: "Foo Yun Chee", from: 1, to: 2 },
  { text: "remedies", from: 1, to: 2 },
  { text: "clearance decision", from: 1, to: 3 },
  { text: "antitrust regulators", from: 1, to: 4 },
  { text: "approval process", from: 1, to: 3 },
  { text: "pending acquisition", from: 1, to: 10 },
  { text: "shareholders", from: 1, to: 4 },
  { text: "deal value", from: 1, to: 4 },
  { text: "tech industry", from: 1, to: 5 },
  { text: "Brussels regulators", from: 2, to: 3 },

  // The lull: background market chatter, no event driving it.
  { text: "cloud market", from: 5, to: 9 },
  { text: "Microsoft Azure", from: 6, to: 8 },
  { text: "Amazon Web Services", from: 6, to: 9 },
  { text: "integration plans", from: 7, to: 11 },
  { text: "closing timeline", from: 8, to: 12 },

  // Phase two: the acquisition closes. A different vocabulary entirely.
  { text: "acquisition closes", from: 13, to: 18 },
  { text: "completed acquisition", from: 13, to: 17 },
  { text: "Jim Whitehurst", from: 13, to: 20 },
  { text: "Red Hat CEO Jim Whitehurst", from: 13, to: 17 },
  { text: "IBM CEO Ginni Rometty", from: 13, to: 17 },
  { text: "Ginni Rometty", from: 13, to: 19 },
  { text: "$190 per share", from: 13, to: 16 },
  { text: "closing price", from: 13, to: 15 },
  { text: "Nasdaq", from: 13, to: 16 },
  { text: "shares of tech stocks", from: 13, to: 16 },
  { text: "landmark acquisition", from: 13, to: 15 },
  { text: "deal completion", from: 13, to: 16 },
  { text: "distinct unit", from: 13, to: 17 },
  { text: "combined company", from: 13, to: 18 },
  { text: "largest software acquisition", from: 13, to: 17 },
  { text: "Armonk", from: 13, to: 15 },
  { text: "Raleigh", from: 13, to: 15 },
  { text: "investor reaction", from: 13, to: 15 },

  // Phase three: the executives brief the press and the analysts respond.
  { text: "press conference", from: 14, to: 16 },
  { text: "next-generation hybrid multicloud platform", from: 14, to: 19 },
  { text: "OpenShift", from: 14, to: 20 },
  { text: "Kubernetes", from: 14, to: 20 },
  { text: "container technology", from: 14, to: 19 },
  { text: "multicloud strategy", from: 14, to: 18 },
  { text: "public cloud", from: 14, to: 20 },
  { text: "private cloud", from: 14, to: 18 },
  { text: "analyst note", from: 14, to: 16 },
  { text: "cloud provider", from: 14, to: 19 },
  { text: "Linux", from: 14, to: 20 },
  { text: "Google Cloud", from: 15, to: 18 },
  { text: "developer tools", from: 15, to: 19 },
];

/** One day of the story: its size, its vocabulary, and what was new that day. */
export type StoryDay = {
  /** Offset from the start of the window. */
  index: number;
  /** ISO date, used as a stable React key. */
  iso: string;
  /** Short display date, e.g. "Jul 9". */
  label: string;
  /** Every phrase in the story component that day. */
  phrases: string[];
  /** Phrases that were not in the component the day before. */
  entered: string[];
  /** Phrases that were in the component the day before and are not now. */
  exited: string[];
  /** Component size: the number of phrases. This is the plotted series. */
  size: number;
};

/**
 * Expand the phrase windows into one record per day.
 *
 * @returns The window, in chronological order.
 */
function buildDays(): StoryDay[] {
  // Formatted by hand rather than through Intl. The server and the browser can
  // ship different ICU data, and a label that differs between them is a
  // hydration mismatch on a prerendered page.
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const active = (d: number) =>
    PHRASES.filter((p) => d >= p.from && d <= p.to).map((p) => p.text);

  const out: StoryDay[] = [];
  for (let d = 0; d < DAY_COUNT; d++) {
    const date = new Date(START.getTime() + d * 86400000);
    const phrases = active(d);
    const prev = d === 0 ? [] : active(d - 1);
    const prevSet = new Set(prev);
    const curSet = new Set(phrases);

    out.push({
      index: d,
      iso: date.toISOString().slice(0, 10),
      label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`,
      phrases,
      entered: d === 0 ? [] : phrases.filter((p) => !prevSet.has(p)),
      exited: d === 0 ? [] : prev.filter((p) => !curSet.has(p)),
      size: phrases.length,
    });
  }
  return out;
}

/** The observed window, one entry per day. */
export const STORY_DAYS = buildDays();

/** Peak size over the window, used to scale the chart. */
export const MAX_SIZE = Math.max(...STORY_DAYS.map((d) => d.size));

/**
 * The public events that drive the two peaks.
 *
 * `day` is the index into `STORY_DAYS`. These are annotations on the chart, not
 * inputs to it: the curve is computed from the phrase windows and the labels are
 * placed where the public record says the events happened, which is the point.
 * The spikes were not told where to be.
 */
export const EVENTS: { day: number; label: string }[] = [
  { day: 1, label: "EU clears the acquisition" },
  { day: 13, label: "IBM closes the acquisition" },
  { day: 14, label: "Executives brief press and analysts" },
];

/** Index of the day the figure selects on load: the day the deal closed. */
export const DEFAULT_DAY = 13;

/** Day index separating the regulatory phase from the closing phase. */
const PHASE_BREAK = 12;

/**
 * The largest day in a range, which is where a peak actually lands.
 *
 * Deriving the peaks rather than naming them keeps the page copy honest if the
 * phrase windows are ever edited: the prose quotes whatever the data says.
 */
function peakBetween(from: number, to: number): StoryDay {
  return STORY_DAYS.slice(from, to + 1).reduce((a, b) =>
    b.size > a.size ? b : a
  );
}

/** The regulatory-approval peak. */
export const PEAK_ONE = peakBetween(0, PHASE_BREAK);

/** The deal-closing peak, which is the larger of the two. */
export const PEAK_TWO = peakBetween(PHASE_BREAK + 1, STORY_DAYS.length - 1);

/**
 * The quiet day between the two peaks: the trough the story fell to before it
 * came back.
 */
export const TROUGH = STORY_DAYS.slice(2, PHASE_BREAK + 1).reduce((a, b) =>
  b.size < a.size ? b : a
);

/** The day the story is at its baseline, before anything has happened. */
export const BASELINE = STORY_DAYS[0];

/**
 * How much of the second peak's vocabulary never appeared during the first.
 *
 * This is the number that makes the case against a keyword alert: the terms you
 * would have had to know in order to write the rule did not exist yet when the
 * story started.
 */
export const RENEWAL = (() => {
  const firstWave = new Set(
    STORY_DAYS.slice(0, PHASE_BREAK + 1).flatMap((d) => d.phrases)
  );
  const fresh = PEAK_TWO.phrases.filter((p) => !firstWave.has(p));
  return {
    fresh: fresh.length,
    total: PEAK_TWO.phrases.length,
    share: fresh.length / PEAK_TWO.phrases.length,
  };
})();
