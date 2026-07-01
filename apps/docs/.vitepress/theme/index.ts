import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Layout from "./Layout.vue";
import ChartDemo from "./ChartDemo.vue";
import WebgpuHeavyDemo from "./WebgpuHeavyDemo.vue";
import NoDataTicksDemo from "./NoDataTicksDemo.vue";
import InsightsDemo from "./InsightsDemo.vue";
import EmbeddingsLab from "./EmbeddingsLab.vue";
import SemanticSearchLab from "./SemanticSearchLab.vue";
import CategorizeLab from "./CategorizeLab.vue";
import PluginLab from "./PluginLab.vue";
import DevtoolsDemo from "./DevtoolsDemo.vue";
import PropsTable from "./PropsTable.vue";
import "./custom.css";
import "./embeddings-lab.css";

// `Layout` wraps the default theme to inject the home eyebrow, hero meta chips,
// and the live "chart atlas" grid (via DefaultTheme home slots). The web-component
// bundle is registered client-side inside the chart components themselves (dynamic
// import, so SSR never touches it). `ChartDemo` is registered globally because the
// chart markdown pages use it; ChartAtlas / CatalogCard are imported directly.
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("ChartDemo", ChartDemo);
    app.component("WebgpuHeavyDemo", WebgpuHeavyDemo);
    app.component("NoDataTicksDemo", NoDataTicksDemo);
    app.component("InsightsDemo", InsightsDemo);
    app.component("EmbeddingsLab", EmbeddingsLab);
    app.component("SemanticSearchLab", SemanticSearchLab);
    app.component("CategorizeLab", CategorizeLab);
    app.component("PluginLab", PluginLab);
    app.component("DevtoolsDemo", DevtoolsDemo);
    app.component("PropsTable", PropsTable);
  },
} satisfies Theme;
