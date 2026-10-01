/**
 * Composition root: the core's root public surface.
 *
 * The use-case entry point — the `Port.Geometry` class — is served from the
 * `./ports` subpath (`@csikosbalint/webapp-platform-core/ports`), alongside the
 * port contracts. This root entry re-exports the shared vocabulary (the
 * `Type` kind tree, the `Topic` topic tree, and the port types) so a
 * consumer that only needs those does not reach into `./ports`.
 *
 * Adapters in `plugins/` import from here and from `./ports`, never from `app/`
 * or `domain/` — the `exports` map in package.json enforces that at resolution
 * time.
 */

export { Type } from "./ports/inbound/math.types.js";
export type { RightTriangle } from "./ports/inbound/math.types.js";

export { Topic } from "./ports/outbound/event.bus.port.js";
export type { EventBus } from "./ports/outbound/event.bus.port.js";
