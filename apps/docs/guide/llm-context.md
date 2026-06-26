# LLM context

Every chart derives a renderer-agnostic **`ChartContext`** from its data model (never the DOM), so it
is **identical in SVG and canvas mode** — even in canvas, where there are no per-mark nodes for a model
to scrape.

```ts
const ctx = chart.getContext();
// or in the wc element / wrappers:
el.getContext();
```

It exposes three things from one source:

1. **Structured JSON** — chart type, axes/domains, per-series stats (min/max/first/last, change,
   trend, correlation, gaps, totals…). Ready for LLM tool-use, RAG, or agents.
2. **A deterministic natural-language `summary`** — rule-based, no model required; also serves as
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

The shape is a discriminated union keyed on `chartType`, so it narrows cleanly per chart. The
upcoming **`@michi-vz/insights`** layer consumes this context for client-side forecasting, anomaly
detection, and narration.
