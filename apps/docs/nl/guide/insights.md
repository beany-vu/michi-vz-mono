---
title: Insights - voorspel, verklaar en bestuur grafieken met AI
---

# Grafieken die voorspellen, zichzelf uitleggen, en met AI praten

::: warning Experimenteel - nog niet stabiel
De AI-laag `@michi-vz/insights` is **experimenteel**: de API, sub-paths, en uitvoer kunnen veranderen in toekomstige releases. De 16 kerngrafieken zijn stabiel; insights (en de nieuwe [Fountain-grafiek](/nl/charts/fountain)) zijn dat nog niet. Pin een versie als je ervan afhankelijk bent.
:::

Een grafiek *tekent* meestal alleen het verleden. `@michi-vz/insights` laat hem **de toekomst voorspellen**,
**zichzelf uitleggen in gewoon Nederlands (of Engels)**, **slechte data betrappen**, en **antwoorden aan een AI-assistent** - allemaal in
de browser, zonder server en zonder dat er iets de pagina verlaat. Het is **opt-in** en gebruikt **gewone, uit het
studieboek bekende methoden** (geen black box); elke michi-vz-grafiek draagt al een gestructureerde `ChartContext`, en
deze functies lezen daar gewoon uit.

<InsightsDemo feature="forecast" />

> Hierboven staat een echte lijngrafiek. Zet **Forecast** aan om een gestreepte voorspelling + gearceerd forecast-gebied te zien;
> **Explain** schrijft een zin uit de data. Geen server - het draait allemaal in je browser.

> [!IMPORTANT] Een model assisteert; het beslist niet.
> Verschillende modellen geven verschillende antwoorden, en zelfs een sterk model kan fout zitten - hoe kleiner en
> sneller het is, hoe meer. Deze tools versnellen het *lezen* van een grafiek; ze nemen er geen verantwoordelijkheid
> voor. Behandel elke modeluitvoer als een startpunt, leun op de deterministische regelgebaseerde fallback als
> eerlijke basislijn, en **verifieer alles wat ertoe doet voordat je erop handelt**. AI is er om te helpen, niet om
> voor je te antwoorden.

---

## Wat het doet

Vier dingen worden mogelijk zodra een grafiek zijn eigen gestructureerde betekenis draagt:

### Lees en bestuur grafieken vanuit een AI-assistent

Dit is de hoofdzaak. Omdat elke grafiek zijn betekenis (`ChartContext`) **en** zijn besturingselementen als
**tools** blootstelt, kan een AI-assistent hem samenvatten, filteren, een serie highlighten, of forecasten - door
functies aan te roepen, niet door pixels te schrapen. Probeer de knoppen (elke is een echte tool-aanroep):

<InsightsDemo feature="agent" />

```ts
// In your app - bring your own LLM caller:
import { createAgent, chartHandle } from "@michi-vz/insights/agent";
const agent = createAgent({ charts: [chartHandle("revenue", chart, props)], llm: myCaller });
await agent.ask("Filter to the top 5 and forecast next quarter");
```

Dezelfde tools worden blootgesteld via **MCP** (Model Context Protocol), zodat **Claude Code, Codex, Cursor, en
Claude Desktop** verbinden zonder enige aangepaste integratie - zie **Agents & MCP** in de referentie hieronder.

### Voorspel de toekomst

Voeg één plugin toe en de grafiek krijgt er een gestreepte voorspelling, een betrouwbaarheidsband, en een
**gebacktest nauwkeurigheidscijfer** bij (zodat het betrouwbaar is, geen gok). Forecasting werkt op Line, **Fan**,
Range, Area, en de stacked-bar-familie.

```ts
import { forecast } from "@michi-vz/insights/forecast";
mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ method: "holt-winters", horizon: 4, level: 0.95 })],
});
// getContext().summary → "...Revenue projected to 189 by 2027 (holt-winters, MAPE 6.1%)."
```

(De demo bovenaan de pagina is dit.) En het is **niet alleen voor lijnen** - dezelfde forecast breidt een
Fan-grafiek uit (geneste betrouwbaarheidsbanden), de stack van een Area-grafiek, een Range-band, en meer:

<InsightsDemo feature="forecast" chart="fan" />

<InsightsDemo feature="forecast" chart="area" />

De **[Fan-grafiek](/nl/charts/fan)** is de speciaal daarvoor gebouwde forecast-presentatie, in één aanroep
gebouwd met `forecastFan()`.

### Leg zichzelf uit, betrap slechte data

De grafiek **detecteert anomalieën** (en markeert ze), schrijft een **narratie in gewoon Nederlands**, en voert
**datakwaliteitsvalidatie** uit - allemaal uit dezelfde gestructureerde context.

<InsightsDemo feature="anomaly" />

<InsightsDemo feature="validate" />

```ts
import { anomaly } from "@michi-vz/insights/anomaly";
import { narrate } from "@michi-vz/insights/narrate";
import { validate } from "@michi-vz/insights/validate";
chart.use(anomaly());   // flags + annotates outliers
chart.use(narrate());   // richer plain-English summary (also feeds screen readers)
chart.use(validate());  // warns via onDataWarning AND marks the bad points red on the chart
```

### Reinig en verbind ook je data

Diezelfde gestructureerde betekenis ruimt ook rommelige data op en vindt dingen op basis van wat ze betekenen, niet
hoe ze gespeld zijn - allemaal standaard model-vrij, allemaal opt-in naar een echt model wanneer je meer wilt:

- **[Labels reconciliëren](#reconcile-labels)** - vouw `USA` / `united states` / `U.S.A.` samen tot
  één schone groep, zodat totalen niet langer splitsen over spellingen.
- **[Koppel over datasets](#match-across-datasets)** - koppel twee anders gespelde lijsten (een
  CRM-export en een ERP-export) tot één eerlijke, samengevoegde grafiek.
- **[Slim zoeken](#smart-search)** - vind een serie op wat je bedoelt ("geld dat binnenkomt"), niet
  op het exacte label.
- **[Breng je eigen model mee](#bring-a-model)** - elke model-ondersteunde functie valt terug op een
  deterministisch, regelgebaseerd antwoord; zet **Real model** aan in de narratie-demo om het proza
  van een klein in-browser-model naast elkaar live te vergelijken.

---

## Voorbeelden uit de praktijk

Elke grafiek hieronder is het echte werk - hij berekent in je browser terwijl de pagina laadt, en hij is
klikbaar (schakel Canvas/SVG om, druk op **Explain ▸**). Het punt is niet de demo; het is dat een analist, een
bankier, een farmaceutisch wetenschapper, of een historicus het antwoord *op de grafiek* krijgt - geen notebook,
geen server. Elke term wordt de eerste keer dat hij verschijnt uitgelegd, en verzameld in de
[Woordenlijst](#glossary).

### Forecast: waar gaat dit heen, en haalt het het doel?

De gestreepte lijn projecteert de recente trend. De gearceerde **betrouwbaarheidsband** is de eigen historische
fout van het model, dus toont hij een eerlijke *bandbreedte* in plaats van één hoopvol getal. En waar de projectie
een doel raakt, markeert een rood **valpunt** *wanneer* het doel bereikt wordt - een antwoord op zowel "waar gaat
dit heen?" als de goal-seek-vraag "gaat het dat halen, en wanneer?".

**Het omzetpercentage van een bank - is het jaareindeplan haalbaar?**

<InsightsDemo feature="forecast" dataset="bank-revenue" />

**Een klinische studie - zal patiënt 300 ingeschreven zijn voor de deadline van het uitleesmoment?**

<InsightsDemo feature="forecast" dataset="pharma-enrollment" />

**Inflatie (CPI) - de band is breed omdat de toekomst écht onzeker is.**

<InsightsDemo feature="forecast" dataset="cpi" />

**Een elektriciteitsnet - haalt de piekvraag de capaciteit voordat de volgende centrale gebouwd is?**

<InsightsDemo feature="forecast" dataset="energy-demand" />

**Een SaaS-boekhouding - hoe dicht ligt terugkerende omzet bij de volgende mijlpaal?**

<InsightsDemo feature="forecast" dataset="saas-mrr" />

### Scenario's: best, base, worst

Eén projectie is zelden genoeg. Voeg **scenario**-lijnen toe - een optimistische en een pessimistische
groeiaanname - en dezelfde historie waaiert uit tot een best-/base-/worst-spreiding, zoals een CFO of een
bankstresstest de toekomst inkadert.

**Een bankstresstest - omzet onder een opwaarts en een ernstig scenario, tegenover de planlijn.**

<InsightsDemo feature="forecast" dataset="scen-bank-stress" />

**De cashrunway van een startup - wanneer bereikt het geld nul als de volgende ronde een kwartaal uitloopt?**

<InsightsDemo feature="forecast" dataset="scen-startup-runway" />

**De lancering van een nieuw medicijn - sterke versus trage adoptie vanaf dag één.**

<InsightsDemo feature="forecast" dataset="scen-pharma-uptake" />

### Narratie: de grafiek schrijft zijn eigen kop (en verzint nooit iets)

Een drukke grafiek verbergt zijn eigen verhaal. `narrate()` leest de data en schrijft één zin in gewone taal: hij
noemt de **top mover** (de serie die het meest bewoog tussen begin en eind) en de op-versus-neer-verdeling. Elk
cijfer is uit de getallen berekend, dus - anders dan een chatbot - kan hij er geen verzinnen. Druk op
**Explain ▸** om de zin te zien.

**Een retailbank - digitale deposito's halen stilletjes het filiaalnetwerk in.**

<InsightsDemo feature="narrate" dataset="narr-bank-channel" />

**Een studie met twee locaties - welke draagt het onderzoek écht?**

<InsightsDemo feature="narrate" dataset="narr-pharma-sites" />

**Reële lonen - een decennium dat terrein verloor, ondanks de recente opleving.**

<InsightsDemo feature="narrate" dataset="narr-real-wages" />

**Een eeuw verstedelijking - het platteland loopt leeg terwijl de steden vollopen.**

<InsightsDemo feature="narrate" dataset="narr-urbanisation" />

**De elektriciteitsmix - kolen verdwijnen, hernieuwbaar neemt de leiding.**

<InsightsDemo feature="narrate" dataset="narr-energy-mix" />

### Anomalie: wat hoort er niet bij?

Een **anomalie** is een jaar dat opvalt tussen de rest van de serie. Standaard wordt hij gevonden met een
**z-score** (hoeveel standaardstappen een punt van het gemiddelde afligt; voorbij ongeveer drie wordt hij
gemarkeerd) en aangeduid met een stip - waardoor "is er iets vreemds gebeurd?" één blik wordt. De exacte logica
van alle drie detectiemethoden (z-score, IQR-hekken, forecast-band), hun drempels en hun beperkingen worden
uitgeschreven in [Methodologie](#methodology---the-exact-logic-behind-every-insight).

**Een bank - het jaar dat kaartfraudeverliezen uit de trend breken (een inbreuk of scamgolf).**

<InsightsDemo feature="anomaly" dataset="anom-fraud" />

**Medicijnveiligheid - het jaar dat gemelde bijwerkingen pieken, een signaal voor geneesmiddelenbewaking.**

<InsightsDemo feature="anomaly" dataset="anom-adverse" />

**Operaties - het jaar dat pieklatentie de pan uit rijst, een teken van een grote storing.**

<InsightsDemo feature="anomaly" dataset="anom-latency" />

**Retail - het jaar dat productretouren omhoogschieten, wijzend op een defecte batch.**

<InsightsDemo feature="anomaly" dataset="anom-returns" />

**Een economie - het jaar dat het bbp instort, een recessieschok tegenover gestage groei.**

<InsightsDemo feature="anomaly" dataset="anom-gdp" />

## Meer uit de gereedschapskist

De tabel **Sub-paths** verderop toont meer dan de galerij hierboven laat zien. Hier zijn nog zes van die plugins
die echt draaien - elk model-vrij, deterministisch, en in een paar regels aan te sluiten. Ze beantwoorden vragen
die een gewone grafiek laat liggen: *wat zou het kosten om het getal te halen, wat zijn de kansen, wanneer keerde
de trend écht, en wat is seizoensgebonden versus echte groei.*

**Goal-seek - wat zou het kosten om het getal te halen?** Forecasting laat de tijd vooruitlopen; goal-seek laat
hem *achterwaarts* lopen vanaf een doel dat jij instelt. Verplaats het doel en kijk hoe het benodigde tempo (de
gouden gestreepte lijn) reageert, met een oordeel of jouw recente tempo dat haalt.

<PluginLab feature="goalseek" />

**Monte Carlo - de kansen, niet alleen een lijn.** Eén forecastlijn verbergt het risico. Dit simuleert
honderden toekomsten en rapporteert de *band* plus de kans om een doel te halen - geseed, zodat het exact
herhaalt, met een **Re-roll** om de spreiding te zien verschuiven.

<PluginLab feature="montecarlo" />

**Changepoints - wanneer keerde de trend écht?** Gemiddelden vervagen het moment waarop een verhaal draait. Dit
vindt waar de helling structureel verschuift en kleurt de lijn per regime - hier een nette
piek-dan-daling.

<PluginLab feature="changepoints" />

**Seizoensgebondenheid - scheid echte groei van "het is weer december".** Eén aanroep splitst een golvende lijn
in een gladde trend en een herhalend seizoenspatroon, en detecteert de cycluslengte zelf.

<PluginLab feature="seasonal" />

**Aggregate - ruwe rijen naar een grafiek in één aanroep.** Voordat je data kunt tonen in een grafiek moet je hem
meestal *vormen*. `aggregate()` doet group-by + measures zonder dependencies (opt-in naar DuckDB-Wasm voor echte
SQL over miljoenen rijen). Verander de groepering en het herrolt.

<PluginLab feature="sql" />

**Sonify - hoor de trend.** Een toegankelijkheidswinst: elke waarde wordt een toonhoogte, zodat een stijgende
serie *klinkt* alsof hij stijgt. Druk op play - de balken zijn de pure, testbare `valuesToTones()`-uitvoer.

<PluginLab feature="sonify" />

## Reinig, koppel en doorzoek je data

Vier dingen die AI aan je data geeft, allemaal in de browser: **reconciliëren** van rommelige labels binnen
één lijst, **koppelen** van twee lijsten die dingen anders spellen, **zoeken** naar een serie op betekenis, en
**categoriseren** van vrije tekst zonder regels - aangedreven door kleine open modellen, niet een gigantisch
cloudmodel.

**Tekst omzetten in betekenis.** Een *embedding* is een manier om een woord of zin om te zetten in een lijst
getallen, zo gerangschikt dat dingen die *hetzelfde betekenen* dicht bij elkaar terechtkomen - zodat een
computer kan zien dat `USA` en `United States` dezelfde plek zijn, ook al delen ze geen letters.
`@michi-vz/insights` verzint hier niets van; het laat zien hoe je de open-source-modellen die de gemeenschap al
gebouwd heeft kunt *benutten*: kleine **embedding-modellen** (de BERT-/MiniLM-familie) en **klein-genoeg open
LLM's** (Qwen, Gemma, Phi), allemaal draaiend **client-side in je browser** - geen server, geen API-sleutel,
niets ergens naartoe gestuurd. Gericht op jouw chartdata verbeteren ze de **kwaliteit** ervan en ruimen ze
**foute, rommelige data** op: vier alledaagse problemen worden één truc - **samenvoegen** van wat hetzelfde
betekent, **koppelen** van wat twee systemen anders spellen, **vinden** van wat je bedoelt, **sorteren** van het
ongesorteerde. De **model-vrije** standaard draait direct offline (karakter-n-grams, prima voor spelling en
typefouten); **kies een model** uit de dropdown (MiniLM ~23 MB → MPNet ~110 MB, groottes getoond, on-demand
geladen) om van het matchen van *letters* naar het matchen van *betekenis* te gaan - en breng een klein LLM mee
om het resultaat te **certificeren**.

### Labels reconciliëren

**Het probleem dat elke analist kent.** Je data komt binnen uit drie bronnen en elke bron spelt hetzelfde ding
anders - `United States`, `united states`, `USA`. Groepeer op exacte match en je grafiek splitst één land op in
drie korte balken met **verkeerde totalen**, en een middag gaat op aan het handmatig schrijven van een
opzoektabel.

**Embeddings lossen het op via betekenis.** Zet elk label om in een vector en voeg de dichtbij elkaar liggende
samen. De **model-vrije** standaard (direct, offline) vouwt al spelling, hoofdlettergebruik, spatiëring en
typefouten samen. Laad een echt model (de dropdown toont de grootte van elk) en het voegt ook afkortingen en
vertalingen samen - `USA` ≈ `United States`, `Deutschland` ≈ `Germany`, `Nippon` ≈ `Japan`. **Certify** voegt
dan een klein LLM toe dat elke groep bevestigt en de gezaghebbende naam stempelt.

<EmbeddingsLab />

> Begin bij **Raw labels** om de rommel te voelen - 10 balken, gesplitste totalen - druk dan op **Reconcile**.
> Model-vrij voegt de spellingsvarianten offline samen; het laden van een model (MiniLM → MPNet) voegt ook de
> afkortingen en vertalingen samen, tot de 3 echte landen. **Certify** geeft die groepen door aan een klein
> in-browser-LLM voor een gezaghebbende naam.

> [!NOTE] Gelijkenis stelt voor, een model *certificeert*.
> Een embedding-model draait volledig **offline** - het heeft geen internet en zoekt niets op. Het voegt
> `Deutschland` samen met `Germany` omdat hun vectoren tijdens de training dicht bij elkaar terechtkwamen, niet
> omdat het het land "kent". De samenvoeging wordt dus niet alleen bepaald op de ruwe drempel: een label sluit
> zich pas bij een groep aan wanneer het **beslissend dichter bij die groep ligt dan bij welke andere ook** (een
> vertrouwensmarge), wat voorkomt dat twee aparte landen samenvallen alleen omdat ze dicht bij elkaar liggen.
> Voor een *gezaghebbend* antwoord voert **Certify** een **cascade** uit (geen mixture-of-experts - dat is intern
> aan één model): embeddings stellen de samenvoegingen goedkoop voor, dan bevestigt een **klein**
> in-browser-LLM (Qwen / Gemma, groottes getoond) dat elke groep één land is en geeft de canonieke naam terug.
> Dat model kent landen echt, maar heeft **WebGPU** nodig en de gewichten downloaden eenmalig. (In een echte app
> zou een aangepaste caller naar een groter model of een lokale **Ollama**-server kunnen wijzen; een statische
> website kan Ollama niet direct aanroepen - het CORS-beleid van de browser blokkeert `localhost`. Zie **Agents
> & MCP** hieronder.)

> [!NOTE] De weddenschap: een snel model maakt het af, een slimmer model verfijnt.
> De stroom hierboven is een bewust experiment - laat een snel, naïef model (de embeddings) het meeste werk
> doen, roep dan een zwaarder, slimmer model (een klein LLM) alleen aan om te verfijnen wat overblijft. Het
> ruilt wat nauwkeurigheid vooraf in voor snelheid en kosten, en betaalt voor het grotere model alleen waar het
> ertoe doet. Dit is een idee dat hier getest wordt, geen vaststaande leer; er valt ook andersom voor te
> pleiten, en de aanpak - samen met deze resultaten - zal evolueren zoals de modellen dat doen.

### Koppel over datasets

**Het volgende probleem: twee aparte bronnen, niet één rommelige lijst.** Een CRM-export en een ERP-export
noemen elk dezelfde klanten, landen, of producten - in elk systeem net iets anders gespeld.
`reconcileLabels` ruimt duplicaten op *binnen* één lijst; `matchLabels` koppelt entiteiten *over* twee lijsten,
zodat twee datasets één eerlijke grafiek worden.

<MatchLab />

> Twee kleine datasets, met opzet niet-matchend. Druk op **Match** en de zekere paren lichten op met hun
> gelijkenis; de overblijvers blijven eerlijk ongekoppeld (met een dichtstbijzijnde-misser-hint) in plaats van
> geforceerd gekoppeld te worden - en de samengevoegde rijen tekenen als één grafiek, twee subbalken per rij.

### Slim zoeken

Een dashboard met tientallen series en je herinnert je de exacte naam niet meer. Typ wat je *bedoelt* en
embeddings rangschikken elke serie op gelijkenis - geen zoekwoord hoeft te matchen.

<SemanticSearchLab />

> Probeer eerst `customer` - model-vrij vindt de klant-KPI's op gedeelde letters. Probeer dan
> `money coming in`: alleen **BERT** bereikt `Revenue`, omdat ze *betekenis* delen, geen spelling.

### Categoriseren

Een stapel enquêteopmerkingen zonder tags. Geef embeddings alleen de **themanamen** (geen zoekwoordenlijsten,
geen training) en elke opmerking valt in zijn dichtstbijzijnde thema - zodat ongestructureerde tekst een
grafiek wordt waar je op kunt handelen. Dit is degene die écht een model nodig heeft: `keeps freezing` →
**Performance** deelt geen letters met welke themanaam ook.

<CategorizeLab />

> **Laad BERT** en kijk hoe de opmerkingen op basis van betekenis in het juiste thema klikken - `too expensive` →
> Pricing, `love the clean new look` → Design & UX - waarvan geen enkele een zoekwoord deelt met hun thema.

Hoe schrijf je het - eerst reconciliëren, dan de andere embedding-toepassingen:

::: code-group

```ts [Reconcile labels]
import { reconcileLabels } from "@michi-vz/insights/embeddings";
// one call: groups messy labels by meaning, with a confidence gate + a tidy representative name
const groups = await reconcileLabels(rawLabels); // { backend: "transformers" } adds synonyms
// → [{ name: "United States", members: ["United States", "USA", ...] }, ...]
// now sum your series by group.name instead of the raw label → clean, correct totals
```

```ts [Match two datasets]
import { matchLabels } from "@michi-vz/insights/embeddings";
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmCountries, erpCountries);
// matches → [{ source: "USA", target: "United States", similarity: 0.91 }, ...]
const rows = matches.map((m) => ({
  label: m.target,
  valueBased: crmTotals[m.source],     // two sources, one row -
  valueCompared: erpTotals[m.target],  // feeds straight into mountComparableHorizontalBarChart
}));
```

```ts [Embed with BERT]
import { createEmbedder, cosineSimilarity } from "@michi-vz/insights/embeddings";
// opt into a small in-browser BERT (MiniLM via Transformers.js, WebGPU); lazy, nothing bundled
const e = await createEmbedder({ backend: "transformers" }); // default all-MiniLM-L6-v2
const [a, b] = await e.embed(["USA", "United States"]);
cosineSimilarity(a, b); // ≈ 0.8 - close, even with no letters in common
```

```ts [Search by meaning]
import { findSimilar } from "@michi-vz/insights/embeddings";
// rank a large chart catalog by what a query means, not how it is spelled
const ranked = await findSimilar("revenue", chartLabels, (l) => l);
```

```ts [Dashboard RAG]
import { findSimilar } from "@michi-vz/insights/embeddings";
// retrieve the charts most relevant to a question, feed THEIR context to an LLM (see Agents)
const top = (await findSimilar(question, charts, (c) => c.getContext().summary)).slice(0, 3);
```

:::

Dezelfde engine, andere toepassingen: een grote chartcatalogus **doorzoeken** op betekenis, vergelijkbare
series **clusteren**, en **dashboard-brede RAG** - de juiste grafieken ophalen zodat een agent kan antwoorden
over een heel dashboard (zie **Agents & MCP**). Embeddings zijn de retrievallaag; de hoofdzaak is wat erbovenop
zit.

## Methodologie - de exacte logica achter elke insight

Niets hier is een black box: elke insight is een met naam genoemde, uit het studieboek bekende methode die je
met de hand kunt verifiëren. Deze sectie geeft het algoritme, de standaardwaarden, en de beperkingen, functie
voor functie.

### Forecast

- **Methode (standaard `"holt-winters"`):** Holt's dubbele exponentiële afvlakking - twee lopende schattingen,
  *niveau* en *trend*, bijgewerkt bij elk punt (`alpha = 0.5` voor niveau,
  `beta = 0.3` voor trend; nog geen seizoensterm). De forecast verlengt het laatste niveau langs de laatste
  trend. `method: "linear"` past in plaats daarvan één ordinary-least-squares-lijn door de hele serie en
  verlengt die.
- **Betrouwbaarheidsband:** de standaardfout van het residu van de one-step-ahead in-sample-fit, verbreed
  met `sqrt(step)` naarmate de forecast verder vooruitkijkt, keer de z-waarde van je `level`
  (standaard 95%). Brede band = het model paste de historie slecht; die eerlijkheid is de feature.
- **Nauwkeurigheid (MAPE/RMSE):** een echte holdout-backtest - het laatste derde deel van de serie (tot aan
  de horizon) wordt verborgen, het model wordt gefit op de rest, en zijn voorspellingen worden gescoord tegen
  wat er daadwerkelijk gebeurde. Series korter dan 6 punten vallen terug op in-sample-nauwkeurigheid.
- **Beperkingen:** alleen numerieke x-assen; geen seizoensterm (een sterk seizoensgebonden serie voorspelt
  zijn trend, niet zijn golfbeweging - decomponeer eerst, zie hieronder).

### Anomaliedetectie

Drie methoden via `anomaly({ method, threshold })`; elk gemarkeerd punt draagt
`{ index, value, score, kind }` en het toolresultaat bevat nu deze uitleg letterlijk:

- **`zscore` (standaard, drempel 3):** `score = |waarde - gemiddelde| / standaarddeviatie` over de
  serie zelf; gemarkeerd voorbij de drempel (`kind: "high"` boven het gemiddelde, `"low"` eronder).
  3 is de conservatieve klassieke afsnijding; 2 markeert mildere pieken. Let op: een sterke trend
  vergroot de standaarddeviatie en verbergt uitschieters - gebruik daar `forecast`.
- **`iqr` (drempel 1.5):** Tukey's hekken - gemarkeerd onder `Q1 - k*IQR` of boven `Q3 + k*IQR`
  (Q1/Q3 = 25e/75e percentiel). Kwartielen negeren extremen, dus dit blijft robuust wanneer de
  data al wilde punten bevat.
- **`forecast`:** trend-bewust - elk punt wordt getoetst tegen een one-step-ahead-forecast gebouwd
  uit ALLEEN de historie ervoor, gemarkeerd wanneer buiten de 95%-band; `score` = gemiste
  standaardfouten.

### Narratie

De standaardnarrator is **regelgebaseerd en deterministisch** - hij leest alleen de gestructureerde
`ChartContext` (nooit ruwe pixels, nooit een model): de top mover op absolute verandering (met zijn
percentage), de op-versus-neer-trendverdeling, en het grootste totaal voor categorische grafieken. Zelfde
invoer, zelfde zin, elke keer - en hij kan geen getal verzinnen dat niet in de context zit. Modelgedreven
proza (`explainChart`) is opt-in en valt altijd terug op de regels.

### Validatie

Pure vorm-/statistiekcontroles over de serie: lege datasets, niet-eindige waarden, dubbele data,
en niet-monotone data - elk gerapporteerd als een getypeerde `DataWarning` met de exacte index,
en optioneel geannoteerd op de grafiek.

### Changepoints, seizoensgebondenheid, Monte Carlo

- **Changepoints:** voor elke kandidaat-splitsing wordt één OLS-lijn ervoor en één erna gefit;
  de splitsing wordt gescoord op `|slopeAfter - slopeBefore|` en alleen lokale maxima boven een
  drempel worden behouden. Eenvoudige, uitlegbare detectie van trendbochten.
- **Seizoensgebondenheid:** klassieke additieve decompositie - een gecentreerd voortschrijdend
  gemiddelde als trend, een gemiddeld-gecentreerde seizoenscomponent per fase, en een restterm; de
  periode wordt gedetecteerd via autocorrelatie.
- **Monte Carlo:** de deterministische forecast is het middelste pad; veel toekomsten worden
  gesimuleerd door Gaussiaanse restruis toe te voegen, geschaald met `se*sqrt(step)`, met een
  **geseede** PRNG (mulberry32) zodat runs reproduceerbaar zijn. Kwantielen van de runs geven de
  band; eindstap-tellingen geven overschrijdingskansen.

### Embeddings (reconcile, match, search, sort)

De standaardembedder is **model-vrije hashing** (karakter-n-grams in een vector met vaste grootte,
L2-genormaliseerd) - volledig offline en deterministisch; hij voegt spelling-/hoofdletter-/typfoutvarianten
samen maar geen echte synoniemen. `backend: "transformers"` upgradet naar MiniLM (zie
[Waar modellen vandaan komen](#where-models-come-from-and-how-to-change-it)). Gelijkenis is cosinus;
samenvoegdrempels staan standaard op 0.6 (hash) / 0.7 (model).

`reconcileLabels` clustert *binnen* één lijst (greedy single-linkage, gepoortd door een
vertrouwensmarge zodat een label zich alleen aansluit bij een groep waar het beslissend het dichtst
bij ligt). `matchLabels` koppelt in plaats daarvan *over* twee lijsten: elk bronlabel koppelt aan
zijn ene beste doel, dezelfde vertrouwensmarge poort de keuze van de bron, en standaard telt een
paar alleen als een **wederzijdse beste match** - beide kanten kiezen de ander als eerste - wat
voorkomt dat twee bronrijen op hetzelfde doel botsen. Alles wat de poorten niet haalt, wordt
teruggemeld als ongekoppeld met zijn dichtstbijzijnde bijna-match, nooit stilletjes weggegooid.

## Waarom het te vertrouwen is (en voor wie het is)

- **Geen black box.** Elk getal is een met naam genoemde, uit het studieboek bekende methode (Holt, MAPE,
  z-score, IQR, OLS…) - de exacte logica per functie wordt uitgeschreven in [Methodologie](#methodology---the-exact-logic-behind-every-insight)
  hierboven. Dezelfde primitieven die een statistiekbibliotheek gebruikt.
- **Deterministisch + getest.** Statistische functies geven dezelfde uitvoer voor dezelfde invoer en zijn
  gedekt door een uitgebreide testsuite; alles wat willekeurig is (Monte Carlo) is geseed.
- **Data blijft in de browser.** Geen server, geen upload. Externe modelbackends zijn strikt opt-in
  en gedocumenteerd als "data verlaat de client".
- **Geen lock-in.** Er wordt nooit een model meegebundeld; modelfuncties zijn opt-in en **vallen terug** op
  een werkende statistische/regelgebaseerde versie als een model niet beschikbaar is.

**Voor wie is het:**

- **Bouw je een product (embedded analytics)?** Lever forecasting en zichzelf uitleggende grafieken aan
  *jouw* gebruikers - client-side, geen Python-service nodig.
- **Ben je een data-/marktanalist?** De methoden die je al kent (Holt-Winters, MAPE, z-score) - nu
  draaiend tijdens runtime in de app, niet alleen in een notebook (zie **vs een pandas-/notebookworkflow** hieronder).
- **Bouw je met AI-agents?** Jouw grafieken worden MCP-tools die een agent kan lezen en besturen.

## Aan de slag

```bash
npm i @michi-vz/insights
```

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

const chart = mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ horizon: 4 })],
});
```

Dat is alles - de grafiek forecast nu. Alles hieronder is referentie.

---

## Forecasting

```ts
forecast({
  method: "holt-winters",                                   // or "linear" / lazy "arima"
  horizon: 8,
  level: 0.95,
  zone: true,                                               // shade the forecast region (toggleable)
  scenarios: [{ name: "optimistic", growth: 0.15 }, { name: "pessimistic", growth: -0.1 }],
  trendline: true,
  threshold: { value: 0, label: "Break-even" },             // reference line + "fall point"
  onThresholdBreach: (b) => alertOps(b),                    // fires when the forecast crosses it
});
```

Meer pure, deterministische helpers in `@michi-vz/insights/forecast`: `forecastFan()`,
`decompose()` / `detectPeriod()` (STL-seizoensgebondenheid), `detectChangepoints()`,
`monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (goal-seek & run-rate).

## Narratie: aanpassen, lokaliseren (i18n), of een model meebrengen

Hier is narratie - een grafiek met twee series die zijn eigen zin schrijft. Druk op **Explain ▸** voor de
instant regelgebaseerde zin; zet **Real model** aan om een klein in-browser-taalmodel te laden (de grootte
wordt getoond voordat er iets gedownload wordt) en lees zijn proza naast de regels, side by side:

<InsightsDemo feature="narrate" model-explain />

De standaard `narrate()` is **regelgebaseerd** (geen model). Maak het op drie manieren van jezelf:

```ts
import { narrate, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";

// 1. i18n - translate the built-in phrases (the sentence logic stays):
narrate({ strings: {
  topMover: (label, dir, pct) => `${label} a ${dir === "rose" ? "le plus augmenté" : "le plus baissé"}${pct}.`,
  trendSplit: (up, down) => `${up} séries en hausse et ${down} en baisse.`,
}});

// 2. Fully custom narrator - any wording, any language:
narrate({ render: (ctx) => myTemplate(ctx) });
```

### Breng een model mee

Probeer het live in de demo hierboven: zet **Real model** aan, kies een klein model op zijn grootte, en
vergelijk zijn proza met de regelgebaseerde zin, side by side.

`explainChart(ctx, { backend, model })` upgradet het proza met een model en **valt altijd terug** op de
regelgebaseerde tekst. Geen plugin nodig - roep het aan op verzoek. **Kleine taalmodellen die in de
browser draaien** hebben de voorkeur (local-first, privé, geen server):

```ts
// In-browser via Transformers.js (ONNX + WebGPU). Phi-3-mini (MIT) or Google Gemma 2 (2B):
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.phi3 });
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.gemma });

// In-browser via WebLLM (WebGPU):
await explainChart(chart.getContext(), { backend: "webllm", model: SLM_PRESETS.webllm.gemma });

// Or your own remote model (data leaves the client - opt-in):
await explainChart(chart.getContext(), { backend: "remote", caller: (prompt) => callClaude(prompt) });
```

**Draai je al lokale AI?** Haak er direct op in - geen download, geen Hugging Face, prompts gaan alleen
naar het endpoint dat jij noemt. Twee kant-en-klare callers dekken de gangbare lokale servers:

```ts
import { ollamaCaller, openaiCompatCaller } from "@michi-vz/insights/narrate";

// Ollama (native API, default http://localhost:11434):
await explainChart(ctx, {
  backend: "remote",
  caller: ollamaCaller({ model: "llama3.2" }),
});

// LM Studio, llama.cpp server, vLLM, LocalAI - anything OpenAI-compatible:
await explainChart(ctx, {
  backend: "remote",
  caller: openaiCompatCaller({ url: "http://localhost:1234", model: "qwen2.5" }),
});
```

Beide gooien een fout bij falen, dus narratie valt terug op de deterministische regelgebaseerde zin - de
grafiek eindigt nooit leeg omdat een lokale server plat lag.

`SLM_PRESETS` levert model-id's voor **Phi-3-mini** en **Gemma 2 (2B)**. Het model wordt lui geladen, alleen
wanneer aangeroepen; er wordt niets meegebundeld, en als het niet kan laden wordt de regelgebaseerde tekst
teruggegeven. Combineer met `strings` / `render` zodat zelfs de fallback in jouw taal is.

Een eerste modelload downloadt gewichten, dus toon een loader met `onProgress` (aangesloten op
Transformers.js / WebLLM). De demo's hierboven gebruiken een rustige, Noords-stijl "denk"-indicator terwijl
het draait:

```ts
await explainChart(ctx, {
  backend: "transformers",
  model: SLM_PRESETS.transformers.gemma,
  onProgress: (p) => setLoading(p.status, p.progress), // drive your own loading UI
});
```

### Waar modellen vandaan komen (en hoe je dat verandert)

Modeldownloads mogen nooit een verrassing zijn. Hier staat precies wat elke backend ophaalt, vandaan,
standaard:

| Backend | Downloadt? | Standaardbron |
| --- | --- | --- |
| `rules` (standaard) | Niets | Volledig offline, deterministisch |
| `transformers` | Modelgewichten, bij eerste gebruik | **`https://huggingface.co`** (gecachet in de browser na de eerste load) |
| `webllm` | Modelgewichten, bij eerste gebruik | Het vooraf gebouwde register van WebLLM (gehost op Hugging Face), gecachet in de browser |
| `remote` | Niets | Jouw prompts gaan naar **jouw** endpoint (de `caller`-optie) - bijv. een lokale Ollama-/llama.cpp-server of jouw API. Data verlaat de pagina; dat is de opt-in. |

Vraag het de bibliotheek zelf voordat je iets laadt, en toon het aan je gebruikers:

```ts
import { describeModelSource, SLM_PRESETS } from "@michi-vz/insights";

const src = describeModelSource("transformers", SLM_PRESETS.transformers.phi3);
// { host: "https://huggingface.co",
//   url:  "https://huggingface.co/Xenova/Phi-3-mini-4k-instruct/resolve/main/",
//   downloads: true, note: "Transformers.js downloads the model files from ..." }
```

En stuur het om met `modelSource` (werkt op `explainChart` en `createEmbedder`):

```ts
// A mirror (e.g. hf-mirror.com, or your artifact proxy):
await explainChart(ctx, {
  backend: "transformers",
  modelSource: { remoteHost: "https://models.example.com" },
});

// Self-hosted, fully offline - serve the model directory from your own origin
// and FORBID any remote download (intranet/compliance):
await explainChart(ctx, {
  backend: "transformers",
  model: "my-fine-tuned-model",
  modelSource: { localModelPath: "/models/", allowRemoteModels: false },
});

// WebLLM self-hosting: point its registry at your own weights:
await explainChart(ctx, {
  backend: "webllm",
  webllmAppConfig: { model_list: [{ model: "https://your.cdn/phi3/", model_id: "phi3", model_lib_url: "https://your.cdn/phi3/lib.wasm" }] },
});

// No download at all - your own API (local or remote):
await explainChart(ctx, { backend: "remote", caller: (prompt) => fetch("/api/llm", { method: "POST", body: prompt }).then(r => r.text()) });
```

## Agents & MCP

Hetzelfde register voedt de demo hieronder - elke knop is een echte tool-aanroep tegen de grafiek
(dezelfde tools die een MCP-client zoals Claude Code zou aanroepen):

<InsightsDemo feature="agent" />

```ts
import { createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";
const registry = createAgentRegistry();
registry.register(chartHandle("revenue", chart, props));
createMcpServer(registry, stdioTransport(), { name: "michi-vz" });
```

Tools: `get_chart_context`, `summarize_chart`, `list_series`, `forecast_series`,
`detect_threshold_breach`, `set_filter`, `highlight`, `set_disabled`, `set_data`. De context van elke
grafiek is ook een leesbare `michivz://chart/<name>`-resource. Een `messagePortTransport` overbrugt de
grafieken van een draaiende webapp.

---

## Referentie

### Sub-paths

Elke mogelijkheid is zijn eigen tree-shakeable import:

| Import | Wat je krijgt | API |
| --- | --- | --- |
| `@michi-vz/insights/forecast` | `forecast()`-plugin (gestreepte voorspelling + band + gebacktest nauwkeurigheid), scenario's, trendlijn, drempel + "valpunt", `forecastFan()` | [forecast](/nl/api/insights/forecast) |
| `@michi-vz/insights/forecast` (extra's) | `decompose()` / `detectPeriod()` (seizoensgebondenheid), `detectChangepoints()`, `monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (goal-seek) | [forecast extras](/nl/api/insights/forecast-extras) |
| `@michi-vz/insights/anomaly` | `anomaly()` / `detectAnomalies()` - z-score-/IQR-/forecast-band-uitschieters | [anomaly](/nl/api/insights/anomaly) |
| `@michi-vz/insights/validate` | `validate()` - rijkere datakwaliteitswaarschuwingen | [validate](/nl/api/insights/validate) |
| `@michi-vz/insights/narrate` | `narrate()` / `explainChart()` - regelbasislijn, opt-in SLM/remote | [narrate](/nl/api/insights/narrate) |
| `@michi-vz/insights/embeddings` | `reconcileLabels()` / `matchLabels()` / `findSimilar()` / `createEmbedder()` - hash-fallback, opt-in BERT/MiniLM | [embeddings](/nl/api/insights/embeddings) |
| `@michi-vz/insights/sql` | `aggregate()` - group-by/measures (opt-in DuckDB-Wasm) | [aggregate](/nl/api/insights/sql) |
| `@michi-vz/insights/sonify` | `sonify()` - hoor een serie als toonhoogte | [sonify](/nl/api/insights/sonify) |
| `@michi-vz/insights/agent` | `createAgent()` + tool-register | [agent & MCP](/nl/api/insights/agent) |
| `@michi-vz/insights/mcp` | `createMcpServer()` - Claude Code / Codex / Cursor | [agent & MCP](/nl/api/insights/agent) |

### Hoe het werkt (de logica, in gewone taal)

- **Forecast.** Fit een model (Holt-Winters volgt *niveau* + *trend*; lineaire regressie past een
  best-fit-lijn) → projecteer vooruit. De **band** komt uit de eigen historische foutspreiding van het model
  (breder wordend met afstand). Een **backtest** verbergt de laatste paar echte punten en meet de fout →
  het nauwkeurigheidscijfer.
- **Anomalie.** Bereken het gemiddelde en de spreiding, markeer dan punten die te ver afliggen - via
  **z-score** (hoeveel standaarddeviaties een punt van het gemiddelde afligt; gemarkeerd voorbij ongeveer 3) of
  **IQR** (of een punt buiten het gebruikelijke middengebied van de data valt).
- **Narrate / Explain - waar de woorden vandaan komen.** **Standaard is er helemaal geen AI-model**:
  `narrate()` leest de gestructureerde `ChartContext` (trend, grootste mover, %-verandering, totalen) en vult
  zinssjablonen in. Het is pure, deterministische stringsamenstelling - direct en offline. `explainChart()`
  kan **optioneel** upgraden naar een echt **generatief** taalmodel: `backend: "transformers"` laadt een
  klein tekstgeneratiemodel (standaard Phi-3-mini) in de browser via Transformers.js, `backend:
  "webllm"` draait Llama/Phi op WebGPU, of `backend: "remote"` roept een eigen model van jou aan (bijv. een
  Claude-API). Elk daarvan krijgt de `ChartContext` als prompt en **valt terug op de regels** als niet
  beschikbaar.
  > **Geen BERT.** BERT (in `@michi-vz/insights/embeddings`) zet tekst om in vectoren voor *gelijkenis /
  > zoeken*, niet voor het schrijven van zinnen. Narratie is standaard regels, of een klein generatief LLM
  > wanneer opt-in - twee verschillende taken.

### Woordenlijst

Betekenissen in gewoon Nederlands van de termen die deze grafieken gebruiken:

- **Valpunt** - de plek waar de geprojecteerde lijn naar verwachting een doel bereikt dat je belangrijk vindt
  (een break-even, een streefwaarde), of hij er nu naartoe klimt of naar zakt; het beantwoordt "wanneer komen we daar aan?".
- **Betrouwbaarheidsband (prediction interval)** - de gearceerde zone rond de forecastlijn die het bereik
  toont waarin de toekomstige waarde waarschijnlijk terechtkomt; smal betekent redelijk zeker, breed betekent
  een ruwe gok, en hij verbreedt naarmate hij verder vooruitkijkt.
- **Forecasthorizon** - hoeveel toekomstige periodes de forecast bestrijkt; een korte horizon is
  betrouwbaarder, een lange speculatiever.
- **MAPE / backtest** - een cijfer voor de nauwkeurigheid van de forecast: de meest recente echte jaren
  worden verborgen, voorspeld vanuit de eerdere, en de gemiddelde misser wordt gerapporteerd als percentage
  (lager is beter).
- **Holt-Winters** - de standaard forecastmethode; hij leert het huidige niveau en de trendrichting en zet
  dat momentum voort, waarbij recentere jaren zwaarder wegen dan oude.
- **z-score** - hoe ongewoon een waarde is, geteld als het aantal standaardstappen dat hij van het gemiddelde
  afligt; voorbij ongeveer drie wordt hij als uitschieter gemarkeerd.
- **IQR (Tukey-hekken)** - een alternatieve uitschietertoets gebouwd uit de middelste helft van de data,
  zodat één extreme waarde hem niet kan verstoren; robuust voor bultige of scheve series.
- **Anomalie** - een punt dat gemarkeerd is omdat het opvalt tussen de rest van de serie (een piek, een dip,
  een mogelijke datafout), aangeduid met een stip.
- **Top mover** - in een grafiek met meerdere lijnen, de serie die het meest bewoog tussen begin en eind; de
  samenvatting in gewone taal noemt hem, zodat de belangrijkste bevinding wordt aangereikt in plaats van
  opgezocht.
- **Drempel-/referentielijn** - een horizontale lijn op een waarde die ertoe doet (een doel, een budget, een
  break-even); elke andere waarde wordt ertegen afgelezen, en het is de lijn waartegen de forecast wordt
  bekeken om het valpunt te vinden.

En de eenheden en afkortingen die de voorbeeldgrafieken gebruiken:

- **CPI (Consumer Price Index)** - de standaardmaat voor inflatie: de gemiddelde prijs van een mandje
  alledaagse goederen, zodat een stijgende CPI betekent dat de kosten van levensonderhoud stijgen.
- **$k / $M** - duizenden / miljoenen dollars (dus "$120M" is 120 miljoen).
- **Index (basis 100)** - een serie herschaald zodat het eerste jaar gelijk is aan 100, zodat "gezakt naar
  92" in één oogopslag leest als "8% onder waar het begon", ongeacht de oorspronkelijke eenheden.
- **Gigawatt (GW)** - een eenheid van elektrisch vermogen; een grote energiecentrale is ruwweg één GW.
- **Run-rate** - het tempo waarin een getal op dit moment groeit, doorgetrokken (bijvoorbeeld "$1,2M per week").
- **MRR (monthly recurring revenue)** - de voorspelbare abonnementsinkomsten die een SaaS-bedrijf elke
  maand boekt, het kerncijfer waarop zulke bedrijven worden afgemeten.

### Methoden & formules

Elk cijfer in deze demo's is berekend uit de data, nooit uit de losse pols - en niets ervan vereist een
statistiekdiploma. Hieronder staat wat elke methode in gewone woorden doet, de formule erachter voor de
nieuwsgierigen, en een gratis, leesbare bron. Verwijzingen naar *Hyndman* wijzen naar
[*Forecasting: Principles and Practice*](https://otexts.com/fpp3/), een gratis online studieboek.

| Wat het doet | Methode | Formule (voor de nieuwsgierigen) | Meer leren |
| --- | --- | --- | --- |
| **Projecteert een trend vooruit** - zet het recente niveau en de helling voort; volgt een herhalend seizoen als er een bestaat. | Holt-Winters | `ŷₜ₊ₕ = ℓₜ + h·bₜ` (niveau + trend bij elke stap bijgewerkt) | [Exponential smoothing](https://otexts.com/fpp3/expsmooth.html) (Hyndman, hfdst. 8) |
| **Past een rechte lijn** - de best-fit-lijn door de punten. | Lineaire regressie (OLS) | `ŷ = a + b·x` (kleinste kwadraten) | [Time-series regression](https://otexts.com/fpp3/regression.html) (Hyndman, hfdst. 7) |
| **Forecast met momentum** - leert hoe elk punt afhangt van het recente verleden. | ARIMA / SARIMA (laadt on demand) | autoregressief + voortschrijdend gemiddelde | [ARIMA models](https://otexts.com/fpp3/arima.html) (Hyndman, hfdst. 9) · [`arima`-bibliotheek](https://github.com/zemlyansky/arima) |
| **Toont hoe zeker de forecast is** - zet de eigen historische fouten van het model om in de 50/80/95%-banden; breder verder vooruit. | Prediction interval | `ŷ ± z·σ·√h` (z = 1.96 voor 95%) | [Prediction intervals](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Beoordeelt de nauwkeurigheid** - verbergt recente punten, voorspelt ze opnieuw, en rapporteert hoe ver mis. | Rolling-origin backtest | `MAPE = mean(\|y−ŷ\|/\|y\|)·100` · `RMSE = √mean((y−ŷ)²)` | [Forecast accuracy](https://otexts.com/fpp3/accuracy.html) (Hyndman, §5.8) |
| **Scheidt seizoen van trend** - splitst een serie in trend + herhalend seizoen + overgebleven ruis. | STL-decompositie | trend + seizoen + rest (Loess) | [STL decomposition](https://otexts.com/fpp3/stl.html) (Hyndman, §3.6) |
| **Simuleert veel toekomsten** - speelt duizenden aannemelijke paden af voor een best-/worst-spreiding. | Monte Carlo | resample residuen over N paden → uitkomstspreiding | [Bootstrap & simulation](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Markeert een uitschieter (eenvoudig)** - markeert punten ver van het gemiddelde. | z-score | `z = (x−μ)/σ`, markeer `\|z\| > 3` | [Outlier detection](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm) (NIST-handboek) |
| **Markeert een uitschieter (robuust)** - markeert punten buiten het typische middengebied; negeert extremen. | IQR / Tukey-hekken | `x < Q1−1.5·IQR` of `x > Q3+1.5·IQR` | [Boxplots & fences](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) (NIST-handboek) |
| **Meet een relatie** - hoe strak twee variabelen samen bewegen, van −1 tot +1. | Pearson *r* | `r = cov(x,y)/(σₓ·σᵧ)` | [Correlation](https://otexts.com/fpp3/regression.html) (Hyndman, hfdst. 7) |
| **Koppelt tekst op betekenis** - zet woorden om in vectoren zodat vergelijkbare betekenissen hoog scoren. | Cosinusgelijkenis | `cos = (a·b)/(‖a‖·‖b‖)` | [Sentence embeddings](https://huggingface.co/docs/transformers.js) (Transformers.js) |

### vs een pandas-/notebookworkflow

Geen vervanging voor verkenning - blijf pandas / R / een notebook daarvoor gebruiken. Het verschil is
*waar de insight draait*:

| | pandas / notebook | `@michi-vz/insights` |
| --- | --- | --- |
| **Draait waar** | jouw machine, offline, eenmalig | de app, de browser van de gebruiker |
| **Uitvoer** | een statisch getal / beeld om te delen | de *gerenderde* grafiek werkt zichzelf bij |
| **Publiek** | de analist | de gebruikers van jouw product |
| **Backend** | Python-runtime | geen - zero server, data blijft lokaal |
| **AI-gereed** | de prompt is met de hand geschreven | de grafiek **is** het tool-oppervlak (MCP) |

pandas is hoe een insight *ontdekt* wordt; dit is hoe het **geleverd** wordt aan gebruikers en omgezet wordt
in een grafiek die een AI-agent kan besturen - dezelfde betrouwbare methoden, geleverd tijdens runtime.

### Verder lezen

- **Forecasting: Principles and Practice** (Hyndman & Athanasopoulos): <https://otexts.com/fpp3/>
- **Model Context Protocol**: <https://modelcontextprotocol.io> · [Aankondiging van Anthropic](https://www.anthropic.com/news/model-context-protocol)
- **Transformers.js** (BERT/embeddings in de browser): <https://huggingface.co/docs/transformers.js>
- **NIST/SEMATECH e-Handbook of Statistical Methods**: <https://www.itl.nist.gov/div898/handbook/>

### Principes

- **Opt-in & tree-shakeable** - ongebruikte mogelijkheden leveren nul bytes.
- **Graceful degradation** - statistische/regelgebaseerde paden hebben geen model nodig; modelpaden vallen terug.
- **Privacy by default** - data blijft in de browser; externe backends zijn opt-in.
- **Alleen permissief-OSS** - er wordt nooit een model meegebundeld.
