---
title: Narrate API
---

# Narrate API

Turns any chart into a sentence about itself, rule-based by default and optionally upgraded to a small local model; for the story and live demos, see the **[Insights guide](/guide/insights)**.

## Import

```ts
import { narrate, narrateRules, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";
```

## Signature & options

### `narrate(options?)`

Returns a plugin that rewrites the chart summary. Rule-based by default.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `strings` | `NarrateStrings` | built-in English | Localizes the built-in phrase builders for i18n: `topMover(label, dir, pct)`, `trendSplit(up, down)`, `largestTotal(label, total)`. |
| `render` | `(ctx) => string` | `undefined` | A fully custom narrator in any language; replaces the built-in builders entirely. |

### `narrateRules(ctx, strings?) => string`

The deterministic, model-free narration. Same text the plugin produces, callable directly.

### `explainChart(ctx, options?) => Promise<string>`

Optionally upgrades narration to a model. Always falls back to the rules if a model is unavailable.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `backend` | `"rules"` or `"transformers"` or `"webllm"` or `"remote"` | `"rules"` | Which narrator to run. `"rules"` is model-free; the others use a generative SLM. |
| `model` | `string` | `undefined` | Model id. See `SLM_PRESETS.transformers.phi3`, `SLM_PRESETS.transformers.gemma`, and `SLM_PRESETS.webllm.*`. |
| `caller` | `(prompt) => Promise<string>` | `undefined` | For `backend: "remote"`. Calls your own model; note that data leaves the client. |
| `strings` | `NarrateStrings` | built-in English | Localizes or replaces the fallback text too. |
| `render` | `(ctx) => string` | `undefined` | Custom fallback narrator, same shape as in `narrate`. |
| `onProgress` | `(info) => void` | `undefined` | Model-load progress; drive a loading UI from it. |

> We prefer small local models (SLMs). Note that BERT is for embeddings and similarity, not narration; narration is either the rules or a generative SLM.

## Example

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

**[Insights guide](/guide/insights)**
