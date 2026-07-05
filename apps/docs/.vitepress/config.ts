import { defineConfig, type HeadConfig } from "vitepress";
import { ui, chartNames, prefixOf, type LocaleKey } from "./i18n";

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

// Charts in catalog order (slug only; localized display names live in i18n.ts).
const chartOrder: string[] = [
  "line",
  "fan",
  "area",
  "scatter",
  "range",
  "ribbon",
  "radar",
  "vertical-stack-bar",
  "comparable",
  "dual",
  "bar-bell",
  "gap",
  "treemap",
  "pie",
  "bubble",
  "sankey",
  "fountain",
];

// Build one locale's nav + sidebar + footer + label strings. `loc` selects the
// translation set; `prefixOf[loc]` ("" for English, "/fr" etc.) namespaces every
// internal link so each language stays inside its own content tree.
function themeForLocale(loc: LocaleKey) {
  const t = ui[loc];
  const names = chartNames[loc];
  const p = prefixOf[loc];
  const link = (path: string) => `${p}${path}`;

  const chartsGroup = {
    text: t.sbCharts,
    items: [
      { text: t.sbOverview, link: link("/charts/") },
      ...chartOrder.map((slug) => ({ text: names[slug], link: link(`/charts/${slug}`) })),
    ],
  };
  const apiGroup = {
    text: t.sbChartApi,
    items: chartOrder.map((slug) => ({ text: names[slug], link: link(`/api/${slug}`) })),
  };
  // Insights API method names are code identifiers - left untranslated on purpose.
  const insightsApiGroup = {
    text: t.sbInsightsApi,
    items: [
      { text: "forecast", link: link("/api/insights/forecast") },
      { text: "forecast extras", link: link("/api/insights/forecast-extras") },
      { text: "anomaly", link: link("/api/insights/anomaly") },
      { text: "narrate / explain", link: link("/api/insights/narrate") },
      { text: "validate", link: link("/api/insights/validate") },
      { text: "embeddings", link: link("/api/insights/embeddings") },
      { text: "aggregate (sql)", link: link("/api/insights/sql") },
      { text: "sonify", link: link("/api/insights/sonify") },
      { text: "agent & MCP", link: link("/api/insights/agent") },
    ],
  };
  const guideGroup = {
    text: t.sbGuide,
    items: [
      { text: t.gWhy, link: link("/guide/why") },
      { text: t.gWhatsNew, link: link("/guide/whats-new") },
      { text: t.gInstallation, link: link("/guide/installation") },
      { text: t.gGettingStarted, link: link("/guide/getting-started") },
      { text: t.gProvider, link: link("/guide/provider") },
      { text: t.gLlmContext, link: link("/guide/llm-context") },
      { text: t.gInsights, link: link("/guide/insights") },
      { text: t.gDevtools, link: link("/guide/devtools") },
    ],
  };

  return {
    nav: [
      { text: t.navCharts, link: link("/charts/") },
      { text: t.navGuide, link: link("/guide/why") },
      {
        text: "v1.6.0",
        items: [
          { text: t.navWhatsNew, link: link("/guide/whats-new") },
          {
            text: t.navChangelog,
            link: "https://github.com/beany-vu/michi-vz-mono/releases",
          },
        ],
      },
    ],
    sidebar: {
      [link("/charts/")]: [chartsGroup, apiGroup, insightsApiGroup],
      [link("/api/")]: [guideGroup, chartsGroup, apiGroup, insightsApiGroup],
      [link("/guide/")]: [guideGroup, apiGroup, insightsApiGroup],
    },
    footer: {
      message:
        `<span class="mv-foot-heart">${t.footerHeart}</span>` +
        '<span class="mv-foot-links">' +
        `<a href="https://github.com/beany-vu/michi-vz-mono">${t.footerStar}</a>` +
        ` · <a href="https://github.com/beany-vu/michi-vz-mono/discussions">${t.footerCommunity}</a>` +
        ` · <a href="https://github.com/beany-vu/michi-vz-mono/blob/main/CONTRIBUTING.md">${t.footerContribute}</a>` +
        ` · <a href="https://github.com/beany-vu/michi-vz-mono/blob/main/CONTRIBUTING.md#translations">${t.footerTranslate}</a>` +
        "</span>",
      copyright: t.footerCopyright,
    },
    docFooter: { prev: t.docPrev, next: t.docNext },
    outline: { label: t.outline },
    darkModeSwitchLabel: t.darkModeSwitch,
    sidebarMenuLabel: t.sidebarMenu,
    returnToTopLabel: t.returnToTop,
    langMenuLabel: t.langMenu,
  };
}

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
  // Four locales share one engine + theme; each gets its own translated nav,
  // sidebar, footer, and content tree (root = English, /fr, /nl, /vi).
  locales: {
    root: { label: ui.root.label, lang: ui.root.lang, themeConfig: themeForLocale("root") },
    fr: { label: ui.fr.label, lang: ui.fr.lang, link: "/fr/", themeConfig: themeForLocale("fr") },
    nl: { label: ui.nl.label, lang: ui.nl.lang, link: "/nl/", themeConfig: themeForLocale("nl") },
    vi: { label: ui.vi.label, lang: ui.vi.lang, link: "/vi/", themeConfig: themeForLocale("vi") },
  },
  themeConfig: {
    // The Michi shield next to the site title in the navbar (64px render of the crest).
    logo: "/michi-shield-nav.png",
    socialLinks: [
      { icon: "github", link: "https://github.com/beany-vu/michi-vz-mono" },
      { icon: "npm", link: "https://www.npmjs.com/org/michi-vz" },
    ],
    search: {
      provider: "local",
      options: {
        locales: {
          fr: {
            translations: {
              button: { buttonText: ui.fr.searchButton, buttonAriaLabel: ui.fr.searchButton },
              modal: { noResultsText: "Aucun résultat pour", resetButtonTitle: "Réinitialiser" },
            },
          },
          nl: {
            translations: {
              button: { buttonText: ui.nl.searchButton, buttonAriaLabel: ui.nl.searchButton },
              modal: { noResultsText: "Geen resultaten voor", resetButtonTitle: "Wissen" },
            },
          },
          vi: {
            translations: {
              button: { buttonText: ui.vi.searchButton, buttonAriaLabel: ui.vi.searchButton },
              modal: { noResultsText: "Không có kết quả cho", resetButtonTitle: "Đặt lại" },
            },
          },
        },
      },
    },
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
