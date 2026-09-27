---
title: Fontein (Jet d'Eau) API
---

# Fontein (Jet d'Eau) API

Eén getal per kolom (de grote stip), het echte bereik eromheen (de fontein, van `low` tot `high`) en de metingen zelf (de kleine stippen), allemaal op één y-as. Categorische x = momentopname; temporele of numerieke x = trend. Zie de **[Fontein-demo](/nl/charts/fountain)** en de [leeswijzer](/nl/charts/fountain#how-to-read-it).

## Import

::: code-group

```ts [Web Component]
import "@michi-vz/wc/fountain-chart";
// <michi-vz-fountain-chart> is nu gedefinieerd
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
```

```ts [React]
import { FountainChart } from "@michi-vz/react/fountain-chart";
```

```ts [Vue]
import { FountainChart } from "@michi-vz/vue/fountain-chart";
```

```ts [Svelte]
import { fountainChart } from "@michi-vz/svelte/fountain-chart";
```

```ts [Angular]
import { bindChart, applyFountainChartProps } from "@michi-vz/angular/fountain-chart";
// heeft CUSTOM_ELEMENTS_SCHEMA nodig op de component die <michi-vz-fountain-chart> bevat
```

:::

## Props

<PropsTable chart="fountain-chart" />

::: tip Twee modi, één datavorm
Stel `xAxisDataType: "band"` in (of laat het weg) voor **momentopname-modus**: één kolom per `label`. Geef een temporele of numerieke `xAxisDataType` plus een `date` bij elk item voor **trendmodus**: de jets staan langs de x-as, en bij één reeks verbindt een stippellijn de grote stippen. Een item met `forecast: true` krijgt een gestippelde steel en rand, een lichtere vulling en een holle grote stip, zonder kleine stippen.
:::

### Nieuw in core 1.29 {#new-props}

| Prop | Type | Standaard | Wat hij doet |
| --- | --- | --- | --- |
| `showRange` | `boolean` | `true` | Tekent de fontein, het bereik `[low, high]`. `false` tekent alleen de steel en de grote stip; de kleine stippen verdwijnen ook. |
| `showSamples` | `boolean` | `true` | Tekent een kleine stip per meting, als items `samples` hebben. |
| `showValueLabels` | `boolean` | `true` | Zet onder elk x-label: vet "usual 30", "&lt;laag woord&gt; 22", "&lt;hoog woord&gt; 55", "only N &lt;sampleWord&gt;" onder 10 metingen, en per referentielijn met `goodSide` een vet "17 of 20" plus de `countLabel`. |
| `drift` | `boolean` | `false` | De Genève-look: de top van elke fontein buigt dezelfde kant op. Hij draagt geen data. |
| `yAxisTitle` | `string` | geen | Titel die gedraaid naast de y-as staat, bijvoorbeeld "minuten (hoger = langzamer)". |
| `endLabels` | `[string, string]` | `["lowest", "highest"]` | De woorden voor het lage en het hoge uiteinde in de labels en de tooltip. |
| `referenceLines` | `FountainReferenceLine[]` | geen | Stippellijnen in de waarschuwingskleur van het thema, met het label aan het rechtereinde. Zie [hieronder](#reference-line). |
| `labels` | `FountainLabels` | Engels | De andere woorden van de grafiek, om te vertalen. Zie [hieronder](#labels). |
| `readingGuide` | `boolean \| string` | `false` | Een leeswijzer onder de grafiek, afgebroken tussen twee onderdelen (bij een « · ») als hij niet op één regel past. `true` toont de standaardtekst, die alleen noemt wat de grafiek tekent (niets over kleine stippen zonder kleine stippen, geen `Tall fountain` zonder fontein); een string vervangt hem. |
| `sampleWord` | `string` | `"measurements"` | Het zelfstandig naamwoord in het meervoud voor de metingen ("dagen", "bestellingen"). Bewust meervoud: er is geen automatisch meervoud. |

`showTrendLine` heeft nu een standaard per modus: `true` in trendmodus met één reeks; `false` met meerdere reeksen, waar één lijn heen en weer tussen de reeksen zou springen, en in momentopname-modus (zet hem op `true` om een geordende rij categorieën te verbinden).

### Data-item: `FountainDataItem` {#data-item}

| Veld | Type | Wat het is |
| --- | --- | --- |
| `label` | `string` | De kolom (momentopname) of de naam van de reeks (trend). Bepaalt de kleur en de `data-label`-hook. |
| `code` | `string` | Optionele vaste id die in de context komt; wordt niet getoond. |
| `value` | `number` | De grote stip. Optioneel als er `samples` zijn: dan hun mediaan. Zonder eindige waarde en zonder metingen wordt de jet overgeslagen. |
| `low` | `number` | De onderkant van de fontein. |
| `high` | `number` | De top van de fontein. |
| `spread` | `number` | Kortere vorm voor een gelijk bereik: `low = value - spread`, `high = value + spread`. |
| `samples` | `number[]` | De echte metingen, elk een kleine stip op de precieze hoogte binnen de fontein. |
| `forecast` | `boolean` | Een voorspelde periode: gestippelde steel en rand, lichtere vulling, holle grote stip, geen kleine stippen en geen telling. |
| `color` | `string` | Kleur per item. Volgorde per jet: `colorsMapping[label]`, dan `color`, dan de paletkleur van het label. |
| `date` | `number \| string` | De x-positie in trendmodus; een item zonder bruikbare datum wordt daar overgeslagen. |
| `predicted` | `boolean` | Verouderd: gebruik `forecast`. Werkt nog. |
| `certainty` | `boolean` | Verouderd: `certainty: false` is `forecast: true`. Werkt nog. |
| `density` | `number` | Verouderd en genegeerd (een waarschuwing `ignored-option`). |
| `lean` | `number` | Verouderd en genegeerd (een waarschuwing `ignored-option`). |

Het bereik komt van de eerste die er is: `low`/`high`, dan `spread`, dan de laagste en hoogste meting; zonder een van die drie heeft de jet geen fontein. Een ontbrekend uiteinde volgt dezelfde volgorde. Metingen buiten een opgegeven bereik, en een waarde buiten het bereik, maken het bereik groter en sturen een waarschuwing. Negatieve waarden mogen: het y-domein bevat 0 en elke `low`, en de steel loopt vanaf de basislijn naar beneden.

### Referentielijn: `FountainReferenceLine` {#reference-line}

| Veld | Type | Wat het is |
| --- | --- | --- |
| `value` | `number` | Waar de lijn ligt, in y-eenheden. Altijd binnen het automatische y-domein. |
| `label` | `string` | Staat aan het rechtereinde van de lijn (afgebroken als het moet; de grafiek houdt rechts ruimte vrij). |
| `goodSide` | `"below" \| "above"` | Welke kant goed is. Als hij is ingesteld, telt elke jet met metingen ze: "below" telt de metingen op of onder de lijn, "above" die op of boven de lijn. |
| `countLabel` | `string` | Woorden na de telling, bijvoorbeeld "op tijd", "geslaagd". Standaard "below the line" of "above the line". |

### Woorden: `FountainLabels` {#labels}

| Veld | Standaard | Waar het staat |
| --- | --- | --- |
| `usual` | `"usual"` | Voor de waarde van de grote stip: "usual 30". |
| `of` | `"of"` | Tussen een telling en het totaal: "17 of 20". |
| `only` | `"only"` | Voor een klein aantal metingen: "only 5 days". |
| `forecast` | `"forecast"` | Achter het x-label van een voorspelde jet en in de tooltip: "Fri (forecast)". |

## Themavariabelen {#theme}

De grafiek leest deze CSS-variabelen van zijn host-element (of een voorouder), in elke renderer:

| Variabele | Standaard | Wat het kleurt |
| --- | --- | --- |
| `--michi-vz-surface` | `#fff` | De achtergrond waarop de grafiek staat: de dunne rand om elke kleine stip en de rand om een grote stip, die ze loshouden van wat eronder ligt. Zet hem bij een donker thema op de achtergrondkleur van je pagina. |
| `--michi-vz-attention` | `#c0392b` | De referentielijnen, hun labels en de tellingen onder de kolommen. |
| `--michi-vz-lake` | `#9cc3dd` | De band bij 0 (het meer). |
| `--michi-vz-ink` | `currentColor` | De trendlijn, de vette regel « usual 30 » en de titel. |
| `--michi-vz-muted` | `#666` | De andere waardelabels, de titel van de y-as, de leeswijzer en de aslabels. |
| `--michi-vz-grid` | `lightgray` | Het dunne lijntje boven de leeswijzer. |
| `--michi-vz-font-family`, `--michi-vz-font-size` | geërfd, `12px` | Elk woord dat de grafiek toont. |

De holle grote stip van een voorspelling is een ring waarbinnen niets wordt getekend (wat eronder ligt, wordt weggeknipt), dus hij blijft hol op elke achtergrond, zonder variabele.

```css
/* De grafieken op een donkere pagina */
.dark .charts {
  --michi-vz-surface: #1b1b1f;
  --michi-vz-ink: #e3e3e3;
  --michi-vz-muted: #a0a0a0;
}
```

## Gebeurtenissen

De webcomponent verzendt deze bubbelende `CustomEvent`s (de engine biedt hetzelfde via de `on*`-callbacks in de tabel hierboven):

| Gebeurtenis | Detail | Treedt op wanneer |
| --- | --- | --- |
| `michi-vz:highlight` | `string[]` | de jet onder de muis verandert (het label) |
| `michi-vz:colormapping` | `Record<string, string>` | er een kleurtoewijzing wordt gegenereerd |
| `michi-vz:dataprocessed` | `ChartContext` | gegevens worden (opnieuw) verwerkt |
| `michi-vz:datawarning` | `DataWarning[]` | er waarschuwingen over de invoer zijn (zie [Waarschuwingen](#warnings)) |

## getContext()

`mountFountainChart(el, props).getContext()` geeft een renderer-onafhankelijke **`FountainChartContext`**:

- **`mode`**: `"snapshot"` voor een categorische (band-)x, `"trend"` voor een temporele of numerieke x.
- **`xAxis`**: `{ type, domain }`, de kolomlabels in momentopname-modus of `[min, max]` in trendmodus. **`yAxis`**: `{ domain }`.
- **`jets`**: één item per getekende jet (in x-volgorde in trendmodus):

| Veld | Wat het is |
| --- | --- |
| `label`, `code`, `color` | Het label van de jet, de optionele id en de uiteindelijke kleur. |
| `value` | De grote stip. |
| `low`, `high` | De onderkant en de top van de fontein; `null` zonder bereik. |
| `range` | `high - low`; `null` zonder bereik. |
| `rangeRatio` | `range / \|value\|`: hoe groot het bereik is naast het getal. `null` als de waarde 0 is of er geen bereik is. |
| `sampleCount` | Aantal kleine stippen. |
| `referenceCounts` | Eén `{ value, goodSide, count, total, countLabel }` per referentielijn met `goodSide`; `[]` voor een voorspelling of een jet zonder metingen. |
| `predicted` | `true` voor een voorspelde jet. |
| `xPosition` | De ruwe `date` in trendmodus, `null` in momentopname-modus. |
| `spread` | Verouderd: `(high - low) / 2`, 0 zonder bereik. Gebruik `range`. |
| `spreadRatio` | Verouderd: `spread / \|value\|`, 0 als het niet te berekenen is. Gebruik `rangeRatio`. |
| `upperBound` | Verouderd: `high` (of de waarde zonder bereik). Gebruik `high`. |
| `lean` | Verouderd: altijd `null`. |

- **`stats`**:
  - `jetCount`: aantal getekende jets.
  - `tallest`: `{ label, value }` van de grootste waarde, of `null`.
  - `widestRange`: `{ label, range }` van het breedste bereik, of `null` als geen jet een bereik heeft.
  - `frothiest`: verouderd. `{ label, spreadRatio }` van de jet met de grootste `rangeRatio`. Gebruik `widestRange` of `jets[].rangeRatio`.
  - `trendSlope`: helling (kleinste kwadraten) van de waarden per periode (trendmodus, één reeks); anders `null`.
  - `valueRange`: `[min, max]` van de waarden, of `null`.
  - `predictedCount`: aantal voorspelde jets.
- **`legendData`**: elk label van de hele `dataSet` met zijn kleur, in volgorde van voorkomen; uitgeschakelde labels blijven staan met `disabled: true`. In trendmodus alleen bij meer dan één reeks.
- **`summary`**: één zin in gewone woorden (in het Engels), bijvoorbeeld `Fountain chart "How long is my commute, really?" with 4 jets. Highest usual value: Bus at 40. Widest range: Car, from 22 to 55.`
- **`a11yTable`**: kolommen `Label`, `Usual`, de twee `endLabels`, `Samples`, en één kolom per referentielijn met `goodSide` (met de `countLabel` als kop, cellen zoals `"17 of 20"`); trendmodus zet `Period` vooraan. Het label van een voorspelde jet krijgt "(forecast)" erachter: zijn rij in trendmodus luidt `["Year 4", "Battery (forecast)", …]`.

Zie [LLM-context](/nl/guide/llm-context) voor hoe je de context gebruikt in prompts en rapporten.

## Waarschuwingen {#warnings}

`onDataWarning` (en de gebeurtenis `michi-vz:datawarning`) krijgt `DataWarning[]`, elk `{ type, message, label? }`. De grafiek tekent data nooit stilletjes anders: elke reparatie wordt gemeld.

| `type` | Wanneer | Wat de grafiek doet |
| --- | --- | --- |
| `non-finite-value` | Een item heeft geen eindige `value` en geen metingen, of sommige metingen zijn niet eindig. | Slaat de jet over (ook in de stats), of laat die metingen weg. Een ontbrekende waarde met metingen wordt hun mediaan. |
| `range-excludes-value` | `low`/`high` (of `spread`) laten de waarde erbuiten. | Maakt het bereik groter zodat de waarde erin valt. |
| `sample-outside-range` | Een meting ligt buiten een opgegeven bereik. | Maakt het bereik groter zodat de meting erin valt. |
| `inverted-range` | `low` ligt boven `high`, of `spread` is negatief. | Draait de uiteinden om (gebruikt de grootte van de spreiding). |
| `missing-date` | Trendmodus, maar het item heeft geen bruikbare `date`. | Slaat het item over (de grafiek blijft in trendmodus). |
| `duplicate-date` | Twee jets hebben dezelfde datum in trendmodus. | Tekent ze over elkaar. |
| `duplicate-label` | Een label komt vaker voor in momentopname-modus. | De jets delen één kolom. |
| `out-of-domain` | Een waarde, een uiteinde of een meting ligt buiten een opgegeven `yAxisDomain`, of een referentielijn. | Houdt de tekening binnen de grafiek; kleine stippen en lijnen erbuiten worden niet getekend. |
| `ignored-option` | Een verwijderde prop is ingesteld, of een item heeft `density` of `lean`. | Negeert hem. |
| `empty-dataset` | De `dataSet` is leeg. | Toont de geen-data-overlay ("No data available", je `noDataLabel`, of je eigen met `suppressDefaultOverlay`) in plaats van assen en marks. `isNodata: false` tekent de lege assen. |
| `layout-overflow` | Elke jet krijgt minder dan 24 px, of de waardelabels passen niet (smalle kolommen, gedraaide x-labels, jets in één kolom, of een grafiek die te laag is). | Tekent de jets toch en laat de waardelabels weg die niet passen, eerst de woorden voor de uiteinden. Maak de grafiek breder, toon minder jets of voeg samen. |

## Verouderd {#deprecations}

Dit werkt allemaal nog in core 1.29 en verdwijnt in een latere release. Zie [Overstappen vanaf core 1.28](/nl/charts/fountain#migrating).

- **Props, genegeerd met een waarschuwing `ignored-option`:** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets`, `showMist`. Op de web component: `fountainStyle` (`fountain-style`).
- **Velden van items:** `predicted` en `certainty` werken nog; gebruik `forecast`. `density` en `lean` worden genegeerd met een waarschuwing.
- **Velden van de context:** `jets[].spread`, `jets[].spreadRatio`, `jets[].upperBound` en `jets[].lean` (altijd `null`); `stats.frothiest`. Gebruik `range`, `rangeRatio`, `high` en `stats.widestRange`.

## Bron

Props zijn getypeerd als [`FountainChartProps`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts) in `@michi-vz/core`.
