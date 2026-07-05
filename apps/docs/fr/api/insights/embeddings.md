---
title: API Embeddings
---

# API Embeddings

Aides sémantiques pour la recherche, la réconciliation, l'appariement entre jeux de données, et la similarité
sur du texte - sans modèle par défaut (un embedder par hachage), avec un backend transformers optionnel
(MiniLM via WebGPU) pour un véritable appariement de synonymes.
Pour l'histoire et les labs, voir le **[guide Insights](/fr/guide/insights#clean-match-and-search-your-data)**.

## Import

```ts
import {
  findSimilar, matchLabels, reconcileLabels, createEmbedder,
  cosineSimilarity, hashEmbed,
} from "@michi-vz/insights/embeddings";
// also re-exported from the package root: import { findSimilar } from "@michi-vz/insights";
```

## `findSimilar` - classer les éléments par sens

Essayez-le - tapez un terme et les étiquettes se classent par sens (sans modèle par défaut) :

<SemanticSearchLab />

```ts
const ranked = await findSimilar("revenue", labels, (s) => s, { backend: "hash" });
// → [{ item, score }, ...] sorted by descending cosine similarity
```

| Paramètre | Type | Ce que ça fait |
| --- | --- | --- |
| `query` | `string` | Le texte à faire correspondre. |
| `items` | `T[]` | Les candidats à classer. |
| `text` | `(item: T) => string` | Extrait la chaîne comparable de chaque élément. |
| `options` | `EmbedOptions` | `{ backend?, model?, dim? }` - voir ci-dessous. |

## `reconcileLabels` - fusionner des étiquettes désordonnées qui signifient la même chose

Essayez-le - des étiquettes désordonnées et orthographiées différemment se regroupent en groupes propres :

<EmbeddingsLab />

La même entité arrive souvent orthographiée de multiples façons ("United States" / "usa" / "United  States") ;
un regroupement par correspondance exacte la divise en compartiments avec des totaux erronés. Ceci intègre
(embed) chaque étiquette et regroupe de manière gloutonne par similarité cosinus (single-linkage) avec un
seuil de confiance, afin que des entités distinctes ne s'effondrent jamais simplement parce qu'elles sont
proches. Additionnez votre série par le `name` de chaque groupe (le médoïde du cluster) pour obtenir des
totaux propres.

```ts
const groups = await reconcileLabels(labels, { threshold: 0.7, margin: 0.05 });
// → [{ name, members: [...] }, ...]
```

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Cosinus minimum pour fusionner dans un groupe. |
| `margin` | `number` | `0.05` | Seuil de confiance : une étiquette ne fusionne que si elle est au moins cet écart plus proche de son meilleur groupe que du suivant. `0` désactive. |
| `embedder` | `Embedder` | optionnel | Réutilise un embedder préconstruit au lieu d'en créer un. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Options d'embedder héritées. |

Le défaut sans modèle fusionne l'orthographe/la casse/les fautes de frappe hors ligne ; `{ backend: "transformers" }`
fusionne aussi les synonymes, les abréviations et les traductions. Pour des noms canoniques faisant autorité
(USA -> United States), associez-le à une liste d'alias ou à un LLM (voir la recette "Certify" du guide).

## `matchLabels` - relier les mêmes entités entre deux listes

Essayez-le - deux exports mal appariés deviennent des paires fiables plus des restes honnêtement non
appariés, et les lignes jointes se dessinent en un seul graphique :

<MatchLab />

Là où `reconcileLabels` nettoie les doublons *au sein* d'une liste, `matchLabels` apparie une liste source
à une liste cible (un export CRM contre un export ERP). Une paire n'est une correspondance fiable que
lorsqu'elle franchit le seuil de similarité, le seuil de confiance (sur le choix de la source parmi les
cibles), et - par défaut - une **meilleure correspondance mutuelle** : chaque côté choisit d'abord l'autre,
de sorte que deux lignes source ne se télescopent jamais silencieusement sur une même cible. Tout le reste
est rapporté avec sa correspondance la plus proche, jamais abandonné ni forcé.

```ts
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmLabels, erpLabels);
// matches          → [{ source, target, similarity }, ...] (source order)
// unmatchedSource  → [{ label, closest, similarity }, ...] ("did you mean" hints)
// unmatchedTarget  → [{ label, closest, similarity }, ...]
```

| Option | Type | Défaut | Ce que ça fait |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Cosinus minimum pour même envisager un candidat. |
| `margin` | `number` | `0.05` | Seuil de confiance sur le choix de la source : sa meilleure cible doit dépasser la deuxième meilleure de cet écart. `0` désactive. |
| `mutual` | `boolean` | `true` | Exige une meilleure correspondance mutuelle. `false` autorise plusieurs-vers-un sur une cible (ou mieux : appliquez d'abord `reconcileLabels` au côté désordonné, puis appariez). |
| `embedder` | `Embedder` | optionnel | Réutilise un embedder préconstruit au lieu d'en créer un. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Options d'embedder héritées. |

Les étiquettes source en double se résolvent en un seul gagnant sous `mutual: true` ; le perdant est
rapporté comme non apparié avec sa correspondance la plus proche, ce qui est votre indice pour réconcilier
d'abord ce côté.

## `createEmbedder` / `cosineSimilarity` / `hashEmbed` - les primitives

```ts
const embedder = await createEmbedder({ backend: "transformers" }); // falls back to hash if unavailable
const [a, b] = await embedder.embed(["customer", "customers"]);
cosineSimilarity(a, b); // 0..1
hashEmbed("customer", 128); // deterministic char-ngram vector, no model
```

| Fonction | Signature | Notes |
| --- | --- | --- |
| `createEmbedder` | `(options?: EmbedOptions) => Promise<Embedder>` | `Embedder` est `{ backend, embed(texts) }`. `backend: "transformers"` charge MiniLM en différé et **revient au hash** si la dépendance/le modèle est manquant. |
| `cosineSimilarity` | `(a: number[], b: number[]) => number` | Cosinus standard ; `0` pour un vecteur nul. |
| `hashEmbed` | `(text: string, dim?: number) => number[]` | Embedding flou par char-ngram sans modèle (`dim` par défaut 128) ; rapproche `customer ~ customers` sans aucun modèle. |

`EmbedOptions` = `{ backend?: "hash" | "transformers"; model?: string; dim?: number }`.

**[guide Insights](/fr/guide/insights#clean-match-and-search-your-data)**
