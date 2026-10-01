# Clean Architecture in this repository

This document defines architectural roles and dependency direction. It is
intentionally about concepts, not concrete APIs, filenames, framework versions,
or wiring syntax.

| Document | Scope |
|---|---|
| this document | The system-wide dependency rule and interaction model |
| [`core/CORE.md`](./core/CORE.md) | Entities, use cases, boundaries, and Main |
| [`plugins/PLUGINS.md`](./plugins/PLUGINS.md) | Controllers, presenters, views, and drivers |
| [`plugins/ui/UI.md`](./plugins/ui/UI.md) | How a web UI applies those outer-circle roles |

## Reading the sketch

The supplied sketch is directionally consistent with Uncle Bob's Clean
Architecture, with four important clarifications:

1. The controller and presenter are sibling **interface adapters**. The view
   sends user intent to the controller and reads a view model produced by the
   presenter.
2. “Port” is not one middle object. The inward path crosses an **input
   boundary**; the outward path crosses an **output boundary**.
3. The interactor coordinates the use case and invokes entities. A response
   model leaves the interactor through an output boundary before the presenter
   converts it into a view model.
4. Main, or the composition root, is omitted from the sketch. Main wires the
   concrete graph but does not participate in the business interaction.

The resulting control flow is:

```text
User → View → Controller → Input Boundary → Interactor → Entities
                                               │
                                               └→ Output Boundary → Presenter → View Model → View
```

For event-driven output, the outward half may cross a message transport:

```text
Interactor → Message Output Boundary → Driver/Transport → Presenter → View Model
```

A correlation identifier lets the presenter associate a terminal output with
one request when several operations share the transport.

These arrows show **runtime control flow**. They do not show source-code
dependency direction.

## The Dependency Rule

> Source-code dependencies point toward policy. Nothing in an inner circle
> knows the name of anything in an outer circle.

Conceptually:

```text
Frameworks & Drivers → Interface Adapters → Application Boundaries / Use Cases → Entities
```

The details follow from that rule:

- Entities know only enterprise rules.
- Interactors depend on entities and application-owned boundary abstractions.
- Controllers depend on input boundaries, not on use-case implementations.
- Presenters depend on output/response boundaries, not on entities or drivers.
- Drivers implement output boundaries owned by the application.
- Main may know every concrete component it must assemble, but no use case may
  know Main or the dependency-injection mechanism.

Calls may travel outward through an output boundary. Imports still point toward
the boundary owned by the inner policy. That inversion is what permits a driver
or framework to be replaced without changing a use case or entity.

## Roles

| Role | Responsibility | Must not do |
|---|---|---|
| View | Render a view model and retain ephemeral interaction input | Invoke business rules or format domain output |
| Controller | Translate user/transport input into an input-boundary request | Mutate entities directly or prepare display output |
| Input boundary | Define what an actor may ask the application to do | Mention a UI, route, framework, or transport |
| Interactor / use case | Coordinate one actor goal and application policy | Know a controller, presenter, driver, or container |
| Entity | Enforce enterprise rules independent of delivery and infrastructure | Perform I/O or depend on a boundary |
| Output boundary | Define output or an external capability needed by a use case | Expose framework or vendor details |
| Presenter | Convert a response/event model into a view model | Re-run business rules or drive the use case |
| Driver | Realize I/O or transport behind an output boundary | Define application policy |
| Main / composition root | Construct and connect the concrete object graph | Contain business decisions |

A public facade may expose assembled input capabilities for convenience. The
facade belongs to Main; it is not itself the input or output port contract.

## State ownership

State belongs with the policy that gives it meaning:

| State | Owner |
|---|---|
| Raw field values, focus, expanded panels | View |
| Pending requests, correlation tracking, display-ready output | Interface adapter / presenter model |
| Workflow decisions and application invariants | Use case |
| Enterprise identity and lifecycle | Entity |
| Connections, subscriptions, retries, delivery state | Driver |

A controller does not “mutate core state.” It translates an actor's intent and
invokes an input boundary. A presenter does not own business state; it owns the
representation shown by the view.

## Architectural tests

The design is healthy when all of these remain true:

- The core can compile and execute without any delivery plugin.
- A delivery framework can be replaced without changing an entity or use case.
- A transport can be replaced by another driver behind the same output
  boundary.
- The view can change formatting and layout without changing application rules.
- Use cases receive collaborators through explicit construction and never
  resolve them from a container.
- Boundary data is not mistaken for an entity, and a view model is not passed
  back into the core.
