# `core/src/ports/` — Boundaries

In Uncle Bob's terminology, these are **boundaries**: interfaces that cross the
seams between the core and the outside world. In Hexagonal Architecture they
are ports.

## Responsibilities

- Declare what an external actor can call through input boundaries.
- Declare what a use case needs from infrastructure through output boundaries.
- Define stable data types crossing those boundaries.
- Depend on domain types when a boundary needs to describe domain data, never on
  frameworks or concrete adapters.

The boundary is owned by the inner policy. An adapter outside the core must
conform to this contract; the core must not change its contract to suit an
adapter.

## Direction

- `inbound/` contains **input boundaries**: calls into the core from a UI,
  controller, CLI, or another driver.
- A future `outbound/` contains **output boundaries**: capabilities requested by
  use cases, such as persistence, clocks, or notifications.

The public boundary barrel is available as
`@csikosbalint/webapp-platform-core/ports`. Keep it declarative and export only
intentional contracts from that barrel. Implementations belong in `app/` or
outside the core, and assembly belongs in `src/index.ts`.
