/**
 * Domain layer: primitive operations. Depends on nothing — not the app
 * layer, not the ports, not any framework.
 */

/** Returns the sum of two numbers. */
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  return a / b;
}

export function  subtract(a: number, b: number): number {
  return a - b;
}
