import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import ChartDemo from "./ChartDemo.vue";
import "./custom.css";

// The web-component bundle is registered client-side inside ChartDemo (dynamic
// import, so SSR never touches it). Here we just register the demo component.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("ChartDemo", ChartDemo);
  },
} satisfies Theme;
