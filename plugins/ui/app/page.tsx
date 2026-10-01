"use client";

/**
 * Route-level view: the triangle calculator page.
 *
 * Holds only its own input state (`legA`, `legB`) and renders. Everything else
 * goes through the adapter:
 *
 *   const { controller, presenter } = useGeometryAdapter();
 *
 * - user intent → `controller.solve(legA, legB)`;
 * - what to show → `presenter` (display-ready strings, no formatting here).
 *
 * Layout: form on the left, result on the right, and the event feed full width
 * underneath at a FIXED height of exactly `FEED_LIMIT` lines. The presenter
 * already caps the feed at that many lines, newest first, so the box never
 * scrolls or overflows.
 */
import { useState } from "react";

import type { FeedLine } from "./adapters/geometry.adapter";
import { FEED_LIMIT, useGeometryAdapter } from "./adapters/geometry.adapter";

/** One feed line: `leading-4` (1rem) plus `gap-1` (0.25rem) between lines. */
const FEED_HEIGHT = `calc(${FEED_LIMIT} * 1rem + ${FEED_LIMIT - 1} * 0.25rem)`;

export default function Home() {
  const { controller, presenter } = useGeometryAdapter();

  const [legA, setLegA] = useState("3");
  const [legB, setLegB] = useState("4");

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 px-8 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Right triangle solver
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <form
            className="flex flex-col gap-4"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              controller.solve(legA, legB);
            }}
          >
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Leg A
              <input
                type="number"
                step="any"
                min="0"
                value={legA}
                onChange={(changeEvent) => setLegA(changeEvent.target.value)}
                className="rounded border border-black/[.12] bg-white px-3 py-2 text-black dark:border-white/[.16] dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Leg B
              <input
                type="number"
                step="any"
                min="0"
                value={legB}
                onChange={(changeEvent) => setLegB(changeEvent.target.value)}
                className="rounded border border-black/[.12] bg-white px-3 py-2 text-black dark:border-white/[.16] dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>

            <SolveButton pending={presenter.pending} />
          </form>

          <section aria-labelledby="result-heading" aria-live="polite" className="flex flex-col gap-4">
            <h2
              id="result-heading"
              className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Result
            </h2>

            {presenter.error && (
              <p className="text-sm text-red-600 dark:text-red-400">{presenter.error}</p>
            )}

            {presenter.result && (
              <dl
                className={`grid grid-cols-2 gap-x-4 gap-y-2 text-sm transition-opacity ${
                  presenter.pending ? "opacity-50" : ""
                }`}
              >
                <dt className="text-zinc-500 dark:text-zinc-400">Hypotenuse</dt>
                <dd className="text-right font-mono text-black dark:text-zinc-50">
                  {presenter.result.hypotenuse}
                </dd>
                <dt className="text-zinc-500 dark:text-zinc-400">Area</dt>
                <dd className="text-right font-mono text-black dark:text-zinc-50">
                  {presenter.result.area}
                </dd>
                <dt className="text-zinc-500 dark:text-zinc-400">Perimeter</dt>
                <dd className="text-right font-mono text-black dark:text-zinc-50">
                  {presenter.result.perimeter}
                </dd>
              </dl>
            )}

            {!presenter.error && !presenter.result && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No result yet.</p>
            )}
          </section>
        </div>

        <section aria-labelledby="feed-heading" className="flex flex-col gap-2">
          <h2
            id="feed-heading"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Event feed
          </h2>
          <FeedList feed={presenter.feed} />
        </section>
      </main>
    </div>
  );
}

/**
 * The submit button, as wide as the form. While pending, the label is hidden
 * with `invisible` (it keeps its space) and a spinner is overlaid in the centre.
 * Screen readers get `aria-busy` plus a visually hidden "Calculating" status.
 */
function SolveButton({ pending }: { readonly pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="relative w-full rounded-full bg-foreground px-5 py-2.5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-wait dark:hover:bg-[#ccc]"
    >
      <span className={pending ? "invisible" : undefined}>Solve</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
          <span role="status" className="sr-only">
            Calculating
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * The live feed in a fixed-height box sized for exactly `FEED_LIMIT` lines.
 * Rendered in the presenter's order (newest first); the presenter caps the
 * count, so nothing overflows. `overflow-hidden` is only a guard.
 */
function FeedList({ feed }: { readonly feed: readonly FeedLine[] }) {
  return (
    <ul
      style={{ height: FEED_HEIGHT }}
      className="flex flex-col gap-1 overflow-hidden text-xs leading-4 font-mono text-zinc-600 dark:text-zinc-300"
    >
      {feed.length === 0 ? (
        <li className="text-zinc-500 dark:text-zinc-400">No events yet.</li>
      ) : (
        feed.map((line, index) => (
          <li key={`${feed.length - index}-${line.topic}`} className="truncate">
            {line.topic}
            {" · "}
            {line.detail}
          </li>
        ))
      )}
    </ul>
  );
}
