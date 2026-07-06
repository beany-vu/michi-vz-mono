---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

RadarChart, SankeyChart, and TreemapChart gain the full loading/no-data prop quad
(`isLoading`, `isNodata`, `noDataLabel`, `suppressDefaultOverlay`), wired through
the shared `applyChartChrome` helper like the already-converged charts. Engines now
stamp `data-mv-state="loading" | "nodata" | "ready"` on the host element.

- React wrappers for these three charts gain `isLoadingComponent` /
  `isNodataComponent` (ReactNode overlays rendered over the still-mounted host).
- **React DOM-shape note:** the React wrappers for Radar/Sankey/Treemap now
  unconditionally wrap the chart host in
  `<div class="michi-vz michi-vz-react-host" style="position:relative">` (the same
  structure Gap/Line already use) — required by the mounted-overlay mechanism. If
  your CSS or DOM-walking code assumed the old direct-child structure for these
  three charts, adjust the selector.
- RadarChart's pre-existing `isLoading` was a dead no-op (its CSS class landed on
  an element the stylesheet's descendant selector never matched); it now shows a
  real overlay, matching its documented intent.
