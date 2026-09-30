"use client";

/**
 * CopyEmailButton.tsx: the site's primary contact call-to-action.
 *
 * Role in the system: replaces a plain `mailto:` button on the home and About
 * pages. A `mailto:` link only works for visitors with a desktop mail app set
 * up; for anyone on webmail it silently does nothing, which is the worst
 * possible outcome for the one button meant to start a conversation. Copying
 * the address works for everyone.
 *
 * Key design decisions:
 *   - **The address is the label.** Showing the email itself, next to the
 *     standard copy icon, makes it obvious what will land on the clipboard.
 *   - **Visible confirmation.** The icon swaps to a check and the label to
 *     "Email copied" for two seconds, so the click never feels like a no-op.
 *   - **mailto as the fallback.** If the Clipboard API is unavailable or
 *     refused (an insecure context, or a browser permission prompt the visitor
 *     declines), the button falls back to opening the mail app.
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
      aria-label={copied ? "Email copied" : `Copy email address ${EMAIL}`}
      className="inline-flex items-center gap-2.5 rounded-full bg-zinc-900 px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-zinc-700"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {/* Both labels share one grid cell and the inactive one is only made
          invisible, so the button keeps the width of the longer label and the
          text beside it doesn't jump when the confirmation shows. aria-live so
          screen readers hear the confirmation too. */}
      <span className="grid text-left" aria-live="polite">
        <span className={`col-start-1 row-start-1 ${copied ? "invisible" : ""}`}>
          {EMAIL}
        </span>
        <span
          className={`col-start-1 row-start-1 ${copied ? "" : "invisible"}`}
          aria-hidden={!copied}
        >
          Email copied
        </span>
      </span>
    </button>
  );
}

/** The conventional copy glyph: two overlapping rounded rectangles. */
function CopyIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
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
      width="16"
      height="16"
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
