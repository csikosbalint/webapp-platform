# Web UI — Clean Architecture roles

This plugin is a web delivery mechanism. The system-wide Dependency Rule is in
[`CLEAN-ARCHITECTURE.md`](../../CLEAN-ARCHITECTURE.md); generic plugin roles are
in [`PLUGINS.md`](../PLUGINS.md).

This document describes concepts only. Framework APIs, concrete modules, type
names, and wiring syntax belong in code rather than architecture guidance.

## Role map

| UI concern | Clean Architecture role |
|---|---|
| Rendering and raw form values | View |
| Translating user intent into an application request | Controller |
| Translating terminal application output into display data | Presenter |
| Crossing the browser/server or process boundary | Transport adapter |
| Delivering application events | Output driver |
| Constructing the application graph | Main / composition root |

The UI adapter exposes two faces to the view:

- **controller** — commands the view may send;
- **presenter** — the view model the view may render.

The view does not receive the application interactor, event bus, or raw response
model.

## Interaction

The conceptual request path is:

```text
View → Controller → Input Boundary → Interactor → Entities
```

The conceptual result path is:

```text
Interactor → Output Boundary → Transport → Presenter → View Model → View
```

The controller translates input; it does not calculate the answer. The
presenter formats and arranges output; it does not repeat business rules.

When browser and application run in different processes, they cannot rely on a
shared in-memory publisher. A transport adapter carries the request inward and
a driver carries the terminal output outward. A local bridge may emulate that
transport in a prototype, but the bridge remains adapter plumbing rather than
application policy.

## Request lifecycle

Each submitted operation may carry a correlation identifier. The adapter keeps
the request pending after the controller sends it. The presenter clears that
pending state only when it receives a matching success or failure outcome.

This gives `pending` a precise meaning:

> A request has entered the application, but its correlated terminal output has
> not yet reached the presenter.

Unrelated events may appear in an activity feed without changing the current
request's result or pending state.

## State ownership

| State | Owner |
|---|---|
| Raw field text | View |
| Pending correlation identifiers | Adapter |
| Application response/event data awaiting presentation | Presenter adapter |
| Formatted result, error text, activity-feed lines | View model |
| Business rules and invariants | Core |
| Subscription and delivery mechanics | Driver |

Local input state stays local because it has no meaning outside the view. The
adapter owns only state shared by controller and presenter. Neither kind of UI
state belongs in an entity.

## Presentation rules

The presenter decides how application output is represented, including:

- number and date formatting;
- error wording suitable for the view;
- ordering and limiting an activity feed;
- which result belongs to the active request;
- whether the view is idle, pending, successful, or failed.

The view decides layout and interaction affordances. It renders the presenter's
model without deriving application meaning from it.

## Boundary rules

- The UI depends only on the core's published application boundary.
- Delivery and framework values are translated before crossing inward.
- Boundary response data is translated before reaching the view.
- The UI never imports inner implementation modules.
- The core never imports the UI or its framework.
- A concrete message transport may change without changing the interactor or
  presenter contract.

## Testing the split

A view-level test should drive user intent and observe rendered output. It may
replace the transport seam while retaining the real controller, presenter, and
view.

Separate contract tests should prove that drivers satisfy their output
boundaries. Business-rule tests remain in the core and require no UI framework.
