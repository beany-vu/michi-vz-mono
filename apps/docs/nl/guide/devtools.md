---
title: DevTools - inspecteer, bestuur en bewerk elke grafiek
---

# Kijk in je grafieken

Een grafiek tekent pixels, maar de bugs zitten in de **status erachter**: de data die daadwerkelijk
de engine bereikte, de asdomeinen, de host-box waartegen de grafiek gemeten werd, en welke
punten *waargenomen* zijn versus *voorspeld*. `@michi-vz/devtools` is een opt-in, in-page paneel dat
dit allemaal blootlegt voor **elke** michi-vz-grafiek op de pagina. Geen browserextensie nodig:
het is één import, geversioneerd met je app.

<DevtoolsDemo />

> Klik op **Mount devtools**: het zwevende Michi-schild verschijnt rechtsonder - het
> ingeklapte gezicht van de devtools. Klik erop (of druk op `Ctrl/Cmd+Shift+M`) om het paneel te openen, kies de grafiek in de lijst, en
> loop de tabbladen af: **Overview** (context, series, live bewerking), **Sizing**, **Scales**, **Diff**,
> **Hit-test**, **Profiler**, **A11y**, en **Insights** - waar ✦ **Narrate** en ✦ **Detect
> anomalies** echte `@michi-vz/insights`-plugins tegen de live grafiek uitvoeren (de piek in de
> 2022 Cost wordt gemarkeerd; highlight hem vanuit het resultaat). Dit is het echte pakket, dat in je browser draait.

## Snelstart

```bash
npm i -D @michi-vz/devtools
```

```ts
import { mountDevtools } from "@michi-vz/devtools";

// Call this BEFORE mounting charts so they register themselves.
// The floating Michi shield button appears; click it (or Ctrl/Cmd+Shift+M) to open the panel.
const devtools = mountDevtools();

import { mountLineChart } from "@michi-vz/core";
mountLineChart(host, { dataSet, xAxisDataType: "number" });

// later
devtools.destroy();
```

Gebruik je React? Er is een oneliner die de devtools mount terwijl die in de boom staat en niks
rendert (standaard alleen-dev - productiebuilds laten de devtools-chunk volledig vallen):

```tsx
import { MichiVzDevtools } from "@michi-vz/react";

<MichiVzDevtools />
```

Voor Vue, Svelte, Angular, of plain web components is het recept dezelfde drie regels: roep
`mountDevtools()` aan in de mount-hook van je rootcomponent, `destroy()` bij unmount. En voor
builds waar devtools inert moet blijven zonder de importlocatie te veranderen, exporteert de
`@michi-vz/devtools/production`-ingang een no-op `mountDevtools`.

## De zwevende knop

De devtools mounten dekt je app nooit af: het start als het kleine **Michi-schild** (het
wapenschild van de bibliotheek) in een hoek.
Klik erop om het paneel te openen, sluit het paneel om de knop terug te krijgen, en de open/gesloten status
wordt **per browser onthouden** - herlaad de pagina en de devtools komt precies terug zoals je het
achterliet. Deel je een hoek met een chatwidget of een andere devtools-knop? **Sleep het schild
overal naartoe** - die plek wordt ook onthouden. `buttonPosition` kiest de starthoek.

`mountDevtools(options?)` geeft een handle terug:
`{ open, close, toggle, isOpen, refresh, getRoot, destroy }`.

| Optie            | Standaard          | Opmerkingen                                                               |
| ---------------- | ------------------ | -------------------------------------------------------------------------- |
| `container`      | `document.body`    | Waar de shadow-host van het paneel aan gekoppeld wordt.                    |
| `open`           | onthouden          | Forceer `true`/`false`; standaard herstelt de laatste status, gesloten bij de eerste run. |
| `hotkey`         | `Ctrl/Cmd+Shift+M` | Zet op `null` om de toetsenbord-toggle uit te schakelen.                   |
| `theme`          | `"auto"`           | `"auto"` volgt `prefers-color-scheme`; of forceer `"dark"` / `"light"`.    |
| `buttonPosition` | `"bottom-right"`   | Starthoek voor de knop; een versleepte plek wint bij latere mounts.        |

Het paneel rendert in zijn eigen **Shadow DOM**, zodat zijn stijlen niet kunnen lekken in je app (en
de CSS van je app het paneel niet kan breken). De grafieken zelf blijven light DOM - het paneel raakt
het kleurcontract nooit aan.

Werk je met een grote context of een lange serietabel? **Sleep de linkerbovenhoek van het paneel** om
het te herschalen (de grootte wordt per browser onthouden), of druk op de **⛶**-knop in de header om
het te maximaliseren tot de volledige viewport en terug.

Dashboards met veel grafieken blijven overzichtelijk: de chartlijst heeft een **filtervak**, elke
lijstitem heeft een **◎ locate**-knop die de grafiek in beeld scrolt en er een omlijning omheen laat
flitsen, en na 8 grafieken voegt het paneel updatebursts samen tot één re-render, zodat een drukke
pagina nooit hapert omdat devtools open staat. Het paneel doet totaal geen polling - het reageert
alleen op de events van de hook, en historie-snapshots slaan grafieken over waarvan de context niet veranderd is.

## De tabbladen

### Sizing - "waarom is mijn grafiek onzichtbaar / overloopt hij?"

De meest voorkomende chartbug in elke bibliotheek is een sizing-bug: een host gemeten op `0×0`
binnen een verborgen tab, of een grafiek geschaald vanuit `clientWidth` zonder padding af te
trekken (ja, `clientWidth` **bevat** padding), zodat hij over zijn card heen loopt. Het Sizing-tabblad
toont de gerenderde rect van de host, de client-box, en de padding naast de breedte/hoogte waar de
grafiek om vroeg, markeert de mismatch in gewone taal, en bevat een kant-en-klaar `ResizeObserver`-recept -
omdat michi-vz-grafieken by design vaste grootte hebben en responsiviteit bij de host hoort.

### Scales - "waarom kloppen mijn asWaarden niet?"

Rendert de live `xAxis` / `yAxis`-domeinen rechtstreeks vanuit de `ChartContext`, met
gezondheidscontroles voor de drie klassieke faalmodi: een `NaN`-domein (een datum of waarde kon
niet geparst worden), een nul-breed domein (elke waarde identiek, marks vallen samen), en een
omgekeerd domein (een handmatige domain-prop achterstevoren doorgegeven). Grafieken zonder assen
(pie, sankey, treemap) zeggen dat, in plaats van niets te tonen.

### Diff - "wat is er veranderd tussen deze twee renders?"

Het paneel maakt een snapshot van de `ChartContext` van elke grafiek bij **elke update** en houdt
een korte historie bij. Het Diff-tabblad vergelijkt de laatste twee snapshots diepgaand tot een
toegevoegd/verwijderd/veranderd-lijst met exacte paden (`series[0].max: 140 → 555`), zodat "mijn
grafiek ziet er anders uit en ik weet niet waarom" een antwoord van twee regels wordt. Stap terug
door de History-balk en de diff volgt de snapshot die je bekijkt.

### Insights - de grafiek legt zichzelf uit

Elke michi-vz-grafiek draagt al een `summary` in gewone taal in zijn context - dezelfde tekst die
een AI-agent of schermlezerpipeline consumeert. Het Insights-tabblad toont het in een
AI-gestileerde bubbel, en wanneer [`@michi-vz/insights`](/nl/guide/insights) aan de grafiek gekoppeld is,
licht het one-click acties op die via `getTools()` ontdekt worden:

- ✦ **Narrate** - `chart.use(narrate())` - deterministische prozanarratie van de huidige status.
- ✦ **Detect anomalies** - `chart.use(anomaly())` - markeert uitschieters per serie; het resultaat
  biedt een one-click **highlight** van de gemarkeerde serie op de live grafiek.
- ✦ **Forecast** - `chart.use(forecast())` - de geprojecteerde punten, nauwkeurigheid, en elke
  drempeloverschrijding.

Al het andere dat een plugin blootstelt, verschijnt onder **Advanced** als een rauwe tool-runner
(JSON-argumenten erin, JSON-resultaat eruit).

### Hit-test - "waarom vuurt mijn tooltip niet?"

Canvas-marks hebben geen DOM, dus wanneer een hover stopt met werken, is er niets te inspecteren
in het Elements-paneel - je kunt een hit-test-bug niet onderscheiden van een dode listener of een
CSS-`pointer-events`-probleem. Het Hit-test-tabblad streamt live de eigen canvas-hit-test-resultaten
van de grafiek: elke pointer-beweging logt zijn coördinaten en de mark die eruit kwam (of een
misser), en een groene/rode marker volgt het laatste event op de grafiek zelf. De doorslaggevende
diagnose is stilte: als je aan het hoveren bent en de log beweegt niet, is de canvas-listener van de
grafiek dood.

### Profiler - "waarom werd dit traag?"

Elke `update()` wordt getimed aan de engine-grens. Het Profiler-tabblad toont de
laatste/gemiddelde/maximale render-duren met een per-update balkenstrip, en waarschuwt wanneer de
rendertijd oploopt - de gebruikelijke verdachten zijn groeiende data, niet-gememoïzeerde props die
volledige re-renders forceren, of gelekte listeners.

### A11y - de audit die geen enkele chart-devtool doet

Op Chartability geïnspireerde heuristieken lopen tegen de live context: een ontbrekende
`summary` in gewone taal (schermlezers en AI-agents krijgen niets), een a11y-tabel met minder rijen
dan series, twee series die één kleur delen (niet te onderscheiden zonder zicht), en seriekleuren
onder de 3:1-graphics-contrastratio op een lichte of donkere achtergrond. Onder de audit rendert het
tabblad de daadwerkelijke a11y-datatabel - precies wat een schermlezer krijgt.

### Overview - inspecteren, besturen, bewerken

De klassieke inspector: de samenvatting, statistieken per serie (inclusief de daadwerkelijk-versus-
voorspeld-splitsing hieronder), highlight/disable-toggles die de live props patchen, en een
`dataSet`-JSON-editor - bewerk, druk op **Apply**, en kijk hoe de grafiek opnieuw rendert. Te veel
mee gerommeld? **Reset chart** herstelt de dataSet, highlight, en disable-status naar precies wat ze
waren toen devtools de grafiek voor het eerst zag - elke door het paneel gedreven bewerking in één
klik teruggedraaid.

Trouwens: de ✦-acties op het Insights-tabblad zijn standaard **geen taalmodel** - ze voeren de
insights-plugins van de grafiek lokaal uit (deterministische regels en statistiek; de tooltip van
elke actie zegt precies wat hij berekent). Er wordt niets gedownload, niets verlaat de pagina.

## Tijdreizen door status

Wanneer een grafiek meer dan één keer veranderd is, verschijnt een **History**-balk: stap `◀` / `▶`
door vorige `ChartContext`-snapshots om precies te zien hoe de status evolueerde, of klik op
**● live** om terug te keren naar de laatste. Terwijl je een eerdere snapshot bekijkt, zijn de
besturingselementen alleen-lezen (je inspecteert historie, je bestuurt de grafiek niet). In combinatie
met het Diff-tabblad beantwoordt dit binnen enkele seconden "hoe zag deze grafiek eruit één update
geleden, en wat is er veranderd?".

## Daadwerkelijk versus voorspeld

Het paneel maakt de **herkomst** van een grafiek expliciet. Markeer voorspelde punten met
`predicted: true` op het datapunt (het is achterwaarts compatibel: wanneer weggelaten, wordt het
afgeleid van `certainty === false`, dezelfde vlag die een segment gestreept tekent):

```ts
const dataSet = [{
  label: "Revenue",
  series: [
    { date: 2022, value: 104, certainty: true },                    // observed
    { date: 2023, value: 121, certainty: false, predicted: true },  // forecast
  ],
}];
```

Dat stroomt door in de `ChartContext` van elke grafiek als `actualCount`, `predictedCount`, en
`forecastStart` (per serie op Line, Fan, en Range), zodat het paneel - en elke AI-agent die de
context leest - het verleden van de projectie kan onderscheiden zonder te gokken op streepjes.

De gestapelde **Area**-grafiek deelt één x per datum, dus daar wordt `predicted` op de hele **rij**
gezet en verschijnt het op chartniveau als `stats.actualRows`, `stats.predictedRows`, en
`stats.forecastStart`:

```ts
const series = [
  { date: 2022, cloud: 60, onprem: 44 },                  // observed
  { date: 2023, cloud: 78, onprem: 40, predicted: true }, // forecast row
];
```

> [!TIP] Geef de voorkeur aan `predicted` boven `certainty` om een forecast te markeren.
> `certainty` wordt ook `false` voor automatisch gedetecteerde **gaten** in de data (`detectGaps`),
> dus het kan een forecast niet onderscheiden van een gat in de data. `predicted` is ondubbelzinnig.

**Dekking.** Herkomst is een tijdreeksidee, dus het wordt gedragen door de grafieken waar een
forecast natuurlijk is: **Line**, **Fan**, en **Range** (per serie), en **Area** (per rij). De
categorische, part-to-whole, en relationele grafieken (stacked bar, bar-bell, comparable, dual,
gap, pie/donut, bubble, sankey, treemap, radar, scatter) hebben geen forecast-as, dus dragen ze geen
`predicted`-vlag.

## Waarom geen browserextensie?

Je hebt er geen nodig. Elke michi-vz-grafiek is **Light DOM** en stelt zijn status al bloot
(`getContext()`, `getTools()`), zodat een in-page paneel alles rechtstreeks kan lezen. Dat maakt de
devtools:

- **Zero-install** - het is gewoon een `import`, geversioneerd met je app.
- **Testbaar voordat je shipt** - het draait in jsdom/Playwright als elke andere module.
- **Framework-onafhankelijk** - het ontdekt zowel imperatieve `mountXChart()`-instanties *als*
  `<michi-vz-*>`-webcomponents.
- **Prod-veilig** - gate het achter `process.env.NODE_ENV !== "production"` (de React-component doet
  dit voor je) of importeer `@michi-vz/devtools/production`; hoe dan ook downloaden je gebruikers
  het nooit.

Een echte browserextensie is pas later de moeite waard, om michi-vz te inspecteren op pagina's die de
devtools-module **niet** bundelen. Het zou dezelfde hook hergebruiken, dus niets hier is weggegooid werk.

## Hoe het werkt

`@michi-vz/core` levert een kleine opt-in hook. `mountDevtools()` roept `enableDevtools()` aan, die
`globalThis.__MICHI_VZ_DEVTOOLS_HOOK__` installeert - een registry waar elke `mountXChart()` naar
schrijft bij het mounten en wist bij `destroy()`. Het paneel abonneert zich erop voor updates en
veegt ook door de DOM voor `<michi-vz-*>`-elementen die eerder gemount zijn. Wanneer devtools nooit
ingeschakeld wordt, wordt de hook nooit aangemaakt en betalen grafieken slechts één vlagcontrole per
mount.

Je kunt je eigen UI (of een toekomstige extensie) bouwen tegen hetzelfde oppervlak:

```ts
import { getDevtoolsHook, enableDevtools } from "@michi-vz/core";

enableDevtools();
const hook = getDevtoolsHook();           // { charts: Map, subscribe, ... }
hook?.subscribe((charts) => {
  for (const c of charts) console.log(c.chartType, c.getContext());
});
```
