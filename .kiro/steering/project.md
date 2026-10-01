# webapp-platform — project rules

Always applies. The repository uses Uncle Bob's Clean Architecture with a
framework-independent core and replaceable delivery plugins.

## Architectural baseline

The conceptual authority is
[`CLEAN-ARCHITECTURE.md`](../../CLEAN-ARCHITECTURE.md). Package-specific concepts
live in [`core/CORE.md`](../../core/CORE.md),
[`plugins/PLUGINS.md`](../../plugins/PLUGINS.md), and
[`plugins/ui/UI.md`](../../plugins/ui/UI.md).

Architecture documentation stays conceptual. Do not add concrete type names,
API walkthroughs, framework versions, or file-by-file implementation narratives
to those documents. Read the code and tests for implementation details.

## Dependency Rule (non-negotiable)

Source dependencies point toward policy:

```text
Frameworks & Drivers → Interface Adapters → Application Boundaries / Use Cases → Entities
```

- `core/` never imports from a plugin, React, Next.js, or another delivery
  framework.
- Domain policy never imports application orchestration or a boundary.
- Use cases depend on domain policy and application-owned boundary abstractions,
  never on a controller, presenter, driver, framework, or container.
- Nested inbound and outbound port modules declare boundary vocabulary and
  contracts.
- Main is an outer assembly role even when it is physically distributed with
  the core package. It is the only role that may know the DI container and
  concrete registrations.
- A public composition facade is not itself a port contract. “Port” means an
  input or output boundary owned by the application.
- Plugins consume only the package's published entry points; never deep-import
  generated output, application implementations, or domain modules.
- Controllers translate input and invoke an input boundary. They do not mutate
  core state directly.
- Presenters consume response/event models and create view models. They do not
  run business rules.
- Raw form state remains in the view. Request lifecycle and display-ready state
  belong to the interface adapter.

## Physical layout

| Path | Architectural responsibility |
|---|---|
| `core/src/domain/` | Entity and domain policy |
| `core/src/app/` | Interactors / use cases |
| `core/src/ports/inbound/` | Input-boundary vocabulary |
| `core/src/ports/outbound/` | Output-boundary vocabulary |
| `core/src/ports/index.ts` | Published assembly facade and boundary barrel |
| `core/src/index.ts` | Root public vocabulary barrel |
| `core/src/tests/` | Test controllers and drivers |
| `plugins/ui/` | Web view, interface adapters, transport adapters, and drivers |

The assembly facade is the deliberate exception to a contracts-only ports
folder: it may import inward to construct the graph. Do not let that exception
spread into the boundary modules themselves.

## TypeScript in `core/`

- Node ESM relative imports keep the `.js` extension in TypeScript source.
- `verbatimModuleSyntax` is on: use `import type` / `export type` for types.
- Strict mode, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` stay
  enabled.
- Do not use `any`, non-null assertions, or unexplained `@ts-ignore` comments.
- Keep entity and use-case implementations private unless an external adapter
  genuinely needs a contract.

## Commands

Package manager is **pnpm** — never npm or yarn.

| Task | Command | Cwd |
|---|---|---|
| Build core | `pnpm build` | `core/` |
| Typecheck core | `pnpm typecheck` | `core/` |
| Test core | `pnpm test` | `core/` |
| Lint UI | `pnpm lint` | `plugins/ui/` |
| Test UI | `pnpm test` | `plugins/ui/` |
| Build UI | `pnpm build` | `plugins/ui/` |

Run `pnpm typecheck && pnpm test` in `core/` after changing core. Run
`pnpm lint && pnpm test` in `plugins/ui/` after changing the UI. Never start the
UI development server yourself; ask the user to run it.

## Generated output — never edit by hand

`core/dist/`, `core/.test-build/`, `plugins/ui/.next/`, `node_modules/`, and the
workspace lockfile are generated. Change the lockfile only through pnpm.

## Framework guidance

The UI pins a framework version whose APIs may differ from training data. Read
the locally installed framework documentation before writing framework-specific
code. Leave generated agent-guidance blocks in place.

## Versioning

Core package version changes are deliberate release decisions. Bump the version
only when asked, and keep plugin dependency declarations in sync.
