# `plugins/ui/app/` — Interface Adapters

This Next.js App Router folder is the UI-side **Interface Adapters** area. Its
components, route handlers, and presenters translate between framework-shaped
input/output and the core's input boundaries.

## Rules

- Keep `next/*`, React, browser, and presentation concerns here or in the
  framework plugin.
- Call the published core boundary rather than importing core internals.
- Convert core results into view models and UI output at this edge.
- Do not put business rules here; delegate them to the core.
- Keep framework conventions such as `layout.tsx` and `page.tsx` at this edge.

The current starter page is only a framework driver. When it invokes the math
capability, the adapter should translate the interaction to
`math.geometry.calculateRightTriangle` and render the returned data without
moving the calculation into the page component.
