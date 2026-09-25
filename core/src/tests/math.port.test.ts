import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMath } from "../index.js";
import type { MathPort } from "../ports/inbound/math.port.js";
import { createFakeResultLog } from "./tmp.result.log.js";

/**
 * Port conformance: anything handed to an adapter as a MathPort must satisfy
 * this suite. When a second implementation appears (a fake, a memoised
 * variant), point it at `assertConformsToMathPort` rather than copying tests.
 */
function assertConformsToMathPort(port: MathPort): void {
  assert.equal(typeof port.geometry, "object");
  assert.equal(typeof port.geometry.calculateRightTriangle, "function");
  assert.equal(typeof port.geometry.solveAndRecordRightTriangle, "function");
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

/** The port under test, wired to a throwaway outbound driver. */
const buildPort = (): MathPort => createMath(createFakeResultLog());

describe("ports/inbound/math", () => {
  it("createMath returns a conforming port", () => {
    assertConformsToMathPort(buildPort());
  });

  it("exposes only the declared namespaces", () => {
    assert.deepEqual(Object.keys(buildPort()), ["geometry"]);
  });

  it("exposes only the declared geometry operations", () => {
    assert.deepEqual(Object.keys(buildPort().geometry), [
      "calculateRightTriangle",
      "solveAndRecordRightTriangle",
    ]);
  });

  it("returns an independent instance per call", () => {
    assert.notEqual(buildPort(), buildPort());
  });

  it("does not leak domain internals through the port", () => {
    const port = buildPort() as MathPort & Record<string, unknown>;
    assert.equal(port["add"], undefined);
    assert.equal(port["multiply"], undefined);
  });

  it("does not leak the outbound driver through the port", () => {
    const geometry: Record<string, unknown> = { ...buildPort().geometry };
    assert.equal(geometry["resultLog"], undefined);
    assert.equal(geometry["recordLast"], undefined);
  });

  it("rejects legs that cannot describe a triangle", () => {
    const { calculateRightTriangle } = buildPort().geometry;
    assert.throws(() => calculateRightTriangle(0, 4), RangeError);
    assert.throws(() => calculateRightTriangle(3, -1), RangeError);
    assert.throws(() => calculateRightTriangle(3, Number.NaN), RangeError);
  });
});
