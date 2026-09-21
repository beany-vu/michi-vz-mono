---
title: Meter (ringen)
description: "Concentrische ringmeter: elke ring bestrijkt waarde/max van een volledige cirkel over een achtergrondspoor, met hover-activering en een ingebouwde centrale aflezing."
---
# Meter (ringen)

<span class="vp-badge tip">Composition</span>

"Hoe ver is elk van deze, op dezelfde schaal?" De meter beantwoordt het met concentrische ringen, van buiten naar binnen: elke ring bestrijkt `value / max` van een volledige cirkel, met de klok mee vanaf 12 uur, over een achtergrondspoor. Een ring aanwijzen **activeert** hem (nadruk + de ingebouwde centrale aflezing); `defaultActive` kiest de rustring, en een ring met waarde `null` toont alleen zijn spoor - "geen data" zonder de meter te verbergen.

<ChartDemo chart="gauge-chart" :legend="false" />

Vrijwel alles is configureerbaar: ringdikte en tussenruimte, spoorkleuren en -dekking per ring, beginhoek, afgeronde uiteinden, arcdekking per ring (voor één-kleur-ontwerpen), en de centrale aflezing - vervang die met `centerContent`, of schakel hem uit met `showCenterLabel: false` en stuur je eigen overlay aan via `onHighlightItem`:

<ChartDemo chart="gauge-chart" :index="1" :legend="false" />

> Ringen delen één schaal (`max`, standaard 100). Normaliseer eerst bij verschillende schalen - of kies een [vergelijkende staafgrafiek](/nl/charts/comparable), die absolute waarden preciezer weergeeft.

## Halve meter en verlopen

`sweepAngle` verkleint de meter van een volledige cirkel tot een boog, met de klok mee vanaf `startAngle`; `gradient` vervangt de effen kleur van een ring door een meerkleurig lineair verloop. De klassieke halve meter is `startAngle: -90, sweepAngle: 180`:

<ChartDemo chart="gauge-chart" :index="2" :legend="false" />

Twee dingen die je bij een eerste lezing makkelijk verkeerd begrijpt:

- **Het spoor volgt ook de boogbreedte.** Het achtergrondspoor van een halve meter is een halve cirkel, geen volledige - `sweepAngle` verkort spoor en waardeboog samen, dus er is geen "verborgen" andere helft die erdoorheen schemert.
- **Het verloop is verankerd aan de volledige boogbreedte, niet aan het getekende deel.** Eenzelfde kleur staat altijd op dezelfde *waarde*, niet op dezelfde positie langs de daadwerkelijk getekende boog - een halfvolle meter toont dus de eerste helft van het verloop, niet het hele verloop samengeperst in de helft. Het eigen `gradient` van een ring wint van het verloop op grafiekniveau.

## Positie binnen een bereik

Een meter kan ook antwoorden op "waar zit deze waarde tussen een minimum en een maximum?": `min` verschuift het begin van de boog weg van nul, `valueMarker` zet de waarde van elke ring vast op de boog, `ticks` voegt referentiestreepjes toe met een bijschrift en een waarde, `endLabels` benoemt de twee uiteinden van een gedeeltelijke boog, en `sweepFit` past een halve meter in zijn vak in plaats van een volledige cirkel te centreren:

<ChartDemo chart="gauge-chart" :index="3" :legend="false" />

De consumer bezit elke tekst: geef `label` en `valueLabel` mee op een streepje of uiteinde, al vertaald en opgemaakt; alleen een ontbrekend `valueLabel` valt terug op `valueFormatter`. Drie details om te weten:

- **De schaal is `[min, max]`.** Een ringwaarde of streepje erbuiten wordt naar het dichtstbijzijnde uiteinde geklemd (met een datawaarschuwing), zodat een leverancier die goedkoper is dan elke referentie zichtbaar blijft, vastgezet aan het begin.
- **Streepjes en uiteinden beschrijven de schaal, markers beschrijven ringen.** Een meter met meerdere ringen tekent de streepjes één keer, op de buitenste ring, en één marker per ring met data; een `null`-ring houdt de streepjes en verliest zijn marker.
- **`sweepFit` reserveert een band van 36 px** aan elke kant zolang er streepjes of uiteinden zijn, en verankert de centrale aflezing (`centerContent`) in het midden van het bestreken vak. Op een volledige ring van 360° geldt alleen de reservering voor streepjes.

Alle drie de renderers tonen dezelfde annotaties: in canvas- en WebGPU-modus staan ze in een overlay boven de geschilderde bogen, dus consumer-CSS op `.mv-gauge-tick-label`, `.mv-gauge-tick-value` en `.mv-gauge-marker` werkt overal.

## Wanneer te gebruiken

- **Geneste marktaandelen.** Het aandeel van één product in geneste scopes (wereld, regio, markt) in één compacte figuur.
- **Voortgangs- / KPI-ringen.** Activity-tracker-stijl: één tint met dekkingstappen per ring, `roundedCaps`, en een aangepaste centrale aflezing.

## Renderers

`renderer: "svg"` (standaard), `"canvas"` (dezelfde ringen op een 2D-canvas; consumer-CSS bereikt de bogen nog steeds via de kleurprobe), of `"webgpu"` <span class="vp-badge warning">Experimenteel</span> (annulusbanden op de GPU; valt terug op canvas tot het apparaat gereed is).
