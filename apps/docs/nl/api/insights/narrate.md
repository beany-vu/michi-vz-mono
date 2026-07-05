---
title: Narrate API
---

# Narrate API

Maakt van elke grafiek een zin over zichzelf, standaard regelgebaseerd en optioneel geüpgraded naar een klein lokaal model; voor het volledige verhaal, zie de **[Insights-gids](/nl/guide/insights)**.

Probeer het - druk op **Explain ▸** en de grafiek schrijft zijn eigen zin:

<InsightsDemo feature="narrate" />

## Import

```ts
import { narrate, narrateRules, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";
```

## Signatuur & opties

### `narrate(options?)`

Retourneert een plugin die de grafieksamenvatting herschrijft. Standaard regelgebaseerd.

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `strings` | `NarrateStrings` | ingebouwd Engels | Lokaliseert de ingebouwde zinsbouwers voor i18n: `topMover(label, dir, pct)`, `trendSplit(up, down)`, `largestTotal(label, total)`. |
| `render` | `(ctx) => string` | `undefined` | Een volledig aangepaste verteller in elke taal; vervangt de ingebouwde bouwers volledig. |

### `narrateRules(ctx, strings?) => string`

De deterministische, modelvrije vertelling. Dezelfde tekst die de plugin produceert, direct aan te roepen.

### `explainChart(ctx, options?) => Promise<string>`

Upgradet optioneel de vertelling naar een model. Valt altijd terug op de regels als een model niet beschikbaar is.

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `backend` | `"rules"` of `"transformers"` of `"webllm"` of `"remote"` | `"rules"` | Welke verteller wordt uitgevoerd. `"rules"` is modelvrij; de andere gebruiken een generatief SLM. |
| `model` | `string` | `undefined` | Model-id. Zie `SLM_PRESETS.transformers.phi3`, `SLM_PRESETS.transformers.gemma`, en `SLM_PRESETS.webllm.*`. |
| `caller` | `(prompt) => Promise<string>` | `undefined` | Voor `backend: "remote"`. Roept je eigen model aan; let op dat data de client verlaat. |
| `strings` | `NarrateStrings` | ingebouwd Engels | Lokaliseert of vervangt ook de terugvaltekst. |
| `render` | `(ctx) => string` | `undefined` | Aangepaste terugvalverteller, met dezelfde vorm als in `narrate`. |
| `onProgress` | `(info) => void` | `undefined` | Voortgang van het laden van het model; stuur hiermee een laad-UI aan. |

> We geven de voorkeur aan kleine lokale modellen (SLM's). Merk op dat BERT bedoeld is voor embeddings en gelijkenis, niet voor vertelling; vertelling is ofwel de regels ofwel een generatief SLM.

## Voorbeeld

```ts
import { narrate, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";
import { frenchStrings } from "./i18n";

// Rule-based, localized to French.
const plugin = narrate({ strings: frenchStrings });

// Upgrade to a small local model, with a loading UI fed by onProgress.
const text = await explainChart(ctx, {
  backend: "transformers",
  model: SLM_PRESETS.transformers.gemma,
  onProgress: (p) => setLoading(p),
});
```

**[Insights-gids](/nl/guide/insights)**
