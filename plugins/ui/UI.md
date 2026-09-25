# `plugins/ui` — Next.js web UI

Specifics for this plugin. The rules every plugin obeys are in
[`PLUGINS.md`](../PLUGINS.md); the core's rules are in
[`core/CORE.md`](../../core/CORE.md). Not repeated here.

This plugin is the web delivery mechanism: an App Router front end that calls the
core through its published boundaries.

## Stack

| Piece | Version | Notes |
|---|---|---|
| Next.js | 16.3.5 | App Router. Pinned exactly |
| React | 19.2.8 | Pinned exactly |
| Tailwind CSS | v4 | Via `@tailwindcss/postcss`; no `tailwind.config` file |
| ESLint | 9 | Flat config, `eslint-config-next` core-web-vitals + typescript |
| Core | `@csikosbalint/webapp-platform-core` | Local `workspace:*` dependency during development |
| pnpm | 12.6.0 | One workspace rooted at the repository directory |

`next.config.ts` is intentionally empty. Add an option only with a reason in a
comment.

## This Next.js is not the one you remember

The pinned version has breaking changes against most training data — APIs,
conventions, and file structure may all differ. Read the relevant guide in
`node_modules/next/dist/docs/` before writing Next-specific code, and heed
deprecation notices.

Two things already visible in the starter that surprise people:

- `layout.tsx` types its props as `LayoutProps<"/">`, a generated global — not a
  hand-written `{ children: React.ReactNode }`.
- `AGENTS.md` carries a generated `nextjs-agent-rules` block, written and
  re-added by `next dev`. Leave it in place; deleting it from a diff only
  re-creates the uncommitted change.

## Layout

| Path | Circle | Holds |
|---|---|---|
| `app/layout.tsx` | Frameworks & Drivers | Root shell, fonts, metadata |
| `app/page.tsx` | Interface Adapters | Route-level adapter. Currently the starter page, no core call yet |
| `app/globals.css` | Frameworks & Drivers | Tailwind entry and theme tokens |
| `eslint.config.mjs`, `next.config.ts`, `postcss` | Frameworks & Drivers | Build and lint plumbing |

Server Components are the default. Reach for `"use client"` only when a
component needs browser state or an event handler, and keep the boundary as
small as possible — the core call belongs on the server side of it.

## Calling the core

```ts
import { createMath } from "@csikosbalint/webapp-platform-core";
```

Never a deeper path. The package's `exports` map allows only the root and
`/ports`; a relative import into `../../core` is a violation even when it
resolves.

`createMath` requires an outbound driver, so this plugin owns that decision. A
browser-facing route cannot use the core's `/tmp` file driver — that one is a
test driver inside `core/src/tests/` and does not ship. When a route needs to
record results, write a driver here, in this plugin, and construct it in the
route or a server module.

Keep the calculation out of the component: the adapter turns form or route input
into a boundary call, awaits it, and renders the returned data.

## Commands

Run these from the repository root after the one-time workspace install:

```sh
pnpm install
pnpm --filter ui lint
pnpm --filter ui build
pnpm --filter ui dev       # next dev — run this yourself, never from an agent
pnpm --filter ui start     # next start, after a build
```

There is no test setup in this plugin yet. Add one before the first non-trivial
adapter, not after.

## Consuming the local core

This repository is a pnpm workspace. The UI depends on the local core package
through `workspace:*`, while the core's package exports remain unchanged and
continue to resolve from `dist/`.

After the one-time install at the repository root, run the core watcher in one
terminal:

```sh
pnpm --filter @csikosbalint/webapp-platform-core dev
```

Run the UI in another terminal:

```sh
pnpm --filter ui dev
```

The watcher refreshes the compiled public surface as core source changes, so no
publishing, package retrieval, `pnpm link`, or temporary dependency edits are
needed. Import only from `@csikosbalint/webapp-platform-core` or its `/ports`
entry point; never bypass the exports map with a relative import or a deep path.

The workspace must be installed from the repository root. A standalone install
of `plugins/ui` is not supported while its dependency is `workspace:*`; release
or deployment workflows that need an independently installable UI should use a
published core version in a separate deployment manifest.

## Housekeeping

- `.next/` is generated. Never edit it, never commit it.
- `pnpm-lock.yaml` changes only through pnpm commands.
- `README.md` in this folder is create-next-app boilerplate. Architecture
  guidance belongs in this file.
