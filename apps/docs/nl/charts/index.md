---
title: Grafieken
description: "De grafiekcatalogus van michi-vz: 22 grafiektypen voor trends, samenstelling, vergelijking, correlatie en stroom, elk met live demo's in React, Vue, Svelte, Angular en web components."
---
# Grafiekcatalogus

Tweeëntwintig framework-onafhankelijke grafieken. Elke pagina bevat een voorbeeld, het gebruik in elk framework en een LLM-contextpaneel.

- [**Lijndiagram**](/nl/charts/line) - _Trends_ · Trends in de tijd over één of meerdere reeksen - met optionele detectie van hiaten, een optionele canvas-renderer (LTTB-decimatie voor grote datasets) en hulplijnen voor losse punten.
- [**Waaierdiagram**](/nl/charts/fan) - _Trends · Voorspelling_ · Een voorspellingswaaier: historie, een gestippelde voorspelde mediaan en geneste betrouwbaarheidsbanden die breder worden naarmate de horizon verder weg ligt (opgebouwd uit Lijn + Bereik).
- [**Vlakdiagram**](/nl/charts/area) - _Samenstelling_ · Deel-van-geheel in de tijd: hoe het aandeel van elk onderdeel in een gestapeld totaal verschuift.
- [**Spreidingsdiagram**](/nl/charts/scatter) - _Correlatie_ · De relatie tussen twee numerieke variabelen; de bolgrootte geeft een derde variabele weer.
- [**Bereikdiagram**](/nl/charts/range) - _Trends_ · Min-max-banden per reeks - voorspellingen, betrouwbaarheidsintervallen of waargenomen bereiken in de tijd.
- [**Lintdiagram**](/nl/charts/ribbon) - _Samenstelling_ · Gestapelde kolommen per periode, verbonden door linten die elke categorie door de tijd heen volgen.
- [**Radardiagram**](/nl/charts/radar) - _Vergelijking_ · Vergelijk meerdere entiteiten in één oogopslag over een gedeelde set assen (een veelhoek per entiteit).
- [**Verticale gestapelde staven**](/nl/charts/vertical-stack-bar) - _Samenstelling_ · Gestapelde verticale staven per categorie, met een expliciete bewaking voor ontbrekende data bij schaarse datasets.
- [**Vergelijkbare staven**](/nl/charts/comparable) - _Vergelijking_ · Twee overlappende horizontale substaven per label - een "based"-waarde tegenover een "compared"-waarde.
- [**Vergelijkbare verticale staven**](/nl/charts/comparable-vertical-bar) - _Vergelijking_ · Twee overlappende kolommen op volle breedte per categorie - een basiswaarde achter, een vergeleken waarde ervoor - met een verschilpijl boven elk paar.
- [**Dubbele staven (Tornado)**](/nl/charts/dual) - _Vergelijking_ · Divergerende staven vanaf een middellijn - value1 rechts, value2 links (bevolkingspiramides, tornado-diagrammen).
- [**Halterdiagram**](/nl/charts/bar-bell) - _Samenstelling_ · Cumulatieve horizontale segmenten per rij met eindcirkels die elke stap markeren.
- [**Verschildiagram**](/nl/charts/gap) - _Vergelijking_ · Twee waarden per label verbonden door een verschilbalk - benadrukt het verschil ertussen.
- [**Treemap**](/nl/charts/treemap) - _Samenstelling_ · Hiërarchische tegels waarvan de grootte de waarde weergeeft, elk optioneel opgesplitst in twee delen (bijv. gerealiseerd versus onbenut) - met een mobielvriendelijke stapel-layout.
- [**Cirkel / Donut**](/nl/charts/pie) - _Samenstelling_ · Segmenten waarvan de grootte het aandeel van een geheel weergeeft, met %-labels per segment; stel `innerRadiusRatio` in voor een donut.
- [**Meter (ringen)**](/nl/charts/gauge) - _Vergelijking_ · Concentrische ringen, één per item, die elk waarde/max van een volledige cirkel over een achtergrondspoor doorlopen, met een centrale uitlezing die bij hover activeert.
- [**Bellendiagram**](/nl/charts/bubble) - _Samenstelling_ · Cirkels waarvan de grootte de waarde weergeeft, samengetrokken tot een cluster door zwaartekracht, elk optioneel opgesplitst in een gerealiseerde kern en een onbenutte ring.
- [**Sankey**](/nl/charts/sankey) - _Stroom_ · Stromen tussen knooppunten, gerangschikt in kolommen, met een banddikte die evenredig is aan de stroomwaarde (gebouwd op d3-sankey).
- [**Fontein (Jet d'Eau)**](/nl/charts/fountain) - _Vergelijking_ · Hoogte van de top = waarde, de opbloeiende pluim = onzekerheid. Categorische x = momentopname/vergelijking van KPI's; temporele of numerieke x = trend met optionele voorspellende fonteinen (het best voor ~5-12 perioden).
- [**Choropletenkaart**](/nl/charts/choropleth-map) - _Geografie_ · Je eigen GeoJSON, gekleurd via een drempelschaal of een expliciete categorie-toewijzing, met 13 d3-geo-projecties.
- [**Symboolkaart**](/nl/charts/symbol-map) - _Geografie_ · Symbolen geplaatst op lengte- en breedtegraad, met een eenmalige krachtensimulatie die overlappende cirkels uit elkaar duwt.
- [**Radiale boom**](/nl/charts/radial-tree) - _Samenstelling_ · Een radiaal dendrogram: bladeren op gelijke afstand van het midden, cirkels geschaald op groeps- en bladniveau, en een labeldichtheid die meebeweegt met het aantal bladeren.
