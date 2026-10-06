/**
 * stealthBuild.ts: the facts the "Building in Stealth" entry quotes.
 *
 * Role in the system: the single source of truth for the counts the stealth
 * entry's case-study page quotes, the same pattern as the other entries'
 * `lib/` modules, so a count changes in one place. The home card quotes no
 * counts, by design (see `app/page.tsx`).
 *
 * Key design decisions:
 *   - **Nothing here names the product, its customers, or its integrations.**
 *     The product is in stealth and Charlie intends to sell it (2026-10-06), so
 *     every value describes how it is being built, never what it does.
 *   - **Counts come from the real documents as of 2026-10-06:** design doc
 *     draft 9, a build spec of about 6,200 lines, 8 milestones (M0 to M7), and
 *     10 security invariants. Update them here when the documents change.
 */

/** Length of the build spec, floored to a round number for display. */
export const SPEC_LINES = "6,000+";

/** Security invariants in the build spec; each has a CI test and none can be overridden. */
export const INVARIANT_COUNT = 10;

/** Drafts the design doc of record went through before the build spec. */
export const DESIGN_DRAFTS = 9;

/** Milestones in the build plan, first commit to public launch. */
export const MILESTONE_COUNT = 8;
