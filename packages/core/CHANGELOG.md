# @michi-vz/core

## 1.2.0

### Minor Changes

- **thd drop-in compatibility release.** The additive API that lets the scoped `@michi-vz/*` packages replace the legacy single-package `michi-vz` with no chart regressions. Everything here is backward-compatible.

  **Renderer-agnostic context (`getContext()` / `onChartDataProcessed`)**

  - `legendData` (`LegendItem[]`: `label`, `color`, `order`, `disabled`, `dataLabelSafe`) on the Line/Gap/Area/Scatter/BarBell/Radar contexts — the per-series colour contract for skip-mode (canvas) consumers.
  - `renderedData` on the Gap context and `visibleItems` on the Line context (legacy `useGapChartMetadata` / `useLineChartMetadataExpose` parity).
  - Every `on*Processed` is now idempotent — it fires only when the serialized context actually changes (prevents render loops in consumers that dispatch on each call).

  **LineChart** — `isLoading` / `isNodata` (boolean or predicate) plus `noDataLabel` / `suppressDefaultOverlay`; axis config `yTicks`, `showGridLines`, `showVerticalGridLines`, `highlightZeroLine`; `fontFamily`; `svgChildren` (consumer-supplied SVG children, e.g. an axis-title `<text>`).

  **GapChart** — built-in shape legend (`showLegend`, `legendAlign`, `shapesLabelsMapping`); `enableExplicitTickValues`.

  **ComparableHorizontalBarChart** — `maxBarHeight` (cap bar thickness so a 1–2 row chart doesn't balloon; bands centre); `symmetricXDomain` (force `[-M, M]`, `M = max(|min|, |max|)`).

  **VerticalStackBarChart** — `xAxisLabelPadding` (rotate crowded labels −45° sooner); `keys` / `keysOrder`.

  **ScatterChart** — `xAxisDataType: "band"` scale path; crosshair overlay; draggable `dScaleLegend`; per-point shapes.

  **RadarChart** — accepts the legacy `data: [{ date, value }]` series shape + `poles.labels`; canvas forgiving hit-test.

  **Axes & rendering** — `renderXAxisLinear` adaptive `autoRotate` + `maxTicks`; band-axis `chooseAxisMode` (horizontal → −45° → thinned); y-band labels no longer clip and match the x-axis colour + font; the y-band gridline now respects `showGrid` (was always drawn); tooltips flip left near the host's right edge.

  **SEO & a11y** — the chart `<svg>` now carries `<title>`, `<desc>` (the deterministic summary) and `<metadata>` (schema.org `ImageObject` JSON-LD); a once-per-page console greeting (opt out via `globalThis.__MICHI_VZ_NO_GREETING__`).

  **CSS** (auto-injected by `ensureStyles()`) — `.mv-nodata` / `.mv-loading` overlays; new vars `--michi-vz-zero-line`, `--michi-vz-loading`, `--michi-vz-ink`, `--michi-vz-muted`, `--michi-vz-font-size`, `--michi-vz-font-family`.

  **New exports** — `buildLegendData`, `evaluateDataState`, `resolveIsNodata`, `resolveEffectiveProps`, `createHatchPattern`.

## 1.1.1

### Patch Changes

- Bar-Bell: render the end-cap circles on top of the bar segments (previously a later segment's bar could paint over the previous segment's cap), and make the whole segment hoverable for tooltips - the bar, not only the end-cap circle.

## 1.1.0

### Minor Changes

-
