---
title: API Narrate
---

# API Narrate

Transforme n'importe quel graphique en une phrase à son propos, basée sur des règles par défaut et pouvant être améliorée avec un petit modèle local ; pour l'histoire complète, voir le **[guide Insights](/fr/guide/insights)**.

Essayez-le - appuyez sur **Explain ▸** et le graphique écrit sa propre phrase :

<InsightsDemo feature="narrate" />

## Import

```ts
import { narrate, narrateRules, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";
```

## Signature et options

### `narrate(options?)`

Retourne un plugin qui réécrit le résumé du graphique. Basé sur des règles par défaut.

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `strings` | `NarrateStrings` | anglais intégré | Localise les générateurs de phrases intégrés pour l'i18n : `topMover(label, dir, pct)`, `trendSplit(up, down)`, `largestTotal(label, total)`. |
| `render` | `(ctx) => string` | `undefined` | Un narrateur entièrement personnalisé, dans n'importe quelle langue ; remplace entièrement les générateurs intégrés. |

### `narrateRules(ctx, strings?) => string`

La narration déterministe, sans modèle. Même texte que celui produit par le plugin, appelable directement.

### `explainChart(ctx, options?) => Promise<string>`

Améliore éventuellement la narration avec un modèle. Revient toujours aux règles si un modèle n'est pas disponible.

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `backend` | `"rules"` ou `"transformers"` ou `"webllm"` ou `"remote"` | `"rules"` | Quel narrateur exécuter. `"rules"` est sans modèle ; les autres utilisent un SLM génératif. |
| `model` | `string` | `undefined` | Identifiant du modèle. Voir `SLM_PRESETS.transformers.phi3`, `SLM_PRESETS.transformers.gemma`, et `SLM_PRESETS.webllm.*`. |
| `caller` | `(prompt) => Promise<string>` | `undefined` | Pour `backend: "remote"`. Appelle votre propre modèle ; notez que les données quittent le client. |
| `strings` | `NarrateStrings` | anglais intégré | Localise ou remplace aussi le texte de repli. |
| `render` | `(ctx) => string` | `undefined` | Narrateur de repli personnalisé, de même forme que dans `narrate`. |
| `onProgress` | `(info) => void` | `undefined` | Progression du chargement du modèle ; utilisez-la pour piloter une UI de chargement. |

> Nous préférons les petits modèles locaux (SLM). Notez que BERT sert aux embeddings et à la similarité, pas à la narration ; la narration est soit les règles, soit un SLM génératif.

## Exemple

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

**[guide Insights](/fr/guide/insights)**
