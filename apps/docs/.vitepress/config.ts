import { defineConfig } from "vitepress";

// Charts in catalog order: [slug, display name, family]
const charts: Array<[string, string, string]> = [
  ["line", "Line Chart", "Trends"],
  ["area", "Area Chart", "Composition"],
  ["scatter", "Scatter Plot", "Correlation"],
  ["range", "Range Chart", "Uncertainty"],
  ["ribbon", "Ribbon Chart", "Composition"],
  ["radar", "Radar Chart", "Comparison"],
  ["vertical-stack-bar", "Vertical Stack Bar", "Composition"],
  ["comparable", "Comparable Bar", "Comparison"],
  ["dual", "Dual Bar (Tornado)", "Comparison"],
  ["bar-bell", "Bar-Bell", "Composition"],
  ["gap", "Gap Chart", "Comparison"],
];

export default defineConfig({
  title: "michi-vz",
  description:
    "Framework-agnostic charts - a plain-TS engine, native web components, and React/Vue/Svelte/Angular wrappers, with an LLM-ready ChartContext on every chart.",
  lang: "en-US",
  cleanUrls: true,
  head: [
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap",
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: "Charts", link: "/charts/" },
      { text: "API", link: "/api/line" },
      { text: "Guide", link: "/guide/getting-started" },
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
      const guideGroup = {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "LLM context", link: "/guide/llm-context" },
        ],
      };
      return {
        "/charts/": [chartsGroup, apiGroup],
        "/api/": [chartsGroup, apiGroup],
        "/guide/": [guideGroup],
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
