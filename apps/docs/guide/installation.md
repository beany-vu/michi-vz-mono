# Installation

`@michi-vz` is published to npm under the [**@michi-vz**](https://www.npmjs.com/org/michi-vz) scope. Install the one package for your stack - the framework wrappers pull in the engine (`@michi-vz/core`) automatically. Each package name below links to its npm page.

| Stack | Package | Peer dependencies |
| --- | --- | --- |
| React | [`@michi-vz/react`](https://www.npmjs.com/package/@michi-vz/react) | `react` & `react-dom` >= 18 |
| Vue | [`@michi-vz/vue`](https://www.npmjs.com/package/@michi-vz/vue) | `vue` >= 3 |
| Svelte | [`@michi-vz/svelte`](https://www.npmjs.com/package/@michi-vz/svelte) | `svelte` >= 4 |
| Angular | [`@michi-vz/angular`](https://www.npmjs.com/package/@michi-vz/angular) | `@angular/core` >= 16 |
| Web component | [`@michi-vz/wc`](https://www.npmjs.com/package/@michi-vz/wc) | none (self-contained) |
| Vanilla / engine | [`@michi-vz/core`](https://www.npmjs.com/package/@michi-vz/core) | none (d3 installed automatically) |

## Install

::: code-group

```bash [React]
npm i @michi-vz/react
```

```bash [Vue]
npm i @michi-vz/vue
```

```bash [Svelte]
npm i @michi-vz/svelte
```

```bash [Angular]
npm i @michi-vz/angular
```

```bash [Web component]
npm i @michi-vz/wc
```

```bash [Vanilla JS]
npm i @michi-vz/core
```

:::

> Examples use **npm**; `pnpm add`, `yarn add`, and `bun add` work identically.

## Peer dependencies

The framework wrappers declare their framework as a **peer dependency** - install it (or make sure your app already has it) alongside the wrapper, so you control the version:

::: code-group

```bash [React]
npm i @michi-vz/react react react-dom
```

```bash [Vue]
npm i @michi-vz/vue vue
```

```bash [Svelte]
npm i @michi-vz/svelte svelte
```

```bash [Angular]
npm i @michi-vz/angular @angular/core
```

:::

`@michi-vz/wc` and `@michi-vz/core` have **no peer dependencies** - everything they need (the d3 modules, DOMPurify) ships as regular dependencies and installs automatically.

## Importing a single chart

Import one chart instead of the barrel so your bundler can drop the other 21:

::: code-group

```ts [React]
import { RadarChart } from "@michi-vz/react/radar-chart";
```

```ts [Vue]
import { RadarChart } from "@michi-vz/vue/radar-chart";
```

```ts [Svelte]
import { radarChart } from "@michi-vz/svelte/radar-chart";
```

```ts [Angular]
import { bindChart, applyRadarChartProps } from "@michi-vz/angular/radar-chart";
```

```ts [Web component]
import "@michi-vz/wc/radar-chart"; // registers <michi-vz-radar-chart> only
```

:::

The bare `@michi-vz/react` / `@michi-vz/vue` / `@michi-vz/svelte` / `@michi-vz/angular` / `@michi-vz/wc` barrel still works and still registers every chart - subpaths are purely additive. Every chart has its own subpath, kebab-case, e.g. `@michi-vz/vue/comparable-vertical-bar-chart`; see [Radar Chart](/charts/radar) or browse the full [gallery](/charts/).

## CDN / no build

For a prototype, a CodePen, or a plain HTML page, load the web components straight from a CDN - no bundler required:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

> Pin a major for stability, e.g. `@michi-vz/wc@1/dist/michi-vz-wc.bundle.js`. The CDN bundle ships **every** element, so for production prefer installing the package and importing only the charts you use (per-element sub-paths are tree-shakeable).

## Styles

The engine auto-injects a tiny `core.css` (layout, tooltip, transitions) the first time a chart mounts - **you do not import any CSS**. It deliberately sets **no `fill`/`stroke`**: colour is your contract. Colour marks by their sanitized label in your own stylesheet:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

Because charts render in **light DOM**, your CSS reaches every mark - including canvas pixels, via a `getComputedStyle` probe.

## Next steps

- **[Render your first chart](/guide/getting-started)** - the per-framework quickstart.
- **[Browse the charts](/charts/)** - 21 examples, one page each.
- **[API reference](/api/line)** - props, events, and `getContext()` per chart.
- **[LLM context](/guide/llm-context)** - the renderer-agnostic `ChartContext` every chart emits.
