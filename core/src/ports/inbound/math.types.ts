/**
 * The type vocabulary of the math capability: operation signatures, the data
 * shapes they exchange, and the namespaces that group them.
 *
 * Types only, no imports — this file is the shared language that `math.port.ts`
 * assembles into a contract and that `app/` implements against.
 */

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

/**
 * Solves a right triangle from its two legs.
 *
 * @param legA - the first leg; must be finite and greater than zero
 * @param legB - the second leg; must be finite and greater than zero
 * @returns the legs together with the derived hypotenuse, area and perimeter
 */
export type CalculateRightTriangle = (
  legA: number,
  legB: number,
) => RightTriangle;

/**
 * The geometry namespace of the math port.
 *
 * Grouping by subject keeps the port readable as it grows: callers reach an
 * operation as `math.geometry.calculateRightTriangle` rather than through a
 * flat list of unrelated functions.
 */
export interface GeometryOperations {
  readonly calculateRightTriangle: CalculateRightTriangle;
}
