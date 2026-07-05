---
title: LLM-context - een grafiek die een AI kan lezen en aansturen
---

# LLM-context: een grafiek die een AI kan lezen en aansturen

Geef een chatbot een grafiek en de gebruikelijke aanpak is er een screenshot van maken en hopen dat het model de pixels leest.
Een michi-vz-grafiek slaat dat over: hij geeft een gestructureerde **`ChartContext`** af die het model rechtstreeks kan lezen,
en stelt zijn besturingselementen bloot als **tools** die het model kan aanroepen. Zo kan een assistent de grafiek *begrijpen* en
*veranderen* - via functieaanroepen, niet gissen.

<InsightsDemo feature="forecast" />

> De zin onder de grafiek is zijn `getContext().summary` - geschreven vanuit de data, niet uit de DOM geschraapt.
> Een model krijgt dat, plus de volledige gestructureerde context hieronder.

## Wat de context is

Elke grafiek leidt een renderer-onafhankelijke **`ChartContext`** af uit zijn datamodel (nooit uit de DOM), zodat hij
**identiek is in SVG- en canvas-modus** - zelfs in canvas, waar er geen per-mark-nodes zijn om te schrapen.

```ts
const ctx = chart.getContext(); // or el.getContext() on the web component / wrappers
```

Het geeft drie dingen af uit één bron:

1. **Gestructureerde JSON** - charttype, assen/domeinen, statistieken per serie (min/max/eerste/laatste,
   verandering, trend, correlatie, gaten, totalen…). Klaar voor LLM-tool-use, RAG, of agents.
2. **Een deterministische natuurlijke-taal-`summary`** - regelgebaseerd, geen model nodig; dient ook als
   alt-tekst.
3. **Een chart-onafhankelijke `a11yTable`** (`headers` + `rows`) die een visueel verborgen DOM-tabel naast
   de grafiek aanstuurt, zodat schermlezers en DOM-scrapende tools echte inhoud krijgen, zelfs in canvas-modus.

```jsonc
{
  "chartType": "line-chart",
  "renderer": "svg",
  "series": [{ "label": "North", "change": 20, "trend": "up", "gaps": 0 }],
  "stats": { "seriesCount": 2, "largestMover": { "label": "North", "change": 20 } },
  "summary": "Line chart with 2 series over 8 points. North rose the most (20).",
  "a11yTable": { "headers": ["Series", "Points", "First", "Last", "Change", "Trend"], "rows": [/* … */] }
}
```

De vorm is een discriminated union op `chartType`, zodat het per grafiek keurig versmalt.

## Praat met je grafiek: een chatbot die hem bestuurt

Omdat de betekenis gestructureerd is **en** de besturingselementen tools zijn, schraapt een chatbot geen pixels - hij
roept functies aan. Elke knop hieronder is een echte tool-aanroep tegen de grafiek (de exacte aanroepen die een
MCP-client zoals Claude Code zou doen):

<InsightsDemo feature="agent" />

Typ een commando - zelfs een slordige zoals *"hilight east"* - en de grafiek reageert. De **⚡ Instant**-engine
routeert je woorden naar de tools van de grafiek met een **typo-tolerante** matcher (en stelt een fix voor wanneer
hij twijfelt: *"bedoelde je highlight East?"*). Schakel naar **Real model** en kies een klein in-browser-LLM
(**Qwen / Llama / Gemma**) dat de context van de grafiek leest en vrije verzoeken interpreteert; het valt
terug op de instant-matcher als het niet geladen is of struikelt.

Hoe dan ook, het *lezen* is exact: een antwoord op *"welke serie groeide het meest?"* komt rechtstreeks van de
deterministische `getContext()` (top mover, %-verandering, totalen) - dezelfde context die de insight-functies
gebruiken - dus alleen de formulering is fuzzy, nooit de getallen. Bekabel je eigen caller en de agent krijgt die
context plus de tools:

```ts
import { createAgent, chartHandle } from "@michi-vz/insights/agent";

const agent = createAgent({ charts: [chartHandle("sales", chart, props)], llm: myCaller });
await agent.ask("Highlight North, hide South, and forecast next quarter");
// the agent reads getContext(), calls highlight / set_disabled / sales.forecast, and replies.
```

Het chatinvoerveld hierboven is een klein exemplaar dat speciaal voor deze docs gebouwd is. Voor een gepolijste
chat-UI in je eigen app is **[deep-chat](https://deepchat.dev)** een prachtige framework-onafhankelijke
chat-webcomponent - zet hem erin, wijs hem naar jouw LLM, en geef hem dezelfde `getContext()` en tools mee.
(Hoed af voor de deep-chat-mensen.)

> Een model kan overtuigend fout zijn en verschillende modellen antwoorden verschillend - vertrouw AI dus niet blindelings.
> De gestructureerde context en tools zijn deterministisch; het model erbovenop is het deel om te verifiëren.

Dezelfde tools worden blootgesteld via **MCP** (Model Context Protocol), zodat Claude Code, Cursor, en Claude
Desktop verbinden zonder aangepaste integratie. De volledige toolslijst, de `michivz://chart/<name>`-resources,
en de registry-demo staan in **[Insights → Agents & MCP](/nl/guide/insights)**.
