import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { createMath } from "../index.js";
import {
  createFailingResultLog,
  createFakeResultLog,
  createTmpFileResultLog,
} from "./tmp.result.log.js";

describe("ports/outbound/result-log", () => {
  it("records the last result through whatever driver it was given", async () => {
    const log = createFakeResultLog();
    const math = createMath(log);

    await math.geometry.solveAndRecordRightTriangle(3, 4);

    assert.deepEqual(log.entries, [
      {
        operation: "geometry.calculateRightTriangle",
        inputs: [3, 4],
        result: 5,
      },
    ]);
  });

  it("still returns the solved triangle to the caller", async () => {
    const math = createMath(createFakeResultLog());

    assert.deepEqual(await math.geometry.solveAndRecordRightTriangle(6, 8), {
      legA: 6,
      legB: 8,
      hypotenuse: 10,
      area: 24,
      perimeter: 24,
    });
  });

  it("leaves the pure calculation free of side effects", async () => {
    const log = createFakeResultLog();
    const math = createMath(log);

    math.geometry.calculateRightTriangle(3, 4);

    assert.deepEqual(log.entries, []);
  });

  it("validates before it records", async () => {
    const log = createFakeResultLog();
    const math = createMath(log);

    await assert.rejects(
      () => math.geometry.solveAndRecordRightTriangle(0, 4),
      RangeError,
    );
    assert.deepEqual(log.entries, []);
  });

  it("lets a driver failure reach the caller", async () => {
    const math = createMath(createFailingResultLog());

    await assert.rejects(
      () => math.geometry.solveAndRecordRightTriangle(3, 4),
      /disk on fire/,
    );
  });

  describe("with the /tmp file driver", () => {
    const log = createTmpFileResultLog(
      `/tmp/webapp-platform-last-result.test-${process.pid}.json`,
    );

    after(() => log.clear());

    it("writes the last result to /tmp", async () => {
      await createMath(log).geometry.solveAndRecordRightTriangle(3, 4);

      assert.ok(log.path.startsWith("/tmp/"));
      assert.deepEqual(await log.readLast(), {
        operation: "geometry.calculateRightTriangle",
        inputs: [3, 4],
        result: 5,
      });
    });

    it("keeps only the most recent result", async () => {
      const math = createMath(log);

      await math.geometry.solveAndRecordRightTriangle(3, 4);
      await math.geometry.solveAndRecordRightTriangle(5, 12);

      assert.deepEqual((await log.readLast())?.inputs, [5, 12]);
    });
  });
});
