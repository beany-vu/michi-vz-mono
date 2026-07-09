---
title: Bellendiagram
description: "Bellendiagram met areaal-getrouwe grootte en een zwaartekracht-layout; elke bel kan opgesplitst worden in een gerealiseerde kern en een onbenutte ring, waardoor grootte en voortgang samen zichtbaar worden."
---
# Bellendiagram

<span class="vp-badge tip">Samenstelling</span>

"Hoe groot is elk onderdeel, en hoeveel ervan is al gerealiseerd?" Een bellenwolk beantwoordt de vraag naar omvang in één oogopslag: elke cirkel heeft een grootte op basis van waarde (**oppervlakte**, niet straal), en een zwaartekrachtsimulatie trekt ze samen tot een net cluster, zodat de grote bellen duidelijk domineren. Net als bij de [treemap](/nl/charts/treemap) kan elke bel een **tweedelige splitsing** dragen - een volle gerealiseerde kern binnen een lichtere onbenutte ring - zodat je grootte en voortgang samen afleest.

<ChartDemo chart="bubble-chart" :legend="[]" />

Geen splitsing nodig? Laat `partial` weg voor een nette proportionele wolk, één kleur per categorie:

<ChartDemo chart="bubble-chart" :index="1" :legend="[]" />

> Het cluster wordt opgebouwd met [d3-force](https://github.com/d3/d3-force): bellen vallen richting het midden (`gravity`) en duwen elkaar uit elkaar zodat ze nooit overlappen (botsing). De simulatie wordt **synchroon** afgerond, zodat SVG en canvas exact dezelfde, reproduceerbare layout renderen.

## Wanneer kies je deze

- **Omvang in één oogopslag.** Producten, markten, zoekwoorden als een wolk met verschillende groottes - wanneer "welke zijn groot?" meer telt dan een exacte rangschikking, geeft het cluster meteen antwoord.
- **Kansenkaarten.** Met de splitsing is een grote bel met een dunne gerealiseerde kern geld dat op tafel ligt - de blik waarmee je een portefeuille op onbenut potentieel scant.
- **Moet positie iets betekenen** (twee numerieke assen, correlatie), dan is een [spreidingsdiagram](/nl/charts/scatter) de juiste keuze; de bellenwolk ruilt positie in voor compactheid.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
// Another nod to CERN: one simulated collision event's worth of reconstructed
// energy clusters, one bubble per cluster, area = energy. A falling power-law
// spectrum means a few big deposits over thousands of soft ones - the gravity
// packing turns the event's whole energy budget into one readable cloud.
function makeBubble() {
  const subdetectors = [
    { label: "Tracker", color: "#457b9d", share: 0.38 },
    { label: "ECAL", color: "#2a9d8f", share: 0.3 },
    { label: "HCAL", color: "#e07b39", share: 0.24 },
    { label: "Muon chambers", color: "#9b5de5", share: 0.08 },
  ];
  const dataSet = [];
  let i = 0;
  for (const s of subdetectors) {
    const n = Math.round(1500 * s.share);
    for (let k = 0; k < n; k++) {
      dataSet.push({
        label: `${s.label} #${i++}`,
        // Falling energy spectrum: many soft clusters, a handful of hard ones.
        value: 2 + 200 * Math.pow(Math.random(), 3),
        color: s.color,
      });
    }
  }
  return {
    title: "One simulated collision event: energy clusters, bubble area = energy (GeV)",
    dataSet, gravity: 0.06, padding: 0.5,
    // Chunked async settle + fewer ticks: the multi-second force layout runs in
    // ~12ms slices behind the chart's loading overlay instead of freezing the page.
    layoutMode: "async", settleTicks: 200,
  };
}
</script>

BubbleChart heeft een optionele `renderer="webgpu"` die de bellenwolk tekent als GPU-instanced cirkels, terwijl labels en tooltips op de SVG-laag blijven. Dit is capability-gated: in een browser zonder WebGPU schakelt het automatisch terug naar canvas, en `getContext().renderer` meldt welke renderer daadwerkelijk heeft getekend.

Net als de spreidingsdiagram-pagina leent de demo hieronder van de deeltjesfysica: ~1.500 gereconstrueerde energieclusters uit één gesimuleerd botsingsevent, één bel per cluster, gekleurd per subdetector. Het handjevol harde deposities torent boven duizenden zachte uit, en de zwaartekracht-packing maakt van het hele energiebudget van het event één leesbare wolk.

<WebgpuHeavyDemo element="michi-vz-bubble-chart" :make="makeBubble" :legend="[
    { label: 'Tracker', color: '#457b9d' },
    { label: 'ECAL', color: '#2a9d8f' },
    { label: 'HCAL', color: '#e07b39' },
    { label: 'Muon chambers', color: '#9b5de5' },
  ]" caption="~1.500 gesimuleerde energieclusters" />

## Speel door de jaren heen

Geef elke bel een `date` en zet `timeline` aan: de bellenwolk wordt een verhaal per jaar, met een eigen afspeelknop en scrubber die telkens de groottes van één periode toont. Standaard uit - zonder opt-in verandert er niets.

<TimelinePlayDemo chart="bubble-chart" hint="Druk op de afspeelknop onder de grafiek: de data stapt door de jaren, één momentopname per keer. Sleep de scrubber om naar een jaar te springen." />

::: code-group

```tsx [React]
const ref = useRef<BubbleChartHandle>(null);

<BubbleChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(year) / stepForward()
```

```vue [Vue]
<BubbleChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:bubbleChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyBubbleChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-bubble-chart id="c"></michi-vz-bubble-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(year)
</script>
```

:::

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij mounten, `showControl: false` verbergt de ingebouwde balk.
- Waarden glijden standaard tussen periodes (`interpolate`); stem de beweging af met `tweenMs` en `easing`, of zet `interpolate: false` voor harde overgangen. Met reduced motion is de overgang altijd hard.
- De headless controller is altijd beschikbaar: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor eigen UI.
- Een `filter` (top-N, sortering) blijft binnen elke periode gelden, dus blijven per jaar alleen de top 5 bellen over.
- Bellen zonder `date` blijven in elke periode zichtbaar.

## Gebruik

::: code-group

```tsx [React]
import { BubbleChart } from "@michi-vz/react";

export default () => <BubbleChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { BubbleChart } from "@michi-vz/vue";
</script>

<template>
  <BubbleChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { bubbleChart } from "@michi-vz/svelte";
</script>

<div use:bubbleChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyBubbleChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-bubble-chart #c></michi-vz-bubble-chart>
applyBubbleChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-bubble-chart id="c"></michi-vz-bubble-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, splitLabels, …
</script>
```

```ts [Vanilla JS]
import { mountBubbleChart } from "@michi-vz/core";

const chart = mountBubbleChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Datavorm

Elk `dataSet`-item is één bel: een `label`, een `value` (oppervlakte), een optionele `partial` (het gerealiseerde subdeel) en een optionele `color`.

```ts
const props = {
  splitLabels: ["Realized", "Untapped"],
  showLegend: true,
  gravity: 0.09, // higher = tighter cluster
  dataSet: [
    { label: "Germany", value: 120, partial: 64 }, // 53% realized
    { label: "United States", value: 152, partial: 88 },
    { label: "China", value: 168, partial: 51 },
  ],
};
```

## Zwaartekracht & de splitsing

`gravity` bepaalt hoe sterk bellen naar het midden worden getrokken (hoger = strakker), `padding` de ruimte ertussen, en `fillRatio` hoeveel van het plot de wolk vult. De splitsing werkt hetzelfde als bij de treemap: `partial` snijdt een areaal-getrouwe gerealiseerde kern uit (straal `r·√(partial/value)`), en de rest oogt als een lichtere tint van dezelfde kleurtoon - een volle kleur onder een witte sluier, zodat het werkt op zowel lichte **als** donkere achtergronden. Benoem de onderdelen met `splitLabels`.

## API

Props zijn getypeerd als `BubbleChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of experimenteel `"webgpu"`), `highlightItems`, `disabledItems` en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context) terug. Volledige referentie: [Bubble API](/nl/api/bubble).
