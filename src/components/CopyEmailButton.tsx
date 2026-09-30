"use client";

/**
 * CopyEmailButton.tsx: the site's single contact call-to-action, in the header.
 *
 * Role in the system: the site's email control. The root layout renders it in
 * the header so it is on every page, including a case study someone landed on
 * from a shared link, and the About page repeats it under its closing "say hi".
 *
 * Key design decisions:
 *   - **Copy, not mailto.** A `mailto:` link only works for visitors with a
 *     desktop mail app set up; for anyone on webmail it silently does nothing.
 *     Copying the address works for everyone.
 *   - **Black pill, "Email" plus the copy icon.** The pill is what makes it the
 *     salient action in an otherwise quiet header, and the standard copy glyph
 *     next to the word says what a click will do.
 *   - **Visible confirmation.** The icon swaps to a check and the label to
 *     "Copied" for two seconds, so the click never feels like a no-op. Both
 *     labels share one grid cell, so the pill never changes width.
 *   - **mailto as the fallback.** If the Clipboard API is unavailable or
 *     refused (an insecure context, or a denied permission), the button falls
 *     back to opening the mail app.
 */

import { useEffect, useRef, useState } from "react";

const EMAIL = "charlietolleson@gmail.com";

/** How long the "copied" confirmation stays up before resetting. */
const CONFIRM_MS = 2000;

export default function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear a pending reset if the component unmounts mid-confirmation.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), CONFIRM_MS);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : `Copy ${EMAIL}`}
      aria-label={copied ? "Email address copied" : `Copy email address ${EMAIL}`}
      className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 text-white transition-colors hover:bg-zinc-700"
    >
      <span className="grid" aria-live="polite">
        <span className={`col-start-1 row-start-1 ${copied ? "invisible" : ""}`}>
          Email
        </span>
        <span
          className={`col-start-1 row-start-1 ${copied ? "" : "invisible"}`}
          aria-hidden={!copied}
        >
          Copied
        </span>
      </span>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

/** The conventional copy glyph: two overlapping rounded rectangles. */
function CopyIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
