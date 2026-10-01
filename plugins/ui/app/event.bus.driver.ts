/**
 * Frameworks & Drivers: a plugin-owned `EventBus` implementation.
 *
 * The core declares the bus as a logical contract — topic-keyed publish and
 * subscribe — and says nothing about transport. This driver is the simplest
 * possible transport: an in-process emitter, module-scoped, keyed by topic.
 * Because the contract is what the core sees, swapping this for a Redis pub/sub,
 * a broker client, or a websocket fan-out across several servers and the browser
 * changes nothing inside `core/`.
 *
 * A distributed implementation would satisfy the same `EventBus` interface:
 * `publish` writes to the transport under a topic, `subscribe` registers against
 * messages arriving for that topic — including ones this process never published.
 */
import type {
  EventBus,
  Topic,
} from "@csikosbalint/webapp-platform-core/ports";

type AnyHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<Topic, Set<AnyHandler>>();

/**
 * The single in-process bus instance.
 *
 * A module singleton on purpose: publisher and subscribers must share one bus
 * for delivery to happen. A distributed driver would not need this, because the
 * transport itself is the shared medium.
 *
 * Honors the `EventBus` delivery contract: handlers are scheduled, not awaited,
 * and a handler's rejection is logged here rather than reaching the publisher.
 */
export const eventBus: EventBus = {
  publish: async (topic, payload) => {
    for (const handler of handlers.get(topic) ?? []) {
      void Promise.resolve()
        .then(() => handler(payload))
        .catch((error: unknown) => {
          console.error(`[event bus] handler for ${topic} failed`, error);
        });
    }
  },
  subscribe: (topic, handler) => {
    const set = handlers.get(topic) ?? new Set<AnyHandler>();
    set.add(handler as AnyHandler);
    handlers.set(topic, set);
    return () => set.delete(handler as AnyHandler);
  },
};
