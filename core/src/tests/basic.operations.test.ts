import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { add } from "../domain/basic.operations.js";

describe("domain/add", () => {
  it("sums two positives", () => {
    assert.equal(add(2, 3), 5);
  });

  it("is commutative", () => {
    assert.equal(add(7, -2), add(-2, 7));
  });

  it("treats 0 as the identity", () => {
    assert.equal(add(41, 0), 41);
    assert.equal(add(0, 41), 41);
  });

  it("handles negatives", () => {
    assert.equal(add(-4, -6), -10);
  });
});
