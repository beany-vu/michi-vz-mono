---
"@michi-vz/core": minor
"@michi-vz/react": minor
---

Add chart export helpers so consumers can download a chart as a correctly-styled image or CSV.

- **`@michi-vz/core`**: new framework-agnostic helpers — `chartContextToCsv(ctx)` serializes any chart's `getContext().a11yTable` (the full, untruncated data table every chart carries) to RFC-4180 CSV with no per-chart code; `chartToStyledSvgString(el)` / `chartToStyledSvgDataUri(el)` rebuild a standalone SVG with `CORE_CSS` inlined, fixing the long-standing problem that the chart CSS lives in `document.adoptedStyleSheets` and is invisible to `XMLSerializer` / `save-svg-as-png` (exported images lost gridlines, axis labels and the zero-line); `chartToPngDataUrl(el)` rasterizes to PNG and composites canvas-renderer marks over the SVG axes.
- **`@michi-vz/react`**: every chart handle now exposes `getElement()` (alongside the existing `getContext()`) returning the chart host element, so consumers get a scoped reference to feed the export helpers instead of a fragile global DOM query.
- **LineChart `sharedTooltip`** (+ optional `sharedTooltipFormatter`): when on, hovering anywhere in the plot shows ONE tooltip listing every series' value at the nearest x (year), alongside the crosshair, instead of the single nearest series. Forwarded by the WC (`shared-tooltip`) and Angular wrappers; React passes it through.
- **LineChart `a11yTable`** is now a wide per-period table (one column per distinct x value, labelled like the axis; one row per series, `-` for gaps) instead of a per-series summary — so a CSV export off `getContext()` carries every plotted point (e.g. one column per year), and the a11y mirror shows the data itself. Per-series stats stay on `context.series`/`stats`; the narrative stays on `context.summary`.

No API removed or renamed. The only behavior change is the LineChart `a11yTable` shape above (its `summary` and `series` fields are unchanged).
