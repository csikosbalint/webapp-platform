/**
 * Inbound port: the math capability the core offers to the outside.
 *
 * This file declares a contract and nothing else. Its only import is the
 * sibling type vocabulary in `math.types.ts` — a port that reaches into `app/`
 * or `domain/` is wiring, not a contract. Implementations live in `app/`;
 * binding happens in `index.ts`.
 */

import type { GeometryOperations } from "./math.types.js";

/**
 * The operations reachable through the math inbound port, grouped into
 * subject namespaces.
 */
export interface MathPort {
  readonly geometry: GeometryOperations;
}
