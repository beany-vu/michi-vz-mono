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

## Nog niet uitgebracht

<!-- TODO voor publicatie: vervang deze kop door de echte versienummers
     zodra `changeset version` alle .changeset/*.md-bestanden heeft verwerkt. -->

- **Speel door de jaren heen, op elke grafiek.** De nieuwe opt-in prop `timeline`
  voegt een ingebouwde afspeelknop + jaarscrubber toe (plus een headless
  `chart.timeline()`-controller) aan alle 21 grafieken. Tijdas-grafieken zoals
  [Lijn](/nl/charts/line) en [Vlak](/nl/charts/area) tekenen hun markeringen tot
  het actieve jaar en vegen soepel verder tijdens het afspelen;
  momentopname-grafieken zoals [Taart](/nl/charts/pie), [Gap](/nl/charts/gap) en
  [Spreiding](/nl/charts/scatter) tonen één periode tegelijk met waarden die
  tussen jaren glijden; [Treemap](/nl/charts/treemap) en
  [Radiale boom](/nl/charts/radial-tree) tweenen hele hiërarchieën vanuit met
  `date` getagde wortelknopen; [Sankey](/nl/charts/sankey) speelt over met
  `date` getagde links; en [Radar](/nl/charts/radar) en
  [Bar-Bell](/nl/charts/bar-bell) gebruiken een nieuw rijveld `period`. Overal
  standaard uit, en elke grafiekpagina heeft een live demo.
- **Onthulanimatie op elke grafiek.** De opt-in prop `progressiveDraw` veegt de
  markeringen van links naar rechts binnen bij het mounten - en op
  [Lijn](/nl/charts/line) rijden labels mee op het uiteinde van elke groeiende
  lijn. `replay()` speelt de onthulling opnieuw af.
- Beide features werken in de rendermodi `svg` en `canvas`, respecteren
  `prefers-reduced-motion` (de grafiek verschijnt meteen volledig getekend) en
  zijn bewust inert op de experimentele `webgpu`-renderer.
- **Opgelost:** een re-render tijdens een lopende animatie hervat die nu vanaf de
  huidige positie in plaats van naar het einde te springen - framework-wrappers
  updaten de grafiek direct na het mounten, wat voorheen elke mount-autoplay
  annuleerde.

## v1.8.1

Pakketversies: react **1.8.1** · core, wc, angular **1.9.0** · vue, svelte **1.6.0** ·
devtools, insights **0.2.8**.

- **Vier nieuwe grafieken: de atlas groeit naar 21.** [Comparable Vertical Bar](/nl/charts/comparable-vertical-bar)
  (twee overlappende kolommen per categorie, het gearceerde "voor" achter het gevulde "na",
  met een veranderingspijl boven elk paar), en de eerste geografiefamilie van de bibliotheek:
  [Choropleth Map](/nl/charts/choropleth-map) (je eigen GeoJSON, 13 projecties, drempel- of
  categoriekleuring), [Symbol Map](/nl/charts/symbol-map) (lng/lat-bellen met optionele
  gedempte landmassa) en [Radial Tree](/nl/charts/radial-tree) (een radiaal dendrogram met
  cirkels op groeps- en bladniveau).
- **Logaritmische assen op LineChart.** `yAxisScale: "log"` voor data die decaden omspant:
  niet-positieve waarden worden ontbrekend (met een datawaarschuwing) en te drukke labels
  dunnen uit naar machten van tien. Zie [Line](/nl/charts/line).
- **Echt 100%-stapelen op AreaChart.** `stackOffset: "expand"` maakt van elke gestapelde
  vlakgrafiek aandelen van het geheel: echt d3-stapelen, geen weergavetruc.
  Zie [Area](/nl/charts/area).
- **Vergelijkbare balken, twee nieuwe opties.** `layout: "grouped"` splitst elke band in twee
  helften naast elkaar in plaats van overlappen, en `deltaIndicator` tekent per rij een
  rood/groene veranderingspijl. Zie [Comparable](/nl/charts/comparable).
- **Eerlijke symboolposities.** Symbol Maps `positionMode: "precise"` houdt elke bel exact op
  zijn geprojecteerde lng/lat (overlappen toegestaan) in plaats van de standaard
  ontklonteringssimulatie: de juiste keuze zodra een zichtbare landmassa uitnodigt om
  posities letterlijk te lezen. Een live schakelaar op de
  [Symbol Map-pagina](/nl/charts/symbol-map) toont het verschil.
- **Labels waar ze ontbraken.** Scatter krijgt `pointLabels` plus een `drawOrder`-keuze
  (klein-bovenop standaard, of het oude groot-bovenop); Treemap kan met `tileValueLabels`
  de waarde van elke tegel tonen. De laad- en geen-data-overlays dekken nu ook Radar,
  Sankey en Treemap, en markeringen wijken correct zolang een overlay zichtbaar is.

## v1.6.5

Packageversies: react **1.6.5** · core, wc, angular **1.6.0** · vue, svelte **1.5.7** ·
devtools, insights **0.2.5**.

- **RibbonChart wisselt eindelijk van plaats.** De stapel van elke periode wordt nu per waarde
  opnieuw gerangschikt: een categorie die een andere inhaalt, kruist zichtbaar de linten op weg
  omhoog - precies waar een lintdiagram voor bestaat, hersteld uit de oorspronkelijke
  bibliotheek. Bekijk het op de [Lint-pagina](/nl/charts/ribbon): Amerikaanse muziekomzet,
  waar streaming alles inhaalt en vinyl de cd weer voorbijgaat.
- **Vergelijkbare staven die je echt kunt lezen.** De kortste subbalk wordt weer bovenop
  getekend (een gegroeide balk verbergt zijn "voor" niet meer), en het nieuwe
  `colorsBasedMapping` geeft de voor-balk een eigen kleur: combineer een dekkende lichte tint
  met `valueBasedOpacity: 1` voor een scherp licht/vol-contrast in beide thema's.
  Zie [Vergelijkbare staven](/nl/charts/comparable).
- **Belwolken zonder bevriezen.** `layoutMode: "async"` draait dezelfde deterministische
  krachtensimulatie in stukjes van ~12 ms achter de laad-overlay van de grafiek: een cluster
  van 3.000 bellen dat de pagina ~20 seconden blokkeerde, kost nu hooguit één frame van 50 ms.
  `settleTicks` regelt het settelen, ongewijzigde invoer slaat de simulatie helemaal over, en
  de lay-out wordt gememoïseerd tussen renders. Zie de botsings-demo op
  [Bellen](/nl/charts/bubble).
- **Kleine knoppen, groot comfort.** De waarde-as van het halterdiagram kan onder het plot
  (`xAxisPosition: "bottom"`), GapChart accepteert een expliciete `xAxisDomain` (zoom een
  levensverwachtingsverhaal in op zijn band 35-90), de rijlabels van de tornado kunnen links
  van het plot (`yAxisPosition: "left"`), radar-poollabels blijven vrij van de titel, en de
  contextsamenvatting van de tornado benoemt nu zijn grootste onbalans.
- **Rijlabels die je kunt vastpakken - en scrubben.** Op Gap, Vergelijkbaar en de tornado
  maakt de opt-in `interactiveRowLabels` van elk rijlabel een echte control: hover of focus
  en een verbindingslijn loopt naar de rij, met tooltip en highlight; klikken pint vast. De
  labelgoot scrubt bovendien als een slider: sleep erlangs en de tooltip volgt je cursor van
  rij naar rij, tot aan rijen waarvan het label op een dichte as was uitgedund.
  Probeer het op de demo's van die pagina's.
- **Een legenda voor alles.** Elke grafiekcontext draagt nu `legendData`, en split-grafieken
  (treemap, bellen, vergelijkbare staven) tonen ook de lichte partnerkleur van elk label via
  `LegendItem.paleColor` - de docs-demo's gebruiken het voor hun legenda's en de schakelaar
  "Betekenis | Kleurenparen".
- **Dichte band-assen dunnen zichzelf uit.** Rijlabels van gap/vergelijkbaar/dubbel/halter
  (en de momentopname-as van de fontein) bemonsteren naar een leesbare subset in plaats van
  te versmeren bij 100+ rijen.
- **Docs: druk op de knoppen.** Elke grafiekpagina heeft nu live acties "✦ Leg deze grafiek
  uit" (de echte insights-regelmotor, in je browser) en "🛠 Probeer DevTools op deze grafiek",
  plus nieuwe voorbeelden met een verhaal: het LHC-dimuonspectrum op
  [Spreidingsdiagram](/nl/charts/scatter), bruto-vs-nettosalarissen in de EU op
  [Bellen](/nl/charts/bubble), en een levensverwachtingsgolf van ~195 landen op
  [Verschil](/nl/charts/gap).
- **De Fontein leert zichzelf uitleggen.** De [Fontein-pagina](/nl/charts/fountain) opent nu
  met een anatomie-woordenlijst (elk zichtbaar deel van de glyph heeft een uitgesproken
  betekenis) en een veldgids met elf live leeswijzen: zekerheid, stabiliteit, risico,
  AI-vertrouwen, verdeelde doelgroepen, Filipijnse tyfoons en meer, meestal in het strakke
  symmetrische pluimsilhouet. Symmetrie draagt nu ook betekenis: een expliciete `lean: 0` zet de straal
  echt rechtop, een `lean` met teken markeert eenzijdig risico, en een straal zonder `lean`
  houdt zijn decoratieve Geneefse wind (gerapporteerd als `lean: null` in `getContext()`).

## v1.6.1 - v1.6.4

Pakketversies: react **1.6.4** · devtools, insights **0.2.4** · core, wc, vue, svelte,
angular **1.5.6**. Vier kleine patchgolven tussen de grote releases:

- **De waarde-as van GapChart, drie keer gehard.** Door de consument aangeleverde
  `tickValues` worden gefilterd op eindige waarden, gesorteerd en ontdubbeld (ontaarde
  invoer valt terug op het datadomein); markeringen en as lopen niet meer over wanneer
  `tickValues` worden meegegeven terwijl `enableExplicitTickValues` uit staat; en
  procentdomeinen krijgen bereikbewuste padding, zodat een nulpuntsmarkering op de as landt
  in plaats van erbuiten.
- **De legenda van VerticalStackBar houdt haar kleuren.** Een uitgeschakelde sleutel blijft
  in `legendData` staan met `disabled: true`: de legendapil dimt in plaats van te verdwijnen,
  en kleurslots worden toegewezen over de volledige sleutelset - geen sleutel verandert van
  kleur bij uit- en weer inschakelen. Balken sluiten uitgeschakelde sleutels nog steeds uit.

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
