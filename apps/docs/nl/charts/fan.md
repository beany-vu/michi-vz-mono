---
title: Waaierdiagram
description: "Waaierdiagram voor voorspellingen met onzekerheid: een doorgetrokken historielijn, een gestippeld meest-waarschijnlijk pad en betrouwbaarheidsbanden die breder worden richting de toekomst."
---
# Waaierdiagram

<span class="vp-badge tip">Trends</span> <span class="vp-badge tip">Voorspelling</span>

**"Wat wordt de omzet volgend kwartaal?"** Het eerlijke antwoord is nooit één getal - het is een *bereik*, en dat bereik is precies waar het om draait. Geef een leidinggevende één getal en je gokt; geef diegene deze waaier en je vertelt de waarheid over het risico. De doorgetrokken lijn is wat al gebeurd is, de gestippelde lijn is het ene meest-waarschijnlijke pad, en de gearceerde banden tonen hoe zeker de voorspelling is - ze worden breder naarmate ze verder de toekomst in reiken, want hoe verder vooruit je kijkt, hoe minder iemand kan weten.

<ChartDemo chart="fan-chart" :height="380" />

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeFan() {
  const n = 1500;
  const dataSet = [];
  const bands = [];
  let level = 100;
  const cutoff = Math.round(n * 0.85);
  for (let i = 0; i < n; i++) {
    level += (Math.random() - 0.48) * 2 + Math.sin(i / 40) * 0.6;
    const certainty = i < cutoff;
    dataSet.push({ date: i, value: Math.round(level * 100) / 100, certainty });
    if (!certainty) {
      const h = i - cutoff + 1;
      const spread = Math.sqrt(h) * 1.8;
      bands.push({ date: i, valueMin: Math.round((level - spread) * 100) / 100, valueMax: Math.round((level + spread) * 100) / 100, valueMedium: Math.round(level * 100) / 100 });
    } else {
      bands.push({ date: i, valueMin: level, valueMax: level, valueMedium: level });
    }
  }
  return {
    dataSet: [
      {
        label: "Revenue",
        color: "#2563eb",
        series: dataSet,
        bands: [{ level: 0.95, series: bands }],
      },
    ],
    xAxisDataType: "number",
    fillOpacity: 0.22,
  };
}
</script>

De optionele `renderer="webgpu"` van FanChart tekent de lijn- en band-marks op de GPU, terwijl assen, labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

<WebgpuHeavyDemo element="michi-vz-fan-chart" :make="makeFan" caption="~1,500 points" />

## Hoe je het leest

- **Doorgetrokken lijn - historie.** De werkelijke cijfers die je al hebt.
- **Gestippelde lijn - het meest-waarschijnlijke pad** (de voorspelde *mediaan*): één beste inschatting, nooit het hele verhaal.
- **Geneste banden - betrouwbaarheid.** Van binnen naar buiten = **50% / 80% / 95%**. De werkelijke waarde zou ongeveer **19 van de 20 keer** binnen de 95%-band moeten vallen. Je plant tegen de band, niet tegen de lijn.
- **Waarom het uitwaaiert.** Volgende maand is redelijk te overzien; een jaar verder niet. Onzekerheid stapelt zich op met de afstand, dus de banden worden breder.

> Lees je **worstcasescenario** af aan de onderkant van de buitenste band en je **bestcasescenario** aan de bovenkant. De waaier is je basis-/opwaarts-/neerwaarts-scenario in één enkel beeld - geen apart scenariotabblad nodig.

## De wiskunde, in gewone taal

Je hebt de vergelijkingen niet nodig om de grafiek te gebruiken, maar dit is wat er onder de motorkap zit - en waarom je het kunt vertrouwen:

- **De mediaan** komt van **Holt-Winters** exponentiële afvlakking. Het volgt twee bewegende grootheden, het huidige **niveau** en de **trend** (helling), en rolt ze vooruit; als de reeks een terugkerend seizoenspatroon heeft, volgt het dat ook. (Liever een rechte lijn? `method: "linear"` past in plaats daarvan een gewone kleinste-kwadratenregressie toe.)
  > `ℓₜ = α·yₜ + (1−α)(ℓₜ₋₁ + bₜ₋₁)` · `bₜ = β(ℓₜ − ℓₜ₋₁) + (1−β)bₜ₋₁` · `ŷₜ₊ₕ = ℓₜ + h·bₜ`
- **De banden** komen uit de *eigen historische fouten* van het model. Het meet hoezeer de gefitte waarden misten (de residuspreiding `σ`) en verbreedt het interval als `ŷ ± z·σ·√h` - `z = 1.96` voor 95%, en de `√h` is precies waarom de waaier zich opent met de horizon `h`.
- **Kun je het vertrouwen?** Een **backtest** verbergt de laatste paar echte punten, voorspelt ze opnieuw en rapporteert de fout (`MAPE`, `RMSE`). Zo krijg je een eerlijkheidsscore *voordat* je op het getal wedt, niet erna.

Dit alles draait **in de browser** - geen data-science-backend, geen serverronde. (Power BI voorspelt, ter vergelijking, alleen op een lijndiagram en stopt precies waar echte modellering begint.)

> Bouw de data in één aanroep met `forecastFan()` uit [`@michi-vz/insights/forecast`](/nl/guide/insights), of geef het `series` (historie + mediaan met `certainty:false`) en geneste `bands` mee.

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten, waarbij de elementen na elkaar verschijnen voordat ze op hun plek vallen. Standaard uit - een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="fan-chart" replay-label="Animatie opnieuw afspelen" hint="Elke lijn groeit van het eerste naar het laatste jaar; het label volgt de punt en komt tot stilstand bij het lijneinde. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject verfijnt het gedrag:

::: code-group

```tsx [React]
const ref = useRef<FanChartHandle>(null);

<FanChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
```

```vue [Vue]
<FanChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:fanChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyFanChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
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

De data beslaat al meerdere jaren, dus er is niets te taggen. Zet `timeline` aan: de eigen afspeelknop en scrubber van de grafiek stappen door die jaren - bij elke stap tekenen de historielijn, de voorspelde mediaan en de betrouwbaarheidsbanden zich alleen tot het actieve jaar, en tijdens het afspelen lopen ze vloeiend verder door. Scrub je terug, dan trekt alles zich weer terug. Hoveren toont alleen wat al echt getekend is. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="fan-chart" hint="Druk op de afspeelknop onder de grafiek: de grafiek tekent zich verder door tot elk jaar terwijl hij speelt. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<FanChartHandle>(null);

<FanChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<FanChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:fanChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyFanChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
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

```ts [Insights (one call)]
import { mountFanChart } from "@michi-vz/core";
import { forecastFan } from "@michi-vz/insights/forecast";

// history = DataPoint[] of actuals; build the fan (median + 50/80/95% bands)
const item = forecastFan(history, { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
const chart = mountFanChart(el, { dataSet: [item], xAxisDataType: "date_annual" });
```

```ts [Vanilla JS]
import { mountFanChart } from "@michi-vz/core";

const chart = mountFanChart(el, props); // props.dataSet = FanDataItem[]
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fan-chart id="c"></michi-vz-fan-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet (series + bands), title, …
</script>
```

:::

## Datavorm

Een `FanDataItem` is een vertrouwde lijnreeks plus geneste banden:

```ts
interface FanDataItem {
  label: string;
  color?: string;
  series: DataPoint[];   // history (certainty:true) then forecast median (certainty:false → dashed)
  bands: { level: number; series: RangeDataPoint[] }[]; // drawn widest-first, graduated opacity
}
```

## API

Props zijn getypeerd als `FanChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) en spiegelen `LineChartProps` (`width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer`, `highlightItems`, `disabledItems`, `fillOpacity` en de `on*`-callbacks). `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug.
