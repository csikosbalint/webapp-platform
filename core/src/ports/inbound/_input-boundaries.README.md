# `core/src/ports/inbound/` — Input Boundaries

An inbound port is an **Input Boundary** in Uncle Bob's Clean Architecture:
the interface through which an actor asks the application to perform a
use case.

## Contract rules

- Describe capabilities, not HTTP, React, Next.js, or another transport.
- Keep signatures framework-agnostic and easy for a controller or UI adapter
  to call.
- Keep request and response shapes stable and explicit.
- Import types only when a runtime dependency is unnecessary.
- Do not implement behavior here; implementations belong to `app/`.

`math.port.ts` exposes `MathPort`, while `math.types.ts` contains the shared
boundary vocabulary. `index.ts` is responsible for binding the implementation
to this input boundary.

An inbound boundary is not a controller. Controllers and other interface
adapters translate transport details into this contract from outside `core/`.
