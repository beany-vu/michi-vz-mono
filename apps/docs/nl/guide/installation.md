# Installatie

`@michi-vz` wordt gepubliceerd op npm onder de [**@michi-vz**](https://www.npmjs.com/org/michi-vz)-scope. Installeer het ene pakket voor jouw stack - de framework-wrappers trekken de engine (`@michi-vz/core`) automatisch binnen. Elke pakketnaam hieronder linkt naar zijn npm-pagina.

| Stack | Pakket | Peer dependencies |
| --- | --- | --- |
| React | [`@michi-vz/react`](https://www.npmjs.com/package/@michi-vz/react) | `react` & `react-dom` >= 18 |
| Vue | [`@michi-vz/vue`](https://www.npmjs.com/package/@michi-vz/vue) | `vue` >= 3 |
| Svelte | [`@michi-vz/svelte`](https://www.npmjs.com/package/@michi-vz/svelte) | `svelte` >= 4 |
| Angular | [`@michi-vz/angular`](https://www.npmjs.com/package/@michi-vz/angular) | `@angular/core` >= 16 |
| Web component | [`@michi-vz/wc`](https://www.npmjs.com/package/@michi-vz/wc) | geen (self-contained) |
| Vanilla / engine | [`@michi-vz/core`](https://www.npmjs.com/package/@michi-vz/core) | geen (d3 is meegebundeld) |

## Installeren

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

> Voorbeelden gebruiken **npm**; `pnpm add`, `yarn add`, en `bun add` werken identiek.

## Peer dependencies

De framework-wrappers declareren hun framework als een **peer dependency** - installeer het (of zorg dat je app het al heeft) naast de wrapper, zodat jij de versie beheert:

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

`@michi-vz/wc` en `@michi-vz/core` hebben **geen peer dependencies** - alles wat ze nodig hebben (d3-scale/d3-shape, DOMPurify) is meegebundeld.

## CDN / geen build

Voor een prototype, een CodePen, of een gewone HTML-pagina, laad de web components rechtstreeks vanaf een CDN - geen bundler nodig:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [{ date: 2016, value: 10, certainty: true }] },
  ];
</script>
```

> Pin een major-versie voor stabiliteit, bijv. `@michi-vz/wc@1`. De CDN-bundle bevat **elk** element, dus voor productie is het beter om het pakket te installeren en alleen de grafieken die je gebruikt te importeren (per-element sub-paths zijn tree-shakeable).

## Stijlen

De engine injecteert automatisch een kleine `core.css` (layout, tooltip, transities) de eerste keer dat een grafiek mount - **je importeert zelf geen CSS**. Het stelt bewust **geen `fill`/`stroke`** in: kleur is jouw contract. Kleur marks via hun gesaneerde label in je eigen stylesheet:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

Omdat grafieken renderen in **light DOM**, bereikt jouw CSS elke mark - inclusief canvas-pixels, via een `getComputedStyle`-probe.

## Volgende stappen

- **[Render je eerste grafiek](/nl/guide/getting-started)** - de quickstart per framework.
- **[Bekijk de grafieken](/nl/charts/)** - 16 voorbeelden, elk op een eigen pagina.
- **[API-referentie](/nl/api/line)** - props, events, en `getContext()` per grafiek.
- **[LLM-context](/nl/guide/llm-context)** - de renderer-onafhankelijke `ChartContext` die elke grafiek afgeeft.
