/**
 * Use Case layer: the `Geometry` class.
 *
 * Takes its dependencies through the constructor and knows nothing about how
 * they were built — no container, no service locator, no framework import.
 * The composition root (`Port`, in `ports/index.ts`) registers it with awilix,
 * which constructs it by injecting the declared {@link GeometryDependencies}:
 *
 *   const { geometry } = new Port({ eventBus, source });
 *   await geometry.triangle.calculate(3, 4, { type: Type.Triangle.RIGHT });
 *
 * Rules: `/CLEAN-ARCHITECTURE.md`.
 */

import type {
    Calculate,
    CalculateOptions,
    Geometry as GeometryShape,
    MathOperations,
    RightTriangle,
    TriangleCalculator,
} from "../ports/inbound/math.types.js";
import { Triangle } from "../ports/inbound/math.types.js";
import type { EventBus, EventMetadata } from "../ports/outbound/event.bus.port.js";
import { Topic } from "../ports/outbound/event.bus.port.js";

/** Identifies this operation in events. */
const OPERATION = "geometry.triangle.calculate";

/**
 * What `Geometry` needs, injected by the composition root. The property names
 * are the container's registration names.
 */
export interface GeometryDependencies {
    /** The arithmetic the solvers run on. */
    readonly math: MathOperations;
    /** The bus every operation announces its outcome on. */
    readonly eventBus: EventBus;
    /** Stamped onto every event this instance publishes, when present. */
    readonly source?: string | undefined;
}

/** The geometry use case. Its public surface is just `triangle`. */
export class Geometry implements GeometryShape {
    readonly triangle: TriangleCalculator;

    constructor({ math, eventBus, source }: GeometryDependencies) {
        const metadata: EventMetadata = source === undefined ? {} : { source };
        this.triangle = { calculate: makeCalculate(math, eventBus, metadata) };
    }
}

/**
 * Builds `triangle.calculate`.
 *
 * Invariant: every call publishes exactly one terminal event, including calls
 * whose options are missing or malformed — options are read INSIDE the `try`
 * so a bad call is reported as `FAILED` rather than escaping unannounced.
 *
 * Failure precedence:
 * - a solver error is rethrown to the caller after `FAILED` is published;
 * - if publishing `FAILED` itself fails, the ORIGINAL solver error is still
 *   what the caller receives — a delivery problem while reporting a failure
 *   must not mask the failure;
 * - if publishing `COMPLETED` fails (a transport error; subscriber errors never
 *   reach the publisher, see `EventBus`), the call rejects with that error and
 *   no `FAILED` follows — the calculation did not fail.
 */
function makeCalculate(
    math: MathOperations,
    eventBus: EventBus,
    instanceMetadata: EventMetadata,
): Calculate {
    return async (legA, legB, options) => {
        const inputs = [legA, legB] as const;
        let metadata = instanceMetadata;
        let announced = false;

        try {
            const { type, correlationId } = readOptions(options);
            if (correlationId !== undefined) {
                metadata = { ...instanceMetadata, correlationId };
            }

            const triangle = solve(math, legA, legB, type);

            announced = true;
            await eventBus.publish(Topic.Geometry.Triangle.COMPLETED, {
                ...metadata,
                result: triangle,
            });

            return triangle;
        } catch (cause) {
            if (!announced) {
                try {
                    await eventBus.publish(Topic.Geometry.Triangle.FAILED, {
                        ...metadata,
                        operation: OPERATION,
                        inputs,
                        reason: cause instanceof Error ? cause.message : String(cause),
                    });
                } catch {
                    // Deliberately dropped: the original `cause` takes precedence.
                }
            }

            throw cause;
        }
    };
}

/**
 * Validates `options` at runtime. The static type already requires it; this
 * guards untyped callers so they get a `RangeError` and a `FAILED` event.
 */
function readOptions(options: CalculateOptions | undefined): CalculateOptions {
    if (typeof options !== "object" || options === null) {
        throw new RangeError("options must be an object with a triangle type");
    }
    return options;
}

/** Dispatches on type; only `RIGHT` is implemented. */
function solve(
    math: MathOperations,
    legA: number,
    legB: number,
    type: Triangle,
): RightTriangle {
    switch (type) {
        case Triangle.RIGHT:
            return solveRight(math, legA, legB);
        default:
            throw new RangeError(`unsupported triangle type: ${String(type)}`);
    }
}

/**
 * Solves a right triangle from its two legs using the injected `math`
 * service. `Math.sqrt` is the one op the domain does not provide.
 */
function solveRight(math: MathOperations, legA: number, legB: number): RightTriangle {
    assertLeg(legA, "legA");
    assertLeg(legB, "legB");

    const hypotenuse = Math.sqrt(
        math.add(math.multiply(legA, legA), math.multiply(legB, legB)),
    );
    const area = math.divide(math.multiply(legA, legB), 2);
    const perimeter = math.add(math.add(legA, legB), hypotenuse);

    return { legA, legB, hypotenuse, area, perimeter };
}

/** Rejects legs that cannot describe a triangle side. */
function assertLeg(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be a finite number greater than 0`);
    }
}
