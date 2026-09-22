# `core/src/` — Clean Architecture inner circles

Read the guide for the folder you are changing before editing code. This package
contains the inner circles and their boundaries; framework code lives outside
`core/`.

## Circle mapping

| Folder | Uncle Bob term | Responsibility |
|---|---|---|
| `domain/` | **Entities** | Enterprise business rules and pure domain calculations |
| `app/` | **Use Cases** | Application-specific orchestration and policies |
| `ports/` | **Boundaries** | Contracts between the core and the outside world |
| `ports/inbound/` | **Input Boundaries** | Operations that an external actor can invoke |
| `tests/` | **Frameworks & Drivers** | Test drivers that exercise the inner circles |

`index.ts` is the **composition root**. It is the Main component: the place
where concrete implementations are assembled and exposed through boundaries.

## Dependency Rule

Source-code dependencies point inward:

```text
Frameworks & Drivers → Interface Adapters → Input Boundaries → Use Cases → Entities
                                                        └──────────────→ Entities
```

The package exposes the composition root at `@csikosbalint/webapp-platform-core`
and the public boundary barrel at
`@csikosbalint/webapp-platform-core/ports`. Consumers should use those exports,
not reach into private implementation folders.

## Naming note

The physical directory names remain `domain`, `app`, and `ports` because they
are established package paths. The guide names use Uncle Bob's architectural
terms; do not rename directories merely to make the filesystem mirror the
terminology.
