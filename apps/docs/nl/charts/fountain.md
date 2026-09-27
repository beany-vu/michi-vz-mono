---
title: Fontein (Jet d'Eau)
description: "Fontein (Jet d'Eau)-grafiek: een grote stip voor de gewone waarde, een fontein van de laagste tot de hoogste, en een kleine stip per echte meting, zodat je kunt tellen hoe vaak het over je grens gaat. Experimenteel."
---
# Fontein (Jet d'Eau)

<span class="vp-badge warning">Experimenteel</span> <span class="vp-badge tip">Vergelijking</span>

::: warning Experimenteel - nog niet stabiel
In tegenstelling tot de andere 21 grafieken (die stabiel zijn), is de Fontein-grafiek **experimenteel**: de API, de vormgeving en de vorm van `ChartContext` kunnen in toekomstige releases veranderen. Core 1.29 heeft hem helemaal opnieuw getekend; zie [Overstappen vanaf core 1.28](#migrating). Zet een versie vast als je ervan afhankelijk bent.
:::

**"Hoe lang duurt mijn woon-werkrit?"** "Ongeveer 30 minuten" klopt, maar het is niet het hele antwoord. Sommige dagen duurt het 22 minuten, andere dagen 55. Wat je echt wilt weten, is hoe vaak het langer duurt dan de tijd die je ervoor neemt. De fonteingrafiek laat het allemaal zien op één as: de gewone tijd, de beste en de slechtste dag, en elke dag als een stip die je kunt tellen.

Hij is vernoemd naar de Jet d'Eau in Genève: een dunne steel stijgt op uit het meer en valt terug als een fontein.

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

Elke kleine stip is een van de laatste 20 werkdagen. De auto doet er gewoonlijk 30 minuten over, maar op 3 van de 20 dagen ging hij over de lijn van 45 minuten: een slechte autodag komt soms voor. De bus ging er 8 van de 20 dagen overheen: een slechte busdag komt vaak voor. De trein en de e-bike halen de lijn nooit.

## Zo lees je hem {#how-to-read-it}

::: tip De regels
- **De grote stip is het getal dat je noemt**: de gewone waarde. De helft van de metingen ligt eronder, de helft erboven.
- **Een kleine stip is één echte meting**: 20 kleine stippen zijn 20 dagen.
- **Veel kleine stippen dicht bij elkaar** laten zien wat meestal gebeurt.
- **Een rode stippellijn** is een belofte of een grens.
- **Hoe vaak?** Tel de kleine stippen voorbij de lijn: **1-2 van de 20 is zelden, 3-4 is soms, 5 of meer is vaak.** Onder elke kolom telt de grafiek ze voor je: in de demo betekent "17 of 20 within 45 min" 17 dagen aan de goede kant, dus 3 erover.
- **Een hoge fontein** betekent dat het veel wisselt. Een lage betekent dat het elke keer ongeveer hetzelfde is.
- **Meer kleine stippen in totaal** betekent meer metingen, dus meer vertrouwen. Het is geen grotere waarde.
- **Weinig kleine stippen** betekent dat het maar een gok is. Onder de 10 zegt de grafiek dat ("only 5 days").
- **Links en rechts betekenen niets.** De kleine stippen schuiven alleen opzij zodat ze elkaar niet verbergen.
:::

### De onderdelen van een fontein {#anatomy}

<ChartDemo chart="fountain-chart" :index="16" :legend="false" :height="420" />

1. **Steel**: een staaf van 0 tot aan de grote stip. Hij stopt bij de grote stip. Hoger betekent meer minuten, en hier betekent meer minuten langzamer.
2. **Grote stip**: de gewone dag, 30 minuten. De helft van de dagen was sneller, de helft langzamer. Dit is het getal dat je gebruikt.
3. **Fontein**: de top is de slechtste dag (55 minuten) en de vlakke onderkant de beste dag (22 minuten). De breedte betekent niets: die maakt alleen ruimte voor de kleine stippen.
4. **Kleine stippen**: één per echte dag, elk op de precieze hoogte, altijd binnen de fontein. Waar ze dicht op elkaar zitten, tussen 25 en 35 minuten, is wat meestal gebeurt. De twee helemaal bovenaan zijn de enige langzame dagen.
5. **De lijn en de telling**: de rode stippellijn is een belofte of een grens, hier de 45 minuten die je ervoor neemt. Onder de kolom telt "18 of 20 within 45 min" de kleine stippen aan de goede kant van de lijn.

De getallen staan ook onder de kolom (gewoon, beste, slechtste) en in de tooltip, dus niemand hoeft iets van de as af te meten.

### Zes patronen om te herkennen {#patterns}

Elke fontein hieronder is dezelfde rit, gemeten op verschillende dagen, op dezelfde as: minuten, hoger = langzamer.

#### Stabiel

Een lage fontein met de kleine stippen dicht bij elkaar: bijna elke dag dezelfde tijd.

<ChartDemo chart="fountain-chart" :index="17" :legend="false" :height="320" />

#### Wisselt veel

Een hoge fontein met kleine stippen tot helemaal boven: langzame dagen komen vaak voor, dus plan extra tijd.

<ChartDemo chart="fountain-chart" :index="18" :legend="false" :height="320" />

#### Zelden een slechte dag

De meeste kleine stippen laag, een lege ruimte, en dan een of twee hoog: meestal gaat het goed, slechte dagen zijn zeldzaam.

<ChartDemo chart="fountain-chart" :index="19" :legend="false" :height="320" />

#### Vaak slecht

De meeste kleine stippen hoog en de grote stip bijna bovenaan: hier is langzaam de gewone dag.

<ChartDemo chart="fountain-chart" :index="20" :legend="false" :height="320" />

#### Maar een gok

Maar 5 kleine stippen: te weinig dagen om erop te vertrouwen. De grafiek zet "only 5 days" onder de kolom.

<ChartDemo chart="fountain-chart" :index="21" :legend="false" :height="320" />

#### Genoeg dagen

Dezelfde vorm met 20 kleine stippen: meer dagen geteld, dus betrouwbaarder. De fontein loopt van dezelfde beste tot dezelfde slechtste dag als die hierboven; alleen het aantal kleine stippen is veranderd (de fontein is iets breder, alleen om ruimte te maken voor de stippen).

<ChartDemo chart="fountain-chart" :index="22" :legend="false" :height="320" />

## Wanneer gebruik je hem, en wanneer niet {#when-to-use}

**Gebruik hem** als elke kolom één getal heeft dat mensen noemen, het echte bereik eromheen, en liefst de metingen zelf, en de vraag is "hoe vaak gaat het over mijn grens?". Woon-werkritten, levertijden, prijzen per winkel, cijfers in een klas, de accuduur van een telefoon: alles wat steeds opnieuw gemeten wordt.

- Hij leest het best met **2 tot 12 kolommen** en 10 tot 30 kleine stippen per kolom.
- Voeg een **referentielijn met `goodSide`** toe als er een belofte, een budget of een voldoende is. De grafiek telt dan voor de lezer.
- Zeg in `yAxisTitle` welke kant goed is, bijvoorbeeld "minuten (hoger = langzamer)".

**Kies een andere grafiek** als:

- je twee waarden per rij vergelijkt (voor en na, 2010 en 2023): het [Verschildiagram](/nl/charts/gap);
- je veel perioden vooruit voorspelt en de voorspelling minder zeker wordt naarmate je verder vooruit kijkt: het [Waaierdiagram](/nl/charts/fan);
- je een totaal in delen opsplitst: de [Verticale gestapelde staven](/nl/charts/vertical-stack-bar);
- je maar één getal per item hebt en geen bereik: een gewone staafgrafiek zegt het sneller.

## Voorbeelden {#examples}

Zestien vragen uit het dagelijks leven. De getallen zijn illustratief: verzonnen om echt te lijken, niet uit een gepubliceerde bron. De grafieken tonen hun teksten in het Engels; `labels`, `endLabels` en `sampleWord` vertalen ze (zie [De schakelaars](#switches)).

### Hoe lang duurt mijn woon-werkrit echt? {#commute-by-mode}

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

**Zo lees je hem.** Elke kleine stip is een van de laatste 20 werkdagen. De kleine stippen van de auto zitten tussen 25 en 35 minuten, en maar 3 dagen gingen over de 45 minuten die ik ervoor neem, tot 55. Een slechte autodag komt dus soms voor. De bus ging 8 van de 20 dagen over de 45 minuten: een slechte busdag komt vaak voor. De kleine stippen van de trein en de e-bike halen de lijn nooit: die doen er elke dag ongeveer even lang over.

**Waarom deze grafiek.** Een staaf van de gewone dag maakt de auto de winnaar. De fontein laat zien dat de auto je ook 25 minuten te laat kan maken. De kleine stippen laten zien hoe vaak: 3 van de 20 dagen voor de auto, 8 van de 20 voor de bus, en nooit voor de trein of de e-bike. Op een ochtend dat je niet te laat mag komen, neem je de trein.

### Ik betaal voor 100 Mbps. Wat krijg ik echt? {#home-internet-promised-vs-real}

<ChartDemo chart="fountain-chart" :index="1" :legend="false" :height="480" />

**Zo lees je hem.** Om 21.00 uur zegt de grote stip 62, maar de fontein zakt tot 22. De kleine stippen laten zien dat het niet één pechmeting is: op 5 van de 20 avonden was de snelheid onder de 40, minder dan de helft van wat je betaalt. Om 17.00 uur liggen maar twee kleine stippen laag: een trage late middag is zeldzaam. Om 7.00 uur en 1.00 uur zitten de kleine stippen dicht bij de top: die uren zijn betrouwbaar.

**Waarom deze grafiek.** De gewone snelheden liggen gemiddeld boven de 80, dicht genoeg bij 100 om je schouders op te halen. De fontein van 21.00 uur laat zien dat 's avonds de snelheid kan zakken tot ongeveer een vijfde van de belofte, en de kleine stippen laten zien dat dat ongeveer één avond op de vier gebeurt, niet één keer. Dat is het bewijs voor je provider.

### Hoe lang duurt maaltijdbezorging echt? {#food-delivery-real-time}

<ChartDemo chart="fountain-chart" :index="2" :legend="false" :height="480" />

**Zo lees je hem.** Elke kleine stip is één bestelling. Op vrijdagavond is de gewone wachttijd 45 minuten, maar 5 van de laatste 20 bestellingen duurden langer dan een uur: trage bezorging komt vaak voor. Bestel voordat je honger krijgt, of haal het zelf op. Op een regenachtige zondag is bijna elke bestelling wat traag, maar maar 2 van de 18 duurden langer dan een uur.

**Waarom deze grafiek.** De gewone wachttijden lopen van 25 tot 50 minuten, en als staven lijken ze allemaal een normale wachttijd. De fonteinen laten zien dat vrijdagavond en een regenachtige zondag allebei 80 tot 90 minuten kunnen duren. De kleine stippen laten zien waar je je zorgen over moet maken: op vrijdag duurde één bestelling op de vier langer dan een uur, op een regenachtige zondag maar twee. Bij de lunch op werkdagen zitten de meeste kleine stippen binnen vijf minuten van de 30 die de app belooft, en 's avonds laat is bijna elke bestelling sneller.

### Is de Black Friday-deal echt goedkoper? {#black-friday-tv}

<ChartDemo chart="fountain-chart" :index="3" :legend="false" :height="480" />

**Zo lees je hem.** Elke kleine stip is de prijs van één winkel voor dezelfde tv. Eind oktober en begin november klimmen de kleine stippen: de meeste winkels verhogen de prijs. In de Black Friday-week zakken ze terug tot ongeveer het niveau van begin oktober, dus de meeste "deals" liggen maar 5 tot 55 € onder de oktoberlijn. Maar één kleine stip zit onderaan op 600 €: één winkel van de 15 verkoopt hem echt goedkoper.

**Waarom deze grafiek.** Een lijn van de gewone prijs toont maar een kleine dip. De fontein laat zien dat de prijzen in de weken ervoor stijgen, en dat de onderkant in de Black Friday-week 600 € haalt, maar zelf kan hij niet zeggen hoeveel winkels zo goedkoop zijn. De kleine stippen wel: één winkel zit alleen op 600 € en de andere 14 zitten dicht rond de oktoberlijn. Een echte deal is zeldzaam, en de grafiek laat het zien.

### Komt mijn online bestelling op tijd? {#parcel-delivery-by-origin}

<ChartDemo chart="fountain-chart" :index="4" :legend="false" :height="440" />

**Zo lees je hem.** Uit China zegt de grote stip 12 dagen, maar de fontein reikt tot 30. Tel de kleine stippen: 4 van de 20 pakketten deden er meer dan 3 weken over, dus een traag pakket uit China is niet zeldzaam. Bestel een verjaardagscadeau een maand van tevoren. Uit het VK zitten de meeste kleine stippen op 5 tot 7 dagen: 5 pakketten deden er langer over, waarvan maar 3 meer dan 10 dagen. Uit Duitsland ligt elke kleine stip tussen 2 en 5 dagen.

**Waarom deze grafiek.** Een staaf van de gewone dagen zegt alleen dat ver weg langzamer is. De fontein laat zien dat ver weg ook minder voorspelbaar is: een bestelling uit Duitsland duurt nooit langer dan 5 dagen, terwijl een bestelling uit China een maand kan duren als hij bij de douane blijft hangen. De kleine stippen laten zien hoe vaak dat gebeurt. De fonteinen van het VK en China reiken allebei ver omhoog, maar uit het VK deden maar 3 pakketten er meer dan 10 dagen over, terwijl uit China 4 van de 20 er meer dan 3 weken over deden. Zo weet je of het cadeau er voor de verjaardag is.

### Kan ik de weersverwachting voor de barbecue van zaterdag vertrouwen? {#weather-forecast-week}

<ChartDemo chart="fountain-chart" :index="5" :legend="false" :height="440" />

**Zo lees je hem.** De fontein van zaterdag blijft tussen 22° en 28°, in elk geval boven de lijn van 20°, dus de barbecue kun je gerust plannen. Die van dinsdag loopt van 17° tot 27° en zakt onder de lijn, dus dat is meer een gok.

**Waarom deze grafiek.** Een verwachtingslijn lijkt over dinsdag even zeker als over vandaag. De fonteinen worden in de loop van de week hoger, dus je ziet meteen dat het getal van zaterdag betrouwbaar is en dat van dinsdag niet. Elke fontein zit ongeveer gelijk rond zijn grote stip, omdat de verwachting naar beide kanten fout kan zijn.

### Waar kan ik een tweekamerwoning betalen? {#rent-by-city}

<ChartDemo chart="fountain-chart" :index="6" :legend="false" :height="480" />

**Zo lees je hem.** Kijk naar de budgetlijn van 1.000 €. De fonteinen van Lissabon, Berlijn en Madrid halen hem allemaal, maar tel daar de kleine stippen, want elke kleine stip is één woning. Lissabon heeft maar één woning zo goedkoop en Madrid twee. Berlijn heeft er vijf, dus dat is de enige stad waar een woning van 1.000 € makkelijk te vinden is.

**Waarom deze grafiek.** Een staaf van de gewone huur laat Lissabon, Berlijn en Madrid ongeveer gelijk lijken. De fonteinen laten zien dat alle drie tot 1.000 € zakken, en de kleine stippen laten zien hoe vaak. In Lissabon is het één buitenkansje, en de volgende kost al 1.180 €. In Madrid zijn het twee woningen en in Berlijn vijf. Bovenaan is de 2.300 € van Lissabon één enkele woning, terwijl de meeste woningen daar tussen 1.250 en 1.600 € kosten.

### Is boodschappen doen over de Zwitserse grens goedkoper? {#border-basket}

<ChartDemo chart="fountain-chart" :index="7" :legend="false" :height="420" />

**Zo lees je hem.** De fontein van elk buurland houdt op onder de onderkant van die van Zwitserland (86 CHF), dus zelfs de duurste winkel over de grens is goedkoper dan de goedkoopste Zwitserse.

**Waarom deze grafiek.** Een staaf zegt alleen dat Zwitserland duurder is. De fonteinen beantwoorden de echte vraag: loont de rit, welke winkel je ook kiest? De Zwitserse fontein en de andere raken elkaar niet eens. Hier zit elke fontein ongeveer gelijk rond zijn grote stip, omdat een goedkope winkel ongeveer evenveel bespaart als een dure extra kost.

### Waarom ben ik op maandag zo moe? {#sleep-by-night}

<ChartDemo chart="fountain-chart" :index="8" :legend="false" :height="480" />

**Zo lees je hem.** Elke kleine stip is één nacht. De grote stip van zondag ligt maar een half uur onder die van een doordeweekse nacht, maar 5 van de 16 kleine stippen liggen onder 5 uur. Ongeveer één zondag op de drie is slecht, en dat merk je op maandagochtend. De meeste kleine stippen van doordeweekse nachten liggen tussen 6 en 7 uur, met maar één korte nacht.

**Waarom deze grafiek.** Staven zeggen dat zondag (6 uur) nauwelijks slechter is dan een doordeweekse nacht (6,5). De fontein laat zien dat zondag het meest wisselt, tot 3,5 uur. De kleine stippen laten zien dat het een gewoonte is, geen toeval: 5 van de laatste 16 zondagen lagen onder 5 uur, dus zondag is de nacht om aan te pakken.

### Houdt mijn telefoon het nog een hele dag vol? {#phone-battery-year-by-year}

<ChartDemo chart="fountain-chart" :index="9" :legend="false" :height="480" />

**Zo lees je hem.** De lijn is een hele dag: om 7.00 uur van de lader en om 22.00 uur nog aan. Elke kleine stip is één dag, dus tel de kleine stippen onder de lijn. In jaar 1 kwam geen enkele dag tekort. In jaar 2 drie dagen. In jaar 3 tien van de 21 dagen, en op drie daarvan ging de telefoon voor 19.00 uur uit. Jaar 4 (gestippeld) is een schatting, en daar is zelfs een gewone dag te kort.

**Waarom deze grafiek.** De grote stip van de gewone dag zakt in drie jaar maar van 18 naar 15 uur, dus een gewone lijn ziet er prima uit. De kleine stippen laten zien wat er echt veranderde. Toen de telefoon nieuw was, hield hij het elke dag vol. In jaar 3 kwam hij ongeveer om de dag tekort. Dan is een nieuwe accu het geld waard.

### Hoe vaak is mijn trein echt te laat? {#train-really-late}

<ChartDemo chart="fountain-chart" :index="10" :legend="false" :height="480" />

**Zo lees je hem.** Tel de kleine stippen boven de stippellijn. Dat zijn de ritten die de spoorwegen zelf te laat noemen: 5 van de 20 bij de trein van 7.42 uur, 9 bij die van 17.48 uur naar huis, en maar 1 bij die van 7.12 uur. Een kleine stip precies op de lijn (precies 5 minuten) telt niet als te laat.

**Waarom deze grafiek.** Een staaf van de gemiddelde vertraging zet de trein van 7.42 uur op 5,5 minuten, alsof elke rit een beetje te laat was. In werkelijkheid was de helft van de ritten 2 tot 4 minuten te laat, en drie waren 12, 18 en 25 minuten te laat. Een lijn door de tijd zou de keuze tussen treinen verbergen. Hier zie je meteen dat de trein van 7.12 uur je bijna altijd op tijd brengt, terwijl die van 7.42 uur ongeveer één ochtend op de vier verpest en die van 17.48 uur bijna één avond op de twee.

### Welke diensten leveren de meeste fooi op? {#tips-per-shift}

<ChartDemo chart="fountain-chart" :index="11" :legend="false" :height="480" />

**Zo lees je hem.** Tel de kleine stippen boven de stippellijn van € 60: elke zaterdagavond haalde hem, vrijdag miste hem twee keer, en de lunch op werkdagen kwam nooit in de buurt.

**Waarom deze grafiek.** Een staaf van de gewone fooi zet vrijdag (€ 84) vlak naast zaterdag (€ 97) en laat ze op elkaar lijken. De kleine stippen laten zien dat vrijdag twee keer onder € 60 bleef en zaterdag nooit, en dat bepaalt welke dienst je ruilt. Een lijngrafiek heeft hier geen volgorde in de tijd om te volgen.

### Welk bordspel krijgen we voor bedtijd uit? {#board-game-before-bedtime}

<ChartDemo chart="fountain-chart" :index="12" :legend="false" :height="480" />

**Zo lees je hem.** Ticket to Ride duurt gewoonlijk 55 minuten, maar 4 van de 15 potjes gingen over de stippellijn van een uur tot bedtijd. Scrabble duurt gewoonlijk 48 minuten en ging maar 2 van de 14 keer over. Uno ging nooit over; Monopoly elke keer.

**Waarom deze grafiek.** Een staaf van de gewone tijd zegt dat Scrabble (48 min) en Ticket to Ride (55 min) allebei in een uur passen. De kleine stippen laten zien dat Ticket to Ride in 4 van de 15 potjes over bedtijd ging en Scrabble maar in 2 van de 14. Dat is het verschil tussen rustig naar bed en ruzie.

### Gaan de wekelijkse boodschappen vaker over de € 100? {#weekly-shop-trend}

<ChartDemo chart="fountain-chart" :index="13" :legend="false" :height="480" />

**Zo lees je hem.** De grote stip kroop maar van € 88 naar € 98, maar de kleine stippen boven de lijn van € 100 gingen van 2 weken naar 6 van de 13.

**Waarom deze grafiek.** Een lijn van de gewone weekrekening ziet er rustig uit en blijft onder het budget. De kleine stippen laten zien dat de weken boven budget verdrievoudigden (2, 3, 4 en dan 6 van de 13), en dat is wat een gezin echt voelt. Een staaf per seizoen zou het net zo verbergen.

### Hoe vaak zwemt mijn dochter de 50 m snel genoeg voor de wedstrijd? {#swim-gala-time}

<ChartDemo chart="fountain-chart" :index="14" :legend="false" :height="480" />

**Zo lees je hem.** Lager is sneller. Kleine stippen onder de stippellijn zijn zwembeurten die snel genoeg zijn voor de wedstrijd: geen in het herfsttrimester, 2 van de 14 in het voorjaarstrimester en 5 van de 13 in het zomertrimester.

**Waarom deze grafiek.** Een lijn van haar gewone tijd zakt pas volgend najaar onder de 40 s, dus die zegt "nog niet klaar". De kleine stippen laten zien dat ze deze zomer al 5 van de 13 keer onder de limiet zwom, dus ze kan zich nu al inschrijven. Een lijn kan dat niet laten zien.

### Hoeveel leerlingen zakken voor elke toets? {#class-test-pass-mark}

<ChartDemo chart="fountain-chart" :index="15" :legend="false" :height="480" />

**Zo lees je hem.** Tel de kleine stippen onder de stippellijn van de voldoende: de grote stip van natuurkunde zit veilig op 58, maar toch zakten 7 van de 25 leerlingen, en 8 voor Frans.

**Waarom deze grafiek.** Een staaf van het gewone cijfer per vak zet alle vijf boven de voldoende en noemt het een goed trimester. De kleine stippen laten 7 onvoldoendes zien bij natuurkunde en 8 bij Frans, tegenover geen enkele bij lezen, en daar moet een ouder of leraar iets mee.

## Datavorm {#data-shape}

Elk item in `dataSet` is één jet: één kolom in momentopname-modus, één periode in trendmodus.

| Veld | Wat het is |
| --- | --- |
| `label` | De naam van de kolom (momentopname) of van de reeks (trend). |
| `value` | De grote stip: het getal dat je noemt. Optioneel als er `samples` zijn; dan is het de middelste meting, met de helft van de metingen eronder en de helft erboven. |
| `low`, `high` | De onderkant en de top van de fontein. |
| `spread` | Kortere vorm voor een gelijk bereik: `low = value - spread`, `high = value + spread`. |
| `samples` | De echte metingen, elk een kleine stip. |
| `forecast` | Een periode die nog moet komen (zie [Trend en voorspelling](#trend-and-forecast)). |
| `date` | De x-positie in trendmodus. |
| `color`, `code` | Een kleur voor dit item, en een vaste id die in de context terechtkomt. |

Het bereik komt van de eerste die er is: `low` en `high`, dan `spread`, dan de laagste en hoogste meting. Zonder een van die drie is er geen fontein, alleen de steel en de grote stip. Een meting buiten `low`/`high`, of een waarde buiten het bereik, maakt het bereik groter en stuurt een [waarschuwing](/nl/api/fountain#warnings), dus er wordt niets verborgen. Negatieve waarden mogen: de steel loopt dan vanaf 0 naar beneden.

## De schakelaars {#switches}

| Prop | Standaard | Wat hij doet |
| --- | --- | --- |
| `showRange` | `true` | Tekent de fontein. `false` houdt alleen de steel en de grote stip over; de kleine stippen verdwijnen ook, omdat ze de fontein nodig hebben. |
| `showSamples` | `true` | Tekent een kleine stip per meting, als items `samples` hebben. |
| `showValueLabels` | `true` | Zet de getallen onder elk x-label: "usual 30", de twee woorden voor de uiteinden, "only 5 days" onder 10 metingen, en de tellingen. |
| `drift` | `false` | De Genève-look: de top van elke fontein buigt evenveel naar één kant. Hij draagt geen data. |
| `referenceLines` | geen | Rode stippellijnen bij waarden die ertoe doen. Met `goodSide` telt elke kolom de kleine stippen aan de goede kant. |
| `endLabels` | `["lowest", "highest"]` | Woorden voor de twee uiteinden van de fontein, bijvoorbeeld `["beste", "slechtste"]` of `["goedkoopste", "duurste"]`. |
| `readingGuide` | `false` | Een leeswijzer onder de grafiek, op één regel als hij past; anders breekt hij af tussen twee onderdelen (bij een « · »). `true` toont de standaardtekst, met alleen de onderdelen over wat de grafiek tekent; een string vervangt hem. |
| `sampleWord` | `"measurements"` | Het woord in het meervoud voor de kleine stippen: "20 dagen", "maar 5 bestellingen". |
| `labels` | Engelse woorden | De andere woorden die de grafiek toont: `usual`, `of`, `only` en `forecast`, voor andere talen. |
| `yAxisTitle` | geen | De titel naast de y-as, bijvoorbeeld "minuten (hoger = langzamer)". |

### Alleen steel en grote stip: `showRange: false` {#show-range}

Zonder de fontein wordt het een lollipopgrafiek: een staaf tot aan elke grote stip. De kleine stippen en de woorden voor de uiteinden verdwijnen; de tellingen onder elke kolom blijven, omdat ze uit de metingen komen.

<ChartDemo chart="fountain-chart" :index="24" :legend="false" :height="440" />

### De Genève-look: `drift: true` {#drift}

De top van elke fontein buigt evenveel naar rechts, zoals de echte Jet d'Eau op een dag met een briesje. Elke jet buigt dezelfde kant op, dus de buiging vertelt de lezer niets. Nieuwe lezers vonden hem verwarrend, daarom staat hij standaard uit: gebruik hem voor een poster, niet voor een beslissing.

<ChartDemo chart="fountain-chart" :index="23" :legend="false" :height="440" />

### Lijnen, tellingen en je eigen woorden {#words}

```ts
const props = {
  yAxisTitle: "minuten (hoger = langzamer)",
  endLabels: ["beste", "slechtste"], // "beste 22", "slechtste 55"
  sampleWord: "dagen", // "20 dagen", "maar 5 dagen": altijd meervoud
  referenceLines: [
    {
      value: 45,
      label: "Tijd die ik neem: 45 min", // staat aan het rechtereinde van de lijn
      goodSide: "below", // tel de kleine stippen op of onder 45
      countLabel: "binnen 45 min", // "17 van 20 binnen 45 min"
    },
  ],
  readingGuide: "Kleine stip = één dag · Grote stip = de gewone dag · Hoge fontein = wisselt veel",
  // De andere woorden van de grafiek:
  labels: { usual: "gewoonlijk", of: "van", only: "maar", forecast: "verwachting" },
};
```

- Een telling telt de kleine stippen precies op de lijn mee: "below" telt die op of onder de lijn, "above" die op of boven de lijn.
- Voorspellingskolommen en kolommen zonder metingen krijgen geen telling.
- Zonder `countLabel` zijn de woorden "below the line" of "above the line": vertaal ze met `countLabel`.
- `showValueLabels: false` haalt de regels onder de x-labels weg. De tooltip toont nog steeds dezelfde getallen.

## Trend en voorspelling {#trend-and-forecast}

**Momentopname-modus** is de standaard (`xAxisDataType: "band"`): één kolom per `label`. Voor **trendmodus** kies je een temporele of numerieke `xAxisDataType` (`"number"`, `"date_annual"` of `"date_monthly"`) en geef je elk item een `date`. De jets staan dan langs de x-as, en een grijze stippellijn verbindt de grote stippen (`showTrendLine`: standaard aan in trendmodus met één reeks; uit bij meerdere reeksen en in momentopname-modus). In trendmodus is `label` de naam van de reeks, dus één reeks houdt één kleur.

Een item met **`forecast: true`** is een periode die nog moet komen. Het krijgt een gestippelde steel en rand, een lichtere vulling, een holle grote stip, geen kleine stippen en geen telling, en "(forecast)" achter het x-label (te vertalen met `labels.forecast`).

Perioden met een naam (uren, trimesters, seizoenen) staan op 1, 2, 3 enzovoort langs een getallenas, en `xAxisFormat` toont de namen:

```ts
const names = ["Jaar 1 (nieuw)", "Jaar 2", "Jaar 3", "Jaar 4"];

const props = {
  xAxisDataType: "number",
  xAxisFormat: (d) => names[Number(d) - 1],
  yAxisTitle: "uren (hoger = langer)",
  endLabels: ["kortste", "langste"],
  sampleWord: "dagen",
  referenceLines: [
    { value: 15, label: "een hele dag", goodSide: "above", countLabel: "hield de dag vol" },
  ],
  dataSet: [
    { label: "Accu", date: 1, value: 18, low: 15, high: 20, samples: [18.5, 19, 17.5 /* … */] },
    { label: "Accu", date: 2, value: 17, low: 13, high: 19, samples: [17, 18, 16.5 /* … */] },
    { label: "Accu", date: 3, value: 15, low: 10, high: 17, samples: [15.5, 13, 16 /* … */] },
    { label: "Accu", date: 4, value: 12, low: 7, high: 14, forecast: true },
  ],
};
```

De hele grafiek staat in de galerij: [Houdt mijn telefoon het nog een hele dag vol?](#phone-battery-year-by-year). Houd trendmodus bij een handvol perioden (ongeveer 3 tot 12), zodat elke fontein ruimte heeft.

## Speel door de perioden {#timeline}

In trendmodus voegt `timeline` een afspeelknop en een scrubber toe die door de perioden stappen. Bij elke stap tekent de grafiek de jets tot aan de actieve periode, de hele actieve jet inbegrepen, en hoveren bereikt alleen wat getekend is. Momentopname-modus heeft geen perioden, dus de besturing wordt niet getekend. Standaard uit.

<TimelinePlayDemo chart="fountain-chart" hint="Druk op de afspeelknop onder de grafiek: hij stapt door de perioden en tekent de jets tot aan elke periode. Sleep de scrubber om naar een periode te springen." />

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(period) / seekIndex(i) / stepForward()
```

```vue [Vue]
<FountainChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(period) / seekIndex(i)
</script>
```

:::

- `speedMs` bepaalt het tempo, `loop` begint opnieuw, `autoplay: true` start bij het mounten, `showControl: false` verbergt de ingebouwde balk.
- De headless controller is er altijd: `chart.timeline()` biedt `play() / pause() / toggle() / seek(period) / seekIndex(i) / stepForward() / stepBack()`, plus `onStep` en `formatPeriod` in de config voor je eigen knoppen. Geef bij perioden met een naam `formatPeriod` dezelfde functie als `xAxisFormat`.
- `seek(period)` zoekt eerst de periode en vergelijkt als tekst, dus `seek(2021)` en `seek("2021")` komen allebei op 2021 uit, of je datums nu getallen of strings zijn. Een getal telt alleen als positie (0 = de eerste) als geen periode past, en een string die nergens bij past doet niets. `seekIndex(i)` gaat altijd op positie, net als de ingebouwde scrubber.
- Waarden glijden standaard tussen de perioden (`interpolate`); `interpolate: false` springt. Met reduced motion wordt altijd gesprongen.
- `timeline` wint van `progressiveDraw` als ze allebei zijn ingesteld.

## Onthulanimatie

De grafiek tekent zichzelf van links naar rechts bij het mounten. Standaard uit: een grafiek kiest ervoor met de `progressiveDraw`-prop.

<RevealDemo chart="fountain-chart" :height="440" replay-label="Animatie opnieuw afspelen" hint="De jets verschijnen van links naar rechts; assen en titels blijven staan. Met reduced motion ingeschakeld verschijnt de grafiek meteen volledig getekend." />

`progressiveDraw: true` gebruikt de standaardinstellingen (1200 ms, easeInOutCubic). Een configuratieobject stelt het bij:

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() speelt de animatie opnieuw af
```

```vue [Vue]
<FountainChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() speelt de animatie opnieuw af
</script>
```

:::

- `durationMs` en `easing` ("linear", "easeOutQuad", "easeInOutCubic", of je eigen `(t) => t`-functie) bepalen het verloop.
- `autoplay: false` toont de grafiek volledig getekend; roep `replay()` aan (React-ref-handle, methode van de web component of de core-instantie) om de animatie op verzoek te starten. `replayOnUpdate: true` speelt hem af bij elke datawijziging.
- Respecteert `prefers-reduced-motion`: de grafiek verschijnt dan meteen volledig getekend.

## Zware datasets op WebGPU <span class="vp-badge warning">Experimenteel</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 200; i++) {
    const value = Math.max(8, Math.round(40 + 25 * Math.sin(i / 11) + 10 * Math.sin(i / 3.3)));
    const low = value - (3 + (i % 5));
    const high = value + Math.round(4 + 14 * Math.abs(Math.sin(i / 5)));
    dataSet.push({ label: `Jet ${i + 1}`, value, low, high });
  }
  return { dataSet, xAxisDataType: "band", showValueLabels: false };
}
</script>

FountainChart heeft een optionele `renderer="webgpu"` die elke steel, fontein en grote stip als GPU-geïnstantieerde marks tekent, terwijl assen, labels en tooltips op de SVG-laag blijven. Hij hangt af van wat de browser kan: zonder WebGPU valt hij terug op canvas, en `getContext().renderer` meldt welke er echt getekend heeft. Boven een stuk of twaalf kolommen is de grafiek niet meer als fonteingrafiek te lezen; deze demo is een stresstest, geen aanbeveling.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="200 jets" />

## Gebruik

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = de opties van de grafiek
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - registreer de elementen één keer
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (gebruikt CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, referenceLines, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // renderer-onafhankelijk, klaar voor LLM's
chart.destroy();
```

:::

### Web component: attributen en eigenschappen {#web-component}

Gewone strings en getallen kunnen attributen zijn. Arrays, objecten, functies en de schakelaars zijn eigenschappen.

```html
<michi-vz-fountain-chart
  id="rit"
  chart-title="Hoe lang duurt mijn woon-werkrit echt?"
  y-axis-title="minuten (hoger = langzamer)"
  sample-word="dagen"
  renderer="canvas"
></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("rit");
  el.dataSet = [
    { label: "Auto", value: 30, low: 22, high: 55, samples: [29, 31, 27 /* één per dag */] },
    { label: "Trein", value: 35, low: 32, high: 42, samples: [34, 35, 33 /* … */] },
  ];
  el.endLabels = ["beste", "slechtste"];
  el.referenceLines = [
    { value: 45, label: "Tijd die ik neem: 45 min", goodSide: "below", countLabel: "binnen 45 min" },
  ];
  el.labels = { usual: "gewoonlijk", of: "van", only: "maar", forecast: "verwachting" };
  el.readingGuide = true;
  el.showRange = true; // ook: showSamples, showValueLabels, drift
</script>
```

- **Attributen:** `chart-title`, `y-axis-title`, `sample-word`, `x-axis-data-type`, `renderer`, `locale`, `width`, `height`, `ticks`.
- **Alleen eigenschappen:** `dataSet`, `referenceLines`, `endLabels`, `labels`, `readingGuide`, `showRange`, `showSamples`, `showValueLabels`, `drift`, `showTrendLine`, `colors`, `colorsMapping`, `yAxisDomain`, `xAxisFormat`, `yAxisFormat`, `timeline`, `progressiveDraw`.
- Zet de titel met `chartTitle` (of `chart-title`), niet met `title`: `title` op een HTML-element is de eigen tooltip van de browser.

## Overstappen vanaf core 1.28 {#migrating}

Core 1.29 vervangt de twee oude silhouetten (de jet en de pluim) door één vorm waarin je elke mark van de y-as afleest. Oude code blijft werken; dit verandert er.

- **Verwijderde props worden genegeerd.** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets` en `showMist` worden nog één release geaccepteerd, veranderen niets, en sturen elk een [waarschuwing](/nl/api/fountain#warnings) `ignored-option`. Haal ze weg. Op de web component wordt `fountainStyle` (`fountain-style`) op dezelfde manier genegeerd.
- **`density` en `lean` per item worden genegeerd**, met een waarschuwing `ignored-option`. Geef echte metingen (`samples`) in plaats van een dichtheid; voor de schuine look gebruik je `drift` voor de hele grafiek.
- **`spread` tekent nu een echt bereik.** `{ value: 30, spread: 8 }` werkt nog: de fontein loopt van 22 tot 38 op de y-as. De oude grafiek tekende de spreiding als een breedte die nooit op de as stond. Mat je `spread` iets anders (een verlies, een verschil, een aandeel), dan past het niet meer bij deze grafiek: zet dat getal in de tooltip of in een andere grafiek.
- **`predicted` en `certainty` werken nog**; de nieuwe naam is `forecast` (`certainty: false` is `forecast: true`).
- **De y-as** bevat nu 0, elke `low` en `high` en elke referentielijn, plus 10% ruimte. Negatieve waarden worden onder het meer getekend.
- **Items zonder `date` in trendmodus** worden overgeslagen met een waarschuwing `missing-date`. Vroeger zetten ze de hele grafiek in momentopname-modus.
- **Laden en geen data.** De fontein kent nu `isLoading`, `isNodata`, `noDataLabel` en `suppressDefaultOverlay`, net als de andere grafieken. Een lege `dataSet` toont de geen-data-overlay ("No data available", of je `noDataLabel`) in plaats van lege assen: geef `isLoading` mee terwijl de data laadt, of `isNodata: false` om de lege assen te houden.
- **Kleuren** komen uit de hele `dataSet`, in de volgorde waarin labels voor het eerst voorkomen: een label uitzetten kleurt de andere nooit opnieuw, en een `color` per item wordt gerespecteerd.
- **TypeScript: `value` en `spread` zijn nu optioneel** in `FountainDataItem`, omdat een item ook alleen `samples` mag geven. Code die `.value` of `.spread` van je eigen items leest, heeft misschien een controle of `?? 0` nodig. `tooltipFormatter` krijgt het item met zijn `value` ingevuld (de mediaan van de metingen als het item er geen geeft), dus daar is `d.value` altijd een getal, en een formatter met het type `(d: FountainDataItem) => string` past nog steeds.
- **Context.** `jets[].spread`, `jets[].spreadRatio` en `jets[].upperBound` blijven als verouderde aliassen; gebruik `range`, `rangeRatio` en `high`. `jets[].lean` is altijd `null`. `stats.frothiest` is een verouderde alias; gebruik `stats.widestRange`. Zie [getContext()](/nl/api/fountain#getcontext).

## API

Props zijn getypeerd als `FountainChartProps` in [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Gedeeld door alle grafieken: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, of het experimentele `"webgpu"`), `highlightItems`, `disabledItems`, en de `on*`-callbacks. `onChartDataProcessed` / `getContext()` geven de renderer-onafhankelijke [ChartContext](/nl/guide/llm-context). Volledige referentie: [Fontein API](/nl/api/fountain).
