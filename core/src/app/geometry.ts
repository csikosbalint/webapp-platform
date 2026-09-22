/**
 * Use Case layer: geometry behavior composed from Entity operations.
 *
 * Depends inward on `domain/` and on the port *types* only. The dependency on
 * the port types is what makes this an implementation of a declared contract
 * rather than a free-floating function.
 */

import { add, divide, multiply } from "../domain/basic.operations.js";
import type {
    CalculateRightTriangle,
    GeometryOperations,
} from "../ports/inbound/math.types.js";

/**
 * Derives the hypotenuse, area and perimeter of a right triangle from its two
 * legs.
 *
 * Every arithmetic step goes through the domain primitives; `Math.sqrt` is the
 * one operation the domain does not provide, so it is used directly.
 *
 * @throws RangeError when either leg is not a finite number greater than zero.
 */
const calculateRightTriangle: CalculateRightTriangle = (legA, legB) => {
    assertLeg(legA, "legA");
    assertLeg(legB, "legB");

    const hypotenuse = Math.sqrt(add(multiply(legA, legA), multiply(legB, legB)));
    const area = divide(multiply(legA, legB), 2);
    const perimeter = add(add(legA, legB), hypotenuse);

    return { legA, legB, hypotenuse, area, perimeter };
};

/** Rejects legs that cannot describe a triangle side. */
function assertLeg(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be a finite number greater than 0`);
    }
}

/**
 * The geometry namespace, annotated so the compiler checks it against the port
 * contract here rather than only at the composition root.
 */
const geometry: GeometryOperations = {
    calculateRightTriangle,
};

export default { geometry };
