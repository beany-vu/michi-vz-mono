---
title: Embeddings API
---

# Embeddings API

Semantische helpers voor zoeken, opschonen, matching tussen datasets, en gelijkenis over tekst -
standaard modelvrij (een hashing-embedder), met een opt-in transformers-backend (MiniLM via WebGPU)
voor echte synoniemherkenning.
Voor het verhaal en de labs, zie de **[Insights-gids](/nl/guide/insights#clean-match-and-search-your-data)**.

## Import

```ts
import {
  findSimilar, matchLabels, reconcileLabels, createEmbedder,
  cosineSimilarity, hashEmbed,
} from "@michi-vz/insights/embeddings";
// also re-exported from the package root: import { findSimilar } from "@michi-vz/insights";
```

## `findSimilar` - rangschik items op betekenis

Probeer het - typ een term en de labels worden gerangschikt op betekenis (standaard modelvrij):

<SemanticSearchLab />

```ts
const ranked = await findSimilar("revenue", labels, (s) => s, { backend: "hash" });
// → [{ item, score }, ...] sorted by descending cosine similarity
```

| Parameter | Type | Wat het doet |
| --- | --- | --- |
| `query` | `string` | De tekst om tegen te matchen. |
| `items` | `T[]` | Kandidaten om te rangschikken. |
| `text` | `(item: T) => string` | Haalt de vergelijkbare string uit elk item. |
| `options` | `EmbedOptions` | `{ backend?, model?, dim? }` - zie hieronder. |

## `reconcileLabels` - voeg rommelige labels samen die hetzelfde betekenen

Probeer het - rommelige, verschillend gespelde labels vallen samen in schone groepen:

<EmbeddingsLab />

Dezelfde entiteit wordt vaak op veel verschillende manieren gespeld ("United States" / "usa" / "United  States");
groeperen op exacte overeenkomst splitst dit op in aparte buckets met foutieve totalen. Dit embedt elk label en
clustert gulzig op cosinusgelijkenis (single-linkage) met een betrouwbaarheidsdrempel, zodat verschillende
entiteiten nooit samenvallen alleen omdat ze dicht bij elkaar liggen. Tel je series op per `name` van elke groep
(de cluster-medoid) voor schone totalen.

```ts
const groups = await reconcileLabels(labels, { threshold: 0.7, margin: 0.05 });
// → [{ name, members: [...] }, ...]
```

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Minimale cosinuswaarde om samen te voegen in een groep. |
| `margin` | `number` | `0.05` | Betrouwbaarheidsdrempel: een label wordt alleen samengevoegd als het minstens dit veel dichter bij zijn beste groep ligt dan bij de op-een-na-beste. `0` schakelt dit uit. |
| `embedder` | `Embedder` | optioneel | Hergebruik een vooraf gebouwde embedder in plaats van er een nieuwe te maken. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Overgeërfde embedder-opties. |

De modelvrije standaard voegt spelling/hoofdlettergebruik/typfouten offline samen; `{ backend: "transformers" }`
voegt ook synoniemen, afkortingen en vertalingen samen. Voor gezaghebbende canonieke namen (USA -> United States),
combineer dit met een aliaslijst of een LLM (zie het "Certify"-recept in de gids).

## `matchLabels` - koppel dezelfde entiteiten tussen twee lijsten

Probeer het - twee niet-overeenkomende exports worden betrouwbare paren plus eerlijk-ongematchte
resten, en de samengevoegde rijen worden getekend als één grafiek:

<MatchLab />

Waar `reconcileLabels` duplicaten opschoont *binnen* één lijst, koppelt `matchLabels` een bronlijst
aan een doellijst (een CRM-export vs een ERP-export). Een paar is alleen een betrouwbare match
wanneer het de gelijkenisdrempel haalt, de betrouwbaarheidsdrempel (op de keuze van de bron tussen
doelen), en - standaard - een **wederzijdse beste match**: elke kant kiest de andere als eerste, zodat
twee bronrijen nooit stilzwijgend samenvallen op één doel. Al het andere wordt teruggerapporteerd met
de dichtstbijzijnde bijna-match, nooit weggegooid of geforceerd gekoppeld.

```ts
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmLabels, erpLabels);
// matches          → [{ source, target, similarity }, ...] (source order)
// unmatchedSource  → [{ label, closest, similarity }, ...] ("did you mean" hints)
// unmatchedTarget  → [{ label, closest, similarity }, ...]
```

| Optie | Type | Standaard | Wat het doet |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Minimale cosinuswaarde om een kandidaat überhaupt in aanmerking te nemen. |
| `margin` | `number` | `0.05` | Betrouwbaarheidsdrempel op de keuze van de bron: het beste doel moet het op-een-na-beste met dit veel verslaan. `0` schakelt dit uit. |
| `mutual` | `boolean` | `true` | Vereist een wederzijdse beste match. `false` staat many-to-one toe op een doel (of beter: pas `reconcileLabels` eerst toe op de rommelige kant, en match daarna). |
| `embedder` | `Embedder` | optioneel | Hergebruik een vooraf gebouwde embedder in plaats van er een nieuwe te maken. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Overgeërfde embedder-opties. |

Dubbele bronlabels worden onder `mutual: true` opgelost tot één winnaar; de verliezer wordt
gerapporteerd als ongematcht met zijn bijna-match, wat je signaal is om die kant eerst op te schonen.

## `createEmbedder` / `cosineSimilarity` / `hashEmbed` - de bouwstenen

```ts
const embedder = await createEmbedder({ backend: "transformers" }); // falls back to hash if unavailable
const [a, b] = await embedder.embed(["customer", "customers"]);
cosineSimilarity(a, b); // 0..1
hashEmbed("customer", 128); // deterministic char-ngram vector, no model
```

| Functie | Signatuur | Notities |
| --- | --- | --- |
| `createEmbedder` | `(options?: EmbedOptions) => Promise<Embedder>` | `Embedder` is `{ backend, embed(texts) }`. `backend: "transformers"` laadt MiniLM lazy en **valt terug op hash** als de dependency/het model ontbreekt. |
| `cosineSimilarity` | `(a: number[], b: number[]) => number` | Standaard cosinuswaarde; `0` voor een nulvector. |
| `hashEmbed` | `(text: string, dim?: number) => number[]` | Modelvrije fuzzy char-ngram embedding (standaard `dim` 128); maakt `customer ~ customers` mogelijk zonder enig model. |

`EmbedOptions` = `{ backend?: "hash" | "transformers"; model?: string; dim?: number }`.

**[Insights-gids](/nl/guide/insights#clean-match-and-search-your-data)**
