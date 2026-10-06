/**
 * StealthBrief.tsx: the home-page card visual for the "Building in Stealth"
 * entry.
 *
 * Role in the system: every other card shows the work itself. This one can't,
 * because the product is in stealth, so it shows the two things a founder or
 * investor would ask about, with the details withheld: the product (a phone
 * whose screen is blurred out, with a lock over it) and the business case (a
 * page of section headings that are readable, with everything under them
 * blacked out).
 *
 * Key design decisions:
 *   - **The headings are real.** They are the actual sections of Charlie's
 *     investor brief, so the card claims nothing that isn't true; only the
 *     contents are hidden.
 *   - **No title, no stamp.** An earlier version labeled the page "Investor
 *     brief", blacked out a product name, and stamped it "Confidential"; Charlie
 *     cut all three (2026-10-06), so the headings carry the page on their own.
 *   - **Blur, not wireframe, for the screen.** Soft shapes read as "an app
 *     exists" without describing a single feature. The lock sits on top,
 *     unblurred, so the withholding reads as deliberate.
 *   - **Fixed geometry.** Every width and position is typed below, so server and
 *     browser render identical markup. The filter and clip ids are static
 *     because the card renders once per page.
 *   - **Same 3:1 canvas and mobile scroll wrapper as the other cards.**
 */

const W = 1200;
const H = 400;

/* ---- Phone ---- */
const PHONE_X = 80;
const PHONE_Y = 20;
const PHONE_W = 180;
const PHONE_H = 360;
const BEZEL = 9;
const SCREEN = {
  x: PHONE_X + BEZEL,
  y: PHONE_Y + BEZEL,
  w: PHONE_W - 2 * BEZEL,
  h: PHONE_H - 2 * BEZEL,
};
/** Horizontal center of the screen, where the lock sits. */
const SCREEN_CX = SCREEN.x + SCREEN.w / 2;

/**
 * Abstract app content, drawn crisp and then blurred: a header, a few message
 * bubbles, a card, and an input bar. Blue marks the user's side, as in most
 * messaging UIs, which is as specific as the screen gets.
 */
const SCREEN_SHAPES: { x: number; y: number; w: number; h: number; fill: string }[] = [
  { x: 106, y: 62, w: 92, h: 16, fill: "#a1a1aa" },
  { x: 104, y: 100, w: 112, h: 34, fill: "#d4d4d8" },
  { x: 148, y: 146, w: 98, h: 30, fill: "#2563eb" },
  { x: 104, y: 190, w: 128, h: 48, fill: "#d4d4d8" },
  { x: 104, y: 252, w: 142, h: 54, fill: "#ffffff" },
  { x: 160, y: 318, w: 86, h: 26, fill: "#2563eb" },
  { x: 104, y: 350, w: 142, h: 14, fill: "#d4d4d8" },
];

/* ---- Brief ---- */
const BRIEF_X = 330;
const BRIEF_Y = 30;
const BRIEF_W = 800;
const BRIEF_H = 340;
const PAD = 32;
const COLS = 3;
const COL_GAP = 32;
const COL_W = (BRIEF_W - 2 * PAD - (COLS - 1) * COL_GAP) / COLS;
const ROW_H = 124;
/** Height of one section: heading, then three lines ending 94 below its top. */
const SECTION_H = 94;
/** Top of the grid, chosen so the two rows sit centered on the page. */
const GRID_TOP = BRIEF_Y + Math.round((BRIEF_H - (ROW_H + SECTION_H)) / 2);

/** A body line: `t` is ordinary text (light gray), `r` is redacted (black). */
type Line = [fraction: number, kind: "t" | "r"];

/** The brief's sections, in the order the real document has them. */
const SECTIONS: { heading: string; lines: Line[] }[] = [
  { heading: "Problem", lines: [[0.95, "r"], [0.82, "t"], [0.7, "r"]] },
  { heading: "Why now", lines: [[0.88, "t"], [0.92, "r"], [0.55, "r"]] },
  { heading: "Market", lines: [[0.9, "r"], [0.75, "t"], [0.84, "r"]] },
  { heading: "Business model", lines: [[0.8, "r"], [0.94, "t"], [0.62, "r"]] },
  { heading: "Competition", lines: [[0.92, "t"], [0.7, "r"], [0.86, "t"]] },
  { heading: "Launch plan", lines: [[0.85, "r"], [0.9, "r"], [0.5, "t"]] },
];

/** The static thumbnail: a blurred-out app beside a page of redacted sections. */
export default function StealthBrief() {
  return (
    <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-x-visible sm:px-0">
      <div className="min-w-[720px] sm:min-w-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`A phone with its screen blurred out and locked, beside a page whose contents are redacted. Its section headings are visible: ${SECTIONS.map(
            (s) => s.heading
          ).join(", ")}.`}
        >
          <defs>
            <filter
              id="stealth-screen-blur"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation={6} />
            </filter>
            <clipPath id="stealth-screen-clip">
              <rect
                x={SCREEN.x}
                y={SCREEN.y}
                width={SCREEN.w}
                height={SCREEN.h}
                rx={24}
              />
            </clipPath>
          </defs>

          {/* ---- Phone ---- */}
          <rect
            x={PHONE_X}
            y={PHONE_Y}
            width={PHONE_W}
            height={PHONE_H}
            rx={32}
            fill="#18181b"
          />
          <g clipPath="url(#stealth-screen-clip)">
            <rect
              x={SCREEN.x}
              y={SCREEN.y}
              width={SCREEN.w}
              height={SCREEN.h}
              fill="#f4f4f5"
            />
            <g filter="url(#stealth-screen-blur)">
              {SCREEN_SHAPES.map((s, i) => (
                <rect
                  key={i}
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  rx={12}
                  fill={s.fill}
                />
              ))}
            </g>
          </g>
          {/* The camera cutout, drawn over the screen. */}
          <rect
            x={SCREEN_CX - 26}
            y={PHONE_Y + 18}
            width={52}
            height={14}
            rx={7}
            fill="#18181b"
          />
          {/* The lock: a white disc so it reads against the blur, then the
              body and shackle. */}
          <circle
            cx={SCREEN_CX}
            cy={205}
            r={40}
            fill="#ffffff"
            stroke="#e4e4e7"
            strokeWidth={2}
          />
          <path
            d={`M ${SCREEN_CX - 11} 203 v -10 a 11 11 0 0 1 22 0 v 10`}
            fill="none"
            stroke="#18181b"
            strokeWidth={5}
          />
          <rect
            x={SCREEN_CX - 18}
            y={201}
            width={36}
            height={26}
            rx={5}
            fill="#18181b"
          />

          {/* ---- Brief ---- */}
          <rect
            x={BRIEF_X}
            y={BRIEF_Y}
            width={BRIEF_W}
            height={BRIEF_H}
            rx={10}
            fill="#ffffff"
            stroke="#e4e4e7"
            strokeWidth={2}
          />
          {SECTIONS.map((s, i) => {
            const x = BRIEF_X + PAD + (i % COLS) * (COL_W + COL_GAP);
            const top = GRID_TOP + Math.floor(i / COLS) * ROW_H;
            return (
              <g key={s.heading}>
                <text x={x} y={top + 18} fontSize={20} fill="#3f3f46">
                  {s.heading}
                </text>
                {s.lines.map(([f, kind], j) => {
                  const y = top + 34 + j * 22;
                  // Redaction bars are taller than text lines and centered on
                  // the same row, the way a marker covers a printed line.
                  return kind === "r" ? (
                    <rect
                      key={j}
                      x={x}
                      y={y}
                      width={Math.round(COL_W * f)}
                      height={16}
                      rx={2}
                      fill="#18181b"
                    />
                  ) : (
                    <rect
                      key={j}
                      x={x}
                      y={y + 3}
                      width={Math.round(COL_W * f)}
                      height={10}
                      rx={2}
                      fill="#e4e4e7"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
