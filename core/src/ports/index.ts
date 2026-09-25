/**
 * Public boundary barrel.
 *
 * Consumers may import port contracts from `@csikosbalint/webapp-platform-core/ports`
 * without reaching into the package's internal directory structure.
 *
 * Inbound contracts are here so callers know what they may invoke; outbound
 * contracts are here so driver authors know what they must implement.
 */

export type { MathPort } from "./inbound/math.port.js";
export type {
  CalculateRightTriangle,
  GeometryOperations,
  RightTriangle,
  SolveAndRecordRightTriangle,
} from "./inbound/math.types.js";
export type {
  CalculationRecord,
  ResultLog,
} from "./outbound/result.log.port.js";
