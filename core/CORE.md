# `core/` — application policy and boundaries

Read [`CLEAN-ARCHITECTURE.md`](../CLEAN-ARCHITECTURE.md) first. This document
explains the inner policy, its boundaries, and the Main component that assembles
it. It deliberately avoids concrete APIs and implementation walkthroughs.

The package physically contains more than one architectural circle. Entities
and use cases are inner policy; boundary contracts surround them; Main is an
outer assembly component even when it is distributed with the same package.
Physical proximity never relaxes the Dependency Rule.

## Entities

Entities contain enterprise rules that remain true regardless of framework,
transport, persistence, or presentation.

They are:

- deterministic and side-effect free;
- expressed in business language;
- independent of use cases and boundaries;
- unaware of time, randomness, configuration, and I/O unless those values are
  supplied as ordinary inputs;
- testable without mocks or framework setup.

An entity is not a request, response, event, or view model. Those shapes cross
boundaries; entities express business meaning.

## Use cases / interactors

A use case coordinates one actor goal. It receives an input model, invokes
entity rules, applies application policy, and produces an outcome.

A use case may depend on:

- entities and domain services;
- input and output boundary abstractions owned by the application;
- plain boundary data that does not expose a delivery technology.

A use case must not depend on:

- a framework, controller, presenter, database, broker, or concrete driver;
- Main or a dependency-injection container;
- configuration objects or ambient process state;
- a view model or any display concern.

Collaborators are supplied through construction. Constructor injection keeps
dependencies explicit and lets Main choose their implementations. Resolving a
collaborator from a container inside a use case would turn the container into a
service locator and reverse the dependency.

## Input boundaries

An input boundary defines what an actor may ask the application to do. It is
owned by the application and implemented by an interactor. A controller adapts
external input to it.

An input boundary describes capability and application data, not HTTP, forms,
components, routes, or framework events. It is not a controller and does not
own view state.

## Output boundaries

An output boundary defines what a use case needs beyond its own policy or how
an outcome leaves the use case. Drivers and presenters conform to these
application-owned abstractions.

An output boundary may represent persistence, time, identity generation,
notification, or message delivery. Its vocabulary is application data, never a
vendor SDK or transport object.

For an event-driven outcome:

- the interactor publishes a terminal success or failure model;
- optional source metadata identifies the producer;
- an optional correlation identifier connects the outcome to the request that
  caused it;
- a presenter consumes the matching outcome and creates a view model;
- delivery, retries, subscriptions, and handler failures remain transport
  concerns.

The response/event model is boundary data. It may describe an entity result,
but it is not itself evidence that an entity has been exposed.

## Main / composition root

Main constructs the concrete object graph. It is the only place allowed to know
the composition mechanism and the implementations being connected.

Main:

- receives outer-world drivers selected by the application host;
- registers or constructs domain services and interactors;
- injects each use case's declared collaborators;
- exposes the assembled input capabilities to delivery adapters.

A convenience facade around the assembled capabilities belongs to Main. Calling
that facade a “port” does not make it a boundary contract; the architectural
ports remain the input and output abstractions crossed by adapters and use
cases.

The use cases never receive the container, never resolve registrations, and
never know how the graph was assembled.

## Public boundary

The published surface should reveal only what an external adapter must use:

- assembled input capabilities;
- application-owned request, response, event, and boundary contracts;
- stable application vocabulary.

Entities, use-case implementations, domain helpers, container registrations,
and internal dependency shapes remain private. Public exposure is a deliberate
architectural decision, not a side effect of where a type is declared.

## Tests

Tests occupy an outer ring. They may act as controllers and drivers, but they
must exercise inner policy through the same boundaries available to real
adapters.

- Entity tests need no mocks.
- Use-case tests replace only explicit output boundaries.
- Composition tests prove that Main connects the graph.
- Contract tests verify driver behavior independently of business rules.

A test helper never justifies an inward dependency on the test runner or a
concrete driver.
