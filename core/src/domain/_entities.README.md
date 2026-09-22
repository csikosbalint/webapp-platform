# `core/src/domain/` — Entities guide

Read this before adding, moving, or editing anything in `core/src/domain/`.

## Purpose

This is the **Entities** circle: enterprise business rules expressed as pure
functions and types. It is the part of the system that would still be true if
you threw away the web framework, the database, the HTTP API, and the test
runner.

Everything else in the repo depends on this folder. It depends on nothing.

```
plugins/  ──▶  Interface Adapters  ──▶  Input Boundaries  ◀──  Use Cases  ──▶  Entities  ──▶  (nothing)
```

## The one rule

> **A file in `domain/` has no `import` statement that points outside `domain/`.**

Not `app/`, not `ports/`, not `node:*`, not a package from `node_modules`. If you
are reaching for an import, the code you are writing probably belongs in `app/`
instead. Node built-ins are the trap worth naming: `node:fs`, `node:crypto`, and
`node:timers` are all I/O or non-determinism wearing a standard-library badge.

The single allowance is the JavaScript language itself — `Math`, `Number`,
`Array`, `Object`, `Map`, `Set`, `Error` and friends are globals, not imports.
`Math.sqrt` in a domain function is fine. `Math.random` is not, for the reason
in the next section.

## In scope

| Belongs here | Example |
|---|---|
| Pure calculations over business values | `add`, `subtract`, `divide` |
| Entities — things with identity and a lifecycle | `Order`, `Account` |
| Value objects — things defined only by their values | `Money`, `EmailAddress`, `Percentage` |
| Invariants and validation of business meaning | "an order line quantity is a positive integer" |
| Domain services — rules spanning several entities | `canSettle(invoice, payment)` |
| Domain errors — failures stated in business terms | `InsufficientFunds`, `OrderAlreadyShipped` |
| Policies — named, swappable business decisions | `StandardTaxPolicy`, `FlatRateShipping` |

## Out of scope

| Does not belong here | Goes instead in |
|---|---|
| Orchestrating several steps into a workflow | `app/` |
| Anything async, any `Promise`, any I/O | `app/` (behind an outbound port) |
| Interfaces describing the outside world | `ports/` |
| Request/response DTOs, commands, results | `ports/` |
| HTTP, SQL, ORM, React, Next.js types | `plugins/` |
| Logging, metrics, tracing | `app/` or the adapter |
| Reading `process.env` or config | composition root (`src/index.ts`) |
| `Date.now()`, `Math.random()`, `crypto.randomUUID()` | inject as a parameter or outbound port |

The last row is the one agents get wrong most. A domain function must be
**deterministic**: same inputs, same output, forever. If a rule needs the current
time or a fresh id, the caller supplies it:

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

## MUST

- **MUST** be free of imports from outside `domain/` (see The one rule).
- **MUST** be synchronous. No `async`, no `Promise`, no callbacks.
- **MUST** be deterministic and side-effect free — no mutation of arguments, no
  writes to module-level state, no logging.
- **MUST** name things in the language of the business, not the technology.
  `calculateLateFee`, not `processRow` or `handleData`.
- **MUST** carry explicit types on every exported function signature. No
  inferred public return types, no `any`.
- **MUST** reject invalid business values by throwing a domain error, at the
  point where the value enters the domain.
- **MUST** have unit tests in `core/src/tests/`. Domain code is pure, so there is
  no excuse — no mocks are needed, ever.
- **MUST** stay the single source of truth for a rule. Before adding a function,
  search the folder for one that already does the job.

## MUST NOT

- **MUST NOT** import from `app/`, `ports/`, `plugins/`, `node:*`, or any
  dependency. A domain file that needs a dependency is misplaced.
- **MUST NOT** know that a port, adapter, HTTP request, or database exists.
- **MUST NOT** be typed against a port's DTO. Ports may reference domain types;
  the reverse inverts the dependency and defeats the architecture.
- **MUST NOT** read ambient state — `Date`, `Math.random`, `process.env`,
  module-level mutable variables, singletons, caches.
- **MUST NOT** be exported from the package directly. The package exposes the
  root composition API and the public `ports` boundary barrel, but Entities
  remain private; adapters reach Entity behavior through a port, never by
  importing this folder. Do not add subpath exports that expose Entity or Use
  Case implementation files.
- **MUST NOT** contain a use case. If a function coordinates two or more other
  operations to fulfil an actor's request, it is a use case and belongs in `app/`.
- **MUST NOT** duplicate a primitive that already exists here under a different
  name or with different semantics.

## Deciding where code goes

Ask, in order:

1. Does it need to talk to anything outside the process? → `app/`, behind an
   outbound port in `ports/outbound/`.
2. Does it describe *what the outside can call* or *what the core needs from the
   outside*? → `ports/`.
3. Does it coordinate several operations, or map between boundary shapes and
   domain types? → `app/`.
4. Is it a rule or calculation that is true regardless of how the program is
   invoked? → **here**.

## Entities vs Use Cases: the multiply lesson

`app/` once carried its own `multiply`, built from repeated `add`, alongside the
canonical `multiply(a, b)` in `domain/basic.operations.ts`. Two functions, one
name, different semantics, different layers — a bug waiting to happen. It has
since been deleted, and that deletion is the lesson:

- The **Entities** circle owns the arithmetic fact. One canonical `multiply`.
- The **Use Cases** circle owns application behavior, composing Entity primitives rather than
  re-deriving them. `app/geometry.ts` is the shape to copy: it reaches for
  `add`, `multiply` and `divide` instead of reimplementing them.

If an app-layer function is just re-deriving something the domain already
provides, delete the derivation and call the domain. Keep an app-layer version
only when the port's contract genuinely differs from the raw primitive — and say
why in a comment when it does.

## Future subfolders

`domain/` is flat today, which is correct at this size. Introduce a subfolder
when a category reaches roughly three files, not before — premature grouping
costs more than it saves.

| Subfolder | Holds | Introduce when |
|---|---|---|
| `entities/` | Types with identity and a lifecycle | A second entity appears |
| `value-objects/` | Immutable types defined by value, with their own validation | `Money`, `Email` and similar accumulate |
| `services/` | Rules spanning multiple entities | A rule has no natural single owner |
| `errors/` | Domain error classes | More than two error types exist |
| `policies/` | Named, swappable business decisions | A rule needs to vary by tenant, region, or plan |

Rules for subfolders, all inherited:

- Every rule in this document applies unchanged at any depth.
- Sibling subfolders may import from each other, since all of it is still
  `domain/`. Keep the graph acyclic.
- No subfolder becomes a package, gets its own `package.json`, or is added to
  the `exports` map.
- Keep `.operations.ts`-style suffixes descriptive of content, and name files
  after the concept: `money.value-object.ts`, `order.entity.ts`,
  `insufficient-funds.error.ts`.

## Checking your work

```sh
# Must print nothing: any import that leaves the domain is a violation.
grep -rnE "^\s*import .* from ['\"](\.\./|node:|[a-z@])" core/src/domain/ --include='*.ts'

# Must print nothing: async and Promise do not belong here.
grep -rnE "\basync\b|\bPromise\b" core/src/domain/ --include='*.ts'

# Must print nothing: ambient state.
grep -rnE "Date\.now|new Date|Math\.random|process\.env" core/src/domain/ --include='*.ts'

cd core && pnpm run typecheck && pnpm run test
```

If you added a domain function, you also added a test for it. Verify before
reporting the work finished.
