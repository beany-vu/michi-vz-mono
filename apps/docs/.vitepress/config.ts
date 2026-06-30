import { defineConfig, type HeadConfig } from "vitepress";

// Google Analytics is injected ONLY from a build-time env var so the tracking
// ID never lives in this open-source repo. Set GA_MEASUREMENT_ID in the Netlify
// build environment (Site settings -> Environment variables). When unset - forks,
// clones, local dev - no GA script is emitted, so nobody pollutes the property.
const GA_ID = process.env.GA_MEASUREMENT_ID;
const gaHead: HeadConfig[] = GA_ID
  ? [
      ["script", { async: "", src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` }],
      [
        "script",
        {},
        `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`,
      ],
    ]
  : [];

// Charts in catalog order: [slug, display name, family]
const charts: Array<[string, string, string]> = [
  ["line", "Line Chart", "Trends"],
  ["fan", "Fan Chart", "Trends"],
  ["area", "Area Chart", "Composition"],
  ["scatter", "Scatter Plot", "Correlation"],
  ["range", "Range Chart", "Trends"],
  ["ribbon", "Ribbon Chart", "Composition"],
  ["radar", "Radar Chart", "Comparison"],
  ["vertical-stack-bar", "Vertical Stack Bar", "Composition"],
  ["comparable", "Comparable Bar", "Comparison"],
  ["dual", "Dual Bar (Tornado)", "Comparison"],
  ["bar-bell", "Bar-Bell", "Composition"],
  ["gap", "Gap Chart", "Comparison"],
  ["treemap", "Treemap", "Composition"],
  ["pie", "Pie / Donut", "Composition"],
  ["bubble", "Bubble Chart", "Composition"],
  ["sankey", "Sankey", "Flow"],
  ["fountain", "Fountain (Jet d'Eau)", "Comparison"],
];

export default defineConfig({
  title: "michi-vz",
  description:
    "Framework-agnostic charts - a plain-TS engine, native web components, and React/Vue/Svelte/Angular wrappers, with an LLM-ready ChartContext on every chart.",
  lang: "en-US",
  cleanUrls: true,
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap",
      },
    ],
    ...gaHead,
  ],
  themeConfig: {
    nav: [
      { text: "Charts", link: "/charts/" },
      { text: "API", link: "/api/line" },
      { text: "Guide", link: "/guide/installation" },
      {
        // TanStack-style version switcher (single version for now).
        text: "v1.0.0",
        items: [
          { text: "v1.0.0 (latest)", link: "/charts/" },
          { text: "Changelog", link: "https://github.com/beany-vu/michi-vz-mono/releases" },
        ],
      },
    ],
    sidebar: (() => {
      // Charts (demos) + Chart API are shown together (MUI-style) on both
      // /charts/ and /api/, so you can hop between a chart and its API.
      const chartsGroup = {
        text: "Charts",
        items: [
          { text: "Overview", link: "/charts/" },
          ...charts.map(([slug, name]) => ({ text: name, link: `/charts/${slug}` })),
        ],
      };
      const apiGroup = {
        text: "Chart API",
        items: charts.map(([slug, name]) => ({ text: name, link: `/api/${slug}` })),
      };
      const insightsApiGroup = {
        text: "Insights API",
        items: [
          { text: "forecast", link: "/api/insights/forecast" },
          { text: "forecast extras", link: "/api/insights/forecast-extras" },
          { text: "anomaly", link: "/api/insights/anomaly" },
          { text: "narrate / explain", link: "/api/insights/narrate" },
          { text: "validate", link: "/api/insights/validate" },
          { text: "embeddings", link: "/api/insights/embeddings" },
          { text: "aggregate (sql)", link: "/api/insights/sql" },
          { text: "sonify", link: "/api/insights/sonify" },
          { text: "agent & MCP", link: "/api/insights/agent" },
        ],
      };
      const guideGroup = {
        text: "Guide",
        items: [
          { text: "Installation", link: "/guide/installation" },
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Provider & shared state", link: "/guide/provider" },
          { text: "LLM context", link: "/guide/llm-context" },
          { text: "Insights (AI boost)", link: "/guide/insights" },
          { text: "DevTools", link: "/guide/devtools" },
        ],
      };
      return {
        "/charts/": [chartsGroup, apiGroup, insightsApiGroup],
        "/api/": [chartsGroup, apiGroup, insightsApiGroup],
        "/guide/": [guideGroup, insightsApiGroup],
      };
    })(),
    socialLinks: [{ icon: "github", link: "https://github.com/beany-vu/michi-vz-mono" }],
    footer: {
      message: "Free and open source. MIT licensed.",
      copyright: "© 2026 Beany Vu",
    },
    search: { provider: "local" },
  },
  // The charts are native custom elements - tell Vue not to treat them as components.
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith("michi-vz-"),
      },
    },
  },
});
