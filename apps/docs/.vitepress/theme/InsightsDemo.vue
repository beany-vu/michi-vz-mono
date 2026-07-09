<script setup lang="ts">
// Live @michi-vz/insights demos. `feature` = "forecast" | "anomaly" | "validate" | "agent"
// | "narrate" | "embeddings".
// For feature="forecast", `chart` = "line" | "fan" | "area" | "range" shows the SAME forecasting
// on different chart types. feature="embeddings" is a model-free semantic-search widget (no chart).
// Client-only (dynamic import) so SSR never touches the engine.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useLlm, LLM_CATALOG } from "./useLlm";

const props = defineProps<{ feature?: string; chart?: string; dataset?: string; modelExplain?: boolean }>();
const feature = props.feature ?? "forecast";
const chartKind = props.chart ?? "line";

// Named domain datasets so one demo can show many attractive, real-world examples - just pass
// `dataset`. Single-series ones (`pts`) suit forecast/anomaly; multi-series ones (`series`) suit
// narration (a "top mover" needs more than one line). Forecast-only datasets carry a `threshold`.
type DemoSeries = { label: string; color?: string; pts: [number, number][] };
const DATASETS: Record<string, { title: string; color?: string; threshold?: { value: number; label: string }; scenarios?: { name: string; growth: number }[]; pts?: [number, number][]; series?: DemoSeries[] }> = {
  "bank-revenue": { title: "Quarterly revenue ($M)", color: "#2563eb", threshold: { value: 200, label: "Target $200M" }, pts: [[2017, 42], [2018, 55], [2019, 63], [2020, 71], [2021, 88], [2022, 104], [2023, 121]] },
  "pharma-enrollment": { title: "Trial enrollment (patients)", color: "#16a34a", threshold: { value: 300, label: "Target 300" }, pts: [[2019, 20], [2020, 55], [2021, 95], [2022, 150], [2023, 210]] },
  "cpi": { title: "Inflation, CPI (%)", color: "#d97706", threshold: { value: 2, label: "2% target" }, pts: [[2017, 2.1], [2018, 2.4], [2019, 1.8], [2020, 1.2], [2021, 4.7], [2022, 8.0], [2023, 4.1]] },
  "energy-demand": { title: "Peak demand (GW)", color: "#dc2626", threshold: { value: 60, label: "Capacity 60" }, pts: [[2017, 38], [2018, 40], [2019, 43], [2020, 42], [2021, 47], [2022, 51], [2023, 55]] },
  "saas-mrr": { title: "Monthly recurring revenue ($k)", color: "#8e5aa8", threshold: { value: 500, label: "Target $500k" }, pts: [[2019, 30], [2020, 52], [2021, 88], [2022, 140], [2023, 205]] },
  // Anomaly: one clear outlier per series (z-score flags it).
  "anom-fraud": { title: "Card fraud losses ($M)", color: "#dc2626", pts: [[2016, 42], [2017, 48], [2018, 51], [2019, 55], [2020, 59], [2021, 63], [2022, 210], [2023, 68], [2024, 72]] },
  "anom-adverse": { title: "Reported adverse events (cases)", color: "#16a34a", pts: [[2017, 12], [2018, 15], [2019, 14], [2020, 17], [2021, 16], [2022, 19], [2023, 148], [2024, 21]] },
  "anom-latency": { title: "Peak service latency (ms)", color: "#2563eb", pts: [[2018, 120], [2019, 128], [2020, 135], [2021, 142], [2022, 1180], [2023, 150], [2024, 158]] },
  "anom-returns": { title: "Product return rate (%)", color: "#d97706", pts: [[2016, 6.1], [2017, 6.4], [2018, 6], [2019, 6.6], [2020, 6.3], [2021, 18.7], [2022, 6.8], [2023, 6.5], [2024, 7]] },
  "anom-gdp": { title: "Annual GDP growth (%)", color: "#8e5aa8", pts: [[2015, 2.1], [2016, 2.4], [2017, 2.2], [2018, 2.6], [2019, 2.3], [2020, -4.3], [2021, 2.5], [2022, 2.7], [2023, 2.4]] },
  // Narration: multi-series with a clear "top mover".
  "narr-bank-channel": { title: "Deposits by channel ($M)", series: [
    { label: "Digital", color: "#2563eb", pts: [[2018, 46], [2019, 58], [2020, 77], [2021, 99], [2022, 124], [2023, 151], [2024, 188]] },
    { label: "Branch", color: "#9aa4b2", pts: [[2018, 142], [2019, 133], [2020, 118], [2021, 104], [2022, 92], [2023, 79], [2024, 71]] },
  ] },
  "narr-pharma-sites": { title: "Enrollment by trial site (patients)", series: [
    { label: "Lead site", color: "#16a34a", pts: [[2019, 28], [2020, 52], [2021, 84], [2022, 121], [2023, 164], [2024, 205]] },
    { label: "Backup site", color: "#d97706", pts: [[2019, 24], [2020, 31], [2021, 37], [2022, 40], [2023, 42], [2024, 43]] },
  ] },
  "narr-real-wages": { title: "Real median wage (index, 2015=100)", series: [
    { label: "Real wage", color: "#8e5aa8", pts: [[2015, 100], [2016, 101], [2017, 99], [2018, 98], [2019, 97], [2020, 96], [2021, 93], [2022, 89], [2023, 90], [2024, 92]] },
  ] },
  "narr-urbanisation": { title: "Population by settlement (millions)", series: [
    { label: "Urban", color: "#2563eb", pts: [[1900, 30], [1920, 45], [1940, 68], [1960, 110], [1980, 165], [2000, 215], [2020, 250]] },
    { label: "Rural", color: "#16a34a", pts: [[1900, 90], [1920, 85], [1940, 78], [1960, 72], [1980, 66], [2000, 62], [2020, 58]] },
  ] },
  "narr-energy-mix": { title: "Electricity mix (% of power)", series: [
    { label: "Coal", color: "#6b7280", pts: [[2010, 45], [2013, 40], [2016, 33], [2019, 24], [2022, 18], [2024, 14]] },
    { label: "Gas", color: "#d97706", pts: [[2010, 24], [2013, 27], [2016, 33], [2019, 38], [2022, 40], [2024, 41]] },
    { label: "Renewables", color: "#16a34a", pts: [[2010, 9], [2013, 14], [2016, 21], [2019, 31], [2022, 38], [2024, 43]] },
  ] },
  // Scenarios: best / base / worst projection lines from the same history.
  "scen-bank-stress": { title: "Revenue under stress ($M)", color: "#2563eb", threshold: { value: 200, label: "Plan $200M" }, scenarios: [{ name: "Upside +15%", growth: 0.15 }, { name: "Severe −20%", growth: -0.2 }], pts: [[2017, 42], [2018, 55], [2019, 63], [2020, 71], [2021, 88], [2022, 104], [2023, 121]] },
  "scen-startup-runway": { title: "Cash on hand ($M)", color: "#dc2626", threshold: { value: 0, label: "Out of cash" }, scenarios: [{ name: "Plan holds", growth: 0.05 }, { name: "Funding slips", growth: -0.3 }], pts: [[2019, 52], [2020, 44], [2021, 37], [2022, 28], [2023, 19]] },
  "scen-pharma-uptake": { title: "New-drug uptake (thousands of prescriptions)", color: "#16a34a", scenarios: [{ name: "Strong adoption", growth: 0.2 }, { name: "Slow adoption", growth: -0.05 }], pts: [[2020, 5], [2021, 14], [2022, 28], [2023, 46], [2024, 68]] },
};
const ds = props.dataset ? DATASETS[props.dataset] ?? null : null;

const host = ref<HTMLDivElement>();
const summary = ref("");
const explanation = ref("");
const explaining = ref(false);
const loadError = ref("");
const warnings = ref<string[]>([]);
const transcript = ref<Array<{ q: string; result: string; hint?: boolean }>>([]);
const active = ref<Record<string, boolean>>({ forecast: true, zone: true, forecastZone: true, narrate: false });
const showLineToggles = feature === "forecast" && chartKind === "line";
// Canvas-first (faster renderer, built in parallel with SVG); toggle proves parity.
const renderer = ref<"canvas" | "svg">("canvas");

/* eslint-disable @typescript-eslint/no-explicit-any */
let api: any = null;
let chart: any = null;
let registry: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */
let ro: ResizeObserver | null = null;
let raf = 0;

const pt = (date: number, value: number, certainty = true) => ({ date, value, certainty });
// clientWidth INCLUDES padding, so subtract the host's horizontal padding, else the canvas
// renders wider than its container and overflows (clips the last axis label).
const width = () => {
  const el = host.value;
  if (!el) return 600;
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
};

const LINE: Record<string, { label: string; color?: string; series: Array<{ date: number; value: number; certainty: boolean }> }[]> = {
  forecast: [{ label: "Revenue", color: "#2563eb", series: [pt(2017, 42), pt(2018, 55), pt(2019, 63), pt(2020, 71), pt(2021, 88), pt(2022, 104), pt(2023, 121)] }],
  anomaly: [{ label: "Traffic", color: "#2563eb", series: [pt(2016, 100), pt(2017, 105), pt(2018, 98), pt(2019, 102), pt(2020, 40), pt(2021, 103), pt(2022, 99), pt(2023, 101)] }],
  validate: [{ label: "Raw feed", color: "#dc2626", series: [pt(2018, 10), pt(2019, 20), pt(2019, 15), pt(2017, 8), pt(2021, 30)] }],
  narrate: [
    { label: "Premium", color: "#2563eb", series: [pt(2019, 30), pt(2020, 38), pt(2021, 52), pt(2022, 67), pt(2023, 79)] },
    { label: "Standard", color: "#16a34a", series: [pt(2019, 60), pt(2020, 58), pt(2021, 57), pt(2022, 55), pt(2023, 52)] },
  ],
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

// feature="embeddings": model-free semantic search over chart labels (hash fallback),
// drawn as a real ScatterChart "similarity map" - each label is a dot that slides toward
// the right as it matches the typed query (x = cosine similarity).
const LABELS = ["Quarterly revenue by region", "Revenue growth rate", "Customer churn %", "Website traffic", "Monthly active users", "Marketing spend", "Gross margin %", "Net-new customers"];
const query = ref("revenue");
const ranked = ref<Array<{ item: string; score: number }>>([]);
const scatterHost = ref<HTMLDivElement>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let scatter: any = null;
// Same .insights-demo-stage padding as `width()` above - clientWidth includes
// it, so subtract it here too, else this second host overflows/clips on the right.
const sw = () => {
  const el = scatterHost.value;
  if (!el) return 600;
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
};

function scatterProps() {
  const byLabel: Record<string, number> = {};
  for (const r of ranked.value) byLabel[r.item] = r.score;
  const dataSet = LABELS.map((label, i) => {
    const score = byLabel[label] ?? 0;
    return { label, x: Math.round(score * 1000) / 1000, y: LABELS.length - i, d: Math.round(6 + score * 40), color: score > 0.001 ? "#2563eb" : "#9aa4b2" };
  });
  return { xAxisDataType: "number" as const, renderer: renderer.value, sizeRange: [5, 26] as [number, number], width: sw(), height: 300, dataSet };
}
function mountScatter() {
  if (!scatterHost.value || !api) return;
  scatter?.destroy();
  scatter = api.mountScatterChart(scatterHost.value, scatterProps());
}
async function search() {
  if (!api) return;
  ranked.value = await api.findSimilar(query.value, LABELS, (t: string) => t, {});
  if (scatter) scatter.update(scatterProps());
}

function lineProps() {
  const dataSet = ds
    ? (ds.series
        ? ds.series.map((s) => ({ label: s.label, color: s.color, series: s.pts.map((p) => pt(p[0], p[1])) }))
        : [{ label: ds.title, color: ds.color, series: (ds.pts ?? []).map((p) => pt(p[0], p[1])) }])
    : LINE[feature].map((s) => ({ ...s, series: s.series.map((d) => ({ ...d })) }));
  return {
    dataSet,
    xAxisDataType: "date_annual",
    renderer: renderer.value,
    showDataPoints: true,
    width: width(),
    height: 320,
    onDataWarning: (w: Array<{ message: string }>) => { warnings.value = w.map((x) => x.message); },
  };
}

function buildPlugins() {
  const p = [];
  if (feature === "forecast") {
    if (active.value.forecast) p.push(api.forecast({ method: "holt-winters", horizon: 4, level: 0.95, threshold: ds?.threshold ?? { value: 200, label: "Target 200" }, scenarios: ds?.scenarios, zone: active.value.zone }));
    if (active.value.narrate) p.push(api.narrate());
  } else if (feature === "anomaly") p.push(api.anomaly({ method: "zscore", threshold: 1.5 }));
  else if (feature === "validate") p.push(api.validate());
  else if (feature === "narrate") p.push(api.narrate());
  return p;
}

function mountChart() {
  const w = width();
  if (feature === "forecast" && chartKind === "fan") {
    const item = api.forecastFan(HISTORY.map((d) => ({ ...d })), { method: "holt-winters", horizon: 4, levels: [0.5, 0.8], level: 0.95 }, "Revenue");
    return api.mountFanChart(host.value, { dataSet: [item], xAxisDataType: "date_annual", renderer: renderer.value, fillOpacity: 0.22, forecastZone: active.value.forecastZone, width: w, height: 320 });
  }
  if (feature === "forecast" && chartKind === "area") {
    return api.mountAreaChart(host.value, { keys: ["Wind", "Solar"], series: AREA_ROWS.map((r) => ({ ...r })), xAxisDataType: "date_annual", renderer: renderer.value, width: w, height: 320 }, { plugins: [api.forecast({ method: "holt-winters", horizon: 3 })] });
  }
  if (feature === "forecast" && chartKind === "range") {
    return api.mountRangeChart(host.value, { dataSet: [{ label: "GDP growth %", color: "#2563eb", series: RANGE_PTS.map((p) => ({ ...p })) }], xAxisDataType: "date_annual", renderer: renderer.value, width: w, height: 320 }, { plugins: [api.forecast({ method: "holt-winters", horizon: 3 })] });
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
function setRenderer(r: "canvas" | "svg") {
  if (renderer.value === r) return;
  renderer.value = r;
  if (feature === "embeddings") mountScatter();
  else remount();
}

// Opt-in (props.modelExplain) real-model narration: the rules explanation stays the default;
// a small in-browser LLM can add a second, model-written one. Reuses useLlm()'s module-singleton
// state under narrate-prefixed names, so a model loaded here also lights up the agent-chat demo
// (and vice versa). Routed through backend:"remote" + a caller wrapping the CDN-loaded engine -
// never backend:"webllm"/"transformers" here, since @mlc-ai/web-llm isn't installed in apps/docs
// and those backends' optionalImport would silently fall back to rules, which would be dishonest.
const { loadedId: narrateLlmLoaded, pct: narrateLlmPct, errMsg: narrateLlmErr, load: narrateLlmLoad, generate: narrateLlmGen } = useLlm();
const narrateReal = ref(false); // ⚡ Instant by default
const smallestLlm = LLM_CATALOG.reduce((min, m) => (m.sizeMB < min.sizeMB ? m : min));
const narrateLlmId = ref(smallestLlm.id);
const selectedNarrateLlm = computed(() => LLM_CATALOG.find((m) => m.id === narrateLlmId.value) ?? LLM_CATALOG[0]);
const narrateBusy = ref(false);
const modelExplanation = ref("");
const narrateExplaining = ref(false);

async function loadNarrateModel() {
  if (narrateBusy.value || narrateLlmLoaded.value === selectedNarrateLlm.value.id) return;
  narrateBusy.value = true;
  try { await narrateLlmLoad(selectedNarrateLlm.value); } catch { /* narrateLlmErr surfaced in the panel */ } finally { narrateBusy.value = false; }
}

async function explain() {
  if (!chart || !api || explaining.value || narrateExplaining.value) return;
  explaining.value = true;
  explanation.value = "";
  modelExplanation.value = "";
  // Min display time so the loader reads (a real SLM load takes seconds; rules is instant).
  const [text] = await Promise.all([
    api.explainChart(chart.getContext(), { backend: "rules" }),
    new Promise((r) => setTimeout(r, 850)),
  ]);
  explanation.value = text;
  explaining.value = false;

  // Real-model pass, appended after the rules text - only on pages that opt in, only once the
  // user has switched to Real model AND already loaded it (never an auto-download).
  if (props.modelExplain && narrateReal.value && narrateLlmLoaded.value === selectedNarrateLlm.value.id) {
    narrateExplaining.value = true;
    try {
      modelExplanation.value = await api.explainChart(chart.getContext(), {
        backend: "remote",
        caller: (prompt: string) => narrateLlmGen(prompt, 150),
      });
    } finally {
      narrateExplaining.value = false;
    }
  }
}

function runTool(q: string, tool: string, args: Record<string, unknown>) {
  if (!registry) return;
  let result: unknown;
  try { result = registry.call(tool, args); } catch (e) { result = String(e); }
  const text = typeof result === "string" ? result : JSON.stringify(result);
  transcript.value = [...transcript.value, { q, result: text.length > 160 ? text.slice(0, 160) + "…" : text }];
  summary.value = chart?.getContext()?.summary ?? summary.value;
}

// Chat with the chart. Two engines: an INSTANT typo-tolerant router (offline, default) and an
// opt-in REAL model (Qwen/Llama/Gemma via WebLLM) that reads the chart's context to interpret
// free text. The model picks the action; the router is both the default and the fallback.
const { loadedId: chatLlmLoaded, pct: chatLlmPct, errMsg: chatLlmErr, load: chatLlmLoad, generate: chatLlmGen } = useLlm();
const chatQuery = ref("");
const chatReal = ref(false); // ⚡ Instant by default
const chatLlmId = ref("gemma-2-2b-it-q4f16_1-MLC");
const selectedChatLlm = computed(() => LLM_CATALOG.find((m) => m.id === chatLlmId.value) ?? LLM_CATALOG[0]);
const chatBusy = ref(false);
const fmtSize = (mb: number) => (mb >= 1000 ? `~${(mb / 1000).toFixed(1)} GB` : `~${mb} MB`);
const CHAT_PROMPTS = ["Which series grew the most?", "Highlight North", "Hide everything except East", "Show all"];
const SERIES = ["North", "South", "East"];
function say(q: string, result: string) { transcript.value = [...transcript.value, { q, result, hint: true }]; }

// Tiny edit-distance (Levenshtein), dependency-free, to forgive typos like "hilight" / "sumarize".
function editDist(a: string, b: string) {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function closest(w: string, words: string[], max: number) {
  let best: string | null = null, bd = max + 1;
  for (const c of words) { const e = editDist(w, c.toLowerCase()); if (e < bd) { bd = e; best = c; } }
  return bd <= max ? best : null;
}
const ACTION_WORDS: Record<string, string> = { summarize: "summary", summary: "summary", describe: "summary", highlight: "highlight", show: "highlight", hide: "hide", remove: "hide", reset: "showall", clear: "showall" };
function fuzzyIntent(text: string) {
  const t = text.toLowerCase();
  const words = t.split(/[^a-z]+/).filter(Boolean);
  let action: string | null = null, series: string | null = null;
  if (/show all|reset|clear|everything|unhide/.test(t)) action = "showall";
  for (const w of words) {
    if (!series) { const s = closest(w, SERIES, w.length <= 4 ? 1 : 2); if (s) series = s; }
    if (!action) { const a = closest(w, Object.keys(ACTION_WORDS), w.length <= 4 ? 1 : 2); if (a) action = ACTION_WORDS[a]; }
  }
  if (!action && /grew|most|top|biggest|winner|mover|rose|fell/.test(t)) action = "summary";
  if (/except|only|just/.test(t) && series) action = "isolate"; // "hide everything except East"
  return { action, series };
}
function routeIntent(text: string, action: string | null, series: string | null) {
  if (action === "summary") runTool(text, "summarize_chart", { chart: "sales" });
  else if (action === "showall") { runTool(text, "set_disabled", { chart: "sales", labels: [] }); runTool(text, "highlight", { chart: "sales", labels: [] }); }
  else if (action === "isolate" && series) runTool(text, "set_disabled", { chart: "sales", labels: SERIES.filter((s) => s !== series) });
  else if (action === "hide" && series) runTool(text, "set_disabled", { chart: "sales", labels: [series] });
  else if (action === "highlight" && series) runTool(text, "highlight", { chart: "sales", labels: [series] });
  else if (series) say(text, `Did you mean "highlight ${series}" or "hide ${series}"?`);
  else if (action) say(text, `Which series? Try "highlight North" or "hide South".`);
  else say(text, `Try: "which series grew the most?", "highlight North", "hide South", or "show all".`);
}

async function sendChat(preset?: string) {
  const text = (typeof preset === "string" ? preset : chatQuery.value).trim();
  if (!text || !registry || chatBusy.value) return;
  chatQuery.value = "";
  // Real model: let the chosen LLM read the chart + pick an action (typo-tolerant by nature).
  if (chatReal.value && chatLlmLoaded.value) {
    chatBusy.value = true;
    try {
      const ctx = chart?.getContext?.()?.summary ?? "";
      const prompt = `You control a chart with series North, South, East. Context: ${ctx}\nThe user says: "${text}".\nReply with EXACTLY one line, nothing else: SUMMARY, or HIGHLIGHT <series>, or HIDE <series>, or SHOWALL.`;
      const reply = (await chatLlmGen(prompt, 12)).toUpperCase();
      const series = SERIES.find((s) => reply.includes(s.toUpperCase())) ?? null;
      let action: string | null = null;
      if (/SUMMAR/.test(reply)) action = "summary";
      else if (/SHOW ?ALL|RESET/.test(reply)) action = "showall";
      else if (/HIDE/.test(reply)) action = "hide";
      else if (/HIGHLIGHT|SHOW/.test(reply)) action = "highlight";
      if (action) { routeIntent(text, action, series); return; } // else fall through to the router
    } catch { /* model error → fall through to the instant router */ }
    finally { chatBusy.value = false; }
  }
  // Instant router (default + fallback)
  const { action, series } = fuzzyIntent(text);
  routeIntent(text, action, series);
}

async function loadChatModel() {
  if (chatBusy.value || chatLlmLoaded.value === selectedChatLlm.value.id) return;
  chatBusy.value = true;
  try { await chatLlmLoad(selectedChatLlm.value); } catch { /* chatLlmErr surfaced in the panel */ } finally { chatBusy.value = false; }
}

onMounted(async () => {
  try {
    const [core, ins] = await Promise.all([import("@michi-vz/core"), import("@michi-vz/insights")]);
    api = {
      mountLineChart: core.mountLineChart, mountFanChart: core.mountFanChart, mountAreaChart: core.mountAreaChart, mountRangeChart: core.mountRangeChart, mountScatterChart: core.mountScatterChart,
      forecast: ins.forecast, forecastFan: ins.forecastFan, anomaly: ins.anomaly, validate: ins.validate, narrate: ins.narrate, explainChart: ins.explainChart,
      createAgentRegistry: ins.createAgentRegistry, chartHandle: ins.chartHandle, findSimilar: ins.findSimilar,
    };
    if (feature === "embeddings") {
      await search();
      mountScatter();
      ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => scatter?.update(scatterProps())); });
      if (scatterHost.value) ro.observe(scatterHost.value);
      return;
    }
    remount();
    ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(remount); });
    if (host.value) ro.observe(host.value);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  }
});
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); chart?.destroy(); scatter?.destroy(); });
</script>

<template>
  <div class="insights-demo">
    <div class="insights-demo-bar">
      <span class="insights-demo-title">{{ feature }}<span v-if="ds"> · {{ ds.title }}</span><span v-else-if="feature === 'forecast'"> · {{ chartKind }}</span></span>
      <div class="insights-demo-toggles">
        <span class="idemo-rtoggle" role="group" aria-label="renderer">
          <button :class="{ on: renderer === 'canvas' }" @click="setRenderer('canvas')">Canvas</button>
          <button :class="{ on: renderer === 'svg' }" @click="setRenderer('svg')">SVG</button>
        </span>
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
        <template v-else-if="feature === 'narrate'">
          <button class="idemo-chip explain" @click="explain">Explain ▸</button>
        </template>
      </div>
    </div>

    <!-- Semantic search (embeddings): a search box + ranked labels, not a chart. -->
    <template v-if="feature === 'embeddings'">
      <div class="idemo-search">
        <input v-model="query" @input="search" type="text" placeholder="Type a term, e.g. revenue, customers, traffic…" aria-label="search term" />
      </div>
      <div class="insights-demo-stage" ref="scatterHost"></div>
      <p class="insights-demo-summary" style="margin-top: -4px;">Each label is a dot; <strong>x = similarity</strong> to your query, so matches slide right. Bubble size = score.</p>
      <ul class="idemo-ranked">
        <li v-for="(r, i) in ranked" :key="i" :class="{ dim: r.score === 0 }">
          <span class="idemo-rank-label">{{ r.item }}</span>
          <span class="idemo-rank-bar"><i :style="{ width: Math.round(r.score * 100) + '%' }"></i></span>
          <span class="idemo-rank-score">{{ r.score.toFixed(2) }}</span>
        </li>
      </ul>
      <p class="insights-demo-summary"><strong>findSimilar()</strong> ranks by shared terms here (model-free). Opt into <code>{{ '{ backend: "transformers" }' }}</code> and synonyms match too.</p>
      <p v-if="loadError" class="insights-demo-error">⚠ {{ loadError }}</p>
    </template>

    <!-- Every other feature: a live chart. -->
    <template v-else>
      <div class="insights-demo-stage" ref="host"></div>
      <p v-if="loadError" class="insights-demo-error">⚠ {{ loadError }}</p>

      <p v-if="summary && feature !== 'validate'" class="insights-demo-summary"><strong>getContext().summary →</strong> {{ summary }}</p>

      <div v-if="props.modelExplain" class="idemo-chat-engine">
        <div class="idemo-modes" role="group" aria-label="Explain engine">
          <button :class="{ on: !narrateReal }" @click="narrateReal = false" title="Instant: a rule-based sentence, generated offline - no download.">⚡ Instant</button>
          <button :class="{ on: narrateReal }" @click="narrateReal = true" title="Real model: a small in-browser LLM (Qwen / Llama / Gemma) narrates the chart. Falls back to rules.">Real model</button>
        </div>
        <template v-if="narrateReal">
          <select v-model="narrateLlmId" :disabled="narrateBusy" aria-label="narration model">
            <option v-for="m in LLM_CATALOG" :key="m.id" :value="m.id">{{ m.name }} · {{ fmtSize(m.sizeMB) }}</option>
          </select>
          <button class="idemo-chip" :class="{ ready: narrateLlmLoaded === selectedNarrateLlm.id }" @click="loadNarrateModel" :disabled="narrateBusy">
            <span v-if="narrateBusy && narrateLlmLoaded !== selectedNarrateLlm.id">Loading… {{ narrateLlmPct }}%</span>
            <span v-else-if="narrateLlmLoaded === selectedNarrateLlm.id">✓ {{ selectedNarrateLlm.name }}</span>
            <span v-else>⚡ Load {{ selectedNarrateLlm.name }}</span>
          </button>
        </template>
      </div>
      <p v-if="props.modelExplain && narrateReal && narrateLlmErr" class="idemo-chat-warn">⚠ {{ narrateLlmErr }} (needs a recent Chrome/Edge with WebGPU). The rules explanation still works.</p>

      <div v-if="explaining" class="ai-loading">
        <span class="ai-orb"></span>
        <span class="ai-load-text">Generating narration</span>
        <span class="ai-dots"><i></i><i></i><i></i></span>
      </div>
      <p v-else-if="explanation" class="insights-demo-explain"><strong>{{ props.modelExplain ? "Rules →" : "explainChart() →" }}</strong> {{ explanation }}</p>

      <template v-if="props.modelExplain">
        <div v-if="narrateExplaining" class="ai-loading">
          <span class="ai-orb"></span>
          <span class="ai-load-text">Generating narration</span>
          <span class="ai-dots"><i></i><i></i><i></i></span>
        </div>
        <p v-else-if="modelExplanation" class="insights-demo-explain"><strong>Model ({{ selectedNarrateLlm.name }}) →</strong> {{ modelExplanation }}</p>
      </template>

      <div v-if="feature === 'validate'" class="insights-demo-warnings">
        <strong>onDataWarning →</strong>
        <ul v-if="warnings.length"><li v-for="(w, i) in warnings" :key="i">⚠ {{ w }}</li></ul>
        <span v-else> no warnings</span>
      </div>

      <div v-if="feature === 'agent'" class="idemo-chat ai-glow">
        <div class="idemo-chat-engine">
          <div class="idemo-modes" role="group" aria-label="Chat engine">
            <button :class="{ on: !chatReal }" @click="chatReal = false" title="Instant: a typo-tolerant matcher routes your words to the chart's tools - offline, no download.">⚡ Instant</button>
            <button :class="{ on: chatReal }" @click="chatReal = true" title="Real model: a small in-browser LLM (Qwen / Llama / Gemma) reads the chart and interprets your message. Falls back to Instant.">Real model</button>
          </div>
          <template v-if="chatReal">
            <select v-model="chatLlmId" :disabled="chatBusy" aria-label="chat model">
              <option v-for="m in LLM_CATALOG" :key="m.id" :value="m.id">{{ m.name }} · {{ fmtSize(m.sizeMB) }}</option>
            </select>
            <button class="idemo-chip" :class="{ ready: chatLlmLoaded === selectedChatLlm.id }" @click="loadChatModel" :disabled="chatBusy">
              <span v-if="chatBusy && chatLlmLoaded !== selectedChatLlm.id">Loading… {{ chatLlmPct }}%</span>
              <span v-else-if="chatLlmLoaded === selectedChatLlm.id">✓ {{ selectedChatLlm.name }}</span>
              <span v-else>⚡ Load {{ selectedChatLlm.name }}</span>
            </button>
          </template>
        </div>
        <div class="idemo-chat-row">
          <input v-model="chatQuery" @keyup.enter="sendChat()" :disabled="chatBusy" :placeholder="chatBusy ? 'Thinking…' : 'Ask the chart… e.g. hilight North, then hide South'" aria-label="chat with the chart" />
          <button class="idemo-chip explain" @click="sendChat()" :disabled="chatBusy">Send ▸</button>
        </div>
        <div class="idemo-chat-suggest">
          <span>Paste one:</span>
          <button v-for="p in CHAT_PROMPTS" :key="p" @click="sendChat(p)">{{ p }}</button>
        </div>
        <p v-if="chatReal && chatLlmErr" class="idemo-chat-warn">⚠ {{ chatLlmErr }} (needs a recent Chrome/Edge with WebGPU). The instant matcher still works.</p>
        <p class="idemo-chat-warn"><strong>Typo-tolerant</strong> - understands near-misses like "hilight east" and suggests a fix when unsure. A model can be confidently wrong and different models answer differently, so <strong>don't trust AI blindly</strong> - verify before you act.</p>
      </div>

      <div v-if="feature === 'agent' && transcript.length" class="insights-demo-transcript">
        <div v-for="(t, i) in transcript" :key="i" class="idemo-turn" :class="{ hint: t.hint }"><code>{{ t.q }}</code> <span class="idemo-turn-arw">{{ t.hint ? "⚠ not sure -" : "→" }}</span> {{ t.result }}</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.insights-demo { border: 1px solid var(--vp-c-divider); border-radius: 8px; margin: 18px 0; background: var(--vp-c-bg-soft); overflow: hidden; --michi-vz-ink: var(--vp-c-text-1); }
.insights-demo-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
.insights-demo-title { font-family: "Josefin Sans", system-ui, sans-serif; font-weight: 600; text-transform: capitalize; }
.insights-demo-tag { font-family: var(--vp-font-family-mono); font-size: 11px; color: var(--vp-c-text-3); }
.insights-demo-toggles { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.idemo-chip { font: inherit; font-size: 12.5px; padding: 3px 10px; border: 1px solid var(--vp-c-divider); border-radius: 999px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.idemo-chip.on { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: #fff; }
.idemo-chip.explain { color: var(--vp-c-brand-1); }
.idemo-rtoggle { display: inline-flex; border: 1px solid var(--vp-c-divider); border-radius: 999px; overflow: hidden; margin-right: 4px; }
.idemo-rtoggle button { font: inherit; font-size: 12px; padding: 3px 11px; border: none; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.idemo-rtoggle button.on { background: var(--vp-c-brand-1); color: #fff; }
.insights-demo-stage { padding: 12px 16px; }
.insights-demo-summary, .insights-demo-explain, .insights-demo-warnings, .insights-demo-transcript { margin: 0 16px 12px; font-size: 13px; line-height: 1.5; color: var(--vp-c-text-2); }
.insights-demo-explain { color: var(--vp-c-text-1); }
.insights-demo-warnings ul { margin: 4px 0 0; padding-left: 18px; }
.idemo-turn { font-size: 12.5px; padding: 2px 0; }
.idemo-turn code { color: var(--vp-c-brand-1); }
/* a "did you mean / not sure" hint stands out from a successful tool result */
.idemo-turn.hint { color: #8a5a00; background: rgba(231, 177, 67, 0.16); border-left: 2px solid var(--mv-gold-bright, #e7b143); border-radius: 0 6px 6px 0; padding: 4px 10px; margin: 3px 0; }
.dark .idemo-turn.hint { color: #e7b143; background: rgba(231, 177, 67, 0.12); }
.idemo-turn.hint .idemo-turn-arw { font-weight: 600; }

/* chat-with-the-chart input */
.idemo-chat { margin: 0 16px 12px; }
.idemo-chat-row { display: flex; gap: 8px; }
.idemo-chat-row input { flex: 1; min-width: 0; font: inherit; font-size: 13px; padding: 7px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.idemo-chat-row input:focus { outline: none; border-color: var(--vp-c-brand-1); box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.idemo-chat-suggest { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: var(--vp-c-text-3); }
.idemo-chat-suggest button { font: inherit; font-size: 12px; padding: 3px 10px; border: 1px solid var(--vp-c-divider); border-radius: 999px; background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; }
.idemo-chat-suggest button:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.idemo-chat-warn { margin: 8px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--vp-c-text-3); }
/* chat engine: Instant / Real-model toggle + model picker */
.idemo-chat-engine { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
.idemo-modes { display: inline-flex; border: 1px solid var(--vp-c-divider); border-radius: 999px; overflow: hidden; }
.idemo-modes button { font: inherit; font-size: 12px; padding: 4px 12px; border: none; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.idemo-modes button.on { background: var(--vp-c-brand-1); color: #fff; }
.idemo-chat select { font: inherit; font-size: 12px; padding: 5px 28px 5px 10px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background-color: var(--vp-c-bg); color: var(--vp-c-text-1); cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 9px center; background-size: 11px; }
.idemo-chip.ready { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: #fff; }
.idemo-chip:disabled { opacity: 0.7; cursor: progress; }
/* AI glow: a calm pulse between Geneva crest-red and gold around the chat */
@keyframes ai-glow { 0%, 100% { box-shadow: 0 0 0 1px rgba(147, 31, 26, 0.16), 0 0 13px -4px rgba(147, 31, 26, 0.4); } 50% { box-shadow: 0 0 0 1px rgba(231, 177, 67, 0.34), 0 0 22px -2px rgba(231, 177, 67, 0.5); } }
.idemo-chat.ai-glow { padding: 13px; border: 1px solid var(--vp-c-divider); border-radius: 10px; animation: ai-glow 3.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .idemo-chat.ai-glow { animation: none; box-shadow: 0 0 14px -4px rgba(147, 31, 26, 0.4); } }

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

/* Semantic-search widget */
.idemo-search { padding: 14px 16px 8px; }
.idemo-search input { width: 100%; box-sizing: border-box; font: inherit; font-size: 14px; padding: 8px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.idemo-search input:focus { outline: none; border-color: var(--vp-c-brand-1); }
.idemo-ranked { list-style: none; margin: 4px 0 6px; padding: 0 16px; }
.idemo-ranked li { display: grid; grid-template-columns: 1fr 90px 34px; align-items: center; gap: 10px; padding: 5px 0; font-size: 13px; border-top: 1px solid var(--vp-c-divider); }
.idemo-ranked li.dim { opacity: 0.5; }
.idemo-rank-label { color: var(--vp-c-text-1); }
.idemo-rank-bar { height: 6px; border-radius: 3px; background: var(--vp-c-bg); overflow: hidden; }
.idemo-rank-bar i { display: block; height: 100%; min-width: 1px; background: var(--vp-c-brand-1); transition: width 0.18s ease; }
.idemo-rank-score { font-family: var(--vp-font-family-mono); font-size: 11.5px; color: var(--vp-c-text-3); text-align: right; }
</style>
