/**
 * Domain layer: primitive operations. Depends on nothing — not the app
 * layer, not the ports, not any framework.
 */

/** Returns the sum of two numbers. */
export function add(a: number, b: number): number {
  return a + b;
}

/** Returns the product of two numbers. */
export function multiply(a: number, b: number): number {
  return a * b;
}

/** Returns `a` divided by `b` (IEEE 754: dividing by 0 yields ±Infinity or NaN). */
export function divide(a: number, b: number): number {
  return a / b;
}

/** Returns `a` minus `b`. */
export function subtract(a: number, b: number): number {
  return a - b;
}
