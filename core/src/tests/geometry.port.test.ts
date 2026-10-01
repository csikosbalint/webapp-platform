/**
 * Tests the core through its composition root, exactly as a consumer uses it:
 *
 *   const { geometry } = new Port({ eventBus, source });
 *   await geometry.triangle.calculate(3, 4, { type: Type.Triangle.RIGHT, correlationId });
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { Port, Topic, Type } from "../ports/index.js";
import type { EventBus } from "../ports/outbound/event.bus.port.js";

type AnyHandler = (payload: unknown) => Promise<void>;

/** The fake bus plus test hooks. */
interface FakeEventBus extends EventBus {
  /** Resolves once every handler scheduled so far has settled. */
  readonly drain: () => Promise<void>;
  /** Handler rejections the bus isolated from publishers. */
  readonly handlerErrors: unknown[];
}

/**
 * In-memory bus honoring the `EventBus` delivery contract: `publish` schedules
 * handlers without awaiting them, and a handler's rejection never reaches the
 * publisher. Pass `failPublish` to simulate a transport that rejects a topic.
 */
function createFakeEventBus(failPublish?: Topic): FakeEventBus {
  const handlers = new Map<Topic, Set<AnyHandler>>();
  const pending = new Set<Promise<void>>();
  const handlerErrors: unknown[] = [];

  return {
    handlerErrors,
    drain: async () => {
      await Promise.all(pending);
    },
    publish: async (topic, payload) => {
      if (topic === failPublish) throw new Error(`transport down: ${topic}`);
      for (const handler of handlers.get(topic) ?? []) {
        const run = Promise.resolve()
          .then(() => handler(payload))
          .catch((error: unknown) => {
            handlerErrors.push(error);
          })
          .finally(() => pending.delete(run));
        pending.add(run);
      }
    },
    subscribe: (topic, handler) => {
      const set = handlers.get(topic) ?? new Set<AnyHandler>();
      set.add(handler as AnyHandler);
      handlers.set(topic, set);
      return () => set.delete(handler as AnyHandler);
    },
  };
}

test("solves a right triangle and publishes COMPLETED with source and correlationId", async () => {
  const eventBus = createFakeEventBus();
  const source = "test-source";
  const correlationId = crypto.randomUUID();

  const completed: unknown[] = [];
  eventBus.subscribe(Topic.Geometry.Triangle.COMPLETED, async (event) => {
    completed.push(event);
  });

  const { geometry } = new Port({ eventBus, source });
  const result = await geometry.triangle.calculate(3, 4, {
    type: Type.Triangle.RIGHT,
    correlationId,
  });
  await eventBus.drain();

  assert.deepEqual(result, { legA: 3, legB: 4, hypotenuse: 5, area: 6, perimeter: 12 });
  assert.deepEqual(completed, [{ source, correlationId, result }]);
});

test("a non-positive leg publishes FAILED and rejects", async () => {
  const eventBus = createFakeEventBus();
  const source = "test-source";
  const correlationId = crypto.randomUUID();

  const failed: unknown[] = [];
  eventBus.subscribe(Topic.Geometry.Triangle.FAILED, async (event) => {
    failed.push(event);
  });

  const { geometry } = new Port({ eventBus, source });
  await assert.rejects(
    () => geometry.triangle.calculate(0, 4, { type: Type.Triangle.RIGHT, correlationId }),
    /legA must be a finite number greater than 0/,
  );
  await eventBus.drain();

  assert.deepEqual(failed, [
    {
      source,
      correlationId,
      operation: "geometry.triangle.calculate",
      inputs: [0, 4],
      reason: "legA must be a finite number greater than 0",
    },
  ]);
});

test("without source or correlationId the event omits both fields", async () => {
  const eventBus = createFakeEventBus();

  const completed: object[] = [];
  eventBus.subscribe(Topic.Geometry.Triangle.COMPLETED, async (event) => {
    completed.push(event);
  });

  const { geometry } = new Port({ eventBus });
  await geometry.triangle.calculate(3, 4, { type: Type.Triangle.RIGHT });
  await eventBus.drain();

  assert.equal(completed.length, 1);
  assert.deepEqual(Object.keys(completed[0] ?? {}), ["result"]);
});

test("an unsupported triangle type publishes FAILED and rejects", async () => {
  const eventBus = createFakeEventBus();

  const failed: string[] = [];
  eventBus.subscribe(Topic.Geometry.Triangle.FAILED, async ({ reason }) => {
    failed.push(reason);
  });

  const { geometry } = new Port({ eventBus });
  await assert.rejects(
    // @ts-expect-error -- deliberately passing a type the enum does not define.
    () => geometry.triangle.calculate(3, 4, { type: "triangle.equilateral" }),
    /unsupported triangle type/,
  );
  await eventBus.drain();

  assert.deepEqual(failed, ["unsupported triangle type: triangle.equilateral"]);
});

test("missing options from an untyped caller still publishes FAILED", async () => {
  const eventBus = createFakeEventBus();

  let failures = 0;
  eventBus.subscribe(Topic.Geometry.Triangle.FAILED, async () => {
    failures += 1;
  });

  const { geometry } = new Port({ eventBus });
  await assert.rejects(
    // @ts-expect-error -- simulating a JS caller that omits the options object.
    () => geometry.triangle.calculate(3, 4),
    /options must be an object/,
  );
  await eventBus.drain();

  assert.equal(failures, 1);
});

test("a throwing subscriber cannot fail the calculation", async () => {
  const eventBus = createFakeEventBus();

  eventBus.subscribe(Topic.Geometry.Triangle.COMPLETED, async () => {
    throw new Error("subscriber blew up");
  });

  const { geometry } = new Port({ eventBus });
  const result = await geometry.triangle.calculate(3, 4, { type: Type.Triangle.RIGHT });
  await eventBus.drain();

  assert.equal(result.hypotenuse, 5);
  assert.equal(eventBus.handlerErrors.length, 1);
});

test("a FAILED delivery error does not mask the original error", async () => {
  const eventBus = createFakeEventBus(Topic.Geometry.Triangle.FAILED);

  const { geometry } = new Port({ eventBus });
  await assert.rejects(
    () => geometry.triangle.calculate(-1, 4, { type: Type.Triangle.RIGHT }),
    (error: unknown) =>
      error instanceof RangeError && /legA must be a finite number/.test(error.message),
  );
});
