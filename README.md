# webapp-platform

A framework-independent application core surrounded by replaceable delivery
plugins, following Uncle Bob's Clean Architecture and the Ports and Adapters
style.

## Architecture

The core owns enterprise rules, application use cases, and the boundaries that
define how actors and infrastructure interact with them. Plugins own views,
controllers, presenters, transports, and concrete drivers.

```text
View → Controller → Input Boundary → Interactor → Entities
                                      │
                                      └→ Output Boundary → Presenter → View Model → View
```

Source dependencies point toward policy even when runtime control returns
outward through a presenter or driver. Main assembles the concrete graph and is
kept separate from business decisions.

## Documentation

| Document | Purpose |
|---|---|
| [`CLEAN-ARCHITECTURE.md`](./CLEAN-ARCHITECTURE.md) | System-wide concepts, dependency direction, and the interaction model |
| [`core/CORE.md`](./core/CORE.md) | Entities, interactors, application boundaries, and Main |
| [`plugins/PLUGINS.md`](./plugins/PLUGINS.md) | Interface adapters, views, and drivers |
| [`plugins/ui/UI.md`](./plugins/ui/UI.md) | The web UI's controller/presenter split and state ownership |

Architecture documents describe roles and constraints rather than concrete API
walkthroughs. Code and tests are the authority for implementation details.

## Local development

The repository is a pnpm workspace. Install once from the repository root:

```sh
pnpm install
```

Keep the core compiler and UI development server running separately:

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
