import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMath } from "../index.js";
import type { MathPort } from "../ports/inbound/math.port.js";

/**
 * Port conformance: anything handed to an adapter as a MathPort must satisfy
 * this suite. When a second implementation appears (a fake, a memoised
 * variant), point it at `assertConformsToMathPort` rather than copying tests.
 */
function assertConformsToMathPort(port: MathPort): void {
  assert.equal(typeof port.geometry, "object");
  assert.equal(typeof port.geometry.calculateRightTriangle, "function");
  assert.equal(
    port.geometry.calculateRightTriangle.length,
    2,
    "calculateRightTriangle takes two parameters",
  );
  assert.deepEqual(port.geometry.calculateRightTriangle(3, 4), {
    legA: 3,
    legB: 4,
    hypotenuse: 5,
    area: 6,
    perimeter: 12,
  });
}

describe("ports/inbound/math", () => {
  it("createMath returns a conforming port", () => {
    assertConformsToMathPort(createMath());
  });

  it("exposes only the declared namespaces", () => {
    assert.deepEqual(Object.keys(createMath()), ["geometry"]);
  });

  it("exposes only the declared geometry operations", () => {
    assert.deepEqual(Object.keys(createMath().geometry), [
      "calculateRightTriangle",
    ]);
  });

  it("returns an independent instance per call", () => {
    assert.notEqual(createMath(), createMath());
  });

  it("does not leak domain internals through the port", () => {
    const port = createMath() as MathPort & Record<string, unknown>;
    assert.equal(port["add"], undefined);
    assert.equal(port["multiply"], undefined);
  });

  it("rejects legs that cannot describe a triangle", () => {
    const { calculateRightTriangle } = createMath().geometry;
    assert.throws(() => calculateRightTriangle(0, 4), RangeError);
    assert.throws(() => calculateRightTriangle(3, -1), RangeError);
    assert.throws(() => calculateRightTriangle(3, Number.NaN), RangeError);
  });
});
