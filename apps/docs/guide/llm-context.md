---
title: LLM context - a chart an AI can read and drive
---

# LLM context: a chart an AI can read and drive

::: tip Machine-readable docs
AI assistants can read this whole library from two files: [/llms.txt](https://michi-vz.netlify.app/llms.txt) (compact index, llmstxt.org convention) and [/llms-full.txt](https://michi-vz.netlify.app/llms-full.txt) (the full reference inline - every chart's props, ChartContext, insights, theming). Point your coding agent at either one.
:::

Hand a chart to a chatbot and the usual move is to screenshot it and hope the model reads the pixels.
A michi-vz chart skips that: it hands over a structured **`ChartContext`** the model can read directly,
and exposes its controls as **tools** the model can call. So an assistant can *understand* the chart and
*change* it - by function calls, not guesswork.

<InsightsDemo feature="forecast" />

> The sentence under the chart is its `getContext().summary` - written from the data, not scraped
> from the DOM. A model gets that, plus the full structured context below.

## What the context is

Every chart derives a renderer-agnostic **`ChartContext`** from its data model (never the DOM), so it
is **identical in SVG and canvas mode** - even in canvas, where there are no per-mark nodes to scrape.

```ts
const ctx = chart.getContext(); // or el.getContext() on the web component / wrappers
```

It exposes three things from one source:

1. **Structured JSON** - chart type, axes/domains, per-series stats (min/max/first/last, change,
   trend, correlation, gaps, totals…). Ready for LLM tool-use, RAG, or agents.
2. **A deterministic natural-language `summary`** - rule-based, no model required; also serves as
   alt text.
3. **A chart-agnostic `a11yTable`** (`headers` + `rows`) that drives a visually-hidden DOM table next
   to the chart, so screen readers and DOM-scraping tools get real content even in canvas mode.

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

The shape is a discriminated union keyed on `chartType`, so it narrows cleanly per chart.

## Talk to your chart: a chatbot that drives it

Because the meaning is structured **and** the controls are tools, a chatbot does not scrape pixels - it
calls functions. Every button below is a real tool call against the chart (the exact calls an MCP
client like Claude Code would make):

<InsightsDemo feature="agent" />

Type a command - even a sloppy one like *"hilight east"* - and the chart responds. The **⚡ Instant**
engine routes your words to the chart's tools with a **typo-tolerant** matcher (and suggests a fix when
it is unsure: *"did you mean highlight East?"*). Flip to **Real model** and pick a small in-browser LLM
(**Qwen / Llama / Gemma**) that reads the chart's context and interprets free-form requests; it falls
back to the instant matcher if it is not loaded or stumbles.

Either way, the *reading* is exact: an answer to *"which series grew the most?"* comes straight from the
deterministic `getContext()` (top mover, % change, totals) - the same context the insight features use -
so only the phrasing is fuzzy, never the numbers. Wire your own caller and the agent gets that context
plus the tools:

```ts
import { createAgent, chartHandle } from "@michi-vz/insights/agent";

const agent = createAgent({ charts: [chartHandle("sales", chart, props)], llm: myCaller });
await agent.ask("Highlight North, hide South, and forecast next quarter");
// the agent reads getContext(), calls highlight / set_disabled / sales.forecast, and replies.
```

The chat input above is a tiny one built for these docs. For a polished chat UI in your own app,
**[deep-chat](https://deepchat.dev)** is a lovely framework-agnostic chat web component - drop it in,
point it at your LLM, and hand it the same `getContext()` and tools. (Hat tip to the deep-chat folks.)

> A model can be confidently wrong and different models answer differently - so don't trust AI blindly.
> The structured context and tools are deterministic; the model on top is the part to verify.

The same tools are exposed over **MCP** (Model Context Protocol), so Claude Code, Cursor, and Claude
Desktop connect with no custom integration. The full tool list, the `michivz://chart/<name>` resources,
and the registry demo are in **[Insights → Agents & MCP](/guide/insights)**.
