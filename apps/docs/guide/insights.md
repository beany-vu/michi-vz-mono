---
title: Insights - predict, explain, and drive charts with AI
---

# Charts that predict, explain themselves, and talk to AI

::: warning Experimental - not yet stable
The `@michi-vz/insights` AI layer is **experimental**: its API, sub-paths, and outputs may change in future releases. The 16 core charts are stable; insights (and the new [Fountain chart](/charts/fountain)) are not yet. Pin a version if you depend on them.
:::

A chart usually just *draws* the past. `@michi-vz/insights` makes it **forecast the future**,
**explain itself in plain English**, **catch bad data**, and **answer to an AI assistant** - all in
the browser, with no server and nothing leaving the page. It is **opt-in** and uses **plain, textbook
methods** (no black box); every michi-vz chart already carries a structured `ChartContext`, and these
features simply read from it.

<InsightsDemo feature="forecast" />

> Above is a real line chart. Toggle **Forecast** to see a dashed prediction + shaded forecast region;
> **Explain** writes a sentence from the data. No server - it all runs in your browser.

> [!IMPORTANT] A model assists; it does not decide.
> Different models give different answers, and even a strong one can be wrong - the smaller and faster
> it is, the more so. These tools speed up the *reading* of a chart; they do not take responsibility for
> it. Treat any model output as a starting point, lean on the deterministic rule-based fallback as the
> honest baseline, and **verify anything that matters before you act on it**. AI is here to help, not to
> answer for you.

---

## What it does

Four things become possible once a chart carries its own structured meaning:

### Read and drive charts from an AI assistant

This is the headline. Because each chart exposes its meaning (`ChartContext`) **and** its controls as
**tools**, an AI assistant can summarize it, filter it, highlight a series, or forecast it - by
calling functions, not scraping pixels. Try the buttons (each is a real tool call):

<InsightsDemo feature="agent" />

```ts
// In your app - bring your own LLM caller:
import { createAgent, chartHandle } from "@michi-vz/insights/agent";
const agent = createAgent({ charts: [chartHandle("revenue", chart, props)], llm: myCaller });
await agent.ask("Filter to the top 5 and forecast next quarter");
```

The same tools are exposed over **MCP** (Model Context Protocol), so **Claude Code, Codex, Cursor, and
Claude Desktop** connect with zero custom integration - see **Agents & MCP** in the reference below.

### Predict the future

Add one plugin and the chart grows a dashed prediction, a confidence band, and a **backtested
accuracy** figure (so it is trustworthy, not a guess). Forecasting works on Line, **Fan**, Range,
Area, and the stacked-bar family.

```ts
import { forecast } from "@michi-vz/insights/forecast";
mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ method: "holt-winters", horizon: 4, level: 0.95 })],
});
// getContext().summary → "...Revenue projected to 189 by 2027 (holt-winters, MAPE 6.1%)."
```

(The demo at the top of the page is this.) And it is **not line-only** - the same forecast
extends a Fan chart (nested confidence bands), an Area chart's stack, a Range band, and more:

<InsightsDemo feature="forecast" chart="fan" />

<InsightsDemo feature="forecast" chart="area" />

The **[Fan chart](/charts/fan)** is the dedicated forecast presentation, built in one call with
`forecastFan()`.

### Explain themselves, catch bad data

The chart **detects anomalies** (and marks them), writes a **plain-English narration**, and runs
**data-quality validation** - all from the same structured context.

<InsightsDemo feature="anomaly" />

<InsightsDemo feature="validate" />

```ts
import { anomaly } from "@michi-vz/insights/anomaly";
import { narrate } from "@michi-vz/insights/narrate";
import { validate } from "@michi-vz/insights/validate";
chart.use(anomaly());   // flags + annotates outliers
chart.use(narrate());   // richer plain-English summary (also feeds screen readers)
chart.use(validate());  // warns via onDataWarning AND marks the bad points red on the chart
```

### Clean and connect your data, too

The same structured meaning also cleans up messy data and finds things by what they mean, not
how they are spelled - all model-free by default, all opt-in to a real model when you want more:

- **[Reconcile labels](#reconcile-labels)** - collapse `USA` / `united states` / `U.S.A.` into
  one clean group, so totals stop splitting across spellings.
- **[Match across datasets](#match-across-datasets)** - link two differently-spelled lists (a
  CRM export and an ERP export) into one honest, joined chart.
- **[Smart search](#smart-search)** - find a series by what you mean ("money coming in"), not
  by its exact label.
- **[Bring your own model](#bring-a-model)** - every model-backed feature falls back to a
  deterministic, rule-based answer; flip **Real model** in the narration demo to compare a
  small in-browser model's prose side by side, live.

---

## Real-world examples

Every chart below is the real thing - it computes in your browser as the page loads, and it is
clickable (toggle Canvas/SVG, hit **Explain ▸**). The point is not the demo; it is that an analyst, a
banker, a pharma scientist, or a historian gets the answer *on the chart* - no notebook, no server.
Each term is explained the first time it appears, and gathered in the [Glossary](#glossary).

### Forecast: where is this heading, and will it hit the target?

The dashed line projects the recent trend. The shaded **confidence band** is the model's own past
error, so it shows an honest *range* rather than one hopeful number. And where the projection meets a
goal, a red **fall point** marks *when* the target is reached - answering both "where is this going?"
and the goal-seek question "will it get there, and when?".

**A bank's revenue run-rate - is the year-end plan in reach?**

<InsightsDemo feature="forecast" dataset="bank-revenue" />

**A clinical trial - will it enroll its 300th patient before the readout deadline?**

<InsightsDemo feature="forecast" dataset="pharma-enrollment" />

**Inflation (CPI) - the band is wide because the future genuinely is uncertain.**

<InsightsDemo feature="forecast" dataset="cpi" />

**A power grid - does peak demand reach capacity before the next plant is built?**

<InsightsDemo feature="forecast" dataset="energy-demand" />

**A SaaS book - how close is recurring revenue to the next milestone?**

<InsightsDemo feature="forecast" dataset="saas-mrr" />

### Scenarios: best, base, worst

One projection is rarely enough. Add **scenario** lines - an optimistic and a pessimistic growth
assumption - and the same history fans into a best / base / worst spread, the way a CFO or a bank
stress test brackets the future.

**A bank stress test - revenue under an upside and a severe case, against the plan line.**

<InsightsDemo feature="forecast" dataset="scen-bank-stress" />

**A startup's runway - when does cash hit zero if the next round slips a quarter?**

<InsightsDemo feature="forecast" dataset="scen-startup-runway" />

**A new drug's launch - strong vs slow adoption from day one.**

<InsightsDemo feature="forecast" dataset="scen-pharma-uptake" />

### Narration: the chart writes its own headline (and never makes it up)

A busy chart hides its own story. `narrate()` reads the data and writes one plain sentence: it names
the **top mover** (the series that moved the most between the start and the end) and the up-vs-down
split. Every figure is computed from the numbers, so - unlike a chatbot - it cannot invent one. Hit
**Explain ▸** to see the sentence.

**A retail bank - digital deposits quietly overtake the branch network.**

<InsightsDemo feature="narrate" dataset="narr-bank-channel" />

**A trial with two sites - which one is actually carrying the study?**

<InsightsDemo feature="narrate" dataset="narr-pharma-sites" />

**Real wages - a decade that lost ground, despite the recent uptick.**

<InsightsDemo feature="narrate" dataset="narr-real-wages" />

**A century of urbanisation - the countryside empties as the cities fill.**

<InsightsDemo feature="narrate" dataset="narr-urbanisation" />

**The electricity mix - coal exits, renewables take the lead.**

<InsightsDemo feature="narrate" dataset="narr-energy-mix" />

### Anomaly: what does not belong?

An **anomaly** is a year that stands out from the rest of the series. By default it is found with a
**z-score** (how many standard steps a point sits from the average; past about three, it is flagged)
and marked with a dot - turning "did anything odd happen?" into a single glance. The exact logic of
all three detection methods (z-score, IQR fences, forecast-band), their thresholds and their limits
is spelled out in [Methodology](#methodology---the-exact-logic-behind-every-insight).

**A bank - the year card-fraud losses break out of the trend (a breach or scam wave).**

<InsightsDemo feature="anomaly" dataset="anom-fraud" />

**Drug safety - the year reported adverse events spike, a signal for pharmacovigilance.**

<InsightsDemo feature="anomaly" dataset="anom-adverse" />

**Operations - the year peak latency balloons, marking a major outage.**

<InsightsDemo feature="anomaly" dataset="anom-latency" />

**Retail - the year product returns jump, pointing at a defective batch.**

<InsightsDemo feature="anomaly" dataset="anom-returns" />

**An economy - the year GDP plunges, a recessionary shock against steady growth.**

<InsightsDemo feature="anomaly" dataset="anom-gdp" />

## More from the toolbox

The **Sub-paths** table near the end lists more than the gallery above shows. Here are six more of
those plugins running for real - each one model-free, deterministic, and a few lines to wire in. They
answer questions a plain chart leaves on the table: *what would it take to hit the number, what are the
odds, when did the trend actually change, and what is seasonal versus real growth.*

**Goal-seek - what would it take to hit the number?** Forecasting runs time forward; goal-seek runs it
*backward* from a target you set. Move the target and watch the required pace (the gold dashed line)
react, with a verdict on whether your recent pace gets there.

<PluginLab feature="goalseek" />

**Monte Carlo - the odds, not just a line.** One forecast line hides the risk. This runs hundreds of
simulated futures and reports the *band* plus the probability of clearing a target - seeded, so it
replays exactly, with a **Re-roll** to see the spread shift.

<PluginLab feature="montecarlo" />

**Changepoints - when did the trend actually change?** Averages blur the moment a story turns. This
finds where the slope structurally shifts and colours the line by regime - here a clean
peak-then-decline.

<PluginLab feature="changepoints" />

**Seasonality - separate real growth from "it's December again."** One call splits a wiggly line into a
smooth trend and a repeating seasonal wave, and detects the cycle length on its own.

<PluginLab feature="seasonal" />

**Aggregate - raw rows to a chart in one call.** Before you can chart data you usually have to *shape*
it. `aggregate()` does group-by + measures with zero dependencies (opt into DuckDB-Wasm for real SQL
over millions of rows). Flip the grouping and it re-rolls.

<PluginLab feature="sql" />

**Sonify - hear the trend.** An accessibility win: every value becomes a pitch, so a rising series
*sounds* like it rises. Press play - the bars are the pure, testable `valuesToTones()` output.

<PluginLab feature="sonify" />

## Clean, match, and search your data

Four things AI gives your data, all in the browser: **reconcile** messy labels within one list,
**match** two lists that spell things differently, **search** a series by meaning, and
**categorize** free text with no rules - powered by small open models, not a giant cloud one.

**Turn text into meaning.** An *embedding* is a way to turn a word or phrase into a list of numbers,
arranged so that things that *mean* the same land close together - so a computer can tell `USA` and
`United States` are the same place even though they share no letters. `@michi-vz/insights` invents none
of this; it shows how to *leverage* the open-source models the community already built: small
**embedding models** (the BERT / MiniLM family) and **small-enough open LLMs** (Qwen, Gemma, Phi), all
running **client-side in your browser** - no server, no API key, nothing sent anywhere. Pointed at your
chart data, they lift its **quality** and clean up **wrong, messy data**: four everyday problems become
one trick - **merge** what means the same, **match** what two systems spell differently, **find**
what you mean, **sort** the unsorted. The
**model-free** default runs instantly offline (character n-grams, great for spelling and typos); **pick
a model** from the dropdown (MiniLM ~23 MB → MPNet ~110 MB, sizes shown, loaded on demand) to go from
matching *letters* to matching *meaning* - and bring a small LLM to **certify** the result.

### Reconcile labels

**The problem every analyst knows.** Your data arrives from three sources and they each spell the
same thing differently - `United States`, `united states`, `USA`. Group by exact match and your chart
splits one country into three short bars with **wrong totals**, and an afternoon goes to hand-writing
a lookup table.

**Embeddings fix it by meaning.** Turn each label into a vector and merge the ones that land close
together. The **model-free** default (instant, offline) already collapses spelling, casing, spacing
and typos. Load a real model (the dropdown shows each one's size) and it also merges abbreviations and
translations - `USA` ≈ `United States`, `Deutschland` ≈ `Germany`, `Nippon` ≈ `Japan`. **Certify**
then adds a small LLM that confirms each group and stamps the authoritative name.

<EmbeddingsLab />

> Start on **Raw labels** to feel the mess - 10 bars, split totals - then hit **Reconcile**.
> Model-free merges the spelling variants offline; loading a model (MiniLM → MPNet) merges the
> abbreviations and translations too, down to the 3 real countries. **Certify** hands those groups to a
> small in-browser LLM for an authoritative name.

> [!NOTE] Similarity proposes, a model *certifies*.
> An embedding model runs fully **offline** - it has no internet and looks nothing up. It merges
> `Deutschland` with `Germany` because their vectors landed near each other in training, not because it
> "knows" the country. So the merge is not decided on the raw threshold alone: a label only joins a group
> when it is **decisively closer to that group than to any other** (a confidence margin), which keeps two
> distinct countries from collapsing just because they sit close. For an *authoritative* answer, **Certify**
> runs a **cascade** (not a mixture-of-experts - that is internal to one model): embeddings propose the
> merges cheaply, then a **small** in-browser LLM (Qwen / Gemma, sizes shown) confirms each group is one
> country and returns the canonical name. That model genuinely knows countries, but it needs **WebGPU** and
> the weights download once. (In a real app a custom caller could point at a bigger model or a local
> **Ollama** server instead; a static website cannot call Ollama directly - the browser's CORS policy
> blocks `localhost`. See **Agents & MCP** below.)

> [!NOTE] The bet: a quick model finishes, a smarter one refines.
> The flow above is a deliberate experiment - let a fast, naive model (the embeddings) do the bulk of
> the work, then call a heavier, smarter model (a small LLM) only to refine what is left. It trades a
> little up-front accuracy for speed and cost, and pays for the bigger model only where it matters. This
> is a belief being tested here, not settled doctrine; it can be argued the other way, and the approach -
> along with these results - will evolve as the models do.

### Match across datasets

**The next problem: two separate sources, not one messy list.** A CRM export and an ERP export
each name the same customers, countries, or products - spelled a little differently in each
system. `reconcileLabels` cleans duplicates *within* one list; `matchLabels` links entities
*across* two lists, so two datasets become one honest chart.

<MatchLab />

> Two small datasets, mismatched on purpose. Hit **Match** and the confident pairs light up with
> their similarity; the leftovers stay honestly unmatched (with a closest-miss hint) instead of
> being force-fitted - and the joined rows draw as one chart, two sub-bars per row.

### Smart search

A dashboard with dozens of series and you cannot recall the exact name. Type what you *mean* and
embeddings rank every series by similarity - no keyword has to match.

<SemanticSearchLab />

> Try `customer` first - model-free finds the customer KPIs by shared letters. Then `money coming in`:
> only **BERT** reaches `Revenue`, because they share *meaning*, not spelling.

### Categorize

A pile of survey comments with no tags. Hand embeddings just the **theme names** (no keyword lists, no
training) and each comment drops into its nearest theme - so unstructured text becomes a chart you can
act on. This is the one that truly needs a model: `keeps freezing` → **Performance** shares no letters
with any theme name.

<CategorizeLab />

> **Load BERT** and watch the comments snap into the right themes by meaning - `too expensive` →
> Pricing, `love the clean new look` → Design & UX - none of which share a keyword with their theme.

How to write it - reconcile first, then the other embedding uses:

::: code-group

```ts [Reconcile labels]
import { reconcileLabels } from "@michi-vz/insights/embeddings";
// one call: groups messy labels by meaning, with a confidence gate + a tidy representative name
const groups = await reconcileLabels(rawLabels); // { backend: "transformers" } adds synonyms
// → [{ name: "United States", members: ["United States", "USA", ...] }, ...]
// now sum your series by group.name instead of the raw label → clean, correct totals
```

```ts [Match two datasets]
import { matchLabels } from "@michi-vz/insights/embeddings";
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmCountries, erpCountries);
// matches → [{ source: "USA", target: "United States", similarity: 0.91 }, ...]
const rows = matches.map((m) => ({
  label: m.target,
  valueBased: crmTotals[m.source],     // two sources, one row -
  valueCompared: erpTotals[m.target],  // feeds straight into mountComparableHorizontalBarChart
}));
```

```ts [Embed with BERT]
import { createEmbedder, cosineSimilarity } from "@michi-vz/insights/embeddings";
// opt into a small in-browser BERT (MiniLM via Transformers.js, WebGPU); lazy, nothing bundled
const e = await createEmbedder({ backend: "transformers" }); // default all-MiniLM-L6-v2
const [a, b] = await e.embed(["USA", "United States"]);
cosineSimilarity(a, b); // ≈ 0.8 - close, even with no letters in common
```

```ts [Search by meaning]
import { findSimilar } from "@michi-vz/insights/embeddings";
// rank a large chart catalog by what a query means, not how it is spelled
const ranked = await findSimilar("revenue", chartLabels, (l) => l);
```

```ts [Dashboard RAG]
import { findSimilar } from "@michi-vz/insights/embeddings";
// retrieve the charts most relevant to a question, feed THEIR context to an LLM (see Agents)
const top = (await findSimilar(question, charts, (c) => c.getContext().summary)).slice(0, 3);
```

:::

Same engine, other uses: **searching** a big chart catalog by meaning, **clustering** similar series,
and **dashboard-wide RAG** - retrieving the right charts so an agent can answer across a whole
dashboard (see **Agents & MCP**). Embeddings are the retrieval layer; the headline is what sits on top.

## Methodology - the exact logic behind every insight

Nothing here is a black box: every insight is a named, textbook method you can verify by hand.
This section states the algorithm, its defaults, and its limits, feature by feature.

### Forecast

- **Method (default `"holt-winters"`):** Holt's double exponential smoothing - two running
  estimates, *level* and *trend*, updated at every point (`alpha = 0.5` for level,
  `beta = 0.3` for trend; no seasonal term yet). The forecast extends the last level along the
  last trend. `method: "linear"` instead fits one ordinary-least-squares line through the whole
  series and extends it.
- **Confidence band:** the residual standard error of the one-step-ahead in-sample fit, widened
  by `sqrt(step)` the further out the forecast goes, times the z-value of your `level`
  (default 95%). Wide band = the model fit the history poorly; that honesty is the feature.
- **Accuracy (MAPE/RMSE):** a real holdout backtest - the last third of the series (up to the
  horizon) is hidden, the model is fitted on the rest, and its predictions are scored against
  what actually happened. Series shorter than 6 points fall back to in-sample accuracy.
- **Limits:** numeric x-axes only; no seasonality term (a strongly seasonal series will forecast
  its trend, not its wiggle - decompose first, see below).

### Anomaly detection

Three methods via `anomaly({ method, threshold })`; every flagged point carries
`{ index, value, score, kind }` and the tool result now includes this explanation verbatim:

- **`zscore` (default, threshold 3):** `score = |value - mean| / standard deviation` over the
  series itself; flagged past the threshold (`kind: "high"` above the mean, `"low"` below).
  3 is the conservative textbook cut; 2 flags milder spikes. Caveat: a strong trend inflates
  the standard deviation and hides outliers - use `forecast` there.
- **`iqr` (threshold 1.5):** Tukey's fences - flagged below `Q1 - k*IQR` or above `Q3 + k*IQR`
  (Q1/Q3 = 25th/75th percentile). Quartiles ignore extremes, so this stays robust when the
  data already contains wild points.
- **`forecast`:** trend-aware - each point is tested against a one-step-ahead forecast built
  from ONLY the history before it, flagged when outside the 95% band; `score` = standard
  errors missed by.

### Narration

The default narrator is **rule-based and deterministic** - it reads only the structured
`ChartContext` (never raw pixels, never a model): the top mover by absolute change (with its
percentage), the up-vs-down trend split, and the largest total for categorical charts. Same
input, same sentence, every time - and it cannot invent a number that is not in the context.
Model-backed prose (`explainChart`) is opt-in and always falls back to the rules.

### Validation

Pure shape/statistics checks over the series: empty datasets, non-finite values, duplicate
dates, and non-monotonic dates - each reported as a typed `DataWarning` with the exact index,
and optionally annotated on the chart.

### Changepoints, seasonality, Monte Carlo

- **Changepoints:** for every candidate split, one OLS line is fitted before and one after;
  the split is scored by `|slopeAfter - slopeBefore|` and only local maxima above a threshold
  are kept. Simple, explainable trend-bend detection.
- **Seasonality:** classical additive decomposition - a centered-moving-average trend, a
  mean-centered per-phase seasonal component, and a residual; the period is detected by
  autocorrelation.
- **Monte Carlo:** the deterministic forecast is the centre path; many futures are simulated
  by adding Gaussian residual noise scaled by `se*sqrt(step)`, with a **seeded** PRNG
  (mulberry32) so runs are reproducible. Quantiles of the runs give the band; final-step
  tallies give exceedance probabilities.

### Embeddings (reconcile, match, search, sort)

The default embedder is **model-free hashing** (character n-grams into a fixed-size vector,
L2-normalized) - fully offline and deterministic; it merges spelling/case/typo variants but
not true synonyms. `backend: "transformers"` upgrades to MiniLM (see
[Where models come from](#where-models-come-from-and-how-to-change-it)). Similarity is cosine;
merge thresholds default to 0.6 (hash) / 0.7 (model).

`reconcileLabels` clusters *within* one list (greedy single-linkage, gated by a confidence
margin so a label only joins a group it is decisively closest to). `matchLabels` links
*across* two lists instead: every source label pairs with its single best target, the same
confidence margin gates the source's choice, and by default a pair counts only as a
**mutual best match** - each side picks the other first - which is what stops two source
rows colliding onto the same target. Everything that does not clear the gates is reported
back as unmatched with its closest near-miss, never silently dropped.

## Why trust it (and who it's for)

- **Not a black box.** Every number is a named, textbook method (Holt, MAPE, z-score, IQR,
  OLS…) - the exact logic per feature is spelled out in [Methodology](#methodology---the-exact-logic-behind-every-insight)
  above. The same primitives a stats library uses.
- **Deterministic + tested.** Statistical features give the same output for the same input and are
  covered by an extensive test suite; anything random (Monte Carlo) is seeded.
- **Data stays in the browser.** No server, no upload. Remote model backends are strictly opt-in
  and documented as "data leaves the client."
- **No lock-in.** No model is ever bundled; model features are opt-in and **fall back** to a working
  statistical/rule-based version if a model is unavailable.

**Who it is for:**

- **Building a product (embedded analytics)?** Ship forecasting and self-explaining charts to
  *your* users - client-side, no Python service to run.
- **A data / market analyst?** The methods you already know (Holt-Winters, MAPE, z-score) - now
  running at runtime in the app, not just in a notebook (see **vs a pandas / notebook workflow** below).
- **Building with AI agents?** Your charts become MCP tools an agent can read and drive.

## Get started

```bash
npm i @michi-vz/insights
```

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

const chart = mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ horizon: 4 })],
});
```

That is it - the chart now forecasts. Everything below is reference.

---

## Forecasting

```ts
forecast({
  method: "holt-winters",                                   // or "linear" / lazy "arima"
  horizon: 8,
  level: 0.95,
  zone: true,                                               // shade the forecast region (toggleable)
  scenarios: [{ name: "optimistic", growth: 0.15 }, { name: "pessimistic", growth: -0.1 }],
  trendline: true,
  threshold: { value: 0, label: "Break-even" },             // reference line + "fall point"
  onThresholdBreach: (b) => alertOps(b),                    // fires when the forecast crosses it
});
```

More pure, deterministic helpers in `@michi-vz/insights/forecast`: `forecastFan()`,
`decompose()` / `detectPeriod()` (STL seasonality), `detectChangepoints()`,
`monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (goal-seek & run-rate).

## Narration: customize, localize (i18n), or bring a model

Here is narration - a two-series chart that writes its own sentence. Hit **Explain ▸** for the
instant rule-based sentence; flip **Real model** to load a small in-browser language model (its
size shown before anything downloads) and read its prose next to the rules, side by side:

<InsightsDemo feature="narrate" model-explain />

The default `narrate()` is **rule-based** (no model). Make it yours three ways:

```ts
import { narrate, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";

// 1. i18n - translate the built-in phrases (the sentence logic stays):
narrate({ strings: {
  topMover: (label, dir, pct) => `${label} a ${dir === "rose" ? "le plus augmenté" : "le plus baissé"}${pct}.`,
  trendSplit: (up, down) => `${up} séries en hausse et ${down} en baisse.`,
}});

// 2. Fully custom narrator - any wording, any language:
narrate({ render: (ctx) => myTemplate(ctx) });
```

### Bring a model

Try it live in the demo above: flip **Real model**, pick a small model by its size, and compare
its prose to the rule-based sentence, side by side.

`explainChart(ctx, { backend, model })` upgrades the prose with a model and **always falls back** to
the rule-based text. No plugin needed - call it on demand. **Small language models that run in the
browser** are preferred (local-first, private, no server):

```ts
// In-browser via Transformers.js (ONNX + WebGPU). Phi-3-mini (MIT) or Google Gemma 2 (2B):
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.phi3 });
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.gemma });

// In-browser via WebLLM (WebGPU):
await explainChart(chart.getContext(), { backend: "webllm", model: SLM_PRESETS.webllm.gemma });

// Or your own remote model (data leaves the client - opt-in):
await explainChart(chart.getContext(), { backend: "remote", caller: (prompt) => callClaude(prompt) });
```

**Already running a local AI?** Hook it directly - no download, no Hugging Face, prompts go only
to the endpoint you name. Two ready-made callers cover the common local servers:

```ts
import { ollamaCaller, openaiCompatCaller } from "@michi-vz/insights/narrate";

// Ollama (native API, default http://localhost:11434):
await explainChart(ctx, {
  backend: "remote",
  caller: ollamaCaller({ model: "llama3.2" }),
});

// LM Studio, llama.cpp server, vLLM, LocalAI - anything OpenAI-compatible:
await explainChart(ctx, {
  backend: "remote",
  caller: openaiCompatCaller({ url: "http://localhost:1234", model: "qwen2.5" }),
});
```

Both throw on failure, so narration falls back to the deterministic rule-based sentence - the
chart never ends up blank because a local server was down.

`SLM_PRESETS` ships model ids for **Phi-3-mini** and **Gemma 2 (2B)**. The model is lazy-loaded only
when called; nothing is bundled, and if it cannot load the rule-based text is returned. Combine with
`strings` / `render` so even the fallback is in your language.

A first model load downloads weights, so show a loader with `onProgress` (wired to Transformers.js /
WebLLM). The demos above use a calm, Nordic-style "thinking" indicator while it runs:

```ts
await explainChart(ctx, {
  backend: "transformers",
  model: SLM_PRESETS.transformers.gemma,
  onProgress: (p) => setLoading(p.status, p.progress), // drive your own loading UI
});
```

### Where models come from (and how to change it)

Model downloads should never be a surprise. Here is exactly what each backend fetches, from
where, by default:

| Backend | Downloads? | Default source |
| --- | --- | --- |
| `rules` (default) | Nothing | Fully offline, deterministic |
| `transformers` | Model weights, on first use | **`https://huggingface.co`** (cached in the browser after the first load) |
| `webllm` | Model weights, on first use | WebLLM's prebuilt registry (Hugging Face-hosted), cached in the browser |
| `remote` | Nothing | Your prompts go to **your** endpoint (the `caller` option) - e.g. a local Ollama/llama.cpp server or your API. Data leaves the page; that is the opt-in. |

Ask the library itself before loading anything, and show it to your users:

```ts
import { describeModelSource, SLM_PRESETS } from "@michi-vz/insights";

const src = describeModelSource("transformers", SLM_PRESETS.transformers.phi3);
// { host: "https://huggingface.co",
//   url:  "https://huggingface.co/Xenova/Phi-3-mini-4k-instruct/resolve/main/",
//   downloads: true, note: "Transformers.js downloads the model files from ..." }
```

And redirect it with `modelSource` (works on `explainChart` and `createEmbedder`):

```ts
// A mirror (e.g. hf-mirror.com, or your artifact proxy):
await explainChart(ctx, {
  backend: "transformers",
  modelSource: { remoteHost: "https://models.example.com" },
});

// Self-hosted, fully offline - serve the model directory from your own origin
// and FORBID any remote download (intranet/compliance):
await explainChart(ctx, {
  backend: "transformers",
  model: "my-fine-tuned-model",
  modelSource: { localModelPath: "/models/", allowRemoteModels: false },
});

// WebLLM self-hosting: point its registry at your own weights:
await explainChart(ctx, {
  backend: "webllm",
  webllmAppConfig: { model_list: [{ model: "https://your.cdn/phi3/", model_id: "phi3", model_lib_url: "https://your.cdn/phi3/lib.wasm" }] },
});

// No download at all - your own API (local or remote):
await explainChart(ctx, { backend: "remote", caller: (prompt) => fetch("/api/llm", { method: "POST", body: prompt }).then(r => r.text()) });
```

## Agents & MCP

The same registry powers the demo below - each button is a real tool call against the chart
(the identical tools an MCP client like Claude Code would invoke):

<InsightsDemo feature="agent" />

```ts
import { createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";
const registry = createAgentRegistry();
registry.register(chartHandle("revenue", chart, props));
createMcpServer(registry, stdioTransport(), { name: "michi-vz" });
```

Tools: `get_chart_context`, `summarize_chart`, `list_series`, `forecast_series`,
`detect_threshold_breach`, `set_filter`, `highlight`, `set_disabled`, `set_data`. Each chart's context
is also a readable `michivz://chart/<name>` resource. A `messagePortTransport` bridges a running web
app's charts.

---

## Reference

### Sub-paths

Each capability is its own tree-shakeable import:

| Import | What you get | API |
| --- | --- | --- |
| `@michi-vz/insights/forecast` | `forecast()` plugin (dashed prediction + band + backtested accuracy), scenarios, trendline, threshold + "fall point", `forecastFan()` | [forecast](/api/insights/forecast) |
| `@michi-vz/insights/forecast` (extras) | `decompose()` / `detectPeriod()` (seasonality), `detectChangepoints()`, `monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (goal-seek) | [forecast extras](/api/insights/forecast-extras) |
| `@michi-vz/insights/anomaly` | `anomaly()` / `detectAnomalies()` - z-score / IQR / forecast-band outliers | [anomaly](/api/insights/anomaly) |
| `@michi-vz/insights/validate` | `validate()` - richer data-quality warnings | [validate](/api/insights/validate) |
| `@michi-vz/insights/narrate` | `narrate()` / `explainChart()` - rules baseline, opt-in SLM/remote | [narrate](/api/insights/narrate) |
| `@michi-vz/insights/embeddings` | `reconcileLabels()` / `matchLabels()` / `findSimilar()` / `createEmbedder()` - hash fallback, opt-in BERT/MiniLM | [embeddings](/api/insights/embeddings) |
| `@michi-vz/insights/sql` | `aggregate()` - group-by/measures (opt-in DuckDB-Wasm) | [aggregate](/api/insights/sql) |
| `@michi-vz/insights/sonify` | `sonify()` - hear a series as pitch | [sonify](/api/insights/sonify) |
| `@michi-vz/insights/agent` | `createAgent()` + tool registry | [agent & MCP](/api/insights/agent) |
| `@michi-vz/insights/mcp` | `createMcpServer()` - Claude Code / Codex / Cursor | [agent & MCP](/api/insights/agent) |

### How it works (the logic, in plain terms)

- **Forecast.** Fit a model (Holt-Winters tracks *level* + *trend*; linear regression fits a best-fit
  line) → project ahead. The **band** comes from the model's own past error spread (widening with
  distance). A **backtest** hides the last few real points and measures the error → the accuracy figure.
- **Anomaly.** Compute the average and the spread, then flag points that sit too far out - by
  **z-score** (how many standard deviations a point is from the average; flagged past about 3) or
  **IQR** (whether a point falls outside the usual middle range of the data).
- **Narrate / Explain - where the words come from.** By **default there is no AI model at all**:
  `narrate()` reads the structured `ChartContext` (trend, biggest mover, % change, totals) and fills
  sentence templates. It is pure, deterministic string assembly - instant and offline. `explainChart()`
  can **optionally** upgrade to a real **generative** language model: `backend: "transformers"` loads a
  small text-generation model (default Phi-3-mini) in the browser via Transformers.js, `backend:
  "webllm"` runs Llama/Phi on WebGPU, or `backend: "remote"` calls a model of your own (e.g. a Claude API).
  Any of them gets the `ChartContext` as its prompt and **falls back to the rules** if unavailable.
  > **Not BERT.** BERT (in `@michi-vz/insights/embeddings`) turns text into vectors for *similarity /
  > search*, not for writing sentences. Narration is rules by default, or a small generative LLM when
  > opted in - two different jobs.

### Glossary

Plain-English meanings of the terms these charts use:

- **Fall point** - the spot where the projected line is expected to reach a target you care about (a
  break-even, a goal), whether it climbs up to it or drops down to it; it answers "when will we get there?".
- **Confidence band (prediction interval)** - the shaded zone around the forecast line showing the range
  the future value is likely to land in; narrow means fairly sure, wide means a rough guess, and it widens
  the further ahead it reaches.
- **Forecast horizon** - how many future periods the forecast extends; a short horizon is more
  trustworthy, a long one more speculative.
- **MAPE / backtest** - a grade for the forecast's accuracy: the most recent real years are hidden,
  predicted from the earlier ones, and the average miss is reported as a percentage (lower is better).
- **Holt-Winters** - the default forecasting method; it learns the current level and the trend direction
  and carries that momentum forward, weighting recent years more than old ones.
- **z-score** - how unusual a value is, counted as the number of standard steps it sits from the average;
  past about three, it is flagged as an outlier.
- **IQR (Tukey fences)** - an alternative outlier test built from the middle half of the data, so a single
  extreme value cannot throw it off; robust for lumpy or skewed series.
- **Anomaly** - a point flagged as standing out from the rest of the series (a spike, a slump, a possible
  data error), marked with a dot.
- **Top mover** - on a multi-line chart, the series that moved the most between the start and the end; the
  plain-English summary names it, so the headline finding is handed over rather than hunted for.
- **Threshold / reference line** - a horizontal line at a value that matters (a target, a budget, a
  break-even); every other value is read against it, and it is the line the forecast is watched against
  to find the fall point.

And the units and shorthands the example charts use:

- **CPI (Consumer Price Index)** - the standard gauge of inflation: the average price of a basket of
  everyday goods, so a rising CPI means the cost of living is climbing.
- **$k / $M** - thousands / millions of dollars (so "$120M" is 120 million).
- **Index (base 100)** - a series rescaled so its first year equals 100, so "down to 92" reads at a
  glance as "8% below where it started", whatever the original units.
- **Gigawatt (GW)** - a unit of electrical power; a large power station is roughly one GW.
- **Run-rate** - the pace a number is growing at right now, carried forward (for example "$1.2M a week").
- **MRR (monthly recurring revenue)** - the predictable subscription income a SaaS business books each
  month, the headline number such companies are measured by.

### Methods & formulas

Every figure in these demos is computed from the data, never hand-waved - and none of it needs a
statistics degree. Below is what each method does in plain words, the formula behind it for the curious,
and a free, readable source. References to *Hyndman* point to
[*Forecasting: Principles and Practice*](https://otexts.com/fpp3/), a free online textbook.

| What it does | Method | Formula (for the curious) | Learn more |
| --- | --- | --- | --- |
| **Project a trend forward** - carries the recent level and slope ahead; tracks a repeating season if one exists. | Holt-Winters | `ŷₜ₊ₕ = ℓₜ + h·bₜ` (level + trend updated each step) | [Exponential smoothing](https://otexts.com/fpp3/expsmooth.html) (Hyndman, ch. 8) |
| **Fit a straight line** - the best-fit line through the points. | Linear regression (OLS) | `ŷ = a + b·x` (least squares) | [Time-series regression](https://otexts.com/fpp3/regression.html) (Hyndman, ch. 7) |
| **Forecast with momentum** - learns how each point depends on the recent past. | ARIMA / SARIMA (loads on demand) | autoregressive + moving average | [ARIMA models](https://otexts.com/fpp3/arima.html) (Hyndman, ch. 9) · [`arima` library](https://github.com/zemlyansky/arima) |
| **Show how sure the forecast is** - turns the model's own past errors into the 50/80/95% bands; wider further out. | Prediction interval | `ŷ ± z·σ·√h` (z = 1.96 for 95%) | [Prediction intervals](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Score the accuracy** - hides recent points, re-predicts them, and reports how far off. | Rolling-origin backtest | `MAPE = mean(\|y−ŷ\|/\|y\|)·100` · `RMSE = √mean((y−ŷ)²)` | [Forecast accuracy](https://otexts.com/fpp3/accuracy.html) (Hyndman, §5.8) |
| **Separate season from trend** - splits a series into trend + repeating season + leftover noise. | STL decomposition | trend + seasonal + remainder (Loess) | [STL decomposition](https://otexts.com/fpp3/stl.html) (Hyndman, §3.6) |
| **Simulate many futures** - replays thousands of plausible paths for a best/worst spread. | Monte Carlo | resample residuals over N paths → outcome spread | [Bootstrap & simulation](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Flag an outlier (simple)** - marks points far from the average. | z-score | `z = (x−μ)/σ`, flag `\|z\| > 3` | [Outlier detection](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm) (NIST handbook) |
| **Flag an outlier (robust)** - marks points outside the typical middle range; shrugs off extremes. | IQR / Tukey fences | `x < Q1−1.5·IQR` or `x > Q3+1.5·IQR` | [Boxplots & fences](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) (NIST handbook) |
| **Measure a relationship** - how tightly two variables move together, from −1 to +1. | Pearson *r* | `r = cov(x,y)/(σₓ·σᵧ)` | [Correlation](https://otexts.com/fpp3/regression.html) (Hyndman, ch. 7) |
| **Match text by meaning** - turns words into vectors so similar meanings score high. | Cosine similarity | `cos = (a·b)/(‖a‖·‖b‖)` | [Sentence embeddings](https://huggingface.co/docs/transformers.js) (Transformers.js) |

### vs a pandas / notebook workflow

Not a replacement for exploration - keep using pandas / R / a notebook for that. The difference
is *where the insight runs*:

| | pandas / notebook | `@michi-vz/insights` |
| --- | --- | --- |
| **Runs where** | your machine, offline, once | the app, the user's browser |
| **Output** | a static number / image to share | the *rendered* chart updates itself |
| **Audience** | the analyst | your product's users |
| **Backend** | Python runtime | none - zero server, data stays local |
| **AI-ready** | the prompt is written by hand | the chart **is** the tool surface (MCP) |

pandas is how an insight is *discovered*; this is how it is **shipped** to users and made into a chart
an AI agent can drive - same trustworthy methods, delivered at runtime.

### Further reading

- **Forecasting: Principles and Practice** (Hyndman & Athanasopoulos): <https://otexts.com/fpp3/>
- **Model Context Protocol**: <https://modelcontextprotocol.io> · [Anthropic's announcement](https://www.anthropic.com/news/model-context-protocol)
- **Transformers.js** (BERT/embeddings in the browser): <https://huggingface.co/docs/transformers.js>
- **NIST/SEMATECH e-Handbook of Statistical Methods**: <https://www.itl.nist.gov/div898/handbook/>

### Principles

- **Opt-in & tree-shakeable** - unused capabilities ship zero bytes.
- **Graceful degradation** - statistical/rule-based paths need no model; model paths fall back.
- **Privacy by default** - data stays in the browser; remote backends are opt-in.
- **Permissive-OSS only** - no model is ever bundled.
