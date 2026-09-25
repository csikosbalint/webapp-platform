/**
 * Composition root: the only place that binds implementations to ports.
 *
 * This is the core's entire public surface. Adapters in `plugins/` import the
 * factory and the port types from here and never reach into `app/` or
 * `domain/` — the `exports` map in package.json enforces that at resolution
 * time.
 */

import { createGeometry } from "./app/geometry.js";
import type { MathPort } from "./ports/inbound/math.port.js";
import type { ResultLog } from "./ports/outbound/result.log.port.js";

export type { MathPort } from "./ports/inbound/math.port.js";
export type {
  CalculateRightTriangle,
  GeometryOperations,
  RightTriangle,
  SolveAndRecordRightTriangle,
} from "./ports/inbound/math.types.js";
export type {
  CalculationRecord,
  ResultLog,
} from "./ports/outbound/result.log.port.js";

/**
 * Builds the math inbound port.
 *
 * The outbound dependency arrives here as a parameter, which is the whole
 * point of an output boundary: the caller — a route handler, a CLI, a test —
 * chooses the implementation, and nothing inside `core/` knows what it is.
 *
 * @param resultLog - driver that persists the most recent calculation
 */
export function createMath(resultLog: ResultLog): MathPort {
  return { geometry: createGeometry(resultLog) };
}
