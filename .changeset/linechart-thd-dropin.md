---
"@michi-vz/core": minor
"@michi-vz/react": minor
---

LineChart thd drop-in compatibility: overlays, axis config, font, and React provider.

- **ChartContext `legendData`** — new `LegendItem[]` field (`label`, `color`, `order`, `disabled`, `dataLabelSafe`) populated by LineChart via `buildLegendData`; exposes the per-series colour contract for skip-mode (canvas) consumers.
- **LineChart loading / no-data** — `isLoading` and `isNodata` (boolean or predicate, default = empty dataSet) props; engine sets `data-mv-state="loading"|"nodata"|"ready"` on the host; shows `.mv-nodata` / `.mv-loading` core overlays unless `suppressDefaultOverlay` is set; `noDataLabel` customises the default overlay text.
- **Axis config** — `yTicks` (default 10); `showGridLines` horizontal dashed gridlines (default true); `showVerticalGridLines` vertical dashed gridlines (default false); `highlightZeroLine` draws y=0 solid in grid colour / `--michi-vz-zero-line` (default true).
- **`fontFamily` prop** — sets `--michi-vz-font-family` so both SVG text and canvas `getComputedStyle` probes use the same family; no font embedding required.
- **`MichiVzProvider` + `useChartContext`** (`@michi-vz/react`) — React context backed by `createMichiVzStore` and subscribed via `useSyncExternalStore`; accepts `colorsMapping`, `highlightItems`, `disabledItems`, `hiddenItems`, `visibleItems`, `fontFamily`, `singlePointLine`, `categoryMetadata`, `colorsBasedMapping`, `locale`, `dir`; returns empty defaults when no provider is mounted.
- **React `LineChart` overlay layer** — `isLoadingComponent` / `isNodataComponent` ReactNode props rendered as an overlay over the still-mounted host (never unmounts the chart); merges provider state via `resolveEffectiveProps`.
- **`ScatterPlotChart` alias** (`@michi-vz/react`) — exported as an alias of `ScatterChart` (plus `ScatterPlotChartProps` / `ScatterPlotChartHandle` type aliases) for legacy-name parity.
- **New core exports** — `buildLegendData`, `evaluateDataState`, `resolveIsNodata`, `resolveEffectiveProps`, `toggleNodataIndicator`.
- **CSS** (auto-injected by `ensureStyles()`) — `.mv-nodata` overlay; grid dash updated to `2 2`; zero-line is now solid; new vars `--michi-vz-zero-line`, `--michi-vz-loading`, `--michi-vz-ink`, `--michi-vz-font-size`.
