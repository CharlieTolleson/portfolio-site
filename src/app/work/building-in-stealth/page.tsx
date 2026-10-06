/**
 * Building in Stealth: case study page for Charlie's own AI product.
 *
 * Role in the system: the sixth built portfolio entry, and the answer to "what
 * are you doing now?" for a reader who lands on the home page. It shows how
 * the product is being built (spec, security model, evals, release process)
 * without saying what the product is.
 *
 * Key design decisions:
 *   - **Stealth is a hard rule (Charlie, 2026-10-06).** He intends to sell the
 *     product, so this page never names it, its industry, its users, the
 *     systems it connects to, or anything that would let a reader reconstruct
 *     the idea. Everything here is true of the real build spec, restated in
 *     general terms; facts and counts come from `lib/stealthBuild`.
 *   - **Status is stated honestly.** The spec is complete, the foundations are
 *     built, and the first demo is in progress. Design choices are described
 *     as the design, not as a running system.
 *   - **Shorter than the other entries, and no figure**, because there is less
 *     that can be shown. A milestone-plan figure was tried and cut (Charlie,
 *     2026-10-06). The page closes on an offer of a private walkthrough instead
 *     of a results section.
 *   - **It ties back to the Meta work** (agent-ready context, evals), so the
 *     entry reads as the same person's thinking applied from the first commit.
 */

import Link from "next/link";
import EntrySummary from "@/components/EntrySummary";
import CopyEmailButton from "@/components/CopyEmailButton";
import {
  DESIGN_DRAFTS,
  INVARIANT_COUNT,
  MILESTONE_COUNT,
  SPEC_LINES,
} from "@/lib/stealthBuild";

export const metadata = {
  title: "Building in Stealth",
  description:
    "My own AI product, in stealth: specified end to end before the first line of code, with security and evals in the foundations.",
  openGraph: {
    title: "Building in Stealth | Charlie Tolleson",
    description:
      "How I'm building my own AI product: a spec written for a coding agent, security invariants, eval-gated releases, and a milestone plan.",
    type: "article",
    url: "https://charlietolleson.com/work/building-in-stealth",
  },
  twitter: {
    card: "summary_large_image",
    title: "Building in Stealth | Charlie Tolleson",
    description:
      "My own AI product, specified end to end before the first line of code.",
  },
};

/** Fact rows shown under the title, so the scope is legible at a glance. */
const META: [string, string][] = [
  ["Role", "Founder: research, design, architecture, and build"],
  ["Stage", "Specified end to end; foundations built, first demo in progress"],
  ["Stack", "TypeScript · React Native · Postgres · Claude"],
  ["Built with", "Claude Code, from a spec written for it to build from"],
];

/** Five of the ten security invariants: the ones that say the most about building agents. */
const INVARIANTS: string[] = [
  "The model never sees credentials or secrets. Tools take ids, and the server looks up the rest itself.",
  "Every write to another system is gated, and needs the confirmation that action calls for.",
  "Prompts can't turn off security. The safeguards are code, and a prompt change can only take tools away.",
  "Staff can't read customer content without a grant, and the database enforces it.",
  "Every model call is metered and budgeted, before and after it runs.",
];

const P = "text-xl leading-relaxed text-zinc-700";
const H2 = "text-3xl font-semibold tracking-tight text-zinc-900";
const LINK =
  "text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-500";

export default function BuildingInStealthPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-32 sm:px-10 lg:px-20">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="w-fit font-mono text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← Work
          </Link>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
            Building in Stealth
          </h1>

          <p className="max-w-3xl text-2xl leading-snug text-zinc-500">
            My own AI product, specified end to end before the first line of
            code.
          </p>

          <EntrySummary
            intro="After eight years of building measurement and AI tools inside Meta, Amazon, and IBM, I'm building a product of my own: an AI agent for an industry most software has passed by. It's in stealth, so this page covers how I'm building it rather than what it is. The short version: what I learned about trusting agents at Meta is in the foundations from the first milestone, not bolted on after launch."
            pairs={[
              [
                "An agent that acts inside a customer's business can do real damage to someone who trusted it.",
                `${INVARIANT_COUNT} security invariants that nothing else in the system can override, each one covered by an automated test.`,
              ],
              [
                "A prompt or model change can quietly break behavior customers rely on.",
                "Agent changes versioned, gated by evals, and released in rings: internal first, then early access, then everyone.",
              ],
              [
                "Customer data is a product's raw material and its biggest liability.",
                "No standing staff access to customer content, enforced by the database rather than by policy.",
              ],
              [
                "A plan big enough to matter is too big to build in one pass.",
                `${MILESTONE_COUNT} milestones from first commit to public launch, each with exit criteria and the tests that prove it's done.`,
              ],
            ]}
          />

          <dl className="mt-2 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-3 border-t border-zinc-200 pt-6 sm:grid-cols-2">
            {META.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="font-mono text-xs uppercase tracking-wide text-zinc-400">
                  {k}
                </dt>
                <dd className="m-0 text-base text-zinc-700">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="max-w-3xl border-l-2 border-amber-500 pl-5 text-base leading-relaxed text-zinc-600">
            <span className="font-medium text-zinc-800">
              Why so little detail.
            </span>{" "}
            The product is in stealth, so this page leaves out what it does and
            who it&apos;s for. I&apos;m happy to walk you through it privately.
          </p>
        </div>

        {/* ---- Why ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>Why build my own</h2>
          <p className={P}>
            The part of the work I like most is the beginning: a messy problem,
            no playbook, and something real to build. Inside a large company,
            that part is usually over by the time a project reaches you. Building
            my own product means owning all of it, from the first design
            decision to the security model.
          </p>
          <p className={P}>
            It&apos;s also a chance to answer, from the first commit, the
            question my work at Meta kept coming back to: what does it take for
            people to trust an agent with real work? At Meta I came at it from
            the outside, with evals and standards around systems that already
            existed. Here it&apos;s in the foundations.
          </p>
        </section>

        {/* ---- Spec ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>The spec is the first product</h2>
          <p className={P}>
            Before writing code, I wrote the product down. The design doc went
            through {DESIGN_DRAFTS} drafts, the last one reviewed in separate
            passes for completeness, security and privacy, simplicity, and
            consistency. The build spec that came out of it runs to {SPEC_LINES}{" "}
            lines and covers the app, the server, and the staff console, down to
            the database schema and the tests that close each milestone.
          </p>
          <p className={P}>
            The spec is written for a coding agent to build from, and that
            shaped how it reads. It sets an order of work. It sets a precedence
            rule for when sources disagree: the security invariants first, then
            the spec, then the design docs, then the agent&apos;s own judgment.
            And it says what to do when something isn&apos;t specified: choose
            the simplest option that keeps the invariants, record the decision
            in one line, and keep going.
          </p>
          <p className={P}>
            That&apos;s{" "}
            <Link href="/work/agent-ready-org" className={LINK}>
              the agent-ready idea from Meta
            </Link>{" "}
            at the scale of one product and one coding agent. What an agent reads
            is a production input, so it gets the same care as the code.
          </p>
        </section>

        {/* ---- Trust ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>Trust, designed in</h2>
          <p className={P}>
            The {INVARIANT_COUNT} security invariants hold at every milestone. A
            change that breaks one can&apos;t merge, and each has its own test.
            A few of them say a lot about how an agent should be built:
          </p>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {INVARIANTS.map((v) => (
              <li key={v} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"
                />
                <span className={P}>{v}</span>
              </li>
            ))}
          </ul>
          <p className={P}>
            Quality gets the same treatment. Every change to the agent&apos;s
            prompts, model settings, or limits ships as a new version, and evals
            gate it before it reaches anyone. Then it goes out in rings:
            internal first, then early access, then everyone. It&apos;s the
            release discipline I{" "}
            <Link href="/work/ai-orchestration" className={LINK}>
              led evals for at Meta
            </Link>
            , built in from the start instead of retrofitted.
          </p>
        </section>

        {/* ---- Stack ---- */}
        <section className="flex max-w-3xl flex-col gap-6">
          <h2 className={H2}>A deliberately small stack</h2>
          <p className={P}>
            Some of the most important choices are what&apos;s left out: no
            agent framework, no ORM, no vector database, no cache layer. The
            agent loop is code I own. SQL is the schema of record. One module
            talks to the model, so changing providers is a change in one place.
            The goal is a system small enough to hold in my head, with nothing in
            it I can&apos;t explain.
          </p>
        </section>

        {/* ---- Footer ---- */}
        <section className="flex max-w-3xl flex-col gap-5 border-t border-zinc-200 pt-10">
          <h2 className="text-xl font-medium text-zinc-900">Want to see it?</h2>
          <p className="text-base leading-relaxed text-zinc-600">
            I&apos;m happy to walk you through the product privately, whether
            you&apos;re curious about the idea or about how it&apos;s built.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-200 pt-6 text-base">
            <span className="text-zinc-600">
              Happy to talk about any of this.
            </span>
            <CopyEmailButton />
            <a
              href="https://www.linkedin.com/in/charlietolleson"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              LinkedIn
            </a>
            <Link href="/" className={LINK}>
              More work
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
