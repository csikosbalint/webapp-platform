# Example: the result-log output boundary

Implementation notes for the `ResultLog` example. The rules this example obeys are
in [`CORE.md`](../CORE.md), and the architecture behind them in
[`CLEAN-ARCHITECTURE.md`](../../CLEAN-ARCHITECTURE.md). Not repeated here.

This example exists to show an **output boundary** end to end: a use case wants
to remember its most recent answer, and one driver keeps it in a file under
`/tmp`.

## Files

| File | Circle | Role |
|---|---|---|
| `ports/outbound/result.log.port.ts` | Output Boundary | `ResultLog.recordLast(entry)` and `CalculationRecord` |
| `app/geometry.ts` | Use Case | `createGeometry(resultLog)` takes the port and calls it |
| `domain/basic.operations.ts` | Entities | **Untouched.** Still pure arithmetic, unaware the port exists |
| `index.ts` | Composition Root | `createMath(resultLog)` accepts the driver and passes it down |
| `tests/tmp.result.log.ts` | Frameworks & Drivers | Three implementations of the port |
| `tests/result.log.port.test.ts` | Drivers | Behavior of the use case against each |

## How the dependency inverts

```text
declared here      ports/outbound/result.log.port.ts   ← the use case owns this interface
required here      app/geometry.ts                     ← as a factory parameter
supplied here      index.ts                            ← createMath(resultLog)
implemented here   tests/tmp.result.log.ts             ← outside the inner circles
```

The arrow of dependency points inward at every step: the driver knows the port,
the port knows nothing about the driver. `createGeometry` cannot tell whether it
got a file, a fake, or a database.

## Usage

```ts
const math = createMath(createTmpFileResultLog());

math.geometry.calculateRightTriangle(3, 4);            // pure, sync, no side effect
await math.geometry.solveAndRecordRightTriangle(3, 4); // same answer, now written to /tmp
```

## Choices worth understanding

**The port is write-only.** There is no `readLast` on `ResultLog`, because no
use case reads. The `/tmp` driver does expose `readLast` and `clear` — those are
the driver's own API for tests, not part of the contract.

**Async from day one.** `recordLast` returns `Promise<void>` even though the
in-memory fake is trivially synchronous, so swapping in a real driver never
changes a signature.

**Rejections propagate.** The port neither swallows nor retries; the caller
decides whether a failed write invalidates the operation.
`createFailingResultLog` exists to test exactly that.

**`resultLog` is required, not defaulted.** A default driver would be behavior
living in a contract, and it would hide a missing wiring bug.

**The pure calculation stayed pure.** `calculateRightTriangle` is unchanged.
`solveAndRecordRightTriangle` is a separate async operation that wraps it, so
adding persistence did not contaminate the arithmetic — and a test asserts the
pure path records nothing.

**Validation runs before the write.** `assertLeg` throws before `recordLast` is
reached, so a rejected input never leaves a record behind.

**Entities are not involved.** `domain/` has no reference to the port. Any
temptation to let an entity write something is a sign the write belongs to the
calling use case.

## The three drivers

| Factory | Backed by | Used for |
|---|---|---|
| `createTmpFileResultLog(path?)` | `node:fs/promises`, JSON at `/tmp/webapp-platform-last-result.json` | Showing a real side effect |
| `createFakeResultLog()` | An in-memory array | Asserting what was recorded |
| `createFailingResultLog(message?)` | An immediate rejection | Asserting failure reaches the caller |

All three live in `tests/`, which `tsconfig.json` excludes from `dist/`. Nothing
in `core/` imports `node:fs`; only the driver does. A production driver would
live in `plugins/` and be built the same way.

Tests that touch `/tmp` pass a pid-suffixed path and clean up in an `after`
hook, so parallel runs do not collide and nothing is left behind.

## Adding your own output boundary

1. Declare the interface in `ports/outbound/`, named for the need, not the
   technology.
2. Export its types from `ports/index.ts` so driver authors outside the package
   can implement it.
3. Take it as a parameter of the use-case factory in `app/`.
4. Add it as a parameter of `createMath` (or a sibling factory) in `index.ts`
   and re-export the types.
5. Write an in-memory fake first, then the real driver.
