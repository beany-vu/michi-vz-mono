---
title: Vlakdiagram
description: "Gestapeld vlakdiagram voor samenstelling in de tijd: bekijk hoe het aandeel van elke categorie in het geheel groeit of krimpt terwijl het totaal stijgt."
---
# Vlakdiagram

<span class="vp-badge tip">Samenstelling</span>

Het totaal groeit, maar welk deel is daarvan de drijvende kracht? Stapel je categorieën en bekijk hoe het aandeel van elk ervan in het geheel in de tijd groeit of krimpt, zodat een stijgend totaal en een verschuivende mix tegelijk hun verhaal vertellen.

<ChartDemo chart="area-chart" />

> De grafiek hierboven gebruikt in elk framework dezelfde **engine** - alleen de integratiecode hieronder verschilt.

## Wanneer kies je deze

- **Samenstelling in de tijd, wanneer het totaal ook telt.** De gestapelde banden tonen het aandeel van elke categorie terwijl de bovenrand de som traceert - een stijgend totaal en een verschuivende mix in één beeld.
- **"De mix verandert"-verhalen.** Een segment dat dunner wordt terwijl het totaal groeit, is een boodschap die geen spreadsheet zo snel overbrengt - ideaal voor overzichten van omzet per product of verkeer per kanaal.
- **Wisselen de rangordes, wissel dan van grafiek.** Als het verhaal is wie wie inhaalde, maakt het [lintdiagram](/nl/charts/ribbon) die wissels expliciet; voor één enkel moment in de tijd volstaat een [cirkeldiagram](/nl/charts/pie).

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeArea() {
  const keys = ["Coal", "Natural gas", "Nuclear", "Wind", "Solar"];
  const base = { Coal: 1500, "Natural gas": 1100, Nuclear: 800, Wind: 180, Solar: 30 };
  const drift = { Coal: -0.6, "Natural gas": 0.3, Nuclear: 0.02, Wind: 0.4, Solar: 0.5 };
  const series = [];
  const rows = 1500;
  for (let i = 0; i < rows; i++) {
    const row = { date: i };
    for (const k of keys) {
      const trend = base[k] + drift[k] * i;
      const noise = (Math.sin(i * 0.37 + k.length) + Math.random() - 0.5) * base[k] * 0.03;
      row[k] = Math.max(0, trend + noise);
    }
    series.push(row);
  }
  return { series, keys, xAxisDataType: "number" };
}

function makeNoDataArea() {
  const keys = ["Raw", "Semi-processed", "Processed"];
  // 24 months, but 2022-04/05/09 and 2023-02/03 are MISSING from the data.
  const present = [
    "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
    "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
    "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
  ];
  const series = present.map((date, i) => ({
    date,
    Raw: 20 + Math.round(Math.sin(i / 3) * 8),
    "Semi-processed": 30 + Math.round(Math.cos(i / 2) * 6),
    Processed: 50 + Math.round(Math.sin(i / 4) * 5),
  }));
  return {
    series,
    keys,
    xAxisDataType: "date_monthly",
    colorsMapping: { Raw: "#2c6fbb", "Semi-processed": "#e07b39", Processed: "#3aa757" },
    xAxisFormat: (d) => {
      const dt = new Date(Number(d));
      return (
        dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) +
        " " +
        String(dt.getUTCFullYear()).slice(2)
      );
    },
    noDataTickTooltip: () => "No data reported for this month",
  };
}
</script>

AreaChart heeft een optionele `renderer="webgpu"` die de gestapelde banden op de GPU tekent, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas.

<WebgpuHeavyDemo legend element="michi-vz-area-chart" :make="makeArea" caption="~7,500 points" />

## Doorlopende tijdlijn & ontbrekende-data-ticks

De x-as behoudt altijd de **eerste en laatste periode** en kantelt/verdunt overvolle labels tot ~5. Schakel `fillPeriodTicks` in om voor **elke** maand in het bereik een tick te tekenen; maanden zonder data worden **vervaagd** weergegeven met een "geen data"-tooltip bij hover. Schakel het in of uit:

<NoDataTicksDemo element="michi-vz-area-chart" :make="makeNoDataArea" />

Pas dit aan via `noDataTickTooltip(epochMs)` (tooltiptekst) en `noDataTickColor` (of de CSS-variabele `--michi-vz-tick-nodata`).

::: code-group

```tsx [React]
<AreaChart
  {...props}
  xAxisDataType="date_monthly"
  fillPeriodTicks
  noDataTickTooltip={() => "No data reported for this month"}
  noDataTickColor="#c0392b"
/>
```

```vue [Vue]
<AreaChart :options="{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, fillPeriodTicks: true, noDataTickTooltip: () => 'No data' }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  fillPeriodTicks: true,
  noDataTickTooltip: () => "No data",
});
```

```html [Web component]
<michi-vz-area-chart id="c" fill-period-ticks no-data-tick-color="#c0392b"></michi-vz-area-chart>
<script>
  document.getElementById("c").noDataTickTooltip = () => "No data reported";
</script>
```

:::

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="area-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<AreaChartHandle>(null);

<AreaChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
```

```vue [Vue]
<AreaChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() speelt de animatie opnieuw af
</script>
```

:::

- `durationMs` en `easing` ("linear", "easeOutQuad", "easeInOutCubic", of een eigen `(t) => t`-functie) bepalen het tempo.
- `autoplay: false` rendert de grafiek volledig getekend; roep `replay()` aan (React-ref-handle, webcomponent-methode of de core-instantie) om de animatie op aanvraag te starten. `replayOnUpdate: true` herhaalt de animatie bij elke datawijziging.
- Respecteert `prefers-reduced-motion`: de grafiek verschijnt dan meteen volledig getekend.

## Speel door de jaren heen

De data beslaat al meerdere jaren, dus er is niets te taggen. Zet `timeline` aan: de eigen afspeelknop en scrubber van de grafiek stappen door die jaren - bij elke stap tekenen de gestapelde banden zich alleen tot het actieve jaar, en tijdens het afspelen lopen ze vloeiend verder door. Scrub je terug, dan trekken de banden zich weer terug. Hoveren toont alleen wat al echt getekend is. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="area-chart" hint="Druk op de afspeelknop onder de grafiek: de grafiek tekent zich verder door tot elk jaar terwijl hij speelt. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<AreaChartHandle>(null);

<AreaChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<AreaChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:areaChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyAreaChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij mounten, `showControl: false` verbergt de ingebouwde balk.
- De headless controller is altijd beschikbaar: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor eigen UI.
- Waarden glijden standaard tussen jaren (`interpolate`); zet `interpolate: false` voor harde overgangen. Met reduced motion is de overgang altijd hard.
- `timeline` wint het van `progressiveDraw` wanneer beide op dezelfde grafiek staan.

## Gebruik

::: code-group

```tsx [React]
import { AreaChart } from "@michi-vz/react";

export default () => <AreaChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { AreaChart } from "@michi-vz/vue";
</script>

<template>
  <AreaChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { areaChart } from "@michi-vz/svelte";
</script>

<div use:areaChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyAreaChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-area-chart #c></michi-vz-area-chart>
applyAreaChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-area-chart id="c"></michi-vz-area-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet/series, title, …
</script>
```

```ts [Vanilla JS]
import { mountAreaChart } from "@michi-vz/core";

const chart = mountAreaChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## API

Props zijn getypeerd als `AreaChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
