<script setup lang="ts">
// Live @michi-vz/insights demos. `feature` = "forecast" | "anomaly" | "validate" | "agent".
// For feature="forecast", `chart` = "line" | "fan" | "area" | "range" shows the SAME forecasting
// on different chart types. Client-only (dynamic import) so SSR never touches the engine.
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{ feature?: string; chart?: string }>();
const feature = props.feature ?? "forecast";
const chartKind = props.chart ?? "line";

const host = ref<HTMLDivElement>();
const summary = ref("");
const explanation = ref("");
const explaining = ref(false);
const loadError = ref("");
const warnings = ref<string[]>([]);
const transcript = ref<Array<{ q: string; result: string }>>([]);
const active = ref<Record<string, boolean>>({ forecast: true, zone: true, forecastZone: true, narrate: false });
const showLineToggles = feature === "forecast" && chartKind === "line";

/* eslint-disable @typescript-eslint/no-explicit-any */
let api: any = null;
let chart: any = null;
let registry: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */
let ro: ResizeObserver | null = null;
let raf = 0;

const pt = (date: number, value: number, certainty = true) => ({ date, value, certainty });
const width = () => Math.max(280, host.value?.clientWidth ?? 600);

const LINE: Record<string, { label: string; color?: string; series: Array<{ date: number; value: number; certainty: boolean }> }[]> = {
  forecast: [{ label: "Revenue", color: "#2563eb", series: [pt(2017, 42), pt(2018, 55), pt(2019, 63), pt(2020, 71), pt(2021, 88), pt(2022, 104), pt(2023, 121)] }],
  anomaly: [{ label: "Traffic", color: "#2563eb", series: [pt(2016, 100), pt(2017, 105), pt(2018, 98), pt(2019, 102), pt(2020, 40), pt(2021, 103), pt(2022, 99), pt(2023, 101)] }],
  validate: [{ label: "Raw feed", color: "#dc2626", series: [pt(2018, 10), pt(2019, 20), pt(2019, 15), pt(2017, 8), pt(2021, 30)] }],
  agent: [
    { label: "North", color: "#2563eb", series: [pt(2020, 40), pt(2021, 55), pt(2022, 70), pt(2023, 96)] },
    { label: "South", color: "#16a34a", series: [pt(2020, 30), pt(2021, 33), pt(2022, 38), pt(2023, 41)] },
    { label: "East", color: "#d97706", series: [pt(2020, 22), pt(2021, 35), pt(2022, 52), pt(2023, 78)] },
  ],
};
const HISTORY = [pt(2016, 42), pt(2017, 55), pt(2018, 63), pt(2019, 71), pt(2020, 88), pt(2021, 104), pt(2022, 121)];
const AREA_ROWS = [
  { date: 2018, Wind: 18, Solar: 6 }, { date: 2019, Wind: 22, Solar: 9 }, { date: 2020, Wind: 27, Solar: 13 },
  { date: 2021, Wind: 33, Solar: 18 }, { date: 2022, Wind: 39, Solar: 24 },
];
const RANGE_PTS = [
  { date: 2019, valueMin: 2, valueMax: 3, valueMedium: 2.5, certainty: true },
  { date: 2020, valueMin: 1.6, valueMax: 3.2, valueMedium: 2.4, certainty: true },
  { date: 2021, valueMin: 1.3, valueMax: 3.5, valueMedium: 2.4, certainty: true },
  { date: 2022, valueMin: 1.5, valueMax: 3.7, valueMedium: 2.6, certainty: true },
];

function lineProps() {
  return {
    dataSet: LINE[feature].map((s) => ({ ...s, series: s.series.map((d) => ({ ...d })) })),
    xAxisDataType: "date_annual",
    showDataPoints: true,
    width: width(),
    height: 320,
    onDataWarning: (w: Array<{ message: string }>) => { warnings.value = w.map((x) => x.message); },
  };
}

function buildPlugins() {
  const p = [];
  if (feature === "forecast") {
    if (active.value.forecast) p.push(api.forecast({ method: "holt-winters", horizon: 4, level: 0.95, threshold: { value: 200, label: "Target 200" }, zone: active.value.zone }));
    if (active.value.narrate) p.push(api.narrate());
  } else if (feature === "anomaly") p.push(api.anomaly({ method: "zscore", threshold: 1.5 }));
  else if (feature === "validate") p.push(api.validate());
  return p;
}

function mountChart() {
  const w = width();
  if (feature === "forecast" && chartKind === "fan") {
    const item = api.forecastFan(HISTORY.map((d) => ({ ...d })), { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
    return api.mountFanChart(host.value, { dataSet: [item], xAxisDataType: "date_annual", fillOpacity: 0.22, forecastZone: active.value.forecastZone, width: w, height: 320 });
  }
  if (feature === "forecast" && chartKind === "area") {
    return api.mountAreaChart(host.value, { keys: ["Wind", "Solar"], series: AREA_ROWS.map((r) => ({ ...r })), xAxisDataType: "date_annual", width: w, height: 320 }, { plugins: [api.forecast({ method: "holt-winters", horizon: 3 })] });
  }
  if (feature === "forecast" && chartKind === "range") {
    return api.mountRangeChart(host.value, { dataSet: [{ label: "GDP growth %", color: "#2563eb", series: RANGE_PTS.map((p) => ({ ...p })) }], xAxisDataType: "date_annual", width: w, height: 320 }, { plugins: [api.forecast({ method: "holt-winters", horizon: 3 })] });
  }
  return api.mountLineChart(host.value, lineProps(), { plugins: buildPlugins() });
}

function remount() {
  if (!host.value || !api) return;
  warnings.value = [];
  chart?.destroy();
  chart = mountChart();
  summary.value = chart.getContext()?.summary ?? "";
  explanation.value = "";
  if (feature === "agent") {
    registry = api.createAgentRegistry();
    registry.register(api.chartHandle("sales", chart, lineProps()));
  }
}

function toggle(key: string) { active.value[key] = !active.value[key]; remount(); }

async function explain() {
  if (!chart || !api || explaining.value) return;
  explaining.value = true;
  explanation.value = "";
  // Min display time so the loader reads (a real SLM load takes seconds; rules is instant).
  const [text] = await Promise.all([
    api.explainChart(chart.getContext(), { backend: "rules" }),
    new Promise((r) => setTimeout(r, 850)),
  ]);
  explanation.value = text;
  explaining.value = false;
}

function runTool(q: string, tool: string, args: Record<string, unknown>) {
  if (!registry) return;
  let result: unknown;
  try { result = registry.call(tool, args); } catch (e) { result = String(e); }
  const text = typeof result === "string" ? result : JSON.stringify(result);
  transcript.value = [...transcript.value, { q, result: text.length > 160 ? text.slice(0, 160) + "…" : text }];
  summary.value = chart?.getContext()?.summary ?? summary.value;
}

onMounted(async () => {
  try {
    const [core, ins] = await Promise.all([import("@michi-vz/core"), import("@michi-vz/insights")]);
    api = {
      mountLineChart: core.mountLineChart, mountFanChart: core.mountFanChart, mountAreaChart: core.mountAreaChart, mountRangeChart: core.mountRangeChart,
      forecast: ins.forecast, forecastFan: ins.forecastFan, anomaly: ins.anomaly, validate: ins.validate, narrate: ins.narrate, explainChart: ins.explainChart,
      createAgentRegistry: ins.createAgentRegistry, chartHandle: ins.chartHandle,
    };
    remount();
    ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(remount); });
    if (host.value) ro.observe(host.value);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  }
});
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); chart?.destroy(); });
</script>

<template>
  <div class="insights-demo">
    <div class="insights-demo-bar">
      <span class="insights-demo-title">Live · {{ feature }}<span v-if="feature === 'forecast'"> · {{ chartKind }}</span></span>
      <div class="insights-demo-toggles">
        <template v-if="showLineToggles">
          <button class="idemo-chip" :class="{ on: active.forecast }" @click="toggle('forecast')">Forecast</button>
          <button class="idemo-chip" :class="{ on: active.zone }" @click="toggle('zone')">Forecast bg</button>
          <button class="idemo-chip" :class="{ on: active.narrate }" @click="toggle('narrate')">Narrate</button>
          <button class="idemo-chip explain" @click="explain">Explain ▸</button>
        </template>
        <template v-else-if="feature === 'agent'">
          <button class="idemo-chip" @click="runTool('summarize_chart', 'summarize_chart', { chart: 'sales' })">Summarize</button>
          <button class="idemo-chip" @click="runTool('highlight North', 'highlight', { chart: 'sales', labels: ['North'] })">Highlight North</button>
          <button class="idemo-chip" @click="runTool('hide South', 'set_disabled', { chart: 'sales', labels: ['South'] })">Hide South</button>
          <button class="idemo-chip" @click="runTool('reset', 'set_disabled', { chart: 'sales', labels: [] }); runTool('reset', 'highlight', { chart: 'sales', labels: [] })">Reset</button>
        </template>
        <template v-else-if="feature === 'forecast'">
          <button v-if="chartKind === 'fan'" class="idemo-chip" :class="{ on: active.forecastZone }" @click="toggle('forecastZone')">Forecast bg</button>
          <button class="idemo-chip explain" @click="explain">Explain ▸</button>
        </template>
        <span v-else class="insights-demo-tag">SVG · live</span>
      </div>
    </div>

    <div class="insights-demo-stage" ref="host"></div>
    <p v-if="loadError" class="insights-demo-error">⚠ {{ loadError }}</p>

    <p v-if="summary && feature !== 'validate'" class="insights-demo-summary"><strong>getContext().summary →</strong> {{ summary }}</p>

    <div v-if="explaining" class="ai-loading">
      <span class="ai-orb"></span>
      <span class="ai-load-text">Generating narration</span>
      <span class="ai-dots"><i></i><i></i><i></i></span>
    </div>
    <p v-else-if="explanation" class="insights-demo-explain"><strong>explainChart() →</strong> {{ explanation }}</p>

    <div v-if="feature === 'validate'" class="insights-demo-warnings">
      <strong>onDataWarning →</strong>
      <ul v-if="warnings.length"><li v-for="(w, i) in warnings" :key="i">⚠ {{ w }}</li></ul>
      <span v-else> no warnings</span>
    </div>

    <div v-if="feature === 'agent' && transcript.length" class="insights-demo-transcript">
      <div v-for="(t, i) in transcript" :key="i" class="idemo-turn"><code>{{ t.q }}</code> → {{ t.result }}</div>
    </div>
  </div>
</template>

<style scoped>
.insights-demo { border: 1px solid var(--vp-c-divider); border-radius: 8px; margin: 18px 0; background: var(--vp-c-bg-soft); overflow: hidden; }
.insights-demo-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
.insights-demo-title { font-family: "Spectral", Georgia, serif; font-weight: 600; text-transform: capitalize; }
.insights-demo-tag { font-family: var(--vp-font-family-mono); font-size: 11px; color: var(--vp-c-text-3); }
.insights-demo-toggles { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.idemo-chip { font: inherit; font-size: 12.5px; padding: 3px 10px; border: 1px solid var(--vp-c-divider); border-radius: 999px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.idemo-chip.on { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: #fff; }
.idemo-chip.explain { color: var(--vp-c-brand-1); }
.insights-demo-stage { padding: 12px 16px; }
.insights-demo-summary, .insights-demo-explain, .insights-demo-warnings, .insights-demo-transcript { margin: 0 16px 12px; font-size: 13px; line-height: 1.5; color: var(--vp-c-text-2); }
.insights-demo-explain { color: var(--vp-c-text-1); }
.insights-demo-warnings ul { margin: 4px 0 0; padding-left: 18px; }
.idemo-turn { font-size: 12.5px; padding: 2px 0; }
.idemo-turn code { color: var(--vp-c-brand-1); }

/* AI loading - Nordic-minimal: calm, muted slate-blue, a breathing orb + soft dots. */
.ai-loading { display: flex; align-items: center; gap: 10px; margin: 0 16px 14px; font-size: 13px; color: var(--vp-c-text-3); }
.ai-orb { width: 11px; height: 11px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #acc6dc, #6f97b8); animation: ai-breathe 1.7s ease-in-out infinite; }
@keyframes ai-breathe { 0%, 100% { transform: scale(0.78); box-shadow: 0 0 0 0 rgba(111, 151, 184, 0.45); } 50% { transform: scale(1.08); box-shadow: 0 0 0 9px rgba(111, 151, 184, 0); } }
.ai-load-text { letter-spacing: 0.02em; }
.ai-dots { display: inline-flex; gap: 4px; }
.ai-dots i { width: 5px; height: 5px; border-radius: 50%; background: #6f97b8; opacity: 0.35; animation: ai-dot 1.2s ease-in-out infinite; }
.ai-dots i:nth-child(2) { animation-delay: 0.18s; }
.ai-dots i:nth-child(3) { animation-delay: 0.36s; }
@keyframes ai-dot { 0%, 100% { opacity: 0.25; transform: translateY(0); } 50% { opacity: 0.9; transform: translateY(-2px); } }
@media (prefers-reduced-motion: reduce) { .ai-orb, .ai-dots i { animation: none; } }
.insights-demo-error { margin: 0 16px 12px; font-size: 13px; color: var(--vp-c-danger-1, #c0392b); }
</style>
