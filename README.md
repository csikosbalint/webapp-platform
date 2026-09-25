# webapp-platform

Baseline for flexible web applications: a framework-agnostic Clean Architecture
core plus framework adapters ("plugins").

## Layout

| Path | Contents |
|---|---|
| `core/` | `@csikosbalint/webapp-platform-core` — Entities, Use Cases, Boundaries |
| `plugins/ui/` | Next.js adapter |

## Documentation

Principles are separated from concrete code, and the core is separated from the
plugins.

Each package doc lives with the package it governs.

```text
CLEAN-ARCHITECTURE.md
├── core/CORE.md ────────── core/src/_example.math.README.md
│                      └── core/src/_example.result-log.README.md
└── plugins/PLUGINS.md ─── plugins/ui/UI.md
```

| Doc | Holds |
|---|---|
| [`CLEAN-ARCHITECTURE.md`](./CLEAN-ARCHITECTURE.md) | The Dependency Rule, the circle map, where code goes. Start here |
| [`core/CORE.md`](./core/CORE.md) | Rules for the inner circles: Entities, Use Cases, Boundaries, Composition Root |
| [`plugins/PLUGINS.md`](./plugins/PLUGINS.md) | Rules for every plugin: Interface Adapters, Frameworks & Drivers |
| [`plugins/ui/UI.md`](./plugins/ui/UI.md) | The Next.js plugin: stack, layout, how it calls the core |
| [`core/src/_example.math.README.md`](./core/src/_example.math.README.md) | Worked input-boundary example |
| [`core/src/_example.result-log.README.md`](./core/src/_example.result-log.README.md) | Worked output-boundary example |

Keep the split. A rule spanning both packages goes in `CLEAN-ARCHITECTURE.md`, a
package rule in `core/CORE.md` or `plugins/PLUGINS.md`, a single-plugin detail in
that plugin's doc, and anything naming a concrete type or driver in an example
guide.

## Local development

The repository is a pnpm workspace. The UI consumes the local core package via
`workspace:*`; no publishing or package retrieval is needed. Install once from
this directory:

```sh
pnpm install
```

Because the core's public exports point to compiled `dist/` files, keep its
watcher running in one terminal and the UI in another:

```sh
pnpm --filter @csikosbalint/webapp-platform-core dev
pnpm --filter ui dev
```

Run checks from the workspace root:

```sh
pnpm --filter @csikosbalint/webapp-platform-core typecheck
pnpm --filter @csikosbalint/webapp-platform-core test
pnpm --filter @csikosbalint/webapp-platform-core build
pnpm --filter ui lint
pnpm --filter ui build
```
