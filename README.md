# @michi-vz

Framework-agnostic data-visualization library: a plain-TS rendering **engine**
(`@michi-vz/core`), native **web components** (`@michi-vz/wc`, Lit + light DOM),
thin wrappers for **React / Vue / Svelte / Angular**, and an opt-in client-side
**AI insights** layer (`@michi-vz/insights`, in progress). Every chart emits a
renderer-agnostic, LLM-ready **`ChartContext`** (structured data + stats +
rule-based NL summary + a hidden a11y table mirror) that is identical whether the
chart renders as SVG or canvas.

## Charts (11)

GapChart · LineChart · AreaChart · ScatterPlot · VerticalStackBar ·
ComparableHorizontalBar · DualHorizontalBar (tornado) · BarBell · Range · Ribbon ·
Radar — each available across all five outputs (core engine, web component, and
React/Vue/Svelte/Angular wrappers), in both SVG and canvas renderers.

## Install

```bash
npm i @michi-vz/core            # the engine (no framework deps)
npm i @michi-vz/wc              # native web components
npm i @michi-vz/react           # or /vue, /svelte, /angular
```

## Usage

### Web component (any framework / no build)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>
<michi-vz-line-chart id="c" width="600" height="300" chart-title="Sales"></michi-vz-line-chart>
<script>
  const c = document.getElementById("c");
  c.dataSet = [{ label: "North", series: [{ date: 2016, value: 10, certainty: true }, /* … */] }];
  c.addEventListener("michi-vz:highlight", (e) => console.log(e.detail));
  const ctx = c.getContext(); // LLM-ready context, identical in SVG and canvas
</script>
```

### React

```tsx
import { LineChart } from "@michi-vz/react";

<LineChart dataSet={data} xAxisDataType="date_annual" detectGaps renderer="svg" />;
```

### Imperative engine (no framework)

```ts
import { mountLineChart } from "@michi-vz/core";
const chart = mountLineChart(el, { dataSet, width: 600, height: 300 });
chart.update(nextProps);
chart.getContext();
chart.destroy();
```

## Hard rules (light DOM, colour contract)

Charts render into **light DOM only** — the canvas renderer resolves mark colours
by reading consumer CSS via `getComputedStyle` on probe elements, so consumer
rules like `.line[data-label-safe="North"] { stroke: … }` reach canvas pixels.
Every mark carries `data-label` + `data-label-safe` (sanitized via the single
`sanitizeForClassName`). `@michi-vz/core/styles.css` does layout/tooltip only and
never sets `fill`/`stroke`.

## Develop

```bash
pnpm install
pnpm build && pnpm typecheck && pnpm test
pnpm verify:playground   # headless-browser self-tests (expect "N/N checks passed.")
```

Monorepo: pnpm workspaces + Turborepo + Changesets + tsup. Run apps/docs via Docker.

## License

MIT.
