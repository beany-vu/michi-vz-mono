# @michi-vz/react

## 1.2.0

### Minor Changes

- **thd drop-in compatibility release.**

  - `MichiVzProvider` + `useChartContext` - React context (`createMichiVzStore` + `useSyncExternalStore`) carrying `colorsMapping`, `highlightItems`, `disabledItems`, `hiddenItems`, `visibleItems`, `fontFamily`, `singlePointLine`, `categoryMetadata`, `colorsBasedMapping`, `locale`, `dir`. Merged into chart props via `resolveEffectiveProps`; returns empty defaults with no provider mounted.
  - Overlay props on the chart wrappers - `isLoadingComponent` / `isNodataComponent` (`ReactNode`) rendered over the still-mounted host (the chart never unmounts).
  - `LineChart` and `ScatterChart` accept JSX `children`, serialised (`renderToStaticMarkup`) into the engine's `svgChildren` slot - e.g. an axis-title `<text>`.
  - `RadarChartSet` orchestrator - fans out one `<RadarChart>` per item, merging per-child `colorsMapping` + de-duplicated `legendData`.
  - `ScatterPlotChart` alias of `ScatterChart` (+ `ScatterPlotChartProps` / `ScatterPlotChartHandle`) for legacy-name parity.

### Patch Changes

- Updated dependencies:
  - @michi-vz/core@1.2.0

## 1.1.1

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.1

## 1.1.0

### Minor Changes

-

### Patch Changes

- Updated dependencies
  - @michi-vz/core@1.1.0
