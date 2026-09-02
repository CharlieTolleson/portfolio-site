/**
 * Figure.tsx — a captioned screenshot of the running system.
 *
 * Role in the system: prose and diagrams describe Hyperion; these images prove
 * it exists and runs. A reader who has never met Charlie can't distinguish
 * "built an orchestrator" from "drew a diagram of one" without them.
 *
 * Key design decision: Hyperion's console is a dark UI and this page is light.
 * Rather than pretend otherwise, screenshots sit on a dark mount with a little
 * padding, so they read as deliberate product shots framed by the page instead
 * of dark rectangles that fight it.
 *
 * The `pending` state renders a labelled placeholder rather than a broken image,
 * so the page stays shippable while screenshots are still being captured.
 */

import Image from "next/image";

export default function Figure({
  src,
  alt,
  caption,
  width,
  height,
  maxWidth,
  pending = false,
}: {
  /** Path under `public/`, e.g. `/work/hyperion-monitoring.png`. */
  src: string;
  /** Description of what the screenshot shows, for screen readers. */
  alt: string;
  /** Visible caption explaining what the reader is looking at. */
  caption: string;
  /** Intrinsic pixel width of the image, required by next/image. */
  width: number;
  /** Intrinsic pixel height of the image. */
  height: number;
  /**
   * Optional Tailwind max-width class for the image mount. Portrait-ish shots
   * would otherwise render enormous on a wide page.
   */
  maxWidth?: string;
  /** When true, render a placeholder instead of loading `src`. */
  pending?: boolean;
}) {
  return (
    <figure className="m-0 flex flex-col gap-3">
      {pending ? (
        <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-100">
          <span className="px-6 text-center font-mono text-xs text-zinc-400">
            screenshot pending — {src}
          </span>
        </div>
      ) : (
        <div
          className={`w-full overflow-hidden rounded-xl bg-[#0d1117] p-2 ring-1 ring-zinc-900/10 sm:p-3 ${
            maxWidth ?? ""
          }`}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="w-full rounded-lg"
          />
        </div>
      )}
      <figcaption
        className={`text-sm leading-relaxed text-zinc-500 ${maxWidth ?? ""}`}
      >
        {caption}
      </figcaption>
    </figure>
  );
}
