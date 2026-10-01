# `plugins/` — interface adapters and delivery mechanisms

Read [`CLEAN-ARCHITECTURE.md`](../CLEAN-ARCHITECTURE.md) first. A plugin is an
outer delivery mechanism. It lets an actor reach the application and supplies
infrastructure behind application-owned boundaries.

A plugin decides **how** the application is delivered. It does not decide what
the application means.

## Interface adapters

The adapter ring translates between delivery-shaped data and application-owned
boundary data. Its two complementary roles are controller and presenter.

### Controller

A controller:

- receives raw input from a view or transport;
- validates and coerces delivery-specific representations;
- creates an input-boundary request;
- invokes the application through that boundary;
- may initiate request-lifecycle tracking needed by the adapter.

A controller does not mutate entities directly, format display output, or know
the use-case implementation.

### Presenter

A presenter:

- receives a response or terminal event through an output boundary;
- associates it with the relevant request when correlation is required;
- converts application data into a display-ready view model;
- owns presentation decisions such as formatting, ordering, labels, and
  visibility.

A presenter does not invoke business rules or expose raw boundary data to the
view merely because that data is convenient to render.

Controller and presenter are siblings. The view sends intent to the controller
and reads the presenter's view model; it does not pass business output from one
to the other itself.

## Views

A view renders a view model and captures user interaction. It may own ephemeral
local state whose meaning is purely visual or input-oriented, such as field
text, focus, or whether a panel is open.

A view must not:

- call entity rules;
- translate application responses;
- subscribe directly to infrastructure;
- publish application events;
- know which concrete interactor or driver is in use.

## Frameworks and drivers

Framework code and drivers occupy the outermost ring. Drivers implement output
boundaries for databases, clocks, message transports, remote services, or
other I/O.

A driver owns technical delivery behavior: connections, serialization,
subscriptions, retries, dead-letter handling, and observability. The core owns
the contract and application vocabulary carried over it.

A distributed message driver may deliver outcomes produced in another process.
The presenter still consumes the application event model, while the transport
handles how that event crossed the boundary.

## Composition at the edge

The application host selects concrete drivers and gives them to Main. Main
assembles the use cases; adapters receive only the public input capabilities
and boundary contracts they need.

The dependency-injection mechanism is an assembly detail. Controllers,
presenters, use cases, entities, and drivers do not use it as a service locator.

## State ownership

| State | Owner in a plugin |
|---|---|
| Raw input and purely visual interaction | View |
| Pending request identities and presentation lifecycle | Adapter |
| Display-ready values and feed ordering | Presenter / view model |
| Transport connection and delivery bookkeeping | Driver |
| Business invariants and workflow policy | Not the plugin; the core |

A pending flag is presentation lifecycle state when it means “the controller
sent a request and the presenter has not received its terminal outcome.” It is
not domain state.

## Replaceability test

A plugin is correctly separated when:

- another view can reuse the same application boundaries;
- another transport can replace a driver without changing a use case;
- formatting and layout can change without changing core policy;
- deleting the plugin leaves the core meaningful and testable;
- adding a second plugin does not require adapting the core to the first
  plugin's framework conventions.

Plugin-specific guidance belongs in the plugin's own document. For the web UI,
see [`ui/UI.md`](./ui/UI.md).
