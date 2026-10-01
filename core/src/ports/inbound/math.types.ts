/**
 * The type vocabulary of the math capability: operation signatures, the data
 * shapes they exchange, and the namespaces that group them.
 *
 * Mostly types, with ONE runtime value — `Triangle`, the kind enum a caller
 * passes to `calculate`. An enum member is a value, not just a type, so it is a
 * real export rather than `export type`; it still belongs here because it is
 * part of the capability's shared language, and it reaches into neither `app/`
 * nor `domain/`.
 */

import type { EventBus } from "../outbound/event.bus.port.js";

/** The kind of triangle a `calculate` call solves. */
export enum Triangle {
  /** A right triangle, solved from its two legs. */
  RIGHT = "triangle.right",
}

/**
 * The capability's kind vocabulary, grouped so a caller reaches a kind as
 * `Type.Triangle.RIGHT`. A frozen const tree carrying the runtime enums; it
 * grows as the capability learns new shapes (a `Circle`, a `Polygon`) without
 * changing the call site.
 */
export const Type = {
  Triangle,
} as const;

/**
 * The arithmetic the geometry use case resolves from the DI container and runs
 * on. Mirrors the domain primitives — `add`, `multiply`, `divide`, `subtract` —
 * behind an interface so the use case depends on a registered service (`math`)
 * rather than importing the domain module directly. Named `MathOperations`,
 * not `Math`, so it never collides with the JS global `Math`.
 */
export interface MathOperations {
  readonly add: (a: number, b: number) => number;
  readonly multiply: (a: number, b: number) => number;
  readonly divide: (a: number, b: number) => number;
  readonly subtract: (a: number, b: number) => number;
}

/** A right triangle described by its legs and the values derived from them. */
export interface RightTriangle {
  /** The first leg (cathetus). */
  readonly legA: number;
  /** The second leg (cathetus). */
  readonly legB: number;
  /** The side opposite the right angle. */
  readonly hypotenuse: number;
  /** Half the product of the legs. */
  readonly area: number;
  /** Sum of all three sides. */
  readonly perimeter: number;
}

/** Per-call options for `calculate`. */
export interface CalculateOptions {
  /** Which triangle to solve, e.g. `Type.Triangle.RIGHT`. */
  readonly type: Triangle;
  /**
   * Ties this call's terminal event to the caller. Echoed unchanged onto the
   * `COMPLETED` / `FAILED` event; the core never generates or interprets it.
   */
  readonly correlationId?: string;
}

/**
 * Solves a triangle of the given {@link Triangle} type from two inputs.
 *
 * The two leading numbers are the type's inputs — for `Type.Triangle.RIGHT`
 * they are the two legs. `options.type` discriminates which solver runs; today
 * only `RIGHT` is implemented, and any other type rejects with a `RangeError`.
 *
 * Async because the operation is pub/sub: every call ends by announcing exactly
 * one event through the use case's `EventBus` — `COMPLETED` on success,
 * `FAILED` otherwise. The answer is still returned directly, so a caller that
 * wants the value need not subscribe.
 *
 * @param legA - the first input; must be finite and greater than zero
 * @param legB - the second input; must be finite and greater than zero
 * @param options - the triangle type and an optional correlation id
 * @returns the solved triangle
 * @throws RangeError on bad input or an unimplemented type
 */
export type Calculate = (
  legA: number,
  legB: number,
  options: CalculateOptions,
) => Promise<RightTriangle>;

/** The triangle calculator reached as `triangle.calculate(a, b, Type.Triangle.RIGHT)`. */
export interface TriangleCalculator {
  readonly calculate: Calculate;
}

/**
 * The public shape of a `Geometry` instance — what you destructure from
 * `new Geometry({ eventBus })`.
 *
 * One member today — `triangle` — grouped so the capability can grow
 * (a `circle`, a `polygon`) without changing the call shape:
 *
 *   const { triangle } = new Geometry({ eventBus });
 */
export interface Geometry {
  readonly triangle: TriangleCalculator;
}

/**
 * What `new Port(...)` is handed: only the things the instantiator owns.
 * Everything else (the `math` service, the use cases) the composition root
 * builds and injects itself.
 */
export interface PortOptions {
  /** The bus every operation announces its outcome on. */
  readonly eventBus: EventBus;
  /**
   * Who emits this instance's events (a service, node or client name).
   * Stamped onto every event it publishes. Optional.
   */
  readonly source?: string;
}
