/**
 * Outbound port: the application's event bus.
 *
 * This is the LOGICAL contract, not an implementation. The core owns it because
 * it defines *what a bus is* for this application — a way to publish domain
 * events and a way to subscribe to them by TOPIC — independent of how messages
 * actually travel. The instantiator decides that: an in-process emitter, a
 * Redis pub/sub, a broker, a websocket fan-out across client, server and other
 * servers. None of that leaks in here.
 *
 * The bus is bidirectional on purpose. `subscribe` belongs on the contract even
 * though the core's own use cases only publish: a bus that could only publish
 * is not a bus, and a subscriber elsewhere in the system (another server, the
 * browser, a projector that records results) consumes through this same
 * interface rather than a driver-specific one.
 *
 * Subscription is TOPIC-KEYED. A consumer names the exact event it cares about
 *
 *   eventBus.subscribe(Topic.Geometry.Triangle.COMPLETED, ({ result }) => …);
 *
 * and receives only that topic's EVENT object — the compiler infers the payload
 * type from the topic, so a `COMPLETED` handler is handed a {@link
 * TriangleCompleted} (the solved triangle under `result`) and a `FAILED`
 * handler a {@link TriangleFailed}, with no manual narrowing.
 *
 * Events carry no timestamp: a clock is another outbound dependency, and the
 * implementation that delivers an event is better placed to stamp it than the
 * use case is to invent one.
 *
 * Rules: `/CLEAN-ARCHITECTURE.md`.
 */

import type { RightTriangle } from "../inbound/math.types.js";

/**
 * The topic tree: the stable string keys a consumer subscribes to and the core
 * publishes under. A nested, frozen const object so a caller reaches a topic as
 * `Topic.Geometry.Triangle.COMPLETED` and the value is the wire string.
 *
 * A runtime value (not `export type`): the topic strings must exist at runtime
 * for `subscribe`/`publish` to key on them. The `Topic` *type* below merges
 * into this same name, so `Topic` is both the tree (value) and the union of
 * every topic string (type).
 */
export const Topic = {
  Geometry: {
    Triangle: {
      /** A triangle was solved; payload is a {@link TriangleCompleted}. */
      COMPLETED: "geometry.triangle.completed",
      /** A triangle could not be solved; payload is a {@link TriangleFailed}. */
      FAILED: "geometry.triangle.failed",
    },
  },
} as const;

/** Every topic string the bus knows, derived from the {@link Topic} tree. */
export type Topic =
  | typeof Topic.Geometry.Triangle.COMPLETED
  | typeof Topic.Geometry.Triangle.FAILED;

/**
 * Fields every event carries so a subscriber on a shared, distributed bus can
 * tell which events belong to it.
 */
export interface EventMetadata {
  /**
   * Who emitted the event — the `source` the producing `Geometry` was
   * constructed with. Absent when none was supplied.
   */
  readonly source?: string;
  /**
   * Echoes the `correlationId` passed to the `calculate` call that produced
   * this event. The core never generates or interprets it — minting an id is
   * the caller's job — it only carries it through. Absent when none was passed.
   */
  readonly correlationId?: string;
}

/** The success payload delivered on the `COMPLETED` topic. */
export interface TriangleCompleted extends EventMetadata {
  /** The solved triangle. */
  readonly result: RightTriangle;
}

/** The failure payload delivered on the `FAILED` topic. */
export interface TriangleFailed extends EventMetadata {
  /** Which operation failed, e.g. `geometry.triangle.calculate`. */
  readonly operation: string;
  /** The arguments it was given, in call order. */
  readonly inputs: readonly number[];
  /** Why it failed, already flattened to a message. */
  readonly reason: string;
}

/**
 * Maps each topic to the payload its subscribers receive.
 *
 * This is what makes `subscribe` type-safe per topic: a handler for
 * `COMPLETED` is typed to receive a {@link TriangleCompleted}, a handler for
 * `FAILED` a {@link TriangleFailed}.
 */
export interface TopicPayloads {
  [Topic.Geometry.Triangle.COMPLETED]: TriangleCompleted;
  [Topic.Geometry.Triangle.FAILED]: TriangleFailed;
}

/**
 * Receives one topic's payload. MUST be async: delivery may cross a process
 * or network boundary, so a handler is never assumed to run synchronously.
 */
export type EventHandler<P> = (payload: P) => Promise<void>;

/**
 * Detaches a subscriber. Idempotent: calling it more than once is harmless.
 */
export type Unsubscribe = () => void;

/**
 * The logical event bus.
 *
 * Delivery semantics — every implementation must honor them:
 * - `publish` resolves once the bus has ACCEPTED the event for delivery. It
 *   does not wait for handlers to finish, and a handler's rejection never
 *   reaches the publisher: subscribers cannot fail the operation that
 *   announced the event. Handler errors are the bus implementation's concern
 *   (log, dead-letter, retry).
 * - `publish` rejects only when the bus itself cannot accept the event (a
 *   transport failure). The bus neither swallows nor retries that.
 */
export interface EventBus {
  /**
   * Announces one topic's payload to that topic's current subscribers.
   *
   * @param topic - which topic the payload belongs to
   * @param payload - the fact to publish
   */
  readonly publish: <T extends Topic>(
    topic: T,
    payload: TopicPayloads[T],
  ) => Promise<void>;

  /**
   * Registers a handler for a single topic.
   *
   * @param topic - the topic to listen for
   * @param handler - invoked with that topic's payload
   * @returns a function that detaches this handler
   */
  readonly subscribe: <T extends Topic>(
    topic: T,
    handler: EventHandler<TopicPayloads[T]>,
  ) => Unsubscribe;
}
