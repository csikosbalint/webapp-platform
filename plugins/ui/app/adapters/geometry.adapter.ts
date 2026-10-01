"use client";

/**
 * Interface Adapter (client side): `useGeometryAdapter`.
 *
 * Sits between the view and the core's geometry boundary and splits the work
 * the way Clean Architecture does:
 *
 *   const { controller, presenter } = useGeometryAdapter();
 *
 * - **controller** — turns view input into a boundary call. `solve(legA, legB)`
 *   converts the raw input strings, tags the request with a `correlationId`,
 *   marks it pending, and invokes the server action (the actual core call). It
 *   never formats anything and never writes the outcome.
 * - **presenter** — receives the core's OUTPUT: the terminal `COMPLETED` /
 *   `FAILED` events on the bus. An event carrying one of our correlation ids
 *   clears that request's pending state and sets `result` / `error`; every event
 *   is appended to the feed. It exposes a display-ready view model.
 *
 * So `pending` means exactly: the controller has sent a request and the
 * presenter has not yet received its result or error.
 *
 * State ownership:
 * - the view keeps its own input state (`legA`, `legB`);
 * - this adapter owns the view-model state (pending ids, result, error, feed);
 * - the core owns the domain rules — this adapter re-implements none of them.
 *
 * TWO RUNTIMES, TWO BUSES. The core publishes on the SERVER, through the server
 * action's own `eventBus`. A browser subscriber cannot see that instance, so the
 * controller mirrors the terminal event onto the CLIENT bus once the server call
 * settles — the fan-out a real transport (Redis, a websocket) would do for free.
 * The bus stays private to this adapter: the view neither publishes nor
 * subscribes.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import type { RightTriangle } from "@csikosbalint/webapp-platform-core/ports";
import { Topic } from "@csikosbalint/webapp-platform-core/ports";

import { eventBus } from "../event.bus.driver";
import { solveTriangle } from "../math.actions";

const OPERATION = "geometry.triangle.calculate";

/** How many feed lines the view model keeps (newest first). */
export const FEED_LIMIT = 10;

/** One line of the live event feed, display-ready. */
export interface FeedLine {
  readonly topic: string;
  readonly detail: string;
}

/** A solved triangle, display-ready. */
export interface TriangleView {
  readonly hypotenuse: string;
  readonly area: string;
  readonly perimeter: string;
}

/** Formats a derived value for display. */
function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

/** Flattens any thrown value to a message the view can show. */
function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function useGeometryAdapter() {
  /** Correlation ids sent by the controller and not yet received. */
  const awaiting = useRef(new Set<string>());
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RightTriangle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<readonly FeedLine[]>([]);

  // Presenter input: terminal events from the bus.
  useEffect(() => {
    // Newest first, capped: ordering and how much to show are presentation, so
    // the view model carries both.
    const append = (line: FeedLine) =>
      setFeed((prev) => [line, ...prev].slice(0, FEED_LIMIT));

    /** Settles `id` if it is one of ours; returns whether it was. */
    const receive = (id: string | undefined): boolean => {
      if (id === undefined || !awaiting.current.delete(id)) return false;
      setPending(awaiting.current.size > 0);
      return true;
    };

    const offCompleted = eventBus.subscribe(
      Topic.Geometry.Triangle.COMPLETED,
      async ({ correlationId, result: solved }) => {
        append({
          topic: Topic.Geometry.Triangle.COMPLETED,
          detail: `hypotenuse ${format(solved.hypotenuse)}`,
        });
        if (receive(correlationId)) {
          setResult(solved);
          setError(null);
        }
      },
    );
    const offFailed = eventBus.subscribe(
      Topic.Geometry.Triangle.FAILED,
      async ({ correlationId, reason }) => {
        append({ topic: Topic.Geometry.Triangle.FAILED, detail: reason });
        if (receive(correlationId)) {
          setResult(null);
          setError(reason);
        }
      },
    );

    return () => {
      offCompleted();
      offFailed();
    };
  }, []);

  const controller = useMemo(
    () => ({
      /** Sends a solve request for the two raw input values. */
      solve(legA: string, legB: string): void {
        const a = Number(legA);
        const b = Number(legB);
        const correlationId = crypto.randomUUID();

        awaiting.current.add(correlationId);
        setPending(true);

        void solveTriangle(a, b).then(
          (solved) =>
            eventBus.publish(Topic.Geometry.Triangle.COMPLETED, {
              correlationId,
              result: solved,
            }),
          (cause: unknown) =>
            eventBus.publish(Topic.Geometry.Triangle.FAILED, {
              correlationId,
              operation: OPERATION,
              inputs: [a, b],
              reason: messageOf(cause),
            }),
        );
      },
    }),
    [],
  );

  const presenter = useMemo(
    () => ({
      /** True while a sent request has neither a result nor an error yet. */
      pending,
      error,
      result:
        result === null
          ? null
          : ({
              hypotenuse: format(result.hypotenuse),
              area: format(result.area),
              perimeter: format(result.perimeter),
            } satisfies TriangleView),
      feed,
    }),
    [pending, error, result, feed],
  );

  return { controller, presenter };
}
