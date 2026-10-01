/**
 * Public boundary barrel and composition root — served as
 * `@csikosbalint/webapp-platform-core/ports`.
 *
 * `Port` is the one place the core is wired. Its constructor takes only what
 * the instantiator owns (the outbound drivers and an optional `source`),
 * registers everything in an awilix container, and lets awilix construct the
 * use cases by CONSTRUCTOR INJECTION — each use case declares its dependencies
 * as its constructor parameter (e.g. `GeometryDependencies`) and never sees
 * the container:
 *
 *   const { geometry } = new Port({ eventBus, source });
 *   await geometry.triangle.calculate(3, 4, { type: Type.Triangle.RIGHT });
 *
 * Injection mode is PROXY: awilix passes the cradle as the single constructor
 * argument and resolves each destructured property by name. Unlike CLASSIC it
 * does not parse parameter names from `Function#toString`, so it survives a
 * consumer's minifier.
 */

import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";

import { Geometry } from "../app/geometry.js";
import { add, divide, multiply, subtract } from "../domain/basic.operations.js";
import type { MathOperations, PortOptions } from "./inbound/math.types.js";
import type { EventBus } from "./outbound/event.bus.port.js";

/** Every registration in the container, by name. */
interface Cradle {
  readonly math: MathOperations;
  readonly eventBus: EventBus;
  readonly source: string | undefined;
  readonly geometry: Geometry;
}

/** The core's composition root. Construct one per set of drivers. */
export class Port {
  /** The geometry use case, constructed by the container. */
  readonly geometry: Geometry;

  constructor({ eventBus, source }: PortOptions) {
    const container: AwilixContainer<Cradle> = createContainer<Cradle>({
      injectionMode: InjectionMode.PROXY,
      strict: true,
    });

    container.register({
      math: asValue<MathOperations>({ add, multiply, divide, subtract }),
      eventBus: asValue(eventBus),
      source: asValue(source),
      geometry: asClass(Geometry).singleton(),
    });

    this.geometry = container.resolve("geometry");
  }
}

export { Type } from "./inbound/math.types.js";
export type { RightTriangle } from "./inbound/math.types.js";

export { Topic } from "./outbound/event.bus.port.js";
export type { EventBus } from "./outbound/event.bus.port.js";
