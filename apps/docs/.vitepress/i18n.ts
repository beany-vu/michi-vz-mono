// Translations for the four docs locales (English, French, Dutch, Vietnamese).
// UI chrome (nav, sidebar, footer, chart names) lives here so config.ts can build
// one locale-aware themeConfig per language. Long-form page content is translated
// in the per-locale content dirs (fr/, nl/, vi/), not here.

export type LocaleKey = "root" | "fr" | "nl" | "vi";

// URL prefix per locale ("" = English root, "/fr" etc.). Used to prefix sidebar
// keys and internal links so each locale's navigation stays inside its own tree.
export const prefixOf: Record<LocaleKey, string> = {
  root: "",
  fr: "/fr",
  nl: "/nl",
  vi: "/vi",
};

export interface UiStrings {
  label: string; // language name shown in the switcher
  lang: string; // <html lang>
  navCharts: string;
  navGuide: string;
  navWhatsNew: string;
  navChangelog: string;
  sbCharts: string;
  sbOverview: string;
  sbChartApi: string;
  sbInsightsApi: string;
  sbGuide: string;
  gWhy: string;
  gWhatsNew: string;
  gInstallation: string;
  gGettingStarted: string;
  gProvider: string;
  gLlmContext: string;
  gInsights: string;
  gDevtools: string;
  demoExplain: string;
  demoExplainBusy: string;
  demoDevtoolsMount: string;
  demoDevtoolsUnmount: string;
  demoDevtoolsHint: string;
  demoGoDeeper: string;
  demoInsightsLink: string;
  demoDevtoolsLink: string;
  footerHeart: string;
  footerStar: string;
  footerCommunity: string;
  footerContribute: string;
  footerTranslate: string;
  footerCopyright: string;
  darkModeSwitch: string;
  returnToTop: string;
  sidebarMenu: string;
  outline: string;
  docPrev: string;
  docNext: string;
  langMenu: string;
  searchButton: string;
  searchPlaceholder: string;
  notFoundTitle: string;
  notFoundQuote: string;
  notFoundLink: string;
}

export const ui: Record<LocaleKey, UiStrings> = {
  root: {
    label: "English",
    lang: "en-US",
    navCharts: "Charts",
    navGuide: "Guide",
    navWhatsNew: "What's new in v1.6.0",
    navChangelog: "Changelog (GitHub)",
    sbCharts: "Charts",
    sbOverview: "Overview",
    sbChartApi: "Chart API",
    sbInsightsApi: "Insights API",
    sbGuide: "Guide",
    gWhy: "Why michi-vz",
    gWhatsNew: "What's new",
    gInstallation: "Installation",
    gGettingStarted: "Getting started",
    gProvider: "Provider & shared state",
    gLlmContext: "LLM context",
    gInsights: "Insights (AI boost)",
    gDevtools: "DevTools",
    demoExplain: "✦ Explain this chart",
    demoExplainBusy: "Reading the chart...",
    demoDevtoolsMount: "🛠 Try DevTools on this chart",
    demoDevtoolsUnmount: "🛠 Remove DevTools",
    demoDevtoolsHint: "DevTools is live: click the floating Michi shield (bottom right) or press Ctrl/Cmd+Shift+M, then pick this chart in the panel.",
    demoGoDeeper: "Go deeper:",
    demoInsightsLink: "Insights guide",
    demoDevtoolsLink: "DevTools guide",
    footerHeart: "❤️ Open source and built with care",
    footerStar: "Star on GitHub",
    footerCommunity: "Join our community",
    footerContribute: "Contribute",
    footerTranslate: "Help translate",
    footerCopyright: "MIT licensed · © 2026 Hoang VU",
    darkModeSwitch: "Appearance",
    returnToTop: "Return to top",
    sidebarMenu: "Menu",
    outline: "On this page",
    docPrev: "Previous page",
    docNext: "Next page",
    langMenu: "Change language",
    searchButton: "Search",
    searchPlaceholder: "Search docs",
    notFoundTitle: "Page not found",
    notFoundQuote: "This page could not be found.",
    notFoundLink: "Take me home",
  },
  fr: {
    label: "Français",
    lang: "fr-FR",
    navCharts: "Graphiques",
    navGuide: "Guide",
    navWhatsNew: "Nouveautés de la v1.6.0",
    navChangelog: "Journal des modifications (GitHub)",
    sbCharts: "Graphiques",
    sbOverview: "Vue d'ensemble",
    sbChartApi: "API des graphiques",
    sbInsightsApi: "API Insights",
    sbGuide: "Guide",
    gWhy: "Pourquoi michi-vz",
    gWhatsNew: "Nouveautés",
    gInstallation: "Installation",
    gGettingStarted: "Prise en main",
    gProvider: "Provider et état partagé",
    gLlmContext: "Contexte LLM",
    gInsights: "Insights (boost IA)",
    gDevtools: "DevTools",
    demoExplain: "✦ Expliquer ce graphique",
    demoExplainBusy: "Lecture du graphique...",
    demoDevtoolsMount: "🛠 Essayer les DevTools sur ce graphique",
    demoDevtoolsUnmount: "🛠 Retirer les DevTools",
    demoDevtoolsHint: "Les DevTools sont actifs : cliquez sur le bouclier Michi flottant (en bas à droite) ou appuyez sur Ctrl/Cmd+Shift+M, puis choisissez ce graphique dans le panneau.",
    demoGoDeeper: "Aller plus loin :",
    demoInsightsLink: "Guide Insights",
    demoDevtoolsLink: "Guide DevTools",
    footerHeart: "❤️ Open source, conçu avec soin",
    footerStar: "Star sur GitHub",
    footerCommunity: "Rejoindre la communauté",
    footerContribute: "Contribuer",
    footerTranslate: "Aider à traduire",
    footerCopyright: "Sous licence MIT · © 2026 Hoang VU",
    darkModeSwitch: "Apparence",
    returnToTop: "Retour en haut",
    sidebarMenu: "Menu",
    outline: "Sur cette page",
    docPrev: "Page précédente",
    docNext: "Page suivante",
    langMenu: "Changer de langue",
    searchButton: "Rechercher",
    searchPlaceholder: "Rechercher dans la doc",
    notFoundTitle: "Page introuvable",
    notFoundQuote: "Cette page est introuvable.",
    notFoundLink: "Retour à l'accueil",
  },
  nl: {
    label: "Nederlands",
    lang: "nl-NL",
    navCharts: "Grafieken",
    navGuide: "Gids",
    navWhatsNew: "Wat is nieuw in v1.6.0",
    navChangelog: "Wijzigingslogboek (GitHub)",
    sbCharts: "Grafieken",
    sbOverview: "Overzicht",
    sbChartApi: "Grafiek-API",
    sbInsightsApi: "Insights-API",
    sbGuide: "Gids",
    gWhy: "Waarom michi-vz",
    gWhatsNew: "Wat is nieuw",
    gInstallation: "Installatie",
    gGettingStarted: "Aan de slag",
    gProvider: "Provider en gedeelde status",
    gLlmContext: "LLM-context",
    gInsights: "Insights (AI-boost)",
    gDevtools: "DevTools",
    demoExplain: "✦ Leg deze grafiek uit",
    demoExplainBusy: "Grafiek wordt gelezen...",
    demoDevtoolsMount: "🛠 Probeer DevTools op deze grafiek",
    demoDevtoolsUnmount: "🛠 DevTools verwijderen",
    demoDevtoolsHint: "DevTools is actief: klik op het zwevende Michi-schild (rechtsonder) of druk op Ctrl/Cmd+Shift+M, en kies deze grafiek in het paneel.",
    demoGoDeeper: "Ga dieper:",
    demoInsightsLink: "Insights-gids",
    demoDevtoolsLink: "DevTools-gids",
    footerHeart: "❤️ Open source, met zorg gebouwd",
    footerStar: "Ster op GitHub",
    footerCommunity: "Word lid van de community",
    footerContribute: "Bijdragen",
    footerTranslate: "Help met vertalen",
    footerCopyright: "MIT-licentie · © 2026 Hoang VU",
    darkModeSwitch: "Weergave",
    returnToTop: "Terug naar boven",
    sidebarMenu: "Menu",
    outline: "Op deze pagina",
    docPrev: "Vorige pagina",
    docNext: "Volgende pagina",
    langMenu: "Taal wijzigen",
    searchButton: "Zoeken",
    searchPlaceholder: "Zoek in de documentatie",
    notFoundTitle: "Pagina niet gevonden",
    notFoundQuote: "Deze pagina kon niet worden gevonden.",
    notFoundLink: "Naar de startpagina",
  },
  vi: {
    label: "Tiếng Việt",
    lang: "vi-VN",
    navCharts: "Biểu đồ",
    navGuide: "Hướng dẫn",
    navWhatsNew: "Có gì mới trong v1.6.0",
    navChangelog: "Nhật ký thay đổi (GitHub)",
    sbCharts: "Biểu đồ",
    sbOverview: "Tổng quan",
    sbChartApi: "API biểu đồ",
    sbInsightsApi: "API Insights",
    sbGuide: "Hướng dẫn",
    gWhy: "Vì sao chọn michi-vz",
    gWhatsNew: "Có gì mới",
    gInstallation: "Cài đặt",
    gGettingStarted: "Bắt đầu",
    gProvider: "Provider và trạng thái dùng chung",
    gLlmContext: "Ngữ cảnh LLM",
    gInsights: "Insights (tăng cường AI)",
    gDevtools: "DevTools",
    demoExplain: "✦ Giải thích biểu đồ này",
    demoExplainBusy: "Đang đọc biểu đồ...",
    demoDevtoolsMount: "🛠 Thử DevTools với biểu đồ này",
    demoDevtoolsUnmount: "🛠 Gỡ DevTools",
    demoDevtoolsHint: "DevTools đang chạy: bấm chiếc khiên Michi nổi ở góc dưới bên phải (hoặc Ctrl/Cmd+Shift+M), rồi chọn biểu đồ này trong bảng điều khiển.",
    demoGoDeeper: "Tìm hiểu thêm:",
    demoInsightsLink: "Hướng dẫn Insights",
    demoDevtoolsLink: "Hướng dẫn DevTools",
    footerHeart: "❤️ Mã nguồn mở, xây dựng bằng sự tận tâm",
    footerStar: "Gắn sao trên GitHub",
    footerCommunity: "Tham gia cộng đồng",
    footerContribute: "Đóng góp",
    footerTranslate: "Giúp dịch thuật",
    footerCopyright: "Giấy phép MIT · © 2026 Hoang VU",
    darkModeSwitch: "Giao diện",
    returnToTop: "Lên đầu trang",
    sidebarMenu: "Menu",
    outline: "Trên trang này",
    docPrev: "Trang trước",
    docNext: "Trang sau",
    langMenu: "Đổi ngôn ngữ",
    searchButton: "Tìm kiếm",
    searchPlaceholder: "Tìm trong tài liệu",
    notFoundTitle: "Không tìm thấy trang",
    notFoundQuote: "Không tìm thấy trang này.",
    notFoundLink: "Về trang chủ",
  },
};

// Chart display names per locale, keyed by slug. Slugs (and family badges) stay
// stable; only the human-readable name is localized. Keep these in sync with the
// H1/title translated in each locale's charts/<slug>.md and api/<slug>.md.
export const chartNames: Record<LocaleKey, Record<string, string>> = {
  root: {
    line: "Line Chart",
    fan: "Fan Chart",
    area: "Area Chart",
    scatter: "Scatter Plot",
    range: "Range Chart",
    ribbon: "Ribbon Chart",
    radar: "Radar Chart",
    "vertical-stack-bar": "Vertical Stack Bar",
    comparable: "Comparable Bar",
    dual: "Dual Bar (Tornado)",
    "bar-bell": "Bar-Bell",
    gap: "Gap Chart",
    treemap: "Treemap",
    pie: "Pie / Donut",
    bubble: "Bubble Chart",
    sankey: "Sankey",
    fountain: "Fountain (Jet d'Eau)",
  },
  fr: {
    line: "Graphique en courbes",
    fan: "Graphique en éventail",
    area: "Graphique en aires",
    scatter: "Nuage de points",
    range: "Graphique d'étendue",
    ribbon: "Graphique en ruban",
    radar: "Graphique radar",
    "vertical-stack-bar": "Barres empilées verticales",
    comparable: "Barres comparables",
    dual: "Barres doubles (Tornado)",
    "bar-bell": "Barre-haltère",
    gap: "Graphique d'écart",
    treemap: "Treemap",
    pie: "Camembert / Anneau",
    bubble: "Graphique à bulles",
    sankey: "Sankey",
    fountain: "Fontaine (Jet d'Eau)",
  },
  nl: {
    line: "Lijndiagram",
    fan: "Waaierdiagram",
    area: "Vlakdiagram",
    scatter: "Spreidingsdiagram",
    range: "Bereikdiagram",
    ribbon: "Lintdiagram",
    radar: "Radardiagram",
    "vertical-stack-bar": "Verticale gestapelde staven",
    comparable: "Vergelijkbare staven",
    dual: "Dubbele staven (Tornado)",
    "bar-bell": "Halterdiagram",
    gap: "Verschildiagram",
    treemap: "Treemap",
    pie: "Cirkel / Donut",
    bubble: "Bellendiagram",
    sankey: "Sankey",
    fountain: "Fontein (Jet d'Eau)",
  },
  vi: {
    line: "Biểu đồ đường",
    fan: "Biểu đồ hình quạt",
    area: "Biểu đồ vùng",
    scatter: "Biểu đồ phân tán",
    range: "Biểu đồ khoảng",
    ribbon: "Biểu đồ dải",
    radar: "Biểu đồ radar",
    "vertical-stack-bar": "Biểu đồ cột chồng dọc",
    comparable: "Biểu đồ cột so sánh",
    dual: "Biểu đồ cột kép (Tornado)",
    "bar-bell": "Biểu đồ quả tạ",
    gap: "Biểu đồ khoảng cách",
    treemap: "Treemap",
    pie: "Biểu đồ tròn / Vành khuyên",
    bubble: "Biểu đồ bong bóng",
    sankey: "Sankey",
    fountain: "Đài phun (Jet d'Eau)",
  },
};

// Atlas-section intro copy (the "developer experience at the core" lede above the
// chart-card grid). ChartAtlas.vue is one shared component instance, so it picks
// its copy by the active locale rather than from per-locale frontmatter.
export interface AtlasIntro {
  eyebrow: string;
  headLead: string;
  headAccent: string;
  sub: string;
}

export const atlas: Record<LocaleKey, AtlasIntro> = {
  root: {
    eyebrow: "Developer experience at the core",
    headLead: "Write less.",
    headAccent: "Understand more.",
    sub: "Build charts in minutes, inspect them in seconds, and scale from prototype to production on one API. Pick a chart by the question you are asking - every card is a live component on real data.",
  },
  fr: {
    eyebrow: "L'expérience développeur au cœur du projet",
    headLead: "Écrivez moins.",
    headAccent: "Comprenez plus.",
    sub: "Créez des graphiques en quelques minutes, inspectez-les en quelques secondes, et passez du prototype à la production avec une seule API. Choisissez un graphique selon la question que vous posez - chaque carte est un composant en direct sur des données réelles.",
  },
  nl: {
    eyebrow: "Ontwikkelaarservaring als kern",
    headLead: "Schrijf minder.",
    headAccent: "Begrijp meer.",
    sub: "Bouw grafieken in minuten, inspecteer ze in seconden en schaal van prototype naar productie met dezelfde API. Kies een grafiek op basis van je vraag - elke kaart is een live component op echte data.",
  },
  vi: {
    eyebrow: "Trải nghiệm lập trình viên là cốt lõi",
    headLead: "Viết ít hơn.",
    headAccent: "Hiểu nhiều hơn.",
    sub: "Dựng biểu đồ trong vài phút, kiểm tra chúng trong vài giây, và mở rộng từ nguyên mẫu đến sản xuất trên cùng một API. Chọn biểu đồ theo câu hỏi bạn đang đặt ra - mỗi thẻ là một thành phần trực tiếp trên dữ liệu thật.",
  },
};

// Map a VitePress lang tag (e.g. "fr-FR") to our locale key.
export function localeKeyFromLang(lang: string): LocaleKey {
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("nl")) return "nl";
  if (lang.startsWith("vi")) return "vi";
  return "root";
}

// Persona feature tiles under the hero. Rendered by HomeFeatures.vue with
// monochrome brand-coloured icons (not multicolour emoji), so `icon` is a key
// into that component's SVG set rather than a glyph.
export type FeatureIcon = "inspect" | "ai" | "a11y" | "local";
export interface FeatureTile {
  icon: FeatureIcon;
  title: string;
  detail: string;
}

export const features: Record<LocaleKey, FeatureTile[]> = {
  root: [
    { icon: "inspect", title: "Inspect everything", detail: "A real DevTools panel: live state, layout, render and hit-testing, render diffs, profiling, and accessibility audits." },
    { icon: "ai", title: "Charts machines can read", detail: "Every chart emits a structured ChartContext - a plain-language summary an AI agent can read and drive over MCP." },
    { icon: "a11y", title: "Accessible by default", detail: "That same context is a true text alternative for screen readers. Built in, not bolted on." },
    { icon: "local", title: "Runs locally, yours to keep", detail: "Forecasting, anomaly detection, and narration run in the browser. No server, no upload. MIT-licensed." },
  ],
  fr: [
    { icon: "inspect", title: "Tout inspecter", detail: "Un vrai panneau DevTools : état en direct, mise en page, rendu et détection de survol, comparaison entre rendus, profilage et audits d'accessibilité." },
    { icon: "ai", title: "Des graphiques que les machines lisent", detail: "Chaque graphique fournit un ChartContext structuré - un résumé en langage clair qu'un agent IA peut lire et piloter via MCP." },
    { icon: "a11y", title: "Accessible par défaut", detail: "Ce même contexte est une véritable alternative textuelle pour les lecteurs d'écran. Intégré, pas ajouté après coup." },
    { icon: "local", title: "Fonctionne en local, à vous de le garder", detail: "Prévision, détection d'anomalies et narration s'exécutent dans le navigateur. Aucun serveur, aucun envoi. Sous licence MIT." },
  ],
  nl: [
    { icon: "inspect", title: "Alles inspecteren", detail: "Een echt DevTools-paneel: live status, lay-out, rendering en hit-testing, verschillen tussen renders, profilering en toegankelijkheidsaudits." },
    { icon: "ai", title: "Grafieken die machines kunnen lezen", detail: "Elke grafiek levert een gestructureerde ChartContext - een samenvatting in gewone taal die een AI-agent kan lezen en via MCP kan aansturen." },
    { icon: "a11y", title: "Standaard toegankelijk", detail: "Diezelfde context is een echt tekstalternatief voor schermlezers. Ingebouwd, niet achteraf toegevoegd." },
    { icon: "local", title: "Draait lokaal, van jou", detail: "Voorspelling, anomaliedetectie en narratie draaien in de browser. Geen server, geen upload. MIT-licentie." },
  ],
  vi: [
    { icon: "inspect", title: "Kiểm tra mọi thứ", detail: "Một bảng DevTools thực thụ: trạng thái trực tiếp, bố cục, kết xuất và kiểm tra vùng chạm, so sánh giữa các lần render, đo hiệu năng và kiểm toán khả năng truy cập." },
    { icon: "ai", title: "Biểu đồ mà máy đọc được", detail: "Mỗi biểu đồ phát ra một ChartContext có cấu trúc - bản tóm tắt bằng ngôn ngữ tự nhiên mà một tác nhân AI có thể đọc và điều khiển qua MCP." },
    { icon: "a11y", title: "Mặc định dễ tiếp cận", detail: "Chính ngữ cảnh đó là một phương án thay thế bằng văn bản thực sự cho trình đọc màn hình. Tích hợp sẵn, không phải chắp vá." },
    { icon: "local", title: "Chạy cục bộ, thuộc về bạn", detail: "Dự báo, phát hiện bất thường và thuyết minh chạy ngay trong trình duyệt. Không máy chủ, không tải lên. Giấy phép MIT." },
  ],
};
