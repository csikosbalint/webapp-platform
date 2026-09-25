# `plugins/` — the outer circles

Rules for every plugin. Read
[`CLEAN-ARCHITECTURE.md`](../CLEAN-ARCHITECTURE.md) first for the Dependency Rule
and the circle map; inner-circle rules are in [`core/CORE.md`](../core/CORE.md).

Principles that hold for any plugin live here. Anything specific to one plugin
lives in that plugin's own doc:

| Plugin | Doc | Delivers |
|---|---|---|
| `plugins/ui` | [`ui/UI.md`](./ui/UI.md) | Next.js App Router web UI |

A plugin is a **delivery mechanism**. It decides how the application is reached
and what technology satisfies its needs. It decides nothing about what the
application means.

## What a plugin is for

Two jobs, both at the edge:

| Job | Circle | Direction |
|---|---|---|
| Translate framework input into an input-boundary call, and results into output | Interface Adapters | inward |
| Implement an output boundary the core declared | Frameworks & Drivers | outward |

Everything else in a plugin — routing, styling, bundling, deployment — is
plumbing around those two.

---

## Interface Adapters — `plugins/*/app/` and equivalents

Components, route handlers, presenters, and controllers that translate between
framework-shaped input/output and the core's boundaries.

### MUST

- Call the published package surface:
  `@csikosbalint/webapp-platform-core` and
  `@csikosbalint/webapp-platform-core/ports`.
- Translate transport or UI input into input-boundary types on the way in, and
  core results into view models on the way out.
- Validate and coerce untrusted input here, before it reaches a boundary. The
  core's own validation is a backstop, not the first line.
- Keep framework conventions and framework imports at this edge.
- Keep composition and wiring at the edge, not pushed inward.

### MUST NOT

- Import `core/src`, `core/dist`, or any path inside the package. The `exports`
  map blocks it; do not work around it with a relative path, an alias, or a
  `paths` entry.
- Contain a business rule. A calculation that appears inside a component is a
  rule that escaped the core.
- Reimplement something a boundary already offers because calling the boundary
  felt awkward. Fix the boundary in `core/` instead.
- Hold state that belongs to the domain. UI state is fine; business state is
  not.

---

## Frameworks & Drivers — `plugins/*/`

The outermost ring: frameworks, UI, CSS, browser APIs, filesystem, network,
process, deployment configuration.

### MUST

- Keep framework-specific code inside the plugin.
- Implement output boundaries here, never inside `core/`. A driver is the only
  place allowed to know about `node:fs`, a database client, an HTTP client, or a
  vendor SDK.
- Conform to the contract as declared. If a driver cannot satisfy a boundary,
  that is a conversation about the boundary, not a reason to widen it quietly.
- Construct drivers and pass them to the core's factories at the edge, where
  configuration is already available.
- Read configuration and secrets here. Never pass a whole config object into
  the core; pass the one value or the one driver it asked for.

### MUST NOT

- Move framework types into `core/`, in any direction, for any reason.
- Export a driver from a place the core could import.
- Let a framework upgrade turn into a change to an entity rule. If it does, a
  dependency was pointing the wrong way before the upgrade.

---

## Adding a plugin

1. Create `plugins/<name>/` with its own `package.json` and lockfile. Plugins
   are independent workspaces, not a monorepo build graph.
2. Depend on `@csikosbalint/webapp-platform-core` at a pinned version.
3. Write the adapters that translate your transport into input-boundary calls.
4. Write drivers for any output boundary the core requires, and wire them at the
   edge.
5. Add a `<NAME>.md` in the plugin and link it from the table at the top of this
   file.

A second plugin must be able to reuse `core/` untouched. If adding one forces a
change inside `core/`, the change is either a genuine missing capability — which
belongs in a boundary — or a leak of the first plugin's assumptions.

## Checking your work

From the repository root:

```sh
# Must print nothing: no plugin reaches inside the package.
grep -rn "webapp-platform-core/\(src\|dist\)\|core/src\|core/dist" plugins/*/app plugins/*/*.ts* 2>/dev/null

# Must print nothing: no relative escape out of a plugin.
grep -rn "from ['\"]\.\./\.\./\.\./core" plugins/ --include='*.ts' --include='*.tsx'
```

Then run the plugin's own lint and build. For `plugins/ui` those are documented
in [`ui/UI.md`](./ui/UI.md).
