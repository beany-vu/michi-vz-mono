# Wat is er nieuw

De nieuwste `@michi-vz`-releases, nieuwste eerst. Alle zes pakketten -
[core](https://www.npmjs.com/package/@michi-vz/core),
[wc](https://www.npmjs.com/package/@michi-vz/wc),
[react](https://www.npmjs.com/package/@michi-vz/react),
[vue](https://www.npmjs.com/package/@michi-vz/vue),
[svelte](https://www.npmjs.com/package/@michi-vz/svelte),
[angular](https://www.npmjs.com/package/@michi-vz/angular) - worden samen
geversioneerd (elke release vermeldt welk pakket vooruitliep). Volledige per-commit
details staan in de [GitHub releases](https://github.com/beany-vu/michi-vz-mono/releases).

## v1.6.0

Pakketversies: react **1.6.0** · devtools **0.2.0** · insights **0.2.0** · core, wc, vue,
svelte, angular **1.5.2**.

- **DevTools 0.2.0: de Michi-shield toggle-knop.** De devtools mounten dekt je app niet
  langer af - het start als een klein zwevend schild (het wapenschild van de
  bibliotheek). Klik erop, of druk op `Ctrl/Cmd+Shift+M`, om het paneel te openen; de
  open/gesloten status wordt per browser onthouden, zodat een herlaadbeurt precies
  terugkomt zoals je het achterliet. Een hoek al bezet door een ander zwevend widget?
  **Sleep het schild overal naartoe** - die plek wordt ook onthouden, en de nieuwe
  `buttonPosition`-optie kiest de starthoek. De handle kreeg `isOpen()`, en
  `<MichiVzDevtools />` (react 1.6.0) geeft `buttonPosition` door. Zie
  [DevTools](/nl/guide/devtools).
- **Insights 0.2.0: `matchLabels()` cross-dataset koppeling.** Koppel dezelfde entiteiten
  over twee anders gespelde lijsten (een CRM-export vs. een ERP-export) zodat twee
  datasets één samengevoegde grafiek worden: standaard wederzijdse beste match, gepoortd
  door een vertrouwensmarge, ongekoppelde rijen worden teruggegeven met een
  "bedoelde je"-hint. Model-vrije hashing werkt offline; de MiniLM-backend koppelt ook
  synoniemen, afkortingen en vertalingen. Probeer de live
  [MatchLab](/nl/guide/insights#clean-match-and-search-your-data)-demo.
- **Core 1.5.2: performance-fixes voor zware pagina's.** De idempotentie-guard van
  `onChartDataProcessed` ondertekent contexten nu via een begrensde FNV-1a-hash in
  plaats van elke rij te stringifyen (een string van meerdere MB per render bij 50k
  punten), en canvas/WebGPU scatter-hover vouwt de pointer-burst van elk frame samen tot
  één afsluitende `requestAnimationFrame`-pass. Grote dashboards blijven responsief
  zonder iets te configureren.
- **Documentatie, nu in vier talen.** De site spreekt Engels, Frans, Nederlands en Vietnamees,
  met een taalkiezer in de navbar - elke gids-, grafiek- en API-pagina is vertaald. Bijdragen
  aan de vertalingen zijn welkom; zie de link **Help met vertalen** in de voettekst.
- **Een scherpere startpagina.** De startpagina begint nu met het DevTools-verhaal en vier
  pijlers in gewone taal - alles inspecteren, grafieken die machines kunnen lezen, standaard
  toegankelijk, en draait lokaal. Een nieuwe voettekst nodigt je uit om het project een ster te
  geven, lid te worden van de community, bij te dragen en te helpen vertalen. Het Michi-schild
  is het favicon van de site en staat naast de titel in de navbar, en elke pagina heeft een
  unieke beschrijving en social card.

## v1.5.0

- **DevTools is er: `@michi-vz/devtools` 0.1.0, eerste publieke release.** Een paneel
  in de pagina zelf (geen browserextensie) dat de live status van elke grafiek
  inspecteert via acht tabbladen - Overview (met live bewerking + **Reset chart**),
  Sizing, Scales, Diff, Hit-test, Profiler, Insights, en een A11y-audit. Shadow-DOM
  geïsoleerd, herschaalbaar, licht + donker, standaard alleen-dev met een inerte
  `/production`-ingang, en een React-oneliner: `<MichiVzDevtools />`. Zie
  [DevTools](/nl/guide/devtools).
- **Insights 0.1.0: transparante en local-first AI.**
  [Methodologie](/nl/guide/insights#methodology---the-exact-logic-behind-every-insight)
  legt nu de exacte logica achter elke insight uit; `describeModelSource()` vermeldt wat
  een modelbackend zou downloaden en vandaan, **voordat** er iets laadt; `modelSource`
  leidt downloads om naar een mirror of zelf gehoste bestanden (of verbiedt ze
  volledig); en `ollamaCaller` / `openaiCompatCaller` haken een lokale AI (Ollama, LM
  Studio, llama.cpp) aan in één regel, zonder downloads. Anomalieresultaten dragen nu
  hun methode, drempel, en een uitleg in gewone taal.
- **Core:** de devtools-hook kreeg kanalen voor hoogfrequente hit-tests en
  render-timing (geen kosten wanneer devtools uit staat).

## v1.4.0

- **De hover-crosshair is terug - en configureerbaar.** De verticale muislijn van
  LineChart staat weer standaard aan (legacy-pariteit; de port had dit stilletjes
  uitgeschakeld), snapt naar het dichtstbijzijnde datapunt in plaats van de ruwe cursor
  te volgen, en verbergt zichzelf wanneer de cursor de grafiek verlaat - zowel in
  SVG-, canvas- als WebGPU-modus. Stijl het per grafiek met `enableMouseLine: { stroke,
  strokeWidth, strokeDasharray, snap }`, thema het globaal met de
  `--michi-vz-crosshair` / `--michi-vz-crosshair-width` / `--michi-vz-crosshair-dash`
  CSS-variabelen, of geef `false` door om het uit te zetten.

## v1.3.0

- **Geen periode meer achtergelaten op de x-as.** LineChart-datumassen behouden nu
  altijd de echte eerste en laatste periode (ruwe `d3`-tijd-ticks snapten voorheen naar
  ronde grenzen en lieten ze vallen), en drukke labels roteren automatisch -45° en
  dunnen daarna uit tot ~5 in plaats van stilletjes te verdwijnen.
- **Doorlopende tijdlijnen met `fillPeriodTicks` (Line + Area, opt-in).** Een tick voor
  elke periode in het bereik, niet alleen de aanwezige in de data; ontbrekende periodes
  renderen vervaagd met een "geen data"-hovertooltip, aanpasbaar via
  `noDataTickTooltip` en `noDataTickColor`.

## v1.2.1

- **Elke npm-pagina linkt naar zijn broers en zussen.** Elke package-README draagt nu
  een tabel *Framework packages* die alle zes pakketten linkt, zodat je vanuit elke
  wrapper de rest kunt bereiken. Een dode monorepo-link is gefixt.
- **Alle zes pakketten opnieuw uitgelijnd.** `vue`, `angular`, `svelte` en `wc` liepen
  een versie achter op npm; ze worden nu samen met `core` en `react` in dezelfde versie
  gepubliceerd.
- **Vindbaarheid in de docs.** De [Installatie](/nl/guide/installation)-tabel linkt
  elk pakket naar npm, en er is een npm-knop op de homepage plus een npm-icoon in de
  bovenste navigatie.

## v1.2.0

De release van **drop-in compatibiliteit**: de scoped `@michi-vz/*`-pakketten kunnen de
legacy single-package `michi-vz` vervangen zonder chartregressies. Alles is
backward-compatible.

- **Renderer-onafhankelijke context.** `legendData` (het per-serie kleurcontract voor
  canvas- / skip-mode-consumers) op de Line/Gap/Area/Scatter/BarBell/Radar-contexten;
  `renderedData` / `visibleItems`; elke `on*Processed` is nu idempotent, dus die vuurt
  alleen wanneer de context daadwerkelijk verandert en loopt nooit meer rond.
- **LineChart.** Laad- / geen-data-statussen, as-configuratie (`yTicks`, gridlijnen,
  zero-line-highlight), `fontFamily`, en door de consument aangeleverde `svgChildren`.
- **Meer chartprops.** Gap-vormlegenda; Comparable `maxBarHeight` /
  `symmetricXDomain`; VerticalStackBar-labelrotatie + `keys`; Scatter-bandschaal,
  crosshair, en vormen per punt; Radar legacy datavorm + vergevingsgezinde hit-test.
- **Assen, SEO en a11y.** Adaptieve auto-rotatie en tick-verdunning op drukke assen; de
  chart-`<svg>` draagt nu `<title>`, `<desc>`, en schema.org JSON-LD `<metadata>`.
- **Experimenteel WebGPU**-renderpad naast SVG en canvas.

## v1.1.1

- **Bar-Bell-fix.** Eindkap-cirkels renderen bovenop de barsegmenten (voorheen kon een
  later segment over de kap van het vorige segment heen schilderen), en het hele
  segment is hoverbaar voor tooltips, niet alleen de eindkap-cirkel.
