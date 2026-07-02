---
title: Embeddings API
---

# Embeddings API

Semantic helpers for search, reconciliation, cross-dataset matching, and similarity over text -
model-free by default (a hashing embedder), with an opt-in transformers backend (MiniLM via WebGPU)
for true synonym matching.
For the story and labs, see the **[Insights guide](/guide/insights#clean-match-and-search-your-data)**.

## Import

```ts
import {
  findSimilar, matchLabels, reconcileLabels, createEmbedder,
  cosineSimilarity, hashEmbed,
} from "@michi-vz/insights/embeddings";
// also re-exported from the package root: import { findSimilar } from "@michi-vz/insights";
```

## `findSimilar` - rank items by meaning

Try it - type a term and the labels rank by meaning (model-free by default):

<SemanticSearchLab />

```ts
const ranked = await findSimilar("revenue", labels, (s) => s, { backend: "hash" });
// → [{ item, score }, ...] sorted by descending cosine similarity
```

| Param | Type | What it does |
| --- | --- | --- |
| `query` | `string` | The text to match against. |
| `items` | `T[]` | Candidates to rank. |
| `text` | `(item: T) => string` | Extracts the comparable string from each item. |
| `options` | `EmbedOptions` | `{ backend?, model?, dim? }` - see below. |

## `reconcileLabels` - merge messy labels that mean the same thing

Try it - messy, differently-spelled labels collapse into clean groups:

<EmbeddingsLab />

The same entity often arrives spelled many ways ("United States" / "usa" / "United  States"); grouping
by exact match splits it into buckets with wrong totals. This embeds each label and greedily clusters
by cosine similarity (single-linkage) with a confidence gate, so distinct entities never collapse just
by being near. Sum your series by each group's `name` (the cluster medoid) for clean totals.

```ts
const groups = await reconcileLabels(labels, { threshold: 0.7, margin: 0.05 });
// → [{ name, members: [...] }, ...]
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Minimum cosine to merge into a group. |
| `margin` | `number` | `0.05` | Confidence gate: a label merges only when it is at least this much closer to its best group than the next-best. `0` disables. |
| `embedder` | `Embedder` | optional | Reuse a prebuilt embedder instead of creating one. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Inherited embedder options. |

The model-free default merges spelling/case/typos offline; `{ backend: "transformers" }` also merges
synonyms, abbreviations, and translations. For authoritative canonical names (USA -> United States),
pair it with an alias list or an LLM (see the guide's "Certify" recipe).

## `matchLabels` - link the same entities across two lists

Try it - two mismatched exports become confident pairs plus honestly-unmatched leftovers,
and the joined rows draw as one chart:

<MatchLab />

Where `reconcileLabels` cleans duplicates *within* one list, `matchLabels` pairs a source list
against a target list (a CRM export vs an ERP export). A pair is a confident match only when it
clears the similarity threshold, the confidence-margin gate (on the source's choice among
targets), and - by default - a **mutual best match**: each side picks the other first, so two
source rows never silently collide onto one target. Everything else is reported back with its
closest near-miss, never dropped or force-fitted.

```ts
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmLabels, erpLabels);
// matches          → [{ source, target, similarity }, ...] (source order)
// unmatchedSource  → [{ label, closest, similarity }, ...] ("did you mean" hints)
// unmatchedTarget  → [{ label, closest, similarity }, ...]
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Minimum cosine to consider a candidate at all. |
| `margin` | `number` | `0.05` | Confidence gate on the source's choice: its best target must beat its second-best by this much. `0` disables. |
| `mutual` | `boolean` | `true` | Require a mutual best match. `false` allows many-to-one onto a target (or better: `reconcileLabels` the messy side first, then match across). |
| `embedder` | `Embedder` | optional | Reuse a prebuilt embedder instead of creating one. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Inherited embedder options. |

Duplicate source labels resolve to one winner under `mutual: true`; the loser is reported
unmatched with its near-miss, which is your cue to reconcile that side first.

## `createEmbedder` / `cosineSimilarity` / `hashEmbed` - the primitives

```ts
const embedder = await createEmbedder({ backend: "transformers" }); // falls back to hash if unavailable
const [a, b] = await embedder.embed(["customer", "customers"]);
cosineSimilarity(a, b); // 0..1
hashEmbed("customer", 128); // deterministic char-ngram vector, no model
```

| Function | Signature | Notes |
| --- | --- | --- |
| `createEmbedder` | `(options?: EmbedOptions) => Promise<Embedder>` | `Embedder` is `{ backend, embed(texts) }`. `backend: "transformers"` lazy-loads MiniLM and **falls back to hash** if the dep/model is missing. |
| `cosineSimilarity` | `(a: number[], b: number[]) => number` | Standard cosine; `0` for a zero vector. |
| `hashEmbed` | `(text: string, dim?: number) => number[]` | Model-free fuzzy char-ngram embedding (default `dim` 128); makes `customer ~ customers` without any model. |

`EmbedOptions` = `{ backend?: "hash" | "transformers"; model?: string; dim?: number }`.

**[Insights guide](/guide/insights#clean-match-and-search-your-data)**
