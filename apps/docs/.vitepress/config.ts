import { defineConfig, type HeadConfig } from "vitepress";
import { ui, chartNames, prefixOf, type LocaleKey } from "./i18n";
import reactPkg from "../../../packages/react/package.json";

// Navbar version = the react wrapper's version (the headline package), stamped
// from its package.json at build time so the dropdown can never drift from npm.
const LIB_VERSION = `v${reactPkg.version}`;

// Deployed to Netlify at the domain root, so no `base` needed. SITE_URL is the
// absolute origin used for canonical / OG / sitemap URLs.
const SITE_URL = "https://michi-vz.netlify.app";

// Google Analytics + Search Console are injected ONLY from build-time env vars,
// so neither value lives in this open-source repo. Set GA_MEASUREMENT_ID and
// GOOGLE_SITE_VERIFICATION in the build environment (Netlify: Site settings ->
// Environment variables; local/CLI deploy: export them in your shell before
// building). When unset - forks, clones, local dev - nothing is emitted, so nobody
// pollutes the property. For Search Console, verify the URL-prefix property
// https://michi-vz.netlify.app/ via the HTML-tag (meta) method.
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
  "comparable-vertical-bar",
  "dual",
  "bar-bell",
  "gap",
  "treemap",
  "pie",
  "bubble",
  "sankey",
  "fountain",
  "choropleth-map",
  "symbol-map",
  "radial-tree",
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
        text: LIB_VERSION,
        items: [
          {
            text: t.navWhatsNew.replace("{version}", LIB_VERSION),
            link: link("/guide/whats-new"),
          },
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
        // AI-facing docs (llmstxt.org); the filename is language-neutral on purpose.
        ` · <a href="/llms.txt">llms.txt</a>` +
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
  sitemap: { hostname: SITE_URL + "/" },
  // Per-page SEO: a unique <meta description>, canonical URL, and Open Graph +
  // Twitter card on every page (VitePress otherwise repeats the site description
  // everywhere and emits no social tags). A page can override the description via
  // its own `description:` frontmatter.
  transformPageData(pageData) {
    const base = SITE_URL;
    const path = pageData.relativePath.replace(/\.md$/, "").replace(/(^|\/)index$/, "$1");
    const url = (base + "/" + path).replace(/\/+$/, "") || base;
    // Root home AND the locale homes (fr/nl/vi/index.md) are "home" for SEO:
    // og:type website + the library-level JSON-LD, not a TechArticle.
    const isHome = /^([a-z]{2}\/)?index\.md$/.test(pageData.relativePath);
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
    } else {
      // Per-page structured data: a TechArticle (so search and AI crawlers get
      // the page's topic, language, and parent library) and a BreadcrumbList
      // (eligible for the breadcrumb trail in results). Generated, never stale.
      const seg = pageData.relativePath.split("/");
      const locale = ["fr", "nl", "vi"].includes(seg[0]) ? seg[0] : "en";
      const section = locale === "en" ? seg[0] : seg[1];
      const sectionNames: Record<string, Record<string, string>> = {
        charts: { en: "Charts", fr: "Graphiques", nl: "Grafieken", vi: "Biểu đồ" },
        guide: { en: "Guide", fr: "Guide", nl: "Gids", vi: "Hướng dẫn" },
        api: { en: "Chart API", fr: "API des graphiques", nl: "Grafiek-API", vi: "API biểu đồ" },
      };
      const homeUrl = locale === "en" ? base + "/" : `${base}/${locale}/`;
      const sectionName = sectionNames[section]?.[locale];
      const crumbs = [
        { "@type": "ListItem", position: 1, name: "michi-vz", item: homeUrl },
        ...(sectionName
          ? [{ "@type": "ListItem", position: 2, name: sectionName, item: `${homeUrl}${section}/` }]
          : []),
        { "@type": "ListItem", position: sectionName ? 3 : 2, name: title, item: url },
      ];
      pageData.frontmatter.head.push([
        "script",
        { type: "application/ld+json" },
        JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TechArticle",
              headline: title,
              description: desc,
              url,
              image,
              inLanguage: locale,
              author: { "@type": "Person", name: "Hoang VU" },
              isPartOf: { "@type": "WebSite", name: "michi-vz", url: base + "/" },
              about: {
                "@type": "SoftwareSourceCode",
                name: "michi-vz",
                codeRepository: "https://github.com/beany-vu/michi-vz-mono",
                programmingLanguage: "TypeScript",
                version: LIB_VERSION,
              },
            },
            { "@type": "BreadcrumbList", itemListElement: crumbs },
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
    // Bing Webmaster Tools site verification (token is public by design).
    ["meta", { name: "msvalidate.01", content: "C7FF9872BF63126CE38DF255A3D55CB6" }],
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
