---
"@michi-vz/core": patch
---

Heavy-chart performance bug fixes (the "page with a 50k-point scatter feels laggy" report):

- **Bounded context signature.** The `onChartDataProcessed` idempotency guard signed the whole context with `JSON.stringify`, serializing `a11yTable.rows` (one row per datum) and `legendData` on every render - a multi-MB string for a 50k-point scatter, twice at mount on WebGPU-capable browsers. The a11y mirror caps its rendered table at 100 rows, but the signature bypassed that cap. All 8 engines that used the pattern (scatter, line, area, gap, bar-bell, vertical-stack-bar, comparable-horizontal-bar, radar) now sign through a shared `contextSignature` helper: the two per-datum fields are folded through FNV-1a and only the small remainder is stringified. Change-detection semantics are unchanged; the signature stays a few hundred bytes at any data size.
- **rAF-throttled scatter hover.** The canvas/WebGPU hit-test scanned every point on every `mousemove` (50k `Math.hypot` calls per event, several events per frame) and re-resolved the props each time. The first event of a burst still processes synchronously; the rest of the frame collapses into one trailing `requestAnimationFrame` pass over the latest event, and the resolved renderer is cached per render. Pending passes are cancelled on `destroy()`.
- **Skip the z-order sort when radii are uniform.** The scatter render model sorted all points by radius on every render even when `sizeRange` is pinned or no point has a `d` value (the sort is stable, so the order could not change).
- `makeLayerCanvas` reads `getComputedStyle(host)` once instead of twice.
- `@webgpu/types` is now a declared devDependency of core (it was previously resolved from an undeclared install and a fresh `pnpm install` broke `typecheck`).
