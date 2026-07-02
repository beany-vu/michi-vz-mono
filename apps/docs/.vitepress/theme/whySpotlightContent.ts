// Copy for the homepage "Why michi-vz" spotlight. Pure data, no DOM: the
// component renders `body` as runs so technical terms get a native-title
// tooltip without any v-html. Tone rules: honest, no superlatives, name the
// competitors the way guide/why.md already does, and never claim what the
// code cannot do (the treemap split is real; drilldown is not, so it is not
// mentioned). House style: plain ASCII hyphens only.

export type WhyTabId = "explain" | "gaps" | "insights" | "treemap" | "webgpu" | "frameworks";

/** A body fragment: plain text, or a term carrying a native-title tooltip. */
export type BodyRun = string | { term: string; title: string };

export interface WhyTab {
  id: WhyTabId;
  heading: string;
  body: BodyRun[];
  /** The honest "how the incumbents do it" line, rendered under the body. */
  elsewhere: string;
  link: { text: string; href: string };
}

export const WHY_LEDE =
  "Seventeen chart types, from stacked bars to gap charts to the fountain, drawn by one " +
  "engine. Here are six concrete reasons to reach for michi-vz instead of Chart.js, D3, " +
  "or ECharts. Each one is a live chart, not a screenshot.";

export const TABS: WhyTab[] = [
  {
    id: "explain",
    heading: "Every chart explains itself",
    body: [
      "The sentence beside this chart was written by the chart itself. Every michi-vz chart emits a structured ",
      {
        term: "ChartContext",
        title:
          "A plain JSON object with a plain-language summary, per-series stats, axis domains, and a data table. Returned by getContext() on every chart, identical in SVG, canvas, and WebGPU mode.",
      },
      " that an AI agent can query, a screen reader can speak, and a test can assert on. Pixels for people, structure for everything else.",
    ],
    elsewhere:
      "Chart.js, D3, and ECharts hand you pixels. ECharts can auto-generate a short aria description; Chart.js and D3 leave summarizing and accessibility entirely to you.",
    link: { text: "How machines read these charts", href: "/guide/llm-context" },
  },
  {
    id: "gaps",
    heading: "Missing data, made honest",
    body: [
      "The 2020 reading is missing. So the line is dashed into the gap and the 2020 tick carries its own explanation, from one prop: ",
      {
        term: "detectGaps",
        title:
          "detectGaps: true auto-detects missing periods (years, months, or a numeric step) and dashes the segment entering each gap. noDataTickColor and noDataTickTooltip style and explain the missing ticks.",
      },
      ". Charts should admit what they do not know instead of drawing a confident line through a hole.",
    ],
    elsewhere:
      "Chart.js spanGaps bridges the hole with a solid line (the default leaves a blank break); a dashed gap needs a custom segment callback. In D3 you split the line generator by hand.",
    link: { text: "Gap detection on the line chart", href: "/charts/line#gap-detection" },
  },
  {
    id: "insights",
    heading: "Insights, in the browser",
    body: [
      "The shaded fan is a real ",
      {
        term: "Holt-Winters",
        title:
          "Double exponential smoothing, a named textbook forecasting method. The insights docs spell out the exact logic behind every number, and backtesting reports the accuracy.",
      },
      " forecast with 50% and 80% bands, computed in your browser the moment you opened this tab. No server, no upload: the data never leaves the page, and every method is a named technique you can check.",
    ],
    elsewhere:
      "Chart.js, D3, and ECharts draw whatever numbers you hand them. Forecasting means wiring up a separate stats library, or a server, yourself.",
    link: { text: "The insights layer, with methodology", href: "/guide/insights" },
  },
  {
    id: "treemap",
    heading: "A treemap with an inner truth",
    body: [
      "Each tile is sized by its total, and the inner rectangle shows how much of that total is realized versus ",
      {
        term: "untapped",
        title:
          "Every tile takes a partial value; showSplit draws it as an inner rectangle with its own legend labels (here: Realized vs Untapped).",
      },
      ": two numbers per tile, one glance. Hierarchies nest, and on narrow screens the layout restacks instead of shrinking into slivers.",
    ],
    elsewhere:
      "d3-hierarchy sizes tiles, nothing more. The ECharts treemap has no split concept either, and Chart.js needs a community plugin for a treemap at all.",
    link: { text: "The treemap, in full", href: "/charts/treemap" },
  },
  {
    id: "webgpu",
    heading: "WebGPU, when you need it",
    body: [
      "This point cloud is painted by your GPU when the browser offers a ",
      {
        term: "WebGPU",
        title:
          "The successor to WebGL, shipped in Chrome, Edge, Firefox, and Safari 26+. Experimental in michi-vz: the data marks render on the GPU while axes, labels, and tooltips stay crisp SVG.",
      },
      " adapter, and falls back to canvas automatically when it does not. Flip the renderer below: same chart, same context, different painter. Honestly labeled experimental, and most dashboards never need it.",
    ],
    elsewhere:
      "Chart.js and D3 render SVG or canvas only. The ECharts GL extension targets 3D scenes, not a general WebGPU path for 2D marks.",
    link: { text: "The 50,000-point demo on the scatter page", href: "/charts/scatter" },
  },
  {
    id: "frameworks",
    heading: "One engine, five ways",
    body: [
      "The radar and the snippets below share one props object: React, Vue, Svelte, Angular, and plain web components are thin shells over the same TypeScript engine, kept in lockstep by a ",
      {
        term: "CI parity check",
        title:
          "A static parity test (wrapper-parity.test.mjs) fails the build if any wrapper falls behind the core prop surface, so no framework is a second-class citizen.",
      },
      ". Learn the props once, use them in any stack, or in no framework at all.",
    ],
    elsewhere:
      "Chart.js and ECharts have framework-agnostic cores too, but their React, Vue, and Svelte bindings are separate community projects of varying freshness, not one team shipping five wrappers in lockstep.",
    link: { text: "Install for your framework", href: "/guide/installation" },
  },
];

/** Tab 6's framework snippets. Kept to the same shapes as the shipped
 * `::: code-group` blocks on every chart page (source: charts/radar.md). */
export const FRAMEWORK_SNIPPETS: { label: string; code: string }[] = [
  {
    label: "React",
    code: 'import { RadarChart } from "@michi-vz/react";\n\nexport default () => <RadarChart {...props} />;',
  },
  {
    label: "Vue",
    code: 'import { RadarChart } from "@michi-vz/vue";\n\n<RadarChart :options="props" />',
  },
  {
    label: "Svelte",
    code: 'import { radarChart } from "@michi-vz/svelte";\n\n<div use:radarChart={props}></div>',
  },
  {
    label: "Angular",
    code: 'import { applyRadarChartProps } from "@michi-vz/angular";\n\napplyRadarChartProps(this.c.nativeElement, props);',
  },
  {
    label: "Web component",
    code: '<michi-vz-radar-chart id="c"></michi-vz-radar-chart>\n<script>\n  Object.assign(document.getElementById("c"), props);\n</script>',
  },
];
