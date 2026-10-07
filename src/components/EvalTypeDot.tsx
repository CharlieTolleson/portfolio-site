/**
 * EvalTypeDot.tsx: the one mark the launch-bar entry uses for an eval's type,
 * shared by the criteria grid, the eval-types cards, and the dashboard.
 *
 * Role in the system: keeps the encoding identical across every figure, so a
 * reader who learns it once (from the legend at the top of the criteria grid)
 * can read it everywhere on the page.
 *
 * Key design decisions:
 *   - **Color carries the type, not shape.** A first version used a square for
 *     code checks and a circle for judges, both in blue, and at 16px the two
 *     were hard to tell apart (Charlie, 2026-10-07). Both are now circles:
 *     blue for a code check, emerald for an LLM judge. Blue and emerald differ
 *     on the blue-yellow axis, which the common forms of color blindness keep,
 *     and every figure also names the type in text.
 *   - **Hollow means track only.** A ring in the type's color is a criterion
 *     that is measured but never gates.
 *   - **Not amber.** Amber is reserved for "below the bar" in the dashboard.
 */

import type { EvalType } from "@/lib/launchBar";

/** The color for each eval type. */
export const TYPE_COLOR: Record<EvalType, string> = {
  code: "#2563eb",
  judge: "#059669",
};

/** The name of each eval type, as the page writes it. */
export const TYPE_LABEL: Record<EvalType, string> = {
  code: "Code check",
  judge: "LLM judge",
};

/**
 * A filled circle in the type's color, or a ring for a track-only criterion.
 *
 * @param type The eval type, which picks the color.
 * @param tracked True for a track-only criterion, drawn hollow.
 * @param size Rendered size in pixels.
 * @param color Overrides the type color (the legend's neutral ring uses it).
 */
export default function EvalTypeDot({
  type,
  tracked = false,
  size = 14,
  color,
}: {
  type: EvalType;
  tracked?: boolean;
  size?: number;
  color?: string;
}) {
  const c = color ?? TYPE_COLOR[type];
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={8}
        cy={8}
        r={tracked ? 5.5 : 6.5}
        fill={tracked ? "#ffffff" : c}
        stroke={c}
        strokeWidth={tracked ? 2.5 : 0}
      />
    </svg>
  );
}
