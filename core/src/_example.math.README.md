# Example: the math input boundary

Implementation notes for the `MathPort` example. The rules this example obeys are
in [`CORE.md`](../CORE.md), and the architecture behind them in
[`CLEAN-ARCHITECTURE.md`](../../CLEAN-ARCHITECTURE.md). Not repeated here.

This example exists to show an **input boundary** end to end: an actor asks the
application to solve a right triangle from its two legs.

## Files

| File | Circle | Role |
|---|---|---|
| `domain/basic.operations.ts` | Entities | `add`, `subtract`, `multiply`, `divide` — pure arithmetic |
| `ports/inbound/math.types.ts` | Input Boundary | `RightTriangle`, operation signatures, the `GeometryOperations` namespace |
| `ports/inbound/math.port.ts` | Input Boundary | `MathPort` — assembles namespaces into one contract |
| `app/geometry.ts` | Use Case | `createGeometry(...)` — implements the contract from entity primitives |
| `index.ts` | Composition Root | `createMath(...)` — binds the implementation and exports the types |
| `tests/basic.operations.test.ts` | Drivers | Entity tests, no doubles |
| `tests/math.port.test.ts` | Drivers | Port conformance suite |

## How a call travels

```text
adapter in plugins/            math.geometry.calculateRightTriangle(3, 4)
  → MathPort                   contract declared in ports/inbound/
  → app/geometry.ts            the use case implementing it
  → domain/basic.operations.ts add / multiply / divide
```

`Math.sqrt` is called directly in the use case because the domain does not
provide it, and it is a language global rather than an import.

## Shape worth copying

**Namespaces inside the port.** `MathPort` exposes `geometry` rather than a flat
list of functions, so callers write `math.geometry.calculateRightTriangle`. As
more subjects appear (`algebra`, `statistics`), the contract stays readable.

**Types split from the contract.** `math.types.ts` has no imports at all — it is
the shared vocabulary. `math.port.ts` imports only that vocabulary. A port file
that reached into `app/` or `domain/` would be wiring, not a contract.

**Annotating the implementation.** `app/geometry.ts` declares
`const geometry: GeometryOperations = { ... }`, so a mismatch is a compile error
in the use case rather than a puzzle at the composition root.

**Validation at the edge of the domain.** `assertLeg` throws `RangeError` for a
leg that is not finite and positive, before any arithmetic runs. `RangeError` is
a language global; a richer example would define a domain error in
`domain/errors/`.

## The multiply lesson

`app/` once carried its own `multiply`, built from repeated `add`, alongside the
canonical `multiply(a, b)` in `domain/basic.operations.ts`. Two functions, one
name, different semantics, different layers.

It has been deleted, and the deletion is the point: the Entities circle owns the
arithmetic fact, and the Use Cases circle composes entity primitives instead of
re-deriving them. If an app-layer function is re-deriving something the domain
already provides, delete the derivation and call the domain. Keep an app-layer
version only when the contract genuinely differs from the raw primitive, and say
why in a comment when it does.

## Testing shape

`math.port.test.ts` puts its assertions in `assertConformsToMathPort(port)`
rather than inline, so a second implementation — a fake, a memoised variant — is
verified by pointing it at the same function instead of copying tests.

Two of those tests are negative and worth keeping: the port exposes only its
declared keys, and neither domain internals (`add`, `multiply`) nor the outbound
driver leak through it.

## Extending the example

- **New operation in an existing namespace:** add the signature to
  `math.types.ts`, add it to `GeometryOperations`, implement it in
  `app/geometry.ts`, extend `assertConformsToMathPort`, and update the
  declared-keys test.
- **New subject:** add a `*.types.ts` vocabulary and a namespace interface, add
  the namespace to `MathPort`, create a sibling use-case module in `app/`, and
  bind it in `createMath`.
- **New arithmetic primitive:** it goes in `domain/`, with its own test, and is
  called from `app/` rather than reimplemented.

Remember to re-export any new public type from both `index.ts` and
`ports/index.ts`.

## Wiring it to the UI

`plugins/ui` does not call the core yet — the starter page is a pure framework
driver. When it does, the adapter in `plugins/ui/app/` should translate the
interaction into `math.geometry.calculateRightTriangle` and render the returned
data. The calculation does not move into the page component, and the page
imports `@csikosbalint/webapp-platform-core`, never a path inside `core/src`.

Plugin-side rules for that wiring are in [`plugins/ui/UI.md`](../../plugins/ui/UI.md).
