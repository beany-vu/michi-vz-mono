---
title: Insights - predict, explain, and drive charts with AI
---

# Charts that predict, explain themselves, and talk to AI

`@michi-vz/insights` is an **opt-in** layer over your charts. Every michi-vz chart already emits a
structured, machine-readable `ChartContext` - this package turns that into three superpowers:
**AI agents can read and drive your charts**, the charts **forecast the future**, and they
**explain themselves**. It's **100% client-side**, uses **plain, textbook methods** (no black box),
and ships **zero bytes** until you import a feature.

<InsightsDemo feature="forecast" />

> Above is a real line chart. Toggle **Forecast** to see a dashed prediction + shaded forecast region;
> **Explain** writes a sentence from the data. No server - it all runs in your browser.

---

## 1. Charts AI agents can read *and* drive

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

## 2. Charts that predict the future

Add one plugin and the chart grows a dashed prediction, a confidence band, and a **backtested
accuracy** figure (so it's trustworthy, not a guess). Forecasting works on Line, **Fan**, Range,
Area, and the stacked-bar family.

```ts
import { forecast } from "@michi-vz/insights/forecast";
mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ method: "holt-winters", horizon: 4, level: 0.95 })],
});
// getContext().summary → "...Revenue projected to 189 by 2027 (holt-winters, MAPE 6.1%)."
```

(The demo at the top of the page is this, live.) And it is **not line-only** - the same forecast
extends a Fan chart (nested confidence bands), an Area chart's stack, a Range band, and more:

<InsightsDemo feature="forecast" chart="fan" />

<InsightsDemo feature="forecast" chart="area" />

The **[Fan chart](/charts/fan)** is the dedicated forecast presentation, built in one call with
`forecastFan()`.

## 3. Charts that explain themselves (and catch bad data)

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

---

## Why you can trust it

- **Not a black box.** Every number is a named, textbook method (Holt-Winters, MAPE, z-score, IQR,
  STL, Pearson…) - see **Methods & formulas** below. Same primitives a stats library uses.
- **Deterministic + tested.** Statistical features give the same output for the same input and are
  covered by an extensive test suite; anything random (Monte Carlo) is seeded.
- **Your data stays in the browser.** No server, no upload. Remote model backends are strictly opt-in
  and documented as "data leaves the client."
- **No lock-in.** No model is ever bundled; model features are opt-in and **fall back** to a working
  statistical/rule-based version if a model isn't available.

## Is it for you?

- **Building a product (embedded analytics)?** Ship live forecasting and self-explaining charts to
  *your* users - client-side, no Python service to run.
- **A data / market analyst?** The methods you already know (Holt-Winters, MAPE, z-score) - now
  running at runtime in the app, not just in a notebook. See **vs pandas** below.
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

That's it - the chart now forecasts. Everything below is reference.

---

## Reference

### Sub-paths

Each capability is its own tree-shakeable import:

| Import | What you get |
| --- | --- |
| `@michi-vz/insights/forecast` | `forecast()` plugin (dashed prediction + band + backtested accuracy), scenarios, trendline, threshold + "fall point", Monte Carlo, seasonality/STL, changepoints, goal-seek, `forecastFan()` |
| `@michi-vz/insights/anomaly` | `anomaly()` / `detectAnomalies()` - z-score / IQR / forecast-band outliers |
| `@michi-vz/insights/validate` | `validate()` - richer data-quality warnings |
| `@michi-vz/insights/narrate` | `narrate()` / `explainChart()` - rules baseline, opt-in SLM/remote |
| `@michi-vz/insights/embeddings` | `findSimilar()` / `createEmbedder()` - hash fallback, opt-in BERT/MiniLM |
| `@michi-vz/insights/sql` | `aggregate()` - group-by/measures (opt-in DuckDB-Wasm) |
| `@michi-vz/insights/sonify` | `sonify()` - hear a series as pitch |
| `@michi-vz/insights/agent` | `createAgent()` + tool registry |
| `@michi-vz/insights/mcp` | `createMcpServer()` - Claude Code / Codex / Cursor |

## Forecasting options

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

Here is narration live - a two-series chart that writes its own sentence. Hit **Explain ▸** to
generate it (the calm "thinking" indicator is the Nordic-style loader you'd show while a real SLM
loads; here it runs the instant rule-based path):

<InsightsDemo feature="narrate" />

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

### Bring a model (we prefer SLMs)

`explainChart(ctx, { backend, model })` upgrades the prose with a model and **always falls back** to
the rule-based text. No plugin needed - call it on demand. We deliberately prefer **small language
models that run in the browser** (local-first, private, no server):

```ts
// In-browser via Transformers.js (ONNX + WebGPU). Phi-3-mini (MIT) or Google Gemma 2 (2B):
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.phi3 });
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.gemma });

// In-browser via WebLLM (WebGPU):
await explainChart(chart.getContext(), { backend: "webllm", model: SLM_PRESETS.webllm.gemma });

// Or your own remote model (data leaves the client - opt-in):
await explainChart(chart.getContext(), { backend: "remote", caller: (prompt) => callClaude(prompt) });
```

`SLM_PRESETS` ships model ids for **Phi-3-mini** and **Gemma 2 (2B)**. The model is lazy-loaded only
when you call this; nothing is bundled, and if it can't load you get the rule-based text. Combine with
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

## Semantic search (BERT embeddings)

Try it live - type a term and the chart labels re-rank by similarity (this runs the **model-free
hash** fallback, so it matches shared words; a BERT model adds true semantic matches like
*sales ≈ revenue*):

<InsightsDemo feature="embeddings" />

```ts
import { findSimilar, createEmbedder } from "@michi-vz/insights/embeddings";

// Default = a deterministic hash vector (no model). Opt into a small BERT/MiniLM model:
const ranked = await findSimilar("revenue", chartLabels, (t) => t, { backend: "transformers" });
// model defaults to a small sentence-transformer (all-MiniLM-L6-v2); swap with { model }.
```

BERT here is for **similarity / search** (find related charts, cluster series), not for writing text -
that is narration, above. Different jobs, different models.

## Agents & MCP (reference)

The same registry powers the live demo below - each button is a real tool call against the chart
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
app's live charts.

## How it works (the logic, in plain terms)

- **Forecast.** Fit a model (Holt-Winters tracks *level* + *trend*; linear regression fits a best-fit
  line) → project ahead. The **band** comes from the model's own past error spread (widening with
  distance). A **backtest** hides the last few real points and measures the error → the accuracy figure.
- **Anomaly.** Compute the average + spread, flag points too far out - **z-score** (k std-devs from
  the mean) or **IQR** (outside the Tukey fences).
- **Narrate / Explain - where the words come from.** By **default there is no AI model at all**:
  `narrate()` reads the structured `ChartContext` (trend, biggest mover, % change, totals) and fills
  sentence templates. It is pure, deterministic string assembly - instant and offline. `explainChart()`
  can **optionally** upgrade to a real **generative** language model: `backend: "transformers"` loads a
  small text-generation model (default Phi-3-mini) in the browser via Transformers.js, `backend:
  "webllm"` runs Llama/Phi on WebGPU, or `backend: "remote"` calls your own model (e.g. a Claude API).
  Any of them gets the `ChartContext` as its prompt and **falls back to the rules** if unavailable.
  > **Not BERT.** BERT (in `@michi-vz/insights/embeddings`) turns text into vectors for *similarity /
  > search*, not for writing sentences. Narration is rules by default, or a small generative LLM when
  > you opt in - two different jobs.

## Methods & formulas

| Feature | Method | Formula (plain) | Reference |
| --- | --- | --- | --- |
| Forecast (default) | Holt-Winters / Holt's linear trend | `ℓₜ = α·yₜ + (1−α)(ℓₜ₋₁+bₜ₋₁)`, `bₜ = β(ℓₜ−ℓₜ₋₁)+(1−β)bₜ₋₁`, `ŷₜ₊ₕ = ℓₜ + h·bₜ` | [FPP3 §8](https://otexts.com/fpp3/expsmooth.html) |
| Forecast (alt) | Linear regression (OLS) | `ŷ = a + b·x`, least squares | [FPP3 §7](https://otexts.com/fpp3/regression.html) |
| Forecast (alt) | ARIMA / SARIMA (lazy) | autoregressive + moving average | [FPP3 §9](https://otexts.com/fpp3/arima.html) · [`arima`](https://github.com/zemlyansky/arima) |
| Confidence band | residual spread | `ŷ ± z·σ·√h` (z = 1.96 for 95%) | [FPP3 §5.5](https://otexts.com/fpp3/prediction-intervals.html) |
| Accuracy | rolling-origin backtest | `MAPE = mean(abs(y−ŷ)/abs(y))·100`; `RMSE = √mean((y−ŷ)²)` | [FPP3 §5.8](https://otexts.com/fpp3/accuracy.html) |
| Seasonality | STL decomposition | trend + seasonal + remainder (Loess) | [FPP3 §3.6](https://otexts.com/fpp3/stl.html) |
| Simulation | Monte Carlo | resample residuals over N paths → outcome distribution | [Hyndman, simulation](https://otexts.com/fpp3/simulation.html) |
| Anomaly | z-score | `z = (x−μ)/σ`; flag `abs(z) > k` (k≈3) | [NIST §1.3.5.17](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm) |
| Anomaly | IQR (Tukey fences) | flag `x < Q1−1.5·IQR` or `x > Q3+1.5·IQR` | [NIST §7.1.6](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) |
| Correlation (scatter) | Pearson *r* | `r = cov(x,y)/(σₓσᵧ)` | [FPP3 §7.1](https://otexts.com/fpp3/regression.html) |
| Embeddings | cosine similarity | `cos = (a·b)/(‖a‖·‖b‖)`; MiniLM vectors | [Transformers.js](https://huggingface.co/docs/transformers.js) |

## How this differs from a pandas / notebook workflow

Not a replacement for your exploration - keep using pandas / R / a notebook for that. The difference
is *where the insight runs*:

| | pandas / notebook | `@michi-vz/insights` |
| --- | --- | --- |
| **Runs where** | your machine, offline, once | the live app, the user's browser |
| **Output** | a static number / image you share | the *rendered* chart updates itself |
| **Audience** | you, the analyst | your product's users |
| **Backend** | Python runtime | none - zero server, data stays local |
| **AI-ready** | you write the prompt by hand | the chart **is** the tool surface (MCP) |

pandas is how *you* discover the insight; this is how you **ship** it to users and make a chart an AI
agent can drive - same trustworthy methods, delivered at runtime.

## Further reading

- **Forecasting: Principles and Practice** (Hyndman & Athanasopoulos): <https://otexts.com/fpp3/>
- **Model Context Protocol**: <https://modelcontextprotocol.io> · [Anthropic's announcement](https://www.anthropic.com/news/model-context-protocol)
- **Transformers.js** (BERT/embeddings in the browser): <https://huggingface.co/docs/transformers.js>
- **NIST/SEMATECH e-Handbook of Statistical Methods**: <https://www.itl.nist.gov/div898/handbook/>

## Principles

- **Opt-in & tree-shakeable** - unused capabilities ship zero bytes.
- **Graceful degradation** - statistical/rule-based paths need no model; model paths fall back.
- **Privacy by default** - data stays in the browser; remote backends are opt-in.
- **Permissive-OSS only** - no model is ever bundled.
