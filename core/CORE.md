# `core/` — the inner circles

Rules for the published package `@csikosbalint/webapp-platform-core`. Read
[`CLEAN-ARCHITECTURE.md`](../CLEAN-ARCHITECTURE.md) first for the Dependency Rule
and the circle map; outer-ring rules are in
[`plugins/PLUGINS.md`](../plugins/PLUGINS.md).

Paths are written from the repository root (`core/src/domain/`, not
`src/domain/`) so they can be pasted into a command as-is. Each shell block says
which directory to run it from.

Principles only. Worked examples are linked at the bottom.

`core/` has no framework dependency and never will. Its only runtime
dependencies are the language and whatever a caller injects.

---

## Entities — `core/src/domain/`

Enterprise business rules as pure functions and types: the part of the system
that would still be true if you threw away the web framework, the database, the
HTTP API, and the test runner.

**The one rule:** a file in `domain/` has no `import` statement that points
outside `domain/`. Not `app/`, not `ports/`, not `node:*`, not a package from
`node_modules`. Node built-ins are the trap worth naming — `node:fs`,
`node:crypto`, `node:timers` are I/O or non-determinism wearing a
standard-library badge.

The single allowance is the JavaScript language itself. `Math`, `Number`,
`Array`, `Object`, `Map`, `Set`, `Error` are globals, not imports. `Math.sqrt`
is fine. `Math.random` is not.

### In scope

| Belongs here | Shape |
|---|---|
| Pure calculations over business values | `add`, `subtract` |
| Entities — identity and a lifecycle | `Order`, `Account` |
| Value objects — defined only by their values | `Money`, `EmailAddress` |
| Invariants and validation of business meaning | "a quantity is a positive integer" |
| Domain services — rules spanning several entities | `canSettle(invoice, payment)` |
| Domain errors — failures in business terms | `InsufficientFunds` |
| Policies — named, swappable business decisions | `StandardTaxPolicy` |

### Out of scope

| Does not belong here | Goes instead in |
|---|---|
| Orchestrating several steps into a workflow | `app/` |
| Anything async, any `Promise`, any I/O | `app/`, behind an output boundary |
| Interfaces describing the outside world | `ports/` |
| Request/response DTOs, commands, results | `ports/` |
| HTTP, SQL, ORM, React, framework types | a plugin |
| Logging, metrics, tracing | `app/` or the adapter |
| Reading configuration | composition root |
| `Date.now()`, `Math.random()`, `crypto.randomUUID()` | inject as a parameter or output boundary |

That last row is the one most often got wrong. A domain function must be
deterministic: same inputs, same output, forever. If a rule needs the current
time or a fresh id, the caller supplies it.

```ts
// Wrong — untestable, and the rule now depends on when it runs.
export function isExpired(order: Order): boolean {
  return order.dueAt < Date.now();
}

// Right — the clock is an input, so the rule is a pure predicate.
export function isExpired(order: Order, now: number): boolean {
  return order.dueAt < now;
}
```

### MUST

- Be free of imports from outside `domain/`.
- Be synchronous. No `async`, no `Promise`, no callbacks.
- Be deterministic and side-effect free — no mutation of arguments, no writes
  to module-level state, no logging.
- Name things in the language of the business, not the technology.
- Carry explicit types on every exported signature. No inferred public return
  types, no `any`.
- Reject invalid business values by throwing a domain error, at the point where
  the value enters the domain.
- Have unit tests. Domain code is pure, so no mocks are ever needed.
- Stay the single source of truth for a rule. Search before adding.

### MUST NOT

- Import from `app/`, `ports/`, a plugin, `node:*`, or any dependency.
- Know that a port, adapter, request, or database exists.
- Be typed against a port's DTO. Ports may reference domain types; the reverse
  inverts the dependency.
- Read ambient state — `Date`, `Math.random`, config, module-level mutable
  variables, singletons, caches.
- Be exported from the package. Entities stay private; adapters reach entity
  behavior through a port. Do not add subpath exports for them.
- Contain a use case. A function coordinating two or more operations to fulfil
  an actor's request belongs in `app/`.
- Duplicate a primitive that already exists under a different name.

### Subfolders

`domain/` is flat until a category reaches roughly three files. Premature
grouping costs more than it saves.

| Subfolder | Holds | Introduce when |
|---|---|---|
| `entities/` | Types with identity and a lifecycle | A second entity appears |
| `value-objects/` | Immutable types defined by value | `Money`, `Email` and similar accumulate |
| `services/` | Rules spanning multiple entities | A rule has no natural single owner |
| `errors/` | Domain error classes | More than two error types exist |
| `policies/` | Named, swappable business decisions | A rule varies by tenant, region, or plan |

Every rule above applies unchanged at any depth. Siblings may import each other
— it is all still `domain/` — but keep the graph acyclic. No subfolder becomes a
package or enters the `exports` map. Name files after the concept:
`money.value-object.ts`, `order.entity.ts`, `insufficient-funds.error.ts`.

---

## Use Cases — `core/src/app/`

Application business rules: one actor-facing operation coordinated from start
to finish, applying application policy around entity rules.

### MUST

- Coordinate exactly one actor-facing operation per use case.
- Depend inward on `domain/` and on boundary **types** only.
- Compose entity primitives rather than re-deriving them.
- Receive every external capability as a parameter, typed as an output
  boundary, supplied by the composition root.
- Return boundary-safe data. No framework objects, no driver handles.
- Be annotated against the inbound contract it implements, so the compiler
  checks conformance here rather than only at the composition root.

### MUST NOT

- Depend on a framework, HTTP, a database, configuration, or any concrete
  adapter.
- Import a driver, even for a default or fallback.
- Duplicate an entity rule.
- Leak the identity of the implementation it was handed. Callers must not be
  able to tell which driver is behind an output boundary.
- Be async without cause. Async is justified by an output boundary, not by
  habit. Keep pure calculation synchronous and put the side effect in a
  separate operation rather than making the calculation await something.

---

## Boundaries — `core/src/ports/`

Interfaces that cross the seams between the core and the outside world. In
Hexagonal Architecture terms, ports. The boundary is owned by the inner policy:
an adapter conforms to the contract, and the core does not change its contract
to suit an adapter.

Rules common to both directions:

- Declare contracts only. No behavior, no defaults, no fallbacks.
- `import type` only. A port that pulls runtime code from `app/` or `domain/`
  is wiring, not a contract.
- No framework, driver, SQL, HTTP, or vendor types in any signature.
- Depend on domain types when a boundary must describe domain data; never on
  frameworks or concrete adapters.
- Keep data shapes stable and explicit — they are the published API.
- Model expected failures in the return type where the caller must react,
  rather than relying on implementation-specific exceptions.
- Export intentional contracts from the barrel at `ports/index.ts`, so
  consumers import from `@csikosbalint/webapp-platform-core/ports` instead of a
  deep path.

### Input Boundaries — `ports/inbound/`

What an external actor may ask the application to do. Call and dependency both
point inward: the core owns the interface, the caller conforms.

- Name for the capability offered, not for the caller or the transport.
- Describe capabilities, not HTTP, React, or any transport. No request,
  response, form data, or route params in signatures.
- Put shared data shapes in a sibling `*.types.ts`; keep the port file a
  contract and nothing else.
- An input boundary is not a controller. Controllers live in a plugin and adapt
  to this contract, never the reverse.

### Output Boundaries — `ports/outbound/`

What a use case needs from infrastructure — persistence, a clock, an id
generator, a notifier, a remote service. The call goes outward; the dependency
still points inward.

- Name for what the use case needs, not for the technology that satisfies it:
  `Clock`, not `DateNowWrapper`.
- Keep the surface minimal: only operations a use case actually calls. A method
  no use case invokes belongs to the driver, not the port. A driver may expose
  extra methods of its own for tests or tooling.
- Declare async when the real-world implementation will be async, even if the
  first driver is in-memory. Then swapping drivers never changes a signature.
- Speak in domain types and plain data.
- Entities never use an output boundary. `domain/` depends on nothing, and a
  side effect is not an enterprise business rule. If it looks like an entity
  needs to write something, the writing belongs to the use case that called it.

A port becomes useful in four steps: declare the interface, have a use case
take it as a factory parameter, have the composition root accept an
implementation and pass it down, and implement it in a driver outside `core/`
(see [`plugins/PLUGINS.md`](../plugins/PLUGINS.md)).

---

## Composition Root — `core/src/index.ts`

The Main component: the only place that binds implementations to boundaries,
and the whole public surface of the package.

- Assemble concrete implementations and expose them through boundaries.
- Accept outbound implementations as parameters so the caller chooses the
  driver.
- Read configuration here if it must be read inside `core/` at all.
- Re-export the boundary types adapters need.
- Nothing else in `core/` may construct a driver.

### Published surface

| Specifier | Resolves to |
|---|---|
| `@csikosbalint/webapp-platform-core` | `dist/index.js` — the composition root |
| `@csikosbalint/webapp-platform-core/ports` | `dist/ports/index.js` — the boundary barrel |

Only `dist/` ships. Do not add a subpath export that exposes `app/`, `domain/`,
or an implementation file; the `exports` map is what keeps plugins honest.

---

## Test drivers — `core/src/tests/`

An outer ring living inside the package. Tests drive the core through its public
boundaries or exercise pure entities directly. They are not business rules.

- Test entity behavior without mocks or framework setup.
- Test use cases through their boundary contract where practical.
- Use test doubles only at an explicit boundary.
- Stay independent of generated `dist/` output.
- A test never justifies an inner circle depending on the test runner.
- Drivers written for tests may live here; `tsconfig.json` keeps this folder out
  of `dist/`, so they never ship.

---

## TypeScript

- Node ESM: relative imports keep the `.js` extension in source, even though
  the file is `.ts`.
- `verbatimModuleSyntax` is on: use `import type` / `export type` for types.
- Strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Do
  not loosen `tsconfig.json` to make code compile; fix the code.
- No `any`, no non-null `!` assertions, no `@ts-ignore` without a comment
  explaining why.

## Commands

From this directory:

```sh
pnpm typecheck    # tsc --noEmit
pnpm test         # compiles to .test-build/, runs node --test
pnpm build        # emits dist/
```

## Checking your work

From the repository root:

```sh
# Must print nothing: any import that leaves the domain is a violation.
grep -rnE "^\s*import .* from ['\"](\.\./|node:|[a-z@])" core/src/domain/ --include='*.ts'

# Must print nothing: async and Promise do not belong in the domain.
grep -rnE "\basync\b|\bPromise\b" core/src/domain/ --include='*.ts'

# Must print nothing: ambient state in the domain.
grep -rnE "Date\.now|new Date|Math\.random|process\.env" core/src/domain/ --include='*.ts'

# Must print nothing: the inner circles never import a driver.
grep -rnE "^\s*import .*['\"]node:" core/src/domain/ core/src/app/ core/src/ports/ core/src/index.ts

cd core && pnpm run typecheck && pnpm run test
```

If you added a domain function, you also added a test for it. Verify before
reporting the work finished.

## Example guides

Principles live in this file. Concrete code is walked through separately, one
guide per example:

| Guide | Shows |
|---|---|
| [`src/_example.math.README.md`](./src/_example.math.README.md) | An input boundary end to end: entities, a use case, a contract, the composition root |
| [`src/_example.result-log.README.md`](./src/_example.result-log.README.md) | An output boundary end to end: declaring a need, injecting it, and three drivers |

When an example changes, update its guide — not this file.
