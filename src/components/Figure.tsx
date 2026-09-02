/**
 * Figure.tsx — a captioned screenshot of the running system.
 *
 * Role in the system: prose and diagrams describe Hyperion; these images prove
 * it exists and runs. A reader who has never met Charlie can't distinguish
 * "built an orchestrator" from "drew a diagram of one" without them.
 *
 * The `pending` state renders a labelled placeholder rather than a broken image,
 * so the page stays shippable while screenshots are still being captured. Flip
 * `pending` off once the file named by `src` is in `public/`.
 */

import Image from "next/image";

export default function Figure({
  src,
  alt,
  caption,
  width,
  height,
  pending = false,
}: {
  /** Path under `public/`, e.g. `/work/hyperion-builder.png`. */
  src: string;
  /** Description of what the screenshot shows, for screen readers. */
  alt: string;
  /** Visible caption explaining what the reader is looking at. */
  caption: string;
  /** Intrinsic pixel width of the image, required by next/image. */
  width: number;
  /** Intrinsic pixel height of the image. */
  height: number;
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
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full rounded-lg border border-zinc-200 bg-white"
        />
      )}
      <figcaption className="text-sm leading-relaxed text-zinc-500">
        {caption}
      </figcaption>
    </figure>
  );
}
