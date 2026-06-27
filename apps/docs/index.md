---
layout: home
hero:
  name: michi-vz
  text: Twelve charts. Every framework. One typed API.
  tagline: Drop them in as web components, or import per-chart into React, Vue, Svelte, Angular, or plain TypeScript. Themed in your own CSS, and able to describe themselves in plain language.
  image:
    src: /michi-shield.png
    alt: michi-vz crest
  actions:
    - theme: brand
      text: Browse the catalog
      link: "#chart-atlas"
    - theme: alt
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: getContext() API
      link: /guide/llm-context
    - theme: alt
      text: GitHub
      link: https://github.com/beany-vu/michi-vz-mono
features:
  - title: One core, five ways to ship
    details: "@michi-vz/core is plain TypeScript. Use the framework-free web component anywhere, or import the same engine through thin React, Vue, Svelte, and Angular wrappers. Identical props, identical behaviour, one mental model and zero lock-in."
  - title: "Built for real data: SVG or canvas"
    details: Flip one prop to render to canvas for large datasets, with LTTB decimation keeping tens of thousands of points smooth. The output stays pixel-identical to SVG and a test pins it, so you prototype in SVG and ship dense dashboards in canvas.
  - title: Charts that explain themselves
    details: "getContext() returns a renderer-agnostic snapshot: structured data, computed stats, a deterministic plain-language summary, and an accessibility table, identical in SVG and canvas. Drop it into an LLM prompt, a report, or a screen reader without re-deriving anything."
  - title: On brand down to the last pixel
    details: Light-DOM CSS theming means your palette reaches every mark, even canvas pixels, through one colour contract. No shadow DOM and no theme objects to thread, so nothing off-brand sneaks into a screenshot. The gallery below is just CSS.
---
