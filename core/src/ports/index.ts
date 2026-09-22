/**
 * Public boundary barrel.
 *
 * Consumers may import port contracts from `@csikosbalint/webapp-platform-core/ports`
 * without reaching into the package's internal directory structure.
 */

export type { MathPort } from "./inbound/math.port.js";
export type {
  CalculateRightTriangle,
  GeometryOperations,
  RightTriangle,
} from "./inbound/math.types.js";
