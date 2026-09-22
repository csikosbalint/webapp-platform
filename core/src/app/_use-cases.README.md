# `core/src/app/` — Use Cases

In Uncle Bob's terminology, this folder contains **application business rules**
and use-case interactors. The physical folder is named `app` for compatibility
with the package layout.

## Responsibilities

- Coordinate one actor-facing operation from start to finish.
- Apply application policy around entity/domain rules.
- Depend inward on `domain/` and on boundary types only.
- Return boundary-safe data without exposing framework objects.

`geometry.ts` is the current use-case implementation. It coordinates domain
arithmetic to calculate a right triangle and presents the result through the
input-boundary contract.

## Dependency Rule

Use Cases may depend on Entities and boundary **abstractions**. They must not
depend on Next.js, React, HTTP, databases, environment variables, or concrete
adapters. If a use case needs an external capability, define an outbound
boundary in `ports/` and receive an implementation from the composition root.

## Rules

- Keep use cases synchronous and deterministic unless an outbound boundary
  explicitly requires asynchronous behavior.
- Keep transport concerns out of this folder.
- Do not duplicate an Entity rule; call the domain operation instead.
- Make the actor-facing behavior explicit in the boundary types.
