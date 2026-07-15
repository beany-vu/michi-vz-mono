<script lang="ts">
import { ref as moduleRef } from "vue";
// PAGE-level DevTools singleton: one floating shield serves every demo on the
// page, so the handle + mounted flag are module-scoped (shared by all instances).
const devtoolsMounted = moduleRef(false);
let devtoolsHandle: { destroy: () => void } | null = null;
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { useData, withBase } from "vitepress";
import { examples } from "@michi-vz/examples";
import { ui, prefixOf, localeKeyFromLang } from "../i18n";

interface DemoLegendItem {
  label: string;
  color: string;
  opacity?: number;
  /** Second swatch: the pale companion colour (pale/solid paired encodings). */
  pale?: string;
}

// withDefaults(legend: undefined) is LOAD-BEARING: the prop type compiles to
// [Boolean, Array] and Vue casts an ABSENT Boolean prop to false - which would
// silently disable the auto legend on every page that doesn't pass :legend.
const props = withDefaults(
  defineProps<{
    chart: string;
    index?: number;
    height?: number;
    /** false = no legend; an array = custom rows (e.g. opacity roles); default = auto from getContext().legendData */
    legend?: false | DemoLegendItem[];
  }>(),
  { legend: undefined },
);
const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const ctx = ref<string>("");
const title = ref<string>("");
// Auto legend rows, derived from the context INSIDE the dataprocessed listener
// (never a computed over the non-reactive element api).
const autoLegend = ref<DemoLegendItem[]>([]);
// Paired rows for pale/solid encodings (comparable's colorsBasedMapping): each
// label with BOTH its pale and solid swatch. Users toggle between the "meaning"
// legend the page provides and this per-label colour-pair view.
const pairedLegend = ref<DemoLegendItem[]>([]);
const legendMode = ref<"meaning" | "pairs">("meaning");
const { lang } = useData();
const t = computed(() => ui[localeKeyFromLang(lang.value)]);
const guideLink = (page: string) =>
  withBase(`${prefixOf[localeKeyFromLang(lang.value)]}/guide/${page}`);
// Live "explain": the rules backend of @michi-vz/insights reads THIS chart's
// context and answers instantly, in the page, nothing leaves the browser.
const explanation = ref("");
const explaining = ref(false);

async function explain() {
  if (explaining.value) return;
  if (explanation.value) {
    explanation.value = "";
    return;
  }
  const c = el.value?.getContext?.();
  if (!c) return;
  explaining.value = true;
  try {
    const insights = await import("@michi-vz/insights");
    explanation.value = await insights.explainChart(c, { backend: "rules" });
  } catch (e) {
    explanation.value = e instanceof Error ? e.message : String(e);
  }
  explaining.value = false;
}

async function toggleDevtools() {
  if (devtoolsHandle) {
    devtoolsHandle.destroy();
    devtoolsHandle = null;
    devtoolsMounted.value = false;
    return;
  }
  const dt = await import("@michi-vz/devtools");
  devtoolsHandle = dt.mountDevtools();
  devtoolsMounted.value = true;
}
const legendRows = computed<DemoLegendItem[]>(() => {
  if (props.legend === false) return [];
  // Pale/solid charts get a play toggle: the page's "meaning" rows (or nothing,
  // when the chart already explains itself on-canvas) vs the per-label colour
  // pairs. Pairs come from the context (legendData.paleColor) or the element.
  if (legendMode.value === "pairs" && pairedLegend.value.length) return pairedLegend.value;
  if (Array.isArray(props.legend)) return props.legend;
  // Auto mode: only worth showing when there is more than one coloured series.
  return autoLegend.value.length > 1 ? autoLegend.value : [];
});
const hasLegendToggle = computed(() => props.legend !== false && pairedLegend.value.length > 1);
// Canvas-first: we built the canvas renderer in parallel with SVG and it is the
// faster path, so the live demos lead with it. The toggle proves SVG/canvas parity.
const renderer = ref<"canvas" | "svg">("canvas");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let exCache: any = null;
let ro: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let raf = 0;
let started = false;

function buildNode() {
  if (!exCache || !host.value) return;
  const ex = exCache;
  const node: any = document.createElement(ex.element);
  // We own width/height/renderer for responsiveness - drop any from the example.
  const { title: t, width: _w, height: _h, margin, renderer: _r, ...rest } = ex.props;
  if (t) node.chartTitle = t;
  Object.assign(node, rest);
  node.renderer = renderer.value;
  node.height = props.height ?? 340;
  if (margin) node.margin = margin;
  node.style.display = "block";
  // host.value.clientWidth INCLUDES .chart-demo-stage's own horizontal padding
  // (12px 16px); sizing the chart from the raw clientWidth renders it 32px wider
  // than the space actually available, and the outer .chart-demo's
  // `overflow: hidden` silently clips the excess off the right edge (worse on
  // canvas, which has no overflow:visible escape hatch the way SVG marks do).
  const stageStyle = getComputedStyle(host.value);
  const stagePadX = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
  node.width = Math.max(280, host.value.clientWidth - stagePadX);
  // The wc elements re-emit onChartDataProcessed as a CustomEvent; the context's
  // legendData feeds the auto legend. Attach BEFORE appendChild so the mount-time
  // emission is caught.
  node.addEventListener("michi-vz:dataprocessed", (e: Event) => {
    const legend = (e as CustomEvent).detail?.legendData;
    const raw = Array.isArray(legend) ? legend.filter((l: any) => l && !l.disabled) : [];
    const rows = raw.map((l: any) => ({ label: String(l.label), color: String(l.color || "") }));
    autoLegend.value = rows;
    // Pale companions come from the context itself (treemap/bubble split tints via
    // legendData.paleColor) or from the element (comparable's colorsBasedMapping).
    const paleOf = (node as any).colorsBasedMapping as Record<string, string> | undefined;
    const fromContext = raw
      .filter((l: any) => l.paleColor)
      .map((l: any) => ({
        label: String(l.label),
        color: String(l.color || ""),
        pale: String(l.paleColor),
      }));
    pairedLegend.value = fromContext.length
      ? fromContext
      : paleOf
        ? rows.filter((r) => paleOf[r.label]).map((r) => ({ ...r, pale: paleOf[r.label] }))
        : [];
  });
  host.value.appendChild(node);
  el.value = node;
}

async function start() {
  if (started) return;
  started = true;
  // Register the web components client-side only (never during SSR). enableDevtools
  // BEFORE mounting so this chart self-registers - the DevTools button below then
  // shows it in the panel with zero setup.
  const core = await import("@michi-vz/core");
  core.enableDevtools();
  await import("@michi-vz/wc");
  const ex = (examples as any)[props.chart]?.[props.index ?? 0];
  if (!ex || !host.value) return;
  title.value = ex.title;
  exCache = ex;
  buildNode();

  // Resize the chart to fill its container (rAF-throttled).
  ro = new ResizeObserver((entries) => {
    const w = Math.max(280, Math.floor(entries[0].contentRect.width));
    if (!el.value || w === el.value.width) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (el.value) el.value.width = w;
    });
  });
  ro.observe(host.value);
}

onMounted(() => {
  const ex = (examples as any)[props.chart]?.[props.index ?? 0];
  if (!ex || !host.value) return;
  title.value = ex.title; // header shows immediately; the chart mounts lazily
  // Lazy-mount below-the-fold demos (several per page) so SPA navigation stays
  // snappy - same IntersectionObserver pattern as the homepage CatalogCard.
  if (typeof IntersectionObserver === "undefined") {
    void start();
    return;
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io?.disconnect();
        io = null;
        void start();
      }
    },
    { rootMargin: "240px" },
  );
  io.observe(host.value);
});

onBeforeUnmount(() => {
  io?.disconnect();
  ro?.disconnect();
  cancelAnimationFrame(raf);
  // Remove the chart element explicitly (its disconnectedCallback destroys the
  // engine) instead of relying on Vue's DOM teardown timing.
  el.value?.remove?.();
  el.value = null;
});

// Switching renderer recreates the element (the engine builds its SVG/canvas root once).
function setRenderer(r: "canvas" | "svg") {
  if (renderer.value === r) return;
  renderer.value = r;
  ctx.value = "";
  if (el.value) {
    el.value.remove?.();
    el.value = null;
  }
  buildNode();
}

function toggleContext() {
  if (ctx.value) {
    ctx.value = "";
    return;
  }
  const c = el.value?.getContext?.();
  ctx.value = c ? JSON.stringify(c, null, 2) : "(context unavailable)";
}
</script>

<template>
  <div class="chart-demo">
    <div class="chart-demo-bar">
      <span class="chart-demo-title">{{ title || "Example" }}</span>
      <span class="chart-demo-rtoggle" role="group" aria-label="renderer">
        <button :class="{ on: renderer === 'canvas' }" @click="setRenderer('canvas')">
          Canvas
        </button>
        <button :class="{ on: renderer === 'svg' }" @click="setRenderer('svg')">SVG</button>
      </span>
    </div>
    <div class="chart-demo-stage" ref="host"></div>
    <div v-if="legendRows.length || hasLegendToggle" class="chart-demo-legend-row">
      <ul class="chart-demo-legend">
        <li v-for="item in legendRows" :key="item.label">
          <span
            v-if="item.pale"
            class="chart-demo-swatch"
            :style="{ background: item.pale }"
          ></span>
          <span
            class="chart-demo-swatch"
            :style="{ background: item.color, opacity: item.opacity ?? 1 }"
          ></span>
          {{ item.label }}
        </li>
      </ul>
      <span
        v-if="hasLegendToggle"
        class="chart-demo-rtoggle chart-demo-ltoggle"
        role="group"
        aria-label="legend mode"
      >
        <button :class="{ on: legendMode === 'meaning' }" @click="legendMode = 'meaning'">
          {{ t.demoLegendMeaning }}
        </button>
        <button :class="{ on: legendMode === 'pairs' }" @click="legendMode = 'pairs'">
          {{ t.demoLegendPairs }}
        </button>
      </span>
    </div>
    <div class="chart-demo-foot">
      <button class="chart-demo-btn" @click="toggleContext">
        {{ ctx ? "▴ Hide" : "▾ Show" }} LLM context · getContext()
      </button>
      <span class="chart-demo-note">{{
        renderer === "canvas" ? "canvas · responsive" : "SVG · responsive"
      }}</span>
    </div>
    <pre v-if="ctx" class="chart-demo-ctx">{{ ctx }}</pre>
    <div class="chart-demo-bait">
      <button class="chart-demo-action" :disabled="explaining" @click="explain">
        {{ explaining ? t.demoExplainBusy : t.demoExplain }}
      </button>
      <button class="chart-demo-action" @click="toggleDevtools">
        {{ devtoolsMounted ? t.demoDevtoolsUnmount : t.demoDevtoolsMount }}
      </button>
      <span class="chart-demo-bait-links">
        {{ t.demoGoDeeper }}
        <a :href="guideLink('insights')">{{ t.demoInsightsLink }}</a>
        <span class="chart-demo-bait-sep">·</span>
        <a :href="guideLink('devtools')">{{ t.demoDevtoolsLink }}</a>
      </span>
    </div>
    <p v-if="explanation" class="chart-demo-explanation">✦ {{ explanation }}</p>
    <p v-if="devtoolsMounted" class="chart-demo-devtools-hint">{{ t.demoDevtoolsHint }}</p>
  </div>
</template>

<style scoped>
.chart-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.chart-demo-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.chart-demo-title {
  font-family: "Josefin Sans", system-ui, sans-serif;
  font-weight: 600;
}
/* Renderer toggle - a small segmented control; Canvas is the promoted default. */
.chart-demo-rtoggle {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  overflow: hidden;
}
.chart-demo-rtoggle button {
  font: inherit;
  font-size: 12px;
  padding: 3px 12px;
  border: none;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.chart-demo-rtoggle button.on {
  background: var(--vp-c-brand-1);
  color: #fff;
}
.chart-demo-stage {
  padding: 12px 16px;
}
.chart-demo-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px;
}
.chart-demo-btn {
  font: inherit;
  font-size: 12.5px;
  color: var(--vp-c-brand-1);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.chart-demo-note {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-text-3);
  letter-spacing: 0.04em;
}
.chart-demo-ctx {
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  margin: 0 16px 16px;
}
/* Auto legend - compact swatch rows for demos whose colours have no on-chart key. */
.chart-demo-legend-row {
  display: flex;
  align-items: flex-start;
  gap: 8px 16px;
  padding: 0 16px 10px;
}
.chart-demo-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}
.chart-demo-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.chart-demo-legend li .chart-demo-swatch + .chart-demo-swatch {
  margin-left: -3px;
}
.chart-demo-ltoggle {
  margin-left: auto;
  flex: none;
}
.chart-demo-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}
/* Direct actions: run Insights + mount DevTools on THIS chart, right here. */
.chart-demo-bait {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding: 10px 16px 12px;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
.chart-demo-action {
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  padding: 4px 12px;
  cursor: pointer;
}
.chart-demo-action:hover {
  background: var(--vp-c-brand-soft);
}
.chart-demo-action:disabled {
  opacity: 0.6;
  cursor: wait;
}
.chart-demo-bait-links {
  margin-left: auto;
}
.chart-demo-bait a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}
.chart-demo-bait a:hover {
  text-decoration: underline;
}
.chart-demo-bait-sep {
  color: var(--vp-c-text-3);
}
/* The live answer from @michi-vz/insights - rendered like a spoken aside. */
.chart-demo-explanation {
  margin: 0;
  padding: 10px 16px 12px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-1);
  background: var(--vp-c-brand-soft);
}
.chart-demo-devtools-hint {
  margin: 0;
  padding: 8px 16px 12px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}
</style>
