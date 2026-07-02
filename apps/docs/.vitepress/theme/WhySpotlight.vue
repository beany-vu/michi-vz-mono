<script setup lang="ts">
// Homepage "Why michi-vz" spotlight: one live chart on the left, six
// selling-point tabs on the right. Every tab swaps the live demo (core-engine
// mounts, Pattern B like CatalogCard/previews.ts) and states honestly how the
// incumbents handle the same problem. Copy lives in whySpotlightContent.ts.
//
// Lifecycle rules (hard-won, see the perf notes in the plan):
// - exactly ONE ChartInstance alive at a time: destroy before every mount
// - a switchToken generation counter guards rapid tab clicks across the two
//   async tabs (insights dynamic import, WebGPU adapter probe)
// - `chart` stays a plain let (never reactive - a Proxy-wrapped engine breaks)
// - all DOM / navigator work runs from onMounted-called code only (SSR builds
//   this file; vitepress executes setup during prerender)
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  mountFanChart,
  mountLineChart,
  mountRadarChart,
  mountScatterChart,
  mountTreemapChart,
} from "@michi-vz/core";
import { FRAMEWORK_SNIPPETS, TABS, WHY_LEDE } from "./whySpotlightContent";
import type { WhyTabId } from "./whySpotlightContent";

// Canonical brand palette (CatBand's constants; gold = accent only).
const RED = "#a3271f";
const GOLD = "#b8863b";
const INK2 = "#57564f";
const INK3 = "#83817a";
const STAGE_H = 340;
const MARGIN = { top: 20, right: 24, bottom: 40, left: 48 };

// ---- Demo datasets (tiny, hand-written; the WebGPU cloud is generated) ----
const EXPLAIN_DATA = [
  {
    label: "Cycling permits",
    color: RED,
    series: [
      { date: 2019, value: 8, certainty: true },
      { date: 2020, value: 11, certainty: true },
      { date: 2021, value: 15, certainty: true },
      { date: 2022, value: 19, certainty: true },
      { date: 2023, value: 24, certainty: true },
      { date: 2024, value: 29, certainty: true },
    ],
  },
  {
    label: "Parking permits",
    color: INK3,
    series: [
      { date: 2019, value: 22, certainty: true },
      { date: 2020, value: 21, certainty: true },
      { date: 2021, value: 19, certainty: true },
      { date: 2022, value: 18, certainty: true },
      { date: 2023, value: 16, certainty: true },
      { date: 2024, value: 15, certainty: true },
    ],
  },
];

const GAPS_DATA = [
  {
    label: "Air quality index",
    color: RED,
    series: [
      { date: 2018, value: 42, certainty: true },
      { date: 2019, value: 38, certainty: true },
      // 2020 intentionally missing: the station was offline.
      { date: 2021, value: 33, certainty: true },
      { date: 2022, value: 29, certainty: true },
      { date: 2023, value: 27, certainty: true },
      { date: 2024, value: 24, certainty: true },
    ],
  },
];

const FORECAST_HISTORY = [
  { date: 2019, value: 14, certainty: true },
  { date: 2020, value: 18, certainty: true },
  { date: 2021, value: 23, certainty: true },
  { date: 2022, value: 31, certainty: true },
  { date: 2023, value: 40, certainty: true },
  { date: 2024, value: 52, certainty: true },
];

const TREEMAP_DATA = [
  { label: "Watch exports", value: 42, partial: 27, color: RED },
  { label: "Banking", value: 30, partial: 11, color: GOLD },
  { label: "Chocolate", value: 24, partial: 16, color: INK3 },
  { label: "Tourism", value: 18, partial: 6, color: INK2 },
];

const RADAR_PROPS = {
  axes: ["Coffee", "Pastries", "Wifi", "View", "Price"],
  series: [{ label: "Cafe Michi", color: RED, values: [8, 6, 9, 7, 5] }],
  maxValue: 10,
  fillOpacity: 0.3,
};

// ---- WebGPU tab: ~8k gaussian points, generated once on first activation.
// Far below the 50k of the dedicated scatter page: this mounts on a homepage
// click, not a deep opt-in scroll. Canvas/WebGPU only - 8k SVG nodes on the
// homepage is exactly the trap the perf pass just removed elsewhere.
const GPU_POINTS = 8000;
type GpuPoint = { label: string; x: number; y: number; color: string };
let gpuData: GpuPoint[] | null = null;

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeGpuData(): GpuPoint[] {
  const clusters = [
    { cx: 32, cy: 36, sx: 9, sy: 7, color: RED, label: "Alpine" },
    { cx: 64, cy: 60, sx: 8, sy: 9, color: GOLD, label: "Lakeside" },
    { cx: 46, cy: 76, sx: 7, sy: 5, color: INK3, label: "Plateau" },
  ];
  const pts: GpuPoint[] = [];
  const per = Math.floor(GPU_POINTS / clusters.length);
  for (const c of clusters) {
    for (let i = 0; i < per; i++) {
      pts.push({
        label: c.label,
        x: Math.min(98, Math.max(2, c.cx + gauss() * c.sx)),
        y: Math.min(98, Math.max(2, c.cy + gauss() * c.sy)),
        color: c.color,
      });
    }
  }
  return pts;
}

// ---- State ----
const active = ref<WhyTabId>("explain");
const focused = ref<WhyTabId>("explain");
const chartHost = ref<HTMLDivElement>();
const tabBtns = ref<(HTMLButtonElement | null)[]>([]);
const fwActive = ref(0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any = null; // plain on purpose (see header note)
let currentUpdate: ((w: number) => void) | null = null;
let ro: ResizeObserver | null = null;
let raf = 0;
let switchToken = 0;

const ctxSummary = ref("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctxTable = ref<{ headers: string[]; rows: Array<Array<string | number>> } | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let forecastFanFn: ((...args: any[]) => any) | null = null;
const insightsLoading = ref(false);
const insightsError = ref("");

const gpuStatus = ref<"pending" | "webgpu" | "canvas">("pending");
let gpuProbed = false;
const gpuRenderer = ref<"canvas" | "webgpu">("webgpu");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setTabBtn(el: any, i: number) {
  tabBtns.value[i] = (el as HTMLButtonElement) ?? null;
}

function stageWidth(): number {
  const el = chartHost.value;
  if (!el) return 600;
  // clientWidth INCLUDES padding; sizing the chart from it overflows a padded
  // host, so subtract it (repo memory: chart-host-clientwidth-padding).
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
}

function destroyChart() {
  chart?.destroy?.();
  chart = null;
  currentUpdate = null;
  ctxSummary.value = "";
  ctxTable.value = null;
}

async function probeWebgpu(): Promise<void> {
  // Mirrors WebgpuHeavyDemo.detectBackend: the engine's synchronous
  // getContext().renderer only checks navigator.gpu existence; a real adapter
  // may still be missing (software rasterizers, locked-down browsers).
  gpuProbed = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpu = typeof navigator !== "undefined" ? (navigator as any).gpu : undefined;
  if (!gpu) {
    gpuStatus.value = "canvas";
    return;
  }
  try {
    const adapter = await gpu.requestAdapter();
    gpuStatus.value = adapter ? "webgpu" : "canvas";
  } catch {
    gpuStatus.value = "canvas";
  }
}

function buildChartForActiveTab() {
  const host = chartHost.value;
  if (!host) return;
  const w = stageWidth();
  switch (active.value) {
    case "explain": {
      const p = {
        dataSet: EXPLAIN_DATA,
        xAxisDataType: "date_annual",
        showDataPoints: true,
        width: w,
        height: STAGE_H,
        margin: MARGIN,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = mountLineChart(host, p as any);
      currentUpdate = (nw) => chart?.update({ ...p, width: nw });
      const c = chart?.getContext?.();
      ctxSummary.value = c?.summary ?? "";
      ctxTable.value = c?.a11yTable ?? null;
      break;
    }
    case "gaps": {
      const p = {
        dataSet: GAPS_DATA,
        xAxisDataType: "date_annual",
        detectGaps: true,
        fillPeriodTicks: true,
        noDataTickColor: GOLD,
        noDataTickTooltip: (ms: number) =>
          `No reading in ${new Date(ms).getFullYear()}: station offline.`,
        showDataPoints: true,
        width: w,
        height: STAGE_H,
        margin: MARGIN,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = mountLineChart(host, p as any);
      currentUpdate = (nw) => chart?.update({ ...p, width: nw });
      break;
    }
    case "insights": {
      if (!forecastFanFn) return; // import failed; the error note explains
      const item = forecastFanFn(
        FORECAST_HISTORY,
        { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 },
        "Museum visits (thousands)"
      );
      const p = {
        dataSet: [{ ...item, color: RED }],
        xAxisDataType: "date_annual",
        fillOpacity: 0.24,
        forecastZone: true,
        width: w,
        height: STAGE_H,
        margin: MARGIN,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = mountFanChart(host, p as any);
      currentUpdate = (nw) => chart?.update({ ...p, width: nw });
      break;
    }
    case "treemap": {
      const p = {
        dataSet: TREEMAP_DATA,
        showSplit: true,
        splitLabels: ["Realized", "Untapped"] as [string, string],
        splitOpacity: 0.35,
        showLegend: true,
        width: w,
        height: STAGE_H,
        margin: { top: 16, right: 16, bottom: 28, left: 16 },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = mountTreemapChart(host, p as any);
      currentUpdate = (nw) => chart?.update({ ...p, width: nw });
      break;
    }
    case "webgpu": {
      if (!gpuData) gpuData = makeGpuData();
      const p = {
        dataSet: gpuData,
        xAxisDataType: "number",
        xAxisDomain: [0, 100] as [number, number],
        yAxisDomain: [0, 100] as [number, number],
        sizeRange: [2, 2] as [number, number],
        renderer: gpuRenderer.value,
        width: w,
        height: STAGE_H,
        margin: { top: 16, right: 16, bottom: 36, left: 46 },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = mountScatterChart(host, p as any);
      currentUpdate = (nw) => chart?.update({ ...p, width: nw });
      break;
    }
    case "frameworks": {
      const p = {
        ...RADAR_PROPS,
        width: w,
        height: STAGE_H,
        margin: { top: 28, right: 40, bottom: 28, left: 40 },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = mountRadarChart(host, p as any);
      currentUpdate = (nw) => chart?.update({ ...p, width: nw });
      break;
    }
  }
}

async function mountForActive() {
  const token = ++switchToken;
  destroyChart();

  if (active.value === "insights" && !forecastFanFn && !insightsError.value) {
    insightsLoading.value = true;
    try {
      const mod = await import("@michi-vz/insights/forecast");
      forecastFanFn = mod.forecastFan;
    } catch (e) {
      insightsError.value = e instanceof Error ? e.message : String(e);
    } finally {
      insightsLoading.value = false;
    }
    if (token !== switchToken) return; // user already clicked away mid-import
  }
  if (active.value === "webgpu" && !gpuProbed) {
    await probeWebgpu();
    if (token !== switchToken) return;
  }
  if (token !== switchToken) return;
  buildChartForActiveTab();
}

function selectTab(id: WhyTabId) {
  focused.value = id;
  if (active.value === id) return;
  active.value = id;
  void mountForActive();
}

function setGpuRenderer(r: "canvas" | "webgpu") {
  if (gpuRenderer.value === r) return;
  gpuRenderer.value = r;
  if (active.value === "webgpu") {
    destroyChart();
    buildChartForActiveTab();
  }
}

function onTablistKeydown(e: KeyboardEvent) {
  const idx = TABS.findIndex((t) => t.id === focused.value);
  let next = -1;
  if (e.key === "ArrowDown") next = (idx + 1) % TABS.length;
  else if (e.key === "ArrowUp") next = (idx - 1 + TABS.length) % TABS.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = TABS.length - 1;
  if (next < 0) return;
  e.preventDefault();
  focused.value = TABS[next].id;
  tabBtns.value[next]?.focus();
}

onMounted(() => {
  // The default tab's line chart is 12 points - mounting it eagerly is cheaper
  // than an IntersectionObserver dance (the section sits near the fold, and
  // CatBand above already mounts four charts). The heavy scatter only ever
  // builds on a tab-5 click.
  buildChartForActiveTab();
  ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => currentUpdate?.(stageWidth()));
  });
  if (chartHost.value) ro.observe(chartHost.value);
});

onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
  switchToken++; // invalidate any in-flight async tab switch
  destroyChart();
});
</script>

<template>
  <section class="mv-why" aria-labelledby="mv-why-heading">
    <div class="mv-section-head">
      <span class="mv-mark">&#10022;</span>
      <h2 id="mv-why-heading">Why michi-vz</h2>
    </div>
    <p class="mv-lede">{{ WHY_LEDE }}</p>

    <div class="mv-why-body">
      <!-- Chart first in the DOM: mobile stacks proof above reasons. -->
      <div class="mv-why-left">
        <div class="mv-why-stage" ref="chartHost"></div>

        <!-- Tab 1: the live getContext() readout - the proof of the claim. -->
        <div v-if="active === 'explain' && ctxSummary" class="mv-why-ctx">
          <p class="mv-why-ctx-summary">"{{ ctxSummary }}"</p>
          <p class="mv-why-ctx-note">
            chart.getContext().summary, written by the chart above, live
          </p>
          <table v-if="ctxTable" class="mv-why-ctx-table">
            <thead>
              <tr>
                <th v-for="h in ctxTable.headers" :key="h">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in ctxTable.rows.slice(0, 3)" :key="ri">
                <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
              </tr>
              <tr v-if="ctxTable.rows.length > 3">
                <td :colspan="ctxTable.headers.length" class="mv-why-ctx-more">
                  + {{ ctxTable.rows.length - 3 }} more rows in the context
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 3: async states -->
        <p v-if="active === 'insights' && insightsLoading" class="mv-why-note" role="status">
          computing the forecast in your browser&#8230;
        </p>
        <p v-if="active === 'insights' && insightsError" class="mv-why-note" role="status">
          could not load the insights module ({{ insightsError }})
        </p>

        <!-- Tab 5: renderer toggle + honest backend status -->
        <div v-if="active === 'webgpu'" class="mv-why-gpu">
          <span class="mv-why-rtoggle" role="group" aria-label="renderer">
            <button :class="{ on: gpuRenderer === 'canvas' }" @click="setGpuRenderer('canvas')">
              Canvas
            </button>
            <button :class="{ on: gpuRenderer === 'webgpu' }" @click="setGpuRenderer('webgpu')">
              WebGPU
            </button>
          </span>
          <span class="mv-why-gpu-status" role="status">
            {{ GPU_POINTS.toLocaleString() }} points ·
            <template v-if="gpuRenderer === 'canvas'">canvas 2D</template>
            <template v-else-if="gpuStatus === 'webgpu'">WebGPU active</template>
            <template v-else-if="gpuStatus === 'canvas'">
              no WebGPU adapter here, drawn with canvas instead
            </template>
            <template v-else>detecting&#8230;</template>
          </span>
        </div>
      </div>

      <div
        class="mv-why-tabs"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Why michi-vz"
        @keydown="onTablistKeydown"
      >
        <template v-for="(t, i) in TABS" :key="t.id">
          <button
            class="mv-why-tab"
            role="tab"
            :id="`mv-why-tab-${t.id}`"
            :aria-selected="active === t.id"
            :aria-controls="`mv-why-panel-${t.id}`"
            :tabindex="focused === t.id ? 0 : -1"
            :ref="(el) => setTabBtn(el, i)"
            @click="selectTab(t.id)"
            @focus="focused = t.id"
          >
            <span class="mv-why-tab-num" aria-hidden="true">0{{ i + 1 }}</span>
            <span>{{ t.heading }}</span>
          </button>
          <div
            v-show="active === t.id"
            class="mv-why-panel"
            role="tabpanel"
            :id="`mv-why-panel-${t.id}`"
            :aria-labelledby="`mv-why-tab-${t.id}`"
          >
            <p class="mv-why-copy">
              <template v-for="(run, ri) in t.body" :key="ri">
                <template v-if="typeof run === 'string'">{{ run }}</template>
                <abbr v-else class="mv-term" tabindex="0" :title="run.title">{{ run.term }}</abbr>
              </template>
            </p>
            <p class="mv-why-elsewhere">Elsewhere: {{ t.elsewhere }}</p>
            <div v-if="t.id === 'frameworks'" class="mv-why-fw">
              <span class="mv-why-fw-tabs" role="group" aria-label="framework">
                <button
                  v-for="(s, si) in FRAMEWORK_SNIPPETS"
                  :key="s.label"
                  class="mv-chip"
                  :class="{ on: fwActive === si }"
                  :aria-pressed="fwActive === si"
                  @click="fwActive = si"
                >
                  {{ s.label }}
                </button>
              </span>
              <pre class="mv-why-code">{{ FRAMEWORK_SNIPPETS[fwActive].code }}</pre>
            </div>
            <a class="mv-why-link" :href="t.link.href">{{ t.link.text }} &#8594;</a>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
