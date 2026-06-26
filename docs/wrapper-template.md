# Wrapper-generation template (Phase 2 deliverable)

How to produce the **wc element + 4 framework wrappers** for any new chart, derived
from the verified GapChart slice. Wrappers are thin lifecycle adapters over the core
engine — once the engine + wc element are green you can generate all four **in
parallel**. Replace `<Chart>` / `<chart-tag>` / `<chartProps>` throughout.

## Stable contract (do not re-invent per chart)

- **Engine API** (`@michi-vz/core`): `mount<Chart>(host, props) => ChartInstance<<Chart>Props>`
  with `{ update(props), getContext(): ChartContext | null, destroy() }`.
- **CustomEvents** (wc, bubbles + composed) — the canonical names, same for every chart:
  `michi-vz:highlight`, `michi-vz:colormapping`, `michi-vz:dataprocessed`, `michi-vz:datawarning`.
- **Store shape** (`createMichiVzStore`): `colorsMapping`, `highlightItems`, `disabledItems`,
  `fontFamily?`, `locale?`, `dir?`.
- **`ChartContext`** is a discriminated union keyed on `chartType`; every member extends
  `BaseChartContext` (`chartType`, `title?`, `renderer`, `colorsMapping`, `summary`, `a11yTable`).
  Wrappers only ever pass it through (`getContext()`), so they need no per-chart context typing.
- **SSR rule**: server renders a sized placeholder; the engine mounts on the client.

## 1. wc element — `packages/wc/src/<chart>.ts`

Lit, **light DOM** (`createRenderRoot() { return this }`), no decorators (static `properties`),
mounts the engine into a stable `.mv-host` div, per-element sub-path export. Complex inputs are
`{ attribute: false }` properties; primitives are attributes. Wire every engine callback to an
`emit("michi-vz:*", …)`. Expose `getContext()`. Register guarded by `!customElements.get(tag)`.
(Copy `packages/wc/src/gap-chart.ts` verbatim and rename.)

## 2. React — `packages/react/src/index.tsx`

`forwardRef` + a host `div`; `mount<Chart>` in a mount-once `useEffect` (cleanup `destroy()`);
push props in a second effect that runs every render; `useImperativeHandle` exposes `getContext()`;
placeholder sized by `props.width/height` for SSR.

## 3. Vue 3 — `packages/vue/src/index.ts`

`defineComponent` with a single `options` prop (`PropType<<Chart>Props>`); `mount<Chart>` in
`onMounted`; `watch(() => props.options, next => chart.update(next), { deep: true })`;
`onBeforeUnmount(() => chart.destroy())`; `expose({ getContext })`.

## 4. Svelte — `packages/svelte/src/index.ts`

A plain-TS **action** (no `.svelte` compiler needed): `export function <chart>(node, props)` →
`mount<Chart>(node, props)`, returning `{ update, destroy, getContext }`. Usage:
`<div use:<chart>={props}></div>`.

## 5. Angular — `packages/angular/src/index.ts`

THIN today: `import "@michi-vz/wc"` to register `<chart-tag>`, plus an `apply<Chart>Props(el, props)`
helper for template property binding (use `CUSTOM_ELEMENTS_SCHEMA`). An idiomatic standalone
`@Component` via ng-packagr is a deferred increment — keep this layer for now.

## Per-chart checklist (gate before "done")

1. Engine `mount<Chart>` + pure layer + SVG/canvas renderers + `buildContext` (with `a11yTable`)
   + `onDataWarning`, all in `@michi-vz/core`.
2. wc element + 4 wrappers from the templates above.
3. **TDD**: write vitest/jsdom cases first (mount/update/destroy, data-label-safe marks, a11y rows,
   SVG≡canvas context, malformed-data warning), then implement to green.
4. Extend `playground/index.html` self-tests; run `pnpm test` **and** `pnpm verify:playground`.
5. Re-export types from each wrapper (`export type { <Chart>Props, ChartContext } from "@michi-vz/core"`).
6. Gate = `pnpm build && pnpm typecheck && pnpm test && pnpm verify:playground` all green.
