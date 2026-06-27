# @michi-vz/insights

**Opt-in, client-side AI / predictive / agent layer for [michi-vz](https://github.com/beany-vu/michi-vz-mono) charts.**

The chart engine (`@michi-vz/core`) stays zero-AI-dependency. This package adds forecasting, anomaly
detection, narration, embeddings, an agent/MCP surface, and more - each as its own **tree-shakeable
sub-path**, so a chart that uses none of it ships **zero** extra bytes. The statistical features need
**no model download**; model features are **opt-in and local-first** (they fall back gracefully).

```bash
npm i @michi-vz/insights
```

## At a glance

| Import | What you get |
| --- | --- |
| `@michi-vz/insights/forecast` | `forecast()` plugin (dashed prediction + confidence band + backtested accuracy), scenarios, trendline, threshold + "fall point", Monte Carlo, seasonality/STL, changepoints, goal-seek, `forecastFan()` |
| `@michi-vz/insights/anomaly` | `anomaly()` / `detectAnomalies()` - z-score / IQR / forecast-band outliers |
| `@michi-vz/insights/validate` | `validate()` - richer data-quality warnings |
| `@michi-vz/insights/narrate` | `narrate()` / `explainChart()` - plain-English "explain this chart" (rules baseline, opt-in SLM/remote) |
| `@michi-vz/insights/embeddings` | `findSimilar()` / `createEmbedder()` - semantic search (hash fallback, opt-in BERT/MiniLM) |
| `@michi-vz/insights/sql` | `aggregate()` - group-by/measures wrangling (opt-in DuckDB-Wasm) |
| `@michi-vz/insights/sonify` | `sonify()` - hear a series as pitch (accessibility) |
| `@michi-vz/insights/agent` | `createAgent()` + tool registry - an in-page agent that reads & drives charts |
| `@michi-vz/insights/mcp` | `createMcpServer()` - an MCP server so Claude Code / Codex / Cursor can read & drive charts |

## Forecasting (the headline)

Add the plugin to a chart - nothing else changes:

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

const chart = mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ method: "holt-winters", horizon: 4, level: 0.95 })],
});
chart.getContext().summary;
// "...Forecast: Revenue projected to 189 by 2027 (holt-winters, MAPE 6.1%)."
```

It works on **Line, Fan, Range, Area, Vertical-Stack-Bar, Ribbon, and Bar-Bell** (per-chart adapters
extend each into the future). Line/Range/Fan render the uncertainty natively (dashed tail / band); the
**Fan chart** is the richest presentation - build its data in one call with `forecastFan(history, opts)`.

### Scenarios, threshold & alerting

```ts
forecast({
  horizon: 8,
  scenarios: [{ name: "optimistic", growth: 0.15 }, { name: "pessimistic", growth: -0.1 }],
  threshold: { value: 0, label: "Break-even" },
  onThresholdBreach: (b) => alertOps(b), // fires when the forecast is projected to cross the line
});
```

## Agents & MCP - charts AI can read *and* drive

Every chart already emits a structured `ChartContext`. The agent layer turns that + the chart's
controls into tools an LLM can call.

```ts
// In-page agent (bring your own LLM caller)
import { createAgent, chartHandle } from "@michi-vz/insights/agent";
const agent = createAgent({ charts: [chartHandle("revenue", chart, props)], llm: myCaller });
await agent.ask("Filter to the top 5 and forecast next quarter");

// MCP server (Claude Code / Codex / Cursor / Claude Desktop)
import { createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";
const reg = createAgentRegistry();
reg.register(chartHandle("revenue", chart, props));
createMcpServer(reg, stdioTransport());
```

## Principles

- **Opt-in & tree-shakeable** - unused capabilities ship zero bytes.
- **Graceful degradation** - statistical/rule-based paths need no model; model paths fall back.
- **Privacy by default** - data stays in the browser; remote backends are opt-in.
- **Permissive-OSS only** - no model is ever bundled.

Full guide: **[michi-vz docs → Insights](https://michi-vz.netlify.app/guide/insights)**.

MIT © Beany Vu
