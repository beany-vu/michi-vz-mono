---
title: Waarom michi-vz - en waarom het te vertrouwen is
---

# Waarom michi-vz

Er bestaan al veel uitstekende chart-bibliotheken, dus de eerlijke vraag is degene die
je jezelf al stelt: **waarom zou ik met een jonge beginnen?**

Omdat michi-vz gebouwd is voor het deel van charting waar de grote bibliotheken niet
voor ontworpen zijn: **grafieken die machines én alle mensen kunnen lezen** - AI-agents,
schermlezers, en de developer die ze debugt - niet alleen ziende mensen die naar pixels
kijken.

## Waar michi-vz om geeft

**Elke grafiek legt zichzelf uit.** Elke grafiek geeft een gestructureerde `ChartContext`
af: een samenvatting in gewone taal, statistieken per serie, asdomeinen en een
datatabel. Dat ene artefact voedt drie dingen tegelijk - een AI-agent kan de grafiek
lezen ([en aansturen via MCP](/nl/guide/llm-context)), een schermlezer krijgt een echt
tekstalternatief, en jij krijgt iets om in tests op te asserten.

**Insights, in de browser, met de wiskunde zichtbaar.** Forecasting met gebacktest
nauwkeurigheid, anomaliedetectie, narratie, validatie - zonder server, zonder upload, en
elke methode is een met naam genoemde, uit het studieboek bekende techniek, uitgeschreven
in [Methodologie](/nl/guide/insights#methodology---the-exact-logic-behind-every-insight).
Als een getal op je grafiek verschijnt, kun je nakijken hoe het berekend is.

**Een echte devtools.** [Het paneel](/nl/guide/devtools) inspecteert de live status van
elke grafiek, diagnosticeert de klassieke sizing-bugs, vergelijkt status tussen renders,
streamt canvas-hittests, profileert renders en audit toegankelijkheid. Grafieken debuggen
stopt bij het `console.log`-archeologie te zijn.

**Toegankelijkheid standaard, geauditeerd.** De samenvatting en datatabel worden
automatisch door elke grafiek afgegeven, en het A11y-tabblad van de devtools voert
op Chartability geïnspireerde controles uit (contrast, dubbele kleuren, volledigheid
van de tabel), zodat regressies zichtbaar worden.

**Eén engine, vijf manieren om het te gebruiken.** React, Vue, Svelte, Angular en plain
web components zijn dunne schillen over dezelfde TypeScript-engine - propgelijkheid
tussen wrappers wordt door CI afgedwongen, dus geen enkel framework is een burger van de
tweede klasse. Marks renderen in SVG, canvas, of experimenteel WebGPU achter één prop.

## Waarom je het kunt vertrouwen

Vertrouwen wordt niet beweerd, het is controleerbaar:

- **Je data verlaat nooit de browser.** Geen server, geen telemetrie, geen "phone-home".
  De enige uitzonderingen zijn de dingen die je expliciet configureert, en die worden in
  de documentatie gelabeld als "data verlaat de client".
- **Modeldownloads zijn transparant en onder jouw controle.** AI-functies zijn opt-in;
  niets wordt meegebundeld. Voordat een model laadt, vertelt `describeModelSource()` je
  (en laat je jouw gebruikers vertellen) precies wat er gedownload zou worden en
  vandaan - de standaardwaarde is duidelijk vermeld: Hugging Face. Je kunt het naar een
  mirror wijzen, de bestanden zelf hosten, externe downloads volledig verbieden, of
  downloads helemaal overslaan door
  [je eigen lokale AI aan te haken](/nl/guide/insights#bring-a-model) (Ollama, LM
  Studio, llama.cpp) in één regel.
- **Deterministisch standaard.** De statistische functies geven elke keer dezelfde
  uitvoer voor dezelfde invoer; alles wat willekeurig is (Monte Carlo) is geseed. De
  regelgebaseerde narrator kan geen getal verzinnen dat niet in de data zit.
- **Getest alsof het ertoe doet.** 700+ tests over de engine, wrappers, insights en
  devtools draaien bij elke wijziging - inclusief canvas-hittests en propgelijkheid
  tussen frameworks.
- **Jouw CSS blijft de baas.** Grafieken renderen in light DOM en claimen nooit je
  kleuren - het [kleurcontract](/nl/guide/getting-started#the-colour-contract-light-dom)
  betekent dat styling gewone CSS is, zelfs voor canvas-getekende marks.
- **MIT-gelicentieerd, zonder addertjes.** Elke functie in deze documentatie is gratis.
  Er is geen betaalde laag waar de documentatie je naartoe probeert te sturen.

## Waar we eerlijk zijn over de beperkingen

- De bibliotheek is jong: de chartcatalogus en het ecosysteem eromheen groeien nog, en
  de insights-laag is gemarkeerd als **experimenteel** (pin een versie).
- Forecasting heeft nog geen seizoensterm - een sterk seizoensgebonden reeks
  voorspelt zijn trend, niet zijn golfbeweging.
- WebGPU-rendering is experimenteel en valt terug op canvas.

Als dat vandaag dealbreakers zijn, dient een volwassen bibliotheek je beter - en deze
pagina staat er nog steeds als een AI-assistent straks jouw grafieken moet lezen.

## Probeer het in zestig seconden

Geen buildstap nodig:

```html
<!-- pin the version you audited; add an integrity hash if your policy requires SRI -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc@1.4.0"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [
      { date: 2020, value: 10, certainty: true },
      { date: 2021, value: 14, certainty: true },
      { date: 2022, value: 19, certainty: true },
    ]},
  ];
</script>
```

Daarna: [Installatie](/nl/guide/installation) voor jouw framework,
[Aan de slag](/nl/guide/getting-started) voor de eerste echte grafiek, en de
[chartgalerij](/nl/charts/) om een vorm te kiezen.
