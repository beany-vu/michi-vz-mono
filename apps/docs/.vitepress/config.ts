import { defineConfig, type HeadConfig } from "vitepress";

// Google Analytics is injected ONLY from a build-time env var so the tracking
// ID never lives in this open-source repo. Set GA_MEASUREMENT_ID in the Netlify
// build environment (Site settings -> Environment variables). When unset - forks,
// clones, local dev - no GA script is emitted, so nobody pollutes the property.
// Google Search Console site-verification, injected from a build-time env var
// (Netlify: Site settings -> Environment variables -> GOOGLE_SITE_VERIFICATION)
// so the token stays out of this open-source repo. Verify a URL-prefix property
// (https://michi-vz.netlify.app/); the DNS/Domain method cannot work on a
// .netlify.app subdomain whose DNS you do not control.
const GSC_TOKEN = process.env.GOOGLE_SITE_VERIFICATION;
const gscHead: HeadConfig[] = GSC_TOKEN
  ? [["meta", { name: "google-site-verification", content: GSC_TOKEN }]]
  : [];

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
  // Git commit time per page: shows "Last updated" in the theme AND emits
  // <lastmod> in sitemap.xml so crawlers know which pages changed.
  lastUpdated: true,
  sitemap: { hostname: "https://michi-vz.netlify.app" },
  // Per-page SEO: a unique <meta description>, canonical URL, and Open Graph +
  // Twitter card on every page (VitePress otherwise repeats the site description
  // everywhere and emits no social tags). A page can override the description via
  // its own `description:` frontmatter.
  transformPageData(pageData) {
    const base = "https://michi-vz.netlify.app";
    const path = pageData.relativePath.replace(/\.md$/, "").replace(/(^|\/)index$/, "$1");
    const url = (base + "/" + path).replace(/\/+$/, "") || base;
    const isHome = pageData.relativePath === "index.md";
    const title = pageData.frontmatter.title || pageData.title || "michi-vz";
    const isApi = pageData.relativePath.startsWith("api/");
    const desc =
      pageData.frontmatter.description ||
      (isApi && pageData.title
        ? `${pageData.title.replace(/\s*API$/, "")} API reference for michi-vz: every prop, default, and event, identical across React, Vue, Svelte, Angular, and web components.`
        : !isHome && pageData.title
          ? `${pageData.title} - framework-agnostic charts (SVG, canvas, WebGPU) with an LLM-ready ChartContext, for React, Vue, Svelte, Angular, or web components.`
          : "Framework-agnostic charts: a plain-TS engine, native web components, and React/Vue/Svelte/Angular wrappers, with an LLM-ready ChartContext on every chart.");
    pageData.description = desc;
    // 1200x630 social card (regenerate with scripts/generate-og-card.mjs).
    const image = base + "/og-card.png";
    (pageData.frontmatter.head ??= []).push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:type", content: isHome ? "website" : "article" }],
      ["meta", { property: "og:site_name", content: "michi-vz" }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: desc }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:image", content: image }],
      ["meta", { property: "og:image:width", content: "1200" }],
      ["meta", { property: "og:image:height", content: "630" }],
      [
        "meta",
        {
          property: "og:image:alt",
          content: "michi-vz: framework-agnostic charts with the Michi cat crest",
        },
      ],
      ["meta", { name: "twitter:card", content: "summary_large_image" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: desc }],
      ["meta", { name: "twitter:image", content: image }],
    );
    if (isHome) {
      // Structured data so search engines understand this is an open-source
      // developer library (rich-result eligibility + knowledge-panel signals).
      pageData.frontmatter.head.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: "michi-vz",
              url: base + "/",
              description: desc,
            },
            {
              "@type": "SoftwareSourceCode",
              name: "michi-vz",
              description: desc,
              url: base + "/",
              codeRepository: "https://github.com/beany-vu/michi-vz-mono",
              programmingLanguage: "TypeScript",
              runtimePlatform: "Web",
              license: "https://opensource.org/licenses/MIT",
              author: { "@type": "Person", name: "Hoang VU" },
            },
          ],
        }),
      ]);
    }
  },
  head: [
    // Michi shield favicons (generated from public/michi-shield.png, centered on a
    // transparent square; 48px default + 32px fallback + 180px apple-touch).
    ["link", { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon.png" }],
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap",
      },
    ],
    ...gscHead,
    ...gaHead,
  ],
  themeConfig: {
    // The Michi shield next to the site title in the navbar (64px render of the crest).
    logo: "/michi-shield-nav.png",
    nav: [
      { text: "Charts", link: "/charts/" },
      { text: "Guide", link: "/guide/why" },
      {
        // Version switcher (single version for now).
        text: "v1.6.0",
        items: [
          { text: "What's new in v1.6.0", link: "/guide/whats-new" },
          { text: "Changelog (GitHub)", link: "https://github.com/beany-vu/michi-vz-mono/releases" },
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
          { text: "Why michi-vz", link: "/guide/why" },
          { text: "What's new", link: "/guide/whats-new" },
          { text: "Installation", link: "/guide/installation" },
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Provider & shared state", link: "/guide/provider" },
          { text: "LLM context", link: "/guide/llm-context" },
          { text: "Insights (AI boost)", link: "/guide/insights" },
          { text: "DevTools", link: "/guide/devtools" },
        ],
      };
      // The API reference lives INSIDE the Guide navigation (no separate top-level
      // section): every sidebar shows Guide + Chart API + Insights API together.
      return {
        "/charts/": [chartsGroup, apiGroup, insightsApiGroup],
        "/api/": [guideGroup, chartsGroup, apiGroup, insightsApiGroup],
        "/guide/": [guideGroup, apiGroup, insightsApiGroup],
      };
    })(),
    socialLinks: [
      { icon: "github", link: "https://github.com/beany-vu/michi-vz-mono" },
      { icon: "npm", link: "https://www.npmjs.com/org/michi-vz" },
    ],
    footer: {
      message: "Free and open source. MIT licensed.",
      copyright: "© 2026 Hoang VU",
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
