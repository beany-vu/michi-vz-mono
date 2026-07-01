# Provider & shared state

`@michi-vz/react` ships a React context layer - `MichiVzProvider` + `useChartContext` - that lets a tree of charts share colours, highlights, and display state without prop-drilling.

## MichiVzProvider

Wrap a subtree to share state across every chart inside it:

```tsx
import { MichiVzProvider, LineChart } from "@michi-vz/react";

export default function Dashboard() {
  return (
    <MichiVzProvider
      colorsMapping={{ North: "#b23a2e", South: "#4a90d9" }}
      highlightItems={["North"]}
    >
      <LineChart dataSet={dataSet} xAxisDataType="date_annual" />
    </MichiVzProvider>
  );
}
```

All props are optional. The provider merges them into every chart in the tree via `resolveEffectiveProps`.

### Props

| Prop | Type | Purpose |
|---|---|---|
| `colorsMapping` | `Record<string, string>` | Label → hex colour. Applied to marks and read by the canvas probe. |
| `highlightItems` | `string[]` | Labels to draw at full opacity; others are dimmed. |
| `disabledItems` | `string[]` | Labels hidden from the chart entirely. |
| `hiddenItems` | `string[]` | Labels excluded from rendering (complement of `visibleItems`). |
| `visibleItems` | `string[]` | Explicit allow-list; labels outside it are hidden. |
| `fontFamily` | `string` | Sets `--michi-vz-font-family` so SVG text and canvas text match. The family must already be loaded by the page. |
| `singlePointLine` | `boolean \| SinglePointLineConfig` | How to render a series with a single data point (dot, short line, etc.). |
| `categoryMetadata` | `Record<string, { color?: string; label?: string }>` | Per-category colour/label overrides. |
| `colorsBasedMapping` | `Record<string, string>` | Secondary colour contract (e.g. for area fills vs strokes). |
| `locale` | `string` | BCP-47 locale forwarded to axis formatters (e.g. `"fr"`, `"ar"`). |
| `dir` | `"ltr" \| "rtl"` | Text direction. `"rtl"` mirrors horizontal axes. |

Under the hood `MichiVzProvider` creates a `MichiVzStore` (via `createMichiVzStore` from `@michi-vz/core`) on first render, re-syncing when props change. The store is framework-agnostic; a future web-component coordinator can share the same store instance.

## useChartContext

Read the current shared state from anywhere inside the provider tree:

```tsx
import { useChartContext } from "@michi-vz/react";

function MyLegend() {
  const { colorsMapping, disabledItems } = useChartContext();
  return (
    <ul>
      {Object.entries(colorsMapping).map(([label, color]) => (
        <li key={label} style={{ opacity: disabledItems.includes(label) ? 0.3 : 1 }}>
          <span style={{ background: color, width: 12, height: 12, display: "inline-block" }} />
          {label}
        </li>
      ))}
    </ul>
  );
}
```

`useChartContext` subscribes via `useSyncExternalStore` - updates are tear-free under concurrent rendering. When no `MichiVzProvider` is in the tree it returns safe empty defaults (`colorsMapping: {}`, `highlightItems: []`, etc.) so you never read `undefined`.

## The legendData colour contract

For **canvas charts** the engine cannot read CSS variables directly at paint time - it uses a `getComputedStyle` probe instead. When a chart is rendered with `skipColorMappingDispatch` (the consumer controls colours, not the engine), the colour authority workflow is:

1. The engine populates `ChartContext.legendData` after processing data. Each entry is a `LegendItem`:

   ```ts
   type LegendItem = {
     label: string;        // human label (e.g. "Sub-Saharan Africa")
     color: string;        // resolved colour at render time
     order: number;        // appearance order in the series
     disabled?: boolean;
     dataLabelSafe: string; // sanitizeForClassName(label) → "sub-saharan-africa"
   };
   ```

2. A consumer colour authority reads `legendData` from `onChartDataProcessed(ctx)` and emits CSS that targets the `data-label-safe` attribute:

   ```css
   /* emitted by your colour authority into a <style> block */
   .line[data-label-safe="sub-saharan-africa"] { stroke: #4a90d9; }
   .line[data-label-safe="north-africa"]       { stroke: #e8a838; }
   ```

3. On the next paint the canvas probe calls `getComputedStyle` on the matching SVG element and reads the colour - no opacity/transparent bar problem.

The `dataLabelSafe` field is produced by `sanitizeForClassName` from `@michi-vz/core` and is stable across renders for the same label string.

::: tip Canvas colour checklist
For canvas charts (`renderer="canvas"` + `skipColorMappingDispatch`) you need **both**:

- A `<style>{cssFromLegendData}</style>` block in your JSX - without it every bar renders transparent.
- Unconditional mount + key-driven remount (`key={chartKey}`) rather than `{ready && <Chart />}` - conditional mount prevents `isNodataComponent` from firing on empty data.
:::

## Migrating from the standalone `michi-vz` package

The mono-repo packages (`@michi-vz/core` + `@michi-vz/react`) are a drop-in superset of the legacy `michi-vz` npm package. Most changes are additive; the table below covers the parts that differ.

### Import paths

| Legacy `michi-vz` | Mono `@michi-vz/react` |
|---|---|
| `import { MichiVzProvider } from "michi-vz"` | `import { MichiVzProvider } from "@michi-vz/react"` |
| `import { useChartContext } from "michi-vz"` | `import { useChartContext } from "@michi-vz/react"` |
| `import { ScatterPlotChart } from "michi-vz"` | `import { ScatterPlotChart } from "@michi-vz/react"` (alias kept) |

### ScatterPlotChart alias

The chart was renamed `ScatterChart` in the mono. `ScatterPlotChart`, `ScatterPlotChartProps`, and `ScatterPlotChartHandle` are all re-exported as aliases so existing imports compile without change.

### legendData

In the legacy package `legendData` lived on `ChartMetadata` and was only available on select charts. In the mono it is a first-class field on `ChartContext` (returned by `chart.getContext()` and passed to `onChartDataProcessed`) and is populated by `LineChart` today, with other chart types following.

### No CSS import needed

The legacy package required a separate `import "michi-vz/dist/style.css"`. The mono auto-injects layout/overlay CSS via `ensureStyles()` at mount time - remove the import if you have one. Colour CSS (fill/stroke) is still your contract, as before.

### Provider / useChartContext parity

`MichiVzProvider` accepts exactly the same core props as before (`colorsMapping`, `highlightItems`, `disabledItems`, `fontFamily`, `singlePointLine`), plus the new additions (`hiddenItems`, `visibleItems`, `categoryMetadata`, `colorsBasedMapping`, `locale`, `dir`). `useChartContext` returns a superset of the legacy `MichiVzState` - existing destructures are safe.
