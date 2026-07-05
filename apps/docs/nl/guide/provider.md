# Provider & gedeelde status

`@michi-vz/react` levert een React context-laag - `MichiVzProvider` + `useChartContext` - waarmee een boom van grafieken kleuren, highlights, en weergavestatus kan delen zonder prop-drilling.

## MichiVzProvider

Omwikkel een subtree om status te delen over elke grafiek erbinnen:

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

Alle props zijn optioneel. De provider voegt ze samen in elke grafiek in de boom via `resolveEffectiveProps`.

### Props

| Prop | Type | Doel |
|---|---|---|
| `colorsMapping` | `Record<string, string>` | Label → hex-kleur. Toegepast op marks en gelezen door de canvas-probe. |
| `highlightItems` | `string[]` | Labels die op volle dekking getekend worden; andere worden gedimd. |
| `disabledItems` | `string[]` | Labels die volledig verborgen worden in de grafiek. |
| `hiddenItems` | `string[]` | Labels die uitgesloten worden van rendering (complement van `visibleItems`). |
| `visibleItems` | `string[]` | Expliciete allow-list; labels erbuiten worden verborgen. |
| `fontFamily` | `string` | Zet `--michi-vz-font-family` zodat SVG-tekst en canvas-tekst overeenkomen. Het lettertype moet al door de pagina geladen zijn. |
| `singlePointLine` | `boolean \| SinglePointLineConfig` | Hoe een serie met één datapunt gerenderd wordt (stip, korte lijn, enz.). |
| `categoryMetadata` | `Record<string, { color?: string; label?: string }>` | Overrides voor kleur/label per categorie. |
| `colorsBasedMapping` | `Record<string, string>` | Secundair kleurcontract (bijv. voor area-fills vs. strokes). |
| `locale` | `string` | BCP-47-locale doorgegeven aan asformatters (bijv. `"fr"`, `"ar"`). |
| `dir` | `"ltr" \| "rtl"` | Tekstrichting. `"rtl"` spiegelt horizontale assen. |

Onder de motorkap creëert `MichiVzProvider` een `MichiVzStore` (via `createMichiVzStore` uit `@michi-vz/core`) bij de eerste render, en synchroniseert opnieuw wanneer props veranderen. De store is framework-onafhankelijk; een toekomstige web-component-coördinator kan dezelfde store-instantie delen.

## useChartContext

Lees de huidige gedeelde status vanaf overal binnen de provider-boom:

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

`useChartContext` abonneert via `useSyncExternalStore` - updates zijn tear-free onder concurrent rendering. Wanneer er geen `MichiVzProvider` in de boom staat, geeft het veilige lege standaardwaarden terug (`colorsMapping: {}`, `highlightItems: []`, enz.), zodat je nooit `undefined` leest.

## Het legendData-kleurcontract

Voor **canvas-grafieken** kan de engine CSS-variabelen niet direct lezen tijdens het tekenen - het gebruikt in plaats daarvan een `getComputedStyle`-probe. Wanneer een grafiek gerenderd wordt met `skipColorMappingDispatch` (de consument bestuurt de kleuren, niet de engine), ziet de workflow voor kleurautoriteit er zo uit:

1. De engine vult `ChartContext.legendData` na het verwerken van data. Elke entry is een `LegendItem`:

   ```ts
   type LegendItem = {
     label: string;        // human label (e.g. "Sub-Saharan Africa")
     color: string;        // resolved colour at render time
     order: number;        // appearance order in the series
     disabled?: boolean;
     dataLabelSafe: string; // sanitizeForClassName(label) → "sub-saharan-africa"
   };
   ```

2. Een kleurautoriteit bij de consument leest `legendData` uit `onChartDataProcessed(ctx)` en geeft CSS af die het `data-label-safe`-attribuut target:

   ```css
   /* emitted by your colour authority into a <style> block */
   .line[data-label-safe="sub-saharan-africa"] { stroke: #4a90d9; }
   .line[data-label-safe="north-africa"]       { stroke: #e8a838; }
   ```

3. Bij de volgende tekenbeurt roept de canvas-probe `getComputedStyle` aan op het bijpassende SVG-element en leest de kleur - geen probleem met opacity/transparante balken.

Het veld `dataLabelSafe` wordt geproduceerd door `sanitizeForClassName` uit `@michi-vz/core` en is stabiel over renders heen voor dezelfde labelstring.

::: tip Checklist voor canvas-kleuren
Voor canvas-grafieken (`renderer="canvas"` + `skipColorMappingDispatch`) heb je **beide** nodig:

- Een `<style>{cssFromLegendData}</style>`-blok in je JSX - zonder dit rendert elke bar transparant.
- Onvoorwaardelijke mount + key-gedreven remount (`key={chartKey}`) in plaats van `{ready && <Chart />}` - voorwaardelijke mount verhindert dat `isNodataComponent` op lege data afgaat.
:::

## Migreren vanaf het standalone `michi-vz`-pakket

De monorepo-pakketten (`@michi-vz/core` + `@michi-vz/react`) zijn een drop-in superset van het legacy `michi-vz`-npm-pakket. De meeste wijzigingen zijn additief; de tabel hieronder behandelt de delen die verschillen.

### Importpaden

| Legacy `michi-vz` | Mono `@michi-vz/react` |
|---|---|
| `import { MichiVzProvider } from "michi-vz"` | `import { MichiVzProvider } from "@michi-vz/react"` |
| `import { useChartContext } from "michi-vz"` | `import { useChartContext } from "@michi-vz/react"` |
| `import { ScatterPlotChart } from "michi-vz"` | `import { ScatterPlotChart } from "@michi-vz/react"` (alias behouden) |

### ScatterPlotChart-alias

De grafiek is in de mono hernoemd naar `ScatterChart`. `ScatterPlotChart`, `ScatterPlotChartProps`, en `ScatterPlotChartHandle` worden allemaal opnieuw geëxporteerd als aliassen, zodat bestaande imports zonder wijziging compileren.

### legendData

In het legacy-pakket leefde `legendData` op `ChartMetadata` en was het alleen beschikbaar op een select aantal grafieken. In de mono is het een first-class veld op `ChartContext` (teruggegeven door `chart.getContext()` en doorgegeven aan `onChartDataProcessed`) en wordt het vandaag gevuld door `LineChart`, met andere charttypes die volgen.

### Geen CSS-import nodig

Het legacy-pakket vereiste een aparte `import "michi-vz/dist/style.css"`. De mono injecteert automatisch layout/overlay-CSS via `ensureStyles()` bij het mounten - verwijder de import als je die hebt. Kleur-CSS (fill/stroke) blijft, zoals voorheen, jouw contract.

### Provider / useChartContext-pariteit

`MichiVzProvider` accepteert exact dezelfde kernprops als voorheen (`colorsMapping`, `highlightItems`, `disabledItems`, `fontFamily`, `singlePointLine`), plus de nieuwe toevoegingen (`hiddenItems`, `visibleItems`, `categoryMetadata`, `colorsBasedMapping`, `locale`, `dir`). `useChartContext` geeft een superset van de legacy `MichiVzState` terug - bestaande destructures zijn veilig.
