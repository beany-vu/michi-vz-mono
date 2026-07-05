# Aan de slag

`@michi-vz` is een framework-onafhankelijke chart-bibliotheek: een plain-TS **engine** (`@michi-vz/core`),
native **web components** (`@michi-vz/wc`), en dunne **React / Vue / Svelte / Angular**-wrappers.
Elke grafiek rendert in **SVG of canvas** (plus een experimenteel **WebGPU**-pad) en geeft een **LLM-gereed `ChartContext`** af.

## Installeren

Kies het pakket voor jouw stack - volledige details, peer dependencies, en de CDN-optie staan in **[Installatie](/nl/guide/installation)**:

```bash
npm i @michi-vz/react
# or @michi-vz/vue  ·  @michi-vz/svelte  ·  @michi-vz/angular  ·  @michi-vz/wc  ·  @michi-vz/core
```

## Render een grafiek

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

## Het kleurcontract (light DOM)

Grafieken renderen in **light DOM** zodat de CSS van de consument elke mark bereikt - inclusief
canvas-pixels, via een `getComputedStyle`-probe. Kleur marks via hun gesaneerde label:

```css
.line[data-label-safe="North"] { stroke: #b23a2e; }
.bar[data-label-safe="Africa"] { fill: #cda14a; }
```

`@michi-vz/core/styles.css` handelt alleen layout/tooltip af - het stelt nooit `fill`/`stroke` in,
want kleur is jouw contract.

## Waar je hierna heen kunt

- **Kies een grafiek** in de [galerij](/nl/charts/) - elke chartpagina heeft een live demo,
  framework-tabbladen, en een link naar de volledige propreferentie.
- **Vraag je af of deze bibliotheek iets voor jou is?** [Waarom michi-vz](/nl/guide/why) - wat
  écht anders is, en waar we eerlijk zijn over de beperkingen.
- **Debug wat je bouwt** met het [DevTools-paneel](/nl/guide/devtools) - sizing, scales,
  statusverschillen, en een toegankelijkheidsaudit voor elke grafiek op de pagina.
- **Laat grafieken voorspellen en zichzelf uitleggen** met [Insights](/nl/guide/insights) -
  forecasts, anomalieën, narratie, allemaal in de browser met de
  [uitgeschreven methodologie](/nl/guide/insights#methodology---the-exact-logic-behind-every-insight).
- **Koppel grafieken aan een AI-assistent** via de [LLM-context](/nl/guide/llm-context) en MCP.
