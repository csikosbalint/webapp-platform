# `plugins/ui/` — Frameworks & Drivers

This plugin is the outermost Clean Architecture ring: **Frameworks & Drivers**.
Next.js, React, CSS, browser APIs, and deployment configuration are details
that drive the core through its published input boundaries.

## Rules

- Import the core package surface, not `core/src`, `core/dist`, or its private
  folders.
- Translate UI or route input into the core's input-boundary types.
- Keep Next.js-specific code in this plugin.
- Do not move framework types into `core/`.
- Keep composition and adapter wiring at the edge.

The framework is a delivery mechanism, not the application architecture. A
change to Next.js should not require changing Entity rules merely because the
UI framework changed.
