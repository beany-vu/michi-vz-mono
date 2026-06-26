# Getting started

`@michi-vz` is a framework-agnostic chart library: a plain-TS **engine** (`@michi-vz/core`),
native **web components** (`@michi-vz/wc`), and thin **React / Vue / Svelte / Angular** wrappers.
Every chart renders in **SVG or canvas** and emits an **LLM-ready `ChartContext`**.

## Install

Pick the package for your stack - full details, peer dependencies, and the CDN option are in **[Installation](/guide/installation)**:

```bash
npm i @michi-vz/react
# or @michi-vz/vue  ·  @michi-vz/svelte  ·  @michi-vz/angular  ·  @michi-vz/wc  ·  @michi-vz/core
```

## Render a chart

::: code-group

```tsx [React]
import { LineChart } from "@michi-vz/react";

export default () => (
  <LineChart
    dataSet={[{ label: "North", series: [{ date: 2016, value: 10, certainty: true }] }]}
    xAxisDataType="date_annual"
  />
);
```

```html [Web component / no build]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

```ts [Imperative engine]
import { mountLineChart } from "@michi-vz/core";

const chart = mountLineChart(el, { dataSet, width: 600, height: 300 });
chart.update(nextProps);
chart.getContext();
chart.destroy();
```

:::

## The colour contract (light DOM)

Charts render into **light DOM** so consumer CSS reaches every mark - including canvas pixels,
via a `getComputedStyle` probe. Colour marks by their sanitized label:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

`@michi-vz/core/styles.css` only handles layout/tooltip - it never sets `fill`/`stroke`, because
colour is your contract.
