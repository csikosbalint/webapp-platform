/**
 * Composition root: the only place that binds implementations to ports.
 *
 * This is the core's entire public surface. Adapters in `plugins/` import the
 * factory and the port types from here and never reach into `app/` or
 * `domain/` — the `exports` map in package.json enforces that at resolution
 * time.
 */

import geometryModule from "./app/geometry.js";
import type { MathPort } from "./ports/inbound/math.port.js";

export type { MathPort } from "./ports/inbound/math.port.js";
export type {
  CalculateRightTriangle,
  GeometryOperations,
  RightTriangle,
} from "./ports/inbound/math.types.js";

const { geometry } = geometryModule;

/**
 * Builds the math inbound port.
 *
 * Takes no dependencies today. When a use case needs an outbound port (a
 * store, a clock, a notifier), it arrives as a parameter here rather than
 * being imported deeper in the tree.
 */
export function createMath(): MathPort {
  return { geometry };
}
