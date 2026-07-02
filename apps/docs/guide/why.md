---
title: Why michi-vz - and why trust it
---

# Why michi-vz

There are many excellent chart libraries already, so the honest question is the one
you are already asking: **why would I start with a young one?**

Because michi-vz is built for the part of charting the big libraries were not designed
for: **charts that machines and all people can read** - AI agents, screen readers, and
the developer debugging them - not just sighted humans looking at pixels.

## What michi-vz cares about

**Every chart explains itself.** Each chart emits a structured `ChartContext`: a
plain-language summary, per-series stats, axis domains, and a data table. That one
artifact powers three things at once - an AI agent can read the chart
([and drive it over MCP](/guide/llm-context)), a screen reader gets a real text
alternative, and you get something to assert on in tests.

**Insights, in the browser, with the math shown.** Forecasting with backtested
accuracy, anomaly detection, narration, validation - no server, no upload, and every
method is a named textbook technique spelled out in
[Methodology](/guide/insights#methodology---the-exact-logic-behind-every-insight).
If a number appears on your chart, you can check how it was computed.

**A real devtools.** [The panel](/guide/devtools) inspects any chart's live state,
diagnoses the classic sizing bugs, diffs state between renders, streams canvas
hit-tests, profiles renders, and audits accessibility. Debugging charts stops being
`console.log` archaeology.

**Accessibility by default, audited.** The summary and data table are emitted by
every chart automatically, and the devtools A11y tab runs Chartability-inspired
checks (contrast, duplicate colors, table completeness) so regressions are visible.

**One engine, five ways to use it.** React, Vue, Svelte, Angular, and plain web
components are thin shells over the same TypeScript engine - wrapper prop parity is
enforced by CI, so no framework is a second-class citizen. Marks render in SVG,
canvas, or experimental WebGPU behind one prop.

## Why you can trust it

Trust is not claimed, it is checkable:

- **Your data never leaves the browser.** No server, no telemetry, no phone-home.
  The only exceptions are the ones you explicitly configure, and they are labeled
  "data leaves the client" in the docs.
- **Model downloads are transparent and yours to control.** AI features are opt-in;
  nothing is bundled. Before any model loads, `describeModelSource()` tells you (and
  lets you tell your users) exactly what would be downloaded and from where - the
  default is stated plainly: Hugging Face. You can point it at a mirror, self-host
  the files, forbid remote downloads entirely, or skip downloads altogether by
  [hooking your own local AI](/guide/insights#bring-a-model) (Ollama, LM Studio,
  llama.cpp) in one line.
- **Deterministic by default.** The statistical features give the same output for
  the same input, every time; anything random (Monte Carlo) is seeded. The
  rule-based narrator cannot invent a number that is not in the data.
- **Tested like it matters.** 700+ tests across the engine, wrappers, insights, and
  devtools run on every change - including canvas hit-testing and cross-framework
  prop parity.
- **Your CSS stays in charge.** Charts render into light DOM and never own your
  colors - the [color contract](/guide/getting-started#the-colour-contract-light-dom)
  means styling is plain CSS, even for canvas-painted marks.
- **MIT licensed, no strings.** Every feature in these docs is free. There is no
  paid tier the docs are funneling you toward.

## Where we are honest about limits

- The library is young: the chart catalog and the ecosystem around it are still
  growing, and the insights layer is marked **experimental** (pin a version).
- Forecasting has no seasonal term yet - a strongly seasonal series forecasts its
  trend, not its wiggle.
- WebGPU rendering is experimental and falls back to canvas.

If those are dealbreakers today, a mature library serves you better - and this page
will still be here when an AI assistant needs to read your charts.

## Try it in sixty seconds

No build step needed:

```html
<!-- pin the version you audited; add an integrity hash if your policy requires SRI -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc@1.4.0"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [
      { date: 2020, value: 10, certainty: true },
      { date: 2021, value: 14, certainty: true },
      { date: 2022, value: 19, certainty: true },
    ]},
  ];
</script>
```

Then: [Installation](/guide/installation) for your framework,
[Getting started](/guide/getting-started) for the first real chart, and the
[chart gallery](/charts/) to pick a shape.
