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

## v1.11.4

Pakketversies: core **1.16.1** · wc, angular **1.12.3** · react **1.11.4** · vue, svelte **1.7.4** ·
examples **1.1.4** · devtools, insights **0.2.19**.

- **Top/Bottom-rangschikking slaat series zonder data op de ankerdatum over.** Op de
  [lijngrafiek](/charts/line) rangschikt een serie zonder eindige waarde op het
  `filter.date`-anker nu als LAATSTE in **beide** sorteerrichtingen. De oude sentinel
  sorteerde alleen onder `desc` als laatste — onder `asc` (Bottom-N) sorteerde ze
  *eerst*, waardoor Bottom-N zijn plekken vulde met series zonder data in het ankerjaar
  in plaats van de laagste echte waarden. Een rij die op het anker bestaat maar
  `null`/`NaN` bevat, telt ook als ontbrekend.
- **Ticks op de datum-as kunnen de getekende lijnen niet meer voorbijschieten.** De
  periode-tick-kandidaten van de lijngrafiek (en de "aanwezig"-set van
  `fillPeriodTicks`) komen nu uit dezelfde gerangschikte/gesneden/door `disabledItems`
  gefilterde set als het x-domein. Voorheen schilderde een uit de rangschikking
  gevallen poolserie met een latere periode dan enige getekende serie een tick voorbij
  de plotrand, met een leeg stuk as na de laatste lijn.

## v1.11.3

Pakketversies: core **1.16.0** · wc, angular **1.12.2** · react **1.11.3** · vue, svelte **1.7.3** ·
examples **1.1.3** · devtools, insights **0.2.18**.

- **Een gerangschikte serie verbergen vult niet langer op.** Op de
  [lijngrafiek](/charts/line), de [vergelijkbare horizontale balk](/charts/comparable)
  en de [vergelijkbare verticale balk](/charts/comparable-vertical-bar) rangschikt en
  snijdt het Top/Bottom-`filter` nu de VOLLEDIGE set *voordat* `disabledItems` worden
  verwijderd — een van de top-N series verbergen via de legenda tekent dus N−1 series
  in plaats van de (N+1)-de in het vrijgekomen slot te laten schuiven (de volgorde die
  de [gap-grafiek](/charts/gap) en de groepsselectie van de stapelbalk altijd al
  gebruikten). Zolang een `filter` actief is, houdt `legendData` de verborgen serie
  als gedimde rij en vermeldt `renderedRankedIds` nog steeds haar code, zodat een
  consumerende selectie-UI stabiel blijft over toon/verberg-wissels. Zonder `filter`
  verandert er niets.

## v1.11.2

Pakketversies: core **1.15.0** · wc, angular **1.12.1** · react **1.11.2** · vue, svelte **1.7.2** ·
examples **1.1.2** · devtools, insights **0.2.17**.

- **De context vertelt nu wat er echt op het scherm staat.** Nieuw veld
  `renderedRankedIds` op de gedeelde ChartContext: de codes van de daadwerkelijk
  getekende reeksen, in tekenvolgorde (na `disabledItems` en het sorteren/afkappen van
  de Top/Bottom-`filter`), uitgezonden door de builders van
  [Lijndiagram](/nl/charts/line),
  [Verticale gestapelde staven](/nl/charts/vertical-stack-bar),
  [Vergelijkbare staven](/nl/charts/comparable),
  [Vergelijkbare verticale staven](/nl/charts/comparable-vertical-bar) en
  [Verschildiagram](/nl/charts/gap). De `code` per reeks staat nu ook op de stack- en
  comparable-bar-contexten, en numerieke codes worden niet langer genegeerd door de
  gestapelde staafgrafiek. Hiermee kan een selectie-UI een gerangschikte grafiek
  volgen (het "Top-N chips"-patroon).

## v1.11.1

Pakketversies: core **1.14.0** · wc, angular **1.12.0** · react **1.11.1** · vue, svelte **1.7.1** ·
examples **1.1.1** · devtools, insights **0.2.16**.

- **De [verticale stapelbalk](/nl/charts/vertical-stack-bar) kan nu liggend.** Nieuwe
  additieve `layout: "horizontal"`: rijen op een band-y-as (de gedeelde HTML-labels met
  ellips, dus lange categorienamen blijven leesbaar) met gestapelde segmenten die vanaf
  x(0) naar rechts groeien. Data-, kleurslot-, legenda-, tooltip- en missing-marker-
  contracten zijn identiek aan de verticale lay-out, en de `xAxis*`-props blijven de
  categorie-as formatteren (`yAxis*`/`yTicks` de waarde-as) in beide oriëntaties.
  Afkortingslabels, `xAxisMode` en `timeline` blijven alleen verticaal.

## v1.11.0

Pakketversies: react, wc, angular **1.11.0** · core **1.13.0** · vue, svelte **1.7.0** ·
examples **1.1.0** · devtools, insights **0.2.15**.

- **Nieuwe grafiek: [Meter (ringen)](/nl/charts/gauge).** Een concentrische ringmeter -
  één ring per item, van buiten naar binnen, die elk `value/max` van een volledige
  cirkel over een achtergrondspoor bestrijkt. Aanwijzen activeert een ring en stuurt de
  ingebouwde centrale aflezing; een `null`-waarde toont alleen het spoor. Ringdikte en
  -afstand, kleuren en dekkingen per ring, beginhoek, afgeronde uiteinden en de centrale
  inhoud zijn configureerbaar, met svg-, canvas- en webgpu-renderers die het standaard
  kleurprobe-contract delen.
- **Sleep-zoom op de [lijngrafiek](/nl/charts/line).** Zet de `zoom`-prop aan: sleep een
  horizontaal bereik in het tekengebied om het x-domein te zoomen (een selectiekader
  toont het vooraf), met een ingebouwde "Reset zoom"-knop, `minRange`, een
  `onZoomChange`-callback en `resetZoom()` / `setZoomDomain()` voor programmatische
  besturing. Markeringen worden op het tekengebied bijgesneden; ticks, dradenkruis en
  tooltips volgen het gezoomde domein.
- **PNG-exports kunnen een titel en een bronregel dragen.** `chartToPngDataUrl`
  accepteert `title`- en `caption`-tekstblokken (automatische regelafbreking,
  uitlijning/grootte/kleur configureerbaar) boven en onder de grafiek.

## v1.10.4

Pakketversies: react, wc, angular **1.10.4** · core **1.12.2** · vue, svelte **1.6.6** ·
devtools, insights **0.2.14**.

- **Legenda's van vergelijkbare staven schudden niet meer door elkaar bij het uitschakelen
  van een item.** Op de [Vergelijkbare staven](/nl/charts/comparable) en
  [Vergelijkbare verticale staven](/nl/charts/comparable-vertical-bar) verdween een label
  uit `disabledItems` volledig uit de uitgezonden `legendData`, waardoor legenda's die
  daarop bouwen het item elders opnieuw toevoegden - een zichtbare hersortering (en soms
  een andere kleur) bij elke klik op de legenda. Een uitgeschakeld label blijft nu in
  `legendData` staan, gemarkeerd als `disabled: true`, op zijn oorspronkelijke plek; de
  staven zelf laten het nog steeds weg. Dit komt overeen met het contract dat de verticale
  stapelstaaf sinds core 1.5.6 heeft.

## v1.10.3

Pakketversies: react, wc, angular **1.10.3** · core **1.12.1** · vue, svelte **1.6.5** ·
devtools, insights **0.2.13**.

- **Geen zwevende "Chart"-tooltip meer.** Elke grafiek injecteerde een svg `<title>` met
  "Chart" als SEO-fallback, en browsers tonen een svg `<title>` op rootniveau als native
  hover-tooltip - waar je ook over een grafiek zweefde, er verscheen een klein
  "Chart"-label. Het element wordt nu alleen nog geïnjecteerd als je zelf een
  `title`-prop zet; crawlers behouden de JSON-LD-metadata, en schermlezers merken niets
  (de svg is `aria-hidden`, de verborgen a11y-tabel blijft hun representatie).
- **Tooltips van het [Lijndiagram](/nl/charts/line) kennen hun reeks weer.** Het punt dat
  aan `tooltipFormatter` wordt doorgegeven draagt opnieuw het `label` van zijn reeks
  (`{ ...point, label }`), zoals in de bibliotheek van vóór de monorepo. Tooltips die de
  reeksnaam uit `point.label` tonen, lieten die regel sinds de migratie leeg.

## v1.10.2

Pakketversies: react, wc, angular **1.10.2** · core **1.12.0** · vue, svelte **1.6.4** ·
devtools, insights **0.2.12**.

- **Een drukke datumas kantelt zijn labels nu in plaats van de meeste weg te laten.** Alle
  grafieken met een bandas ([Verticale gestapelde staven](/nl/charts/vertical-stack-bar),
  [Vergelijkbare verticale staven](/nl/charts/comparable-vertical-bar),
  [Fontein](/nl/charts/fountain), [Lintdiagram](/nl/charts/ribbon),
  [Spreidingsdiagram](/nl/charts/scatter)) gaven de rotatie op zodra de banden smal
  werden en legden een uitgedunde set labels plat neer. Een gekanteld label heeft alleen
  zijn diagonale ruimte nodig, ongeveer een kwart van wat een plat label vraagt, dus
  wordt nu een uitgedunde set gekanteld en blijven er ongeveer drie keer zoveel labels
  over. Er wordt alleen gekanteld als dat werkelijk labels oplevert.
  `xAxisMode: "horizontal"` dwingt nog steeds platte labels af.
- **Opgelost: uitgedunde labels konden over elkaar heen worden getekend.** De uitdunning
  garandeerde HOEVEEL labels bleven staan, maar nooit hoe ver ze uit elkaar lagen, en kon
  dus twee naburige banden kiezen. Overlap wordt nu exact gemeten - de eigen breedte van
  elk paar bij platte labels, de loodrechte afstand bij gekantelde - en botsende labels
  vervallen. Het eerste en het laatste label blijven altijd staan, zodat de as zijn
  volledige bereik toont.
- **`YYYYMM`-categorieën volgen de kalender.** Een maandas landt op echte ankerpunten
  (elke januari, jan/jul, jan/apr/jul/okt) in plaats van waar de decimale afronding
  toevallig uitkwam. Diezelfde afronding veroorzaakte de overlap hierboven: ze is
  betekenisloos over een maandveld in twaalftallen en zette twee ticks aan weerszijden
  van elke jaarwisseling. Viercijferige jaren blijven ongewijzigd, ronde decennia passen
  daar al bij.

## v1.10.1

Pakketversies: react, wc, angular **1.10.1** · core **1.11.1** · vue, svelte **1.6.3** ·
devtools, insights **0.2.11**.

- **Opgelost:** in [Verticale gestapelde staven](/nl/charts/vertical-stack-bar) vallen de
  datumlabels op de x-as niet langer boven op de serie-afkortingen. Wanneer een DataSet
  `seriesKeyAbbreviation` meegeeft - de korte letter onder elke groepskolom - beginnen de
  aslabels nu onder die rij in plaats van hem te delen. Het viel op als overlappende tekst
  zodra een drukke as zijn labels -45° kantelde, vooral bij maandelijkse `MM-YYYY`-datums.
  De grafiek reserveert ook de bijbehorende extra ondermarge, zodat de gekantelde labels
  nog passen. Grafieken waarvan de DataSets geen afkorting dragen, blijven onveranderd.

## v1.10.0

Pakketversies: react, wc, angular **1.10.0** · core **1.11.0** · vue, svelte **1.6.2** ·
devtools, insights **0.2.10**.

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
- **Opgelost:** de kale CDN-URL van de web-component-bundle
  (`cdn.jsdelivr.net/npm/@michi-vz/wc`) verwijst nu naar de op zichzelf staande
  browserbundle, zodat een gewone `<script type="module">`-import werkt zonder
  het volledige `/dist/...`-pad uit te schrijven.

## v1.9.0

Pakketversies: react **1.9.0** · core **1.10.0** · wc, angular **1.9.1** · vue, svelte **1.6.1** ·
devtools, insights **0.2.9**.

- **Download elke grafiek als afbeelding of CSV.** Nieuwe exporthelpers in core:
  `chartContextToCsv(ctx)` zet de `getContext().a11yTable` van elke grafiek (de
  volledige, nooit ingekorte datatabel die elke grafiek meedraagt) om naar
  RFC 4180-CSV zonder code per grafiek, en `chartToStyledSvgString` /
  `chartToStyledSvgDataUri` / `chartToPngDataUrl` bouwen een op zichzelf staande,
  correct gestylede SVG of PNG. Geëxporteerde afbeeldingen verloren tot nu toe
  rasterlijnen, aslabels en de nullijn, omdat de grafiek-CSS in
  `adoptedStyleSheets` leeft en onzichtbaar is voor een naïeve serializer; de
  PNG-helper legt bovendien de marks van de canvas-renderer over de SVG-assen.
  React-handles krijgen `getElement()`, zodat de helpers een scoped element
  krijgen in plaats van een fragiele globale DOM-query.
- **Eén tooltip, alle reeksen.** LineCharts `sharedTooltip` (plus een optionele
  `sharedTooltipFormatter`) toont één tooltip met de waarde van elke reeks bij
  het dichtstbijzijnde jaar, naast het dradenkruis, in plaats van alleen de
  dichtstbijzijnde reeks. Doorgegeven door het web component en de
  Angular-wrapper. Zie [Line](/nl/charts/line).
- **De a11y-tabel bevat nu de data zelf.** LineCharts `a11yTable` werd een brede
  tabel per periode: één kolom per x-waarde met hetzelfde label als de as, één
  rij per reeks, `-` voor gaten. Een CSV-export via `getContext()` bevat dus elk
  getekend punt. Statistieken per reeks blijven op `context.series`; dit is de
  enige gedragswijziging van deze release.
- **As-pariteit voor de Gap-grafiek.** [Gap](/nl/charts/gap) krijgt
  `showZeroLineForXAxis` (een doorgetrokken verticale lijn op x=0, nu getekend
  onafhankelijk van `showGrid`) en `maxBarHeight` (een grafiek met 1 of 2 rijen
  rekt zijn balken niet langer over de volle hoogte uit), en de numerieke
  waardeassen van Gap en [Comparable](/nl/charts/comparable) kantelen te drukke
  ticks eerst -45° voordat ze worden uitgedund, zoals de datumassen al deden.
- **Labelcorrecties in de bandgrafieken.** Rijlabels beperken zich tot twee
  regels met een beletselteken in plaats van hun buren te overlappen; lange
  categorielabels roteren in plaats van onterecht uitgedund te worden; een
  [Bubble](/nl/charts/bubble)-label tegen de rechterrand klapt naar links van
  zijn punt in plaats van afgesneden te worden; en
  [Comparable Vertical Bar](/nl/charts/comparable-vertical-bar) tekent de
  kortste subbalk bovenop (een rij waarvan de "voor"-waarde de kleinste was,
  verborg die volledig achter de hogere balk), met de veranderingspijl nu
  gecentreerd boven elk paar.

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
