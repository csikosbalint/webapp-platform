# Clean Architecture in this repo

Entry point for **principles**. What holds everywhere lives here; per-package
rules are split out, and concrete code is walked through separately again.

| Doc | Covers |
|---|---|
| this file | The Dependency Rule, the circle map, where code goes |
| [`core/CORE.md`](./core/CORE.md) | The inner circles — `core/`: Entities, Use Cases, Boundaries, Composition Root |
| [`plugins/PLUGINS.md`](./plugins/PLUGINS.md) | The outer circles — `plugins/`: Interface Adapters, Frameworks & Drivers |

No example code is described in any of the three. Walkthroughs are linked from
the package doc that owns them.

## The Dependency Rule

> **Source-code dependencies point inward only. Nothing in an inner circle
> knows the name of anything in an outer circle.**

```text
Frameworks & Drivers → Interface Adapters → Input Boundaries → Use Cases → Entities
                                                         └──────────────→ Entities
```

Calls may flow outward. *Imports* may not. When an inner circle needs something
from the outside, it declares an interface (an output boundary) and the outer
circle conforms to it. This is dependency inversion, and it is the only
mechanism this repo uses to cross a seam.

The packages exist to make the rule mechanical rather than aspirational.
`core/` is published and cannot import a plugin; a plugin consumes the package
through its `exports` map and cannot reach a private folder. The boundary is
enforced by module resolution, not by discipline alone.

## Circle map

| Path | Uncle Bob term | Depends on | Rules in |
|---|---|---|---|
| `core/src/domain/` | Entities | nothing | [`core/CORE.md`](./core/CORE.md) |
| `core/src/app/` | Use Cases | Entities, boundary types | [`core/CORE.md`](./core/CORE.md) |
| `core/src/ports/inbound/` | Input Boundaries | its own type vocabulary | [`core/CORE.md`](./core/CORE.md) |
| `core/src/ports/outbound/` | Output Boundaries | domain types only | [`core/CORE.md`](./core/CORE.md) |
| `core/src/index.ts` | Composition Root (Main) | everything inside `core/` | [`core/CORE.md`](./core/CORE.md) |
| `core/src/tests/` | Frameworks & Drivers | the public boundaries | [`core/CORE.md`](./core/CORE.md) |
| `plugins/*/app/` | Interface Adapters | the published package surface | [`plugins/PLUGINS.md`](./plugins/PLUGINS.md) |
| `plugins/*/` | Frameworks & Drivers | the published package surface | [`plugins/PLUGINS.md`](./plugins/PLUGINS.md) |

The physical directory names stay `domain`, `app`, and `ports` because they are
established package paths. Do not rename directories to make the filesystem
mirror the terminology.

## Deciding where code goes

Ask, in order:

1. Is it framework, transport, UI, or I/O? → a plugin. See
   [`plugins/PLUGINS.md`](./plugins/PLUGINS.md).
2. Does it need to talk to anything outside the process? → `core/src/app/`,
   behind an output boundary in `core/src/ports/outbound/`.
3. Does it describe *what the outside can call* or *what the core needs from
   the outside*? → `core/src/ports/`.
4. Does it coordinate several operations, or map between boundary shapes and
   domain types? → `core/src/app/`.
5. Is it a rule or calculation that is true regardless of how the program is
   invoked? → `core/src/domain/`.

Steps 2 through 5 are detailed in [`core/CORE.md`](./core/CORE.md).

## The test that matters

A framework is a delivery mechanism, not the application architecture. Two
questions catch most violations:

- Could you delete `plugins/` entirely and still have `core/` compile, test, and
  make sense? It must be yes.
- Could you swap the UI framework without touching an entity rule? It must be
  yes.

If either answer is no, a dependency is pointing the wrong way.
