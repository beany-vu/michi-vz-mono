# @michi-vz/wc

## 1.3.0

### Minor Changes

- LineChart/AreaChart x-axis: the first + last periods are never dropped, crowded labels auto-rotate then thin to ~5, and the opt-in `fillPeriodTicks` continuous-timeline mode (faded no-data ticks + a "no data" hover tooltip, customizable via `noDataTickTooltip` / `noDataTickColor`). New props forwarded by the `<michi-vz-line-chart>` / `<michi-vz-area-chart>` element (`fill-period-ticks` attribute + reactive properties).

- `<michi-vz-line-chart>`: the hover crosshair (`enableMouseLine`) defaults to ON (legacy parity) and now also accepts a `MouseLineConfig` object (`{ stroke, strokeWidth, strokeDasharray, snap }`) via the `enableMouseLine` property; the `enable-mouse-line` attribute still opts in explicitly, and setting the property to `false` opts out.

### Patch Changes

- Updated dependencies:
  - @michi-vz/core@1.3.0

## 1.2.1

### Patch Changes

- docs: add a Framework packages cross-link table to every package README and fix the dead monorepo link, so each npm page links to all the sibling wrappers. Also aligns vue/angular/svelte/wc to the same release as core/react.
- Updated dependencies
  - @michi-vz/core@1.2.1

## 1.2.0

### Minor Changes

- 084458f: Full core-prop parity across every framework wrapper. The wrappers previously forwarded only a curated subset of each chart's props; now all five outputs expose the complete `@michi-vz/core` prop surface for all 17 charts.

  - **`@michi-vz/wc`** - each `<michi-vz-*-chart>` Lit element gained the previously-omitted props as reactive properties + `chartProps` forwards (183 props total): layout/format props (`margin`, `colors`, `xAxisFormat`, `yAxisFormat`, `ticks`, `tickValues`, `enableTransitions`, `filter`), per-chart additions (ComparableBar `maxBarHeight` / `symmetricXDomain` / `patternsMapping` / `showZeroLineForXAxis` / `hideTickLabels` / `horizontalTickPosition`; Scatter crosshair suite + `dScaleLegend` / `yTicksQty` / `showGrid` / `pinIcon`; VSB `xAxisLabelPadding` / `minBarWidth` / `minBarHeight` / `yTicks` / `showGridLines` / `highlightZeroLine` / `fontFamily`; Gap `colorMode` / `shapeColorsMapping` / `shapesLabelsMapping` / `showLegend` / `legendAlign` / `enableExplicitTickValues`; Radar `poles` / `showFilled` / `showDimmedFill` / label formatters; BarBell `dodgeOverlappingCaps`; `svgChildren` on Line + Scatter), and the `isLoading` / `isNodata` / `noDataLabel` overlay controls. Object/array/function props are declared `attribute: false`.
  - **`@michi-vz/angular`** - every `apply<Name>ChartProps` applicator now forwards the matching element's full property set (193 added forwards), including the previously-drifted `applyLineChartProps` / `applyFanChartProps` (which had lagged their WC elements). `title` → `chartTitle` and `style` → `fountainStyle` mappings preserved.
  - **`@michi-vz/vue` / `@michi-vz/svelte`** - already pass the whole props object through, so they expose the full surface (and the latest core engine fixes) on rebuild; no API change, re-released for parity.

  Internal-only flags (`suppressDefaultOverlay`) and the `on*` callbacks (WC dispatches these as DOM `CustomEvent`s) are intentionally not forwarded as plain data props. A static parity-guard test (`apps/docs/scripts/wrapper-parity.test.mjs`) now fails CI if any wrapper falls behind the core type.

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
