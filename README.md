# @michi-vz

**Charts that move with your stack, not against it.** One rendering engine,
twelve chart types, and first-class support for **React, Vue, Svelte, Angular,
native web components, or no framework at all**. Every chart is interactive,
accessible, and emits an LLM-ready data context you can drop straight into a
report, a dashboard, or an AI feature.

**[Live demos and docs -> michi-vz.netlify.app](https://michi-vz.netlify.app/)**

## Why @michi-vz

- **For developers** - pick your framework, keep your charts. The same engine
  powers React, Vue, Svelte, Angular, web components, and vanilla JS, so a stack
  change never means a charting rewrite. Fully typed, tree-shakeable, light DOM,
  and styleable with ordinary CSS.
- **For teams and managers** - one charting standard across every project and
  every framework your teams use. No vendor lock-in, MIT-licensed, accessible by
  default (every chart ships a hidden screen-reader table), and ready for the AI
  features on your roadmap.
- **For analysts, finance, and reporting** - purpose-built financial views like
  tornado (dual horizontal bar), range, gap, and ribbon charts, with a built-in
  notion of certain vs. estimated values so forecasts and actuals read clearly.
  Interactive tooltips and highlighting make the numbers easy to explore and easy
  to put in front of a client.
- **For everyone making charts** - clean defaults that look good out of the box,
  smooth interactions, and copy-paste examples in the [docs](https://michi-vz.netlify.app/).

## Lineage

`@michi-vz` is the framework-agnostic successor to the original React-only
[michi-vz](https://github.com/beany-vu/michi-vz)
([live demos](https://beany-vu.github.io/michi-vz/)). That first version was
React-only; this rebuild extracts the same battle-tested charts into a plain-TS
engine so they run on React, Vue, Svelte, Angular, web components, or plain
JavaScript, while keeping the original behaviour and visual style intact.

## What's inside

A plain-TS rendering **engine** (`@michi-vz/core`), native **web components**
(`@michi-vz/wc`, Lit + light DOM), thin wrappers for **React / Vue / Svelte /
Angular**, and an opt-in client-side **AI insights** layer (`@michi-vz/insights`,
in progress). Every chart emits a renderer-agnostic, LLM-ready **`ChartContext`**
(structured data + stats + rule-based NL summary + a hidden a11y table mirror)
that is identical whether the chart renders as SVG or canvas.

## Charts (12)

GapChart · LineChart · FanChart (forecast) · AreaChart · ScatterPlot · VerticalStackBar ·
ComparableHorizontalBar · DualHorizontalBar (tornado) · BarBell · Range · Ribbon ·
Radar - each available across all five outputs (core engine, web component, and
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

Charts render into **light DOM only** - the canvas renderer resolves mark colours
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
