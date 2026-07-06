---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

New chart: **SymbolMapChart** - chart #20, a force-de-overlapped symbol/bubble
map. Migration target for legacy sdg-trade `MapSymbolForce` (`Chart.js` +
`ForceNode.js`) - a dot-only bubble map where each item's coordinates project
onto the plane, then a one-shot force simulation nudges overlapping circles
apart without moving them far from their true position.

- **Consumers supply lng/lat per item** (`SymbolMapDataItem`). Unlike the
  legacy chart's bundled ~200-row static country coordinate CSV, `@michi-vz/core`
  ships no coordinate table.
- Two projection modes: **dot-only** (no `geography`, the default - legacy
  parity) uses the chosen projection UNTUNED (bare factory(), no translate/
  scale/rotate/center) then rescales the projected point extent to fill the
  plot, mirroring the legacy chart's own xScale/yScale-over-extent math.
  **Backdrop** (`geography` supplied - a NEW capability the legacy chart never
  had) reuses ChoroplethMapChart's tuned projection dispatch, so the muted
  landmass layer and the symbol coordinates share one consistent geographic
  framing. `geo/projections.ts` (the shared factory map + tuned-projection
  formula) was mechanically extracted out of `choroplethMap/scales.ts` for
  this reuse; `ChoroplethMapChartProps`'s own public API is unchanged.
- The one-shot de-overlap: `forceX`/`forceY` pin the simulation to each item's
  true projected position (the exact target snapshotted at force-attach time),
  `forceManyBody()` adds mild separation, `forceCollide` (radius + 2px, 3
  iterations) resolves overlaps. Settles synchronously to the legacy alpha
  threshold (`0.0011`) on a `.stop()`ped simulation - deterministic: identical
  inputs always settle to the identical layout.
- `radiusVisibleMin` filters on the RAW `value`/`valueSecond` (verified against
  the legacy source: strictly before radius scaling) - ported exactly,
  including the "domain floor raised to `radiusVisibleMin` when the max value
  exceeds 100" quirk.
- **Deliberate divergence from legacy**: the radius/opacity scale's domain is
  the TRUE combined extent of every item's `value`/`valueSecond`, NOT legacy
  Chart.js's own domain formula (`[min(primaryMin, secondaryMax),
  max(primaryMin, secondaryMax)]`), which was defective and silently dropped
  the primary max and secondary min - so relative circle sizes differ from
  legacy whenever `value`/`valueSecond` ranges diverge.
- The concentric second ring (`valueSecond`) ports legacy `ForceNode.js`'s
  exact layering: same colour as the primary circle, `opacity - 0.3` (clamped
  to non-negative), drawn on top.
- Canvas colour probe: single-element `circle.symbol[data-label-safe]`, same
  convention as BubbleChart. WebGPU renderer DELEGATES to canvas-2D (same
  rationale as ChoroplethMap: the optional backdrop is arbitrary,
  possibly-concave GeoJSON).
- `buildSymbolMapContext`: stats separate located/visible/hidden(by
  `radiusVisibleMin`)/invalid(bad coordinates) counts, largest/smallest, NL
  summary, a11yTable. `checkSymbolMapData` flags missing/invalid lng-lat,
  negative values, and duplicate ids.
- Full `isLoading`/`isNodata`/`noDataLabel`/`suppressDefaultOverlay` chrome
  quad, `highlightItems`/`disabledItems`, `skipColorMappingDispatch`,
  `tooltipFormatter`.
- Wrappers: `<michi-vz-symbol-map-chart>` (wc), `SymbolMapChart` (React, Vue),
  `symbolMapChart` action (Svelte), `applySymbolMapChartProps` (Angular).
- New core dependency: `d3-array` (`extent`, for the rescale-to-fill math).
