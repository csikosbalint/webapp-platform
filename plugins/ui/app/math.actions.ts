"use server";

/**
 * Interface Adapters: the server side of the math boundary call.
 *
 * The calculation never runs in the client component. This module constructs
 * the core once via `new Port({ eventBus, source })` and translates a UI request
 * into `geometry.triangle.calculate(a, b, { type: Type.Triangle.RIGHT })`, awaits
 * it, and returns plain data. It imports only the published core surface — never
 * a path inside `core/src`.
 *
 * This plugin owns the choice of outbound drivers, so it supplies the event bus
 * where the events every core operation publishes are delivered.
 */
import type { RightTriangle } from "@csikosbalint/webapp-platform-core/ports";
import { Port, Type } from "@csikosbalint/webapp-platform-core/ports";

import { eventBus } from "./event.bus.driver";

const { geometry } = new Port({ eventBus, source: "ui-server" });

/**
 * TEMPORARY: artificial latency so the pending state is visible in the demo.
 * Remove once a real transport adds its own latency.
 */
const ARTIFICIAL_DELAY_MS = 1500;

/**
 * Solves a right triangle from its two legs.
 *
 * Publishes a COMPLETED or FAILED topic through the core's event port as a side
 * effect of the call.
 *
 * @param legA - the first leg; must be finite and greater than zero
 * @param legB - the second leg; must be finite and greater than zero
 */
export async function solveTriangle(
  legA: number,
  legB: number,
): Promise<RightTriangle> {
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));
  return geometry.triangle.calculate(legA, legB, { type: Type.Triangle.RIGHT });
}
