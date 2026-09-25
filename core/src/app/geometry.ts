/**
 * Use Case layer: geometry behavior composed from Entity operations.
 *
 * Depends inward on `domain/` and on port *types* only — the inbound contract
 * it implements and the outbound contract it requires. The dependency on the
 * port types is what makes this an implementation of a declared contract
 * rather than a free-floating function.
 */

import { add, divide, multiply } from "../domain/basic.operations.js";
import type {
    CalculateRightTriangle,
    GeometryOperations,
    SolveAndRecordRightTriangle,
} from "../ports/inbound/math.types.js";
import type { ResultLog } from "../ports/outbound/result.log.port.js";

/**
 * Derives the hypotenuse, area and perimeter of a right triangle from its two
 * legs.
 *
 * Every arithmetic step goes through the domain primitives; `Math.sqrt` is the
 * one operation the domain does not provide, so it is used directly.
 *
 * Pure: same input, same output, no side effect. It needs no dependencies, so
 * it lives outside the factory below.
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
 * Builds the geometry namespace.
 *
 * This is where the outbound port earns its keep. The use case asks for a
 * `ResultLog` as a parameter and never learns which implementation it got: a
 * file under `/tmp`, an in-memory fake in a test, a row in a database. The
 * arrow of dependency points inward because the interface is declared in
 * `ports/outbound/`, owned by this layer, and the driver conforms to it.
 *
 * Note that `calculateRightTriangle` — the Entity-level arithmetic — is reused
 * untouched. Entities stay pure; only the use case is allowed the side effect.
 *
 * @param resultLog - where to record the most recent answer
 */
export function createGeometry(resultLog: ResultLog): GeometryOperations {
    const solveAndRecordRightTriangle: SolveAndRecordRightTriangle = async (
        legA,
        legB,
    ) => {
        const triangle = calculateRightTriangle(legA, legB);

        await resultLog.recordLast({
            operation: "geometry.calculateRightTriangle",
            inputs: [legA, legB],
            result: triangle.hypotenuse,
        });

        return triangle;
    };

    /*
     * Annotated so the compiler checks the namespace against the port contract
     * here rather than only at the composition root.
     */
    const geometry: GeometryOperations = {
        calculateRightTriangle,
        solveAndRecordRightTriangle,
    };

    return geometry;
}
