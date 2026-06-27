<script setup lang="ts">
// Embeddings lab: ONE set of vectors, shown several ways so semantic search reads as
// a capability, not a single scatter. Model-free by default (deterministic hash, instant,
// lexical). "Load BERT" lazily pulls MiniLM from a CDN at click-time (zero bundle cost)
// for TRUE semantics (income ~ revenue); on failure it falls back to the hash path.
// All charts render on canvas. Client-only (dynamic import) so SSR never touches the engine.
import { ref, onMounted, onBeforeUnmount } from "vue";

const BLUE = "#2563eb", GREEN = "#16a34a", GOLD = "#d97706", GREY = "#9aa4b2";
const MATCH = 0.18; // similarity below this reads as "no real match" (faded)
const LABELS = [
  "Quarterly revenue", "Sales pipeline", "Net income", "Gross margin",
  "Customer churn", "Refund rate", "Support tickets",
  "Active users", "New signups", "Website traffic", "Ad clicks", "Marketing spend",
];
// two semantic axes for the map, + the radar's concept axes (each an anchor phrase)
const X_ANCHOR = "revenue income sales money finance margin profit";
const Y_ANCHOR = "users customers people audience signups traffic visitors";
const AXES = ["Revenue", "Users", "Cost", "Growth", "Risk"];
const AXIS_ANCHORS = [
  "revenue income sales money profit margin",
  "users customers people audience visitors",
  "cost spend expense budget marketing",
  "growth increase signups expansion acquisition",
  "risk churn refund loss tickets complaint",
];

const query = ref("revenue");
const view = ref<"rank" | "map" | "fingerprint">("rank");
const backend = ref<"hash" | "bert">("hash");
const modelStatus = ref<"" | "loading" | "ready" | "error">("");
const modelPct = ref(0);
const modelErr = ref("");
const ranked = ref<Array<{ label: string; score: number }>>([]);
const host = ref<HTMLDivElement>();

/* eslint-disable @typescript-eslint/no-explicit-any */
let lib: any = null;       // { mount*, hashEmbed, cosineSimilarity }
let extractor: any = null; // CDN MiniLM pipeline (when loaded)
let chart: any = null;
let labelVecs: number[][] = [];
/* eslint-enable @typescript-eslint/no-explicit-any */
let ro: ResizeObserver | null = null;
let raf = 0;
const width = () => Math.max(280, host.value?.clientWidth ?? 600);

async function embed(texts: string[]): Promise<number[][]> {
  if (backend.value === "bert" && extractor) {
    const out: number[][] = [];
    for (const t of texts) {
      const r = await extractor(t, { pooling: "mean", normalize: true });
      out.push(Array.from(r.data) as number[]);
    }
    return out;
  }
  return texts.map((t) => lib.hashEmbed(t, 128));
}

function clusterColor(x: number, y: number): string {
  if (x < 0.02 && y < 0.02) return GREY;
  return x >= y ? BLUE : GREEN;
}

async function recompute() {
  if (!lib || !host.value) return;
  const cos = lib.cosineSimilarity;
  labelVecs = await embed(LABELS);
  const [qVec] = await embed([query.value]);
  const scores = LABELS.map((_, i) => cos(qVec, labelVecs[i]));
  ranked.value = LABELS.map((label, i) => ({ label, score: scores[i] })).sort((a, b) => b.score - a.score);

  chart?.destroy();
  const w = width();
  if (view.value === "rank") {
    const ds = ranked.value.map((r) => ({
      label: r.label,
      valueBased: Math.round(r.score * 100),
      valueCompared: 0,
      color: r.score >= MATCH ? BLUE : GREY,
    }));
    chart = lib.mountComparableHorizontalBarChart(host.value, { dataSet: ds, renderer: "canvas", width: w, height: 360 });
  } else if (view.value === "map") {
    const [xa, ya] = await embed([X_ANCHOR, Y_ANCHOR]);
    const ds = LABELS.map((label, i) => {
      const x = cos(labelVecs[i], xa), y = cos(labelVecs[i], ya);
      return { label, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, d: Math.round(6 + scores[i] * 40), color: clusterColor(x, y) };
    });
    chart = lib.mountScatterChart(host.value, { xAxisDataType: "number", renderer: "canvas", sizeRange: [5, 28], width: w, height: 360, dataSet: ds });
  } else {
    const axisVecs = await embed(AXIS_ANCHORS);
    const top = ranked.value.slice(0, 3);
    const colors = [BLUE, GOLD, GREEN];
    const series = top.map((t, i) => {
      const v = labelVecs[LABELS.indexOf(t.label)];
      return { label: t.label, color: colors[i], values: axisVecs.map((av) => Math.round(cos(v, av) * 100)) };
    });
    chart = lib.mountRadarChart(host.value, { axes: AXES, maxValue: 100, fillOpacity: 0.16, renderer: "canvas", width: w, height: 360, series });
  }
}

async function loadBert() {
  if (modelStatus.value === "loading" || modelStatus.value === "ready") return;
  modelStatus.value = "loading";
  modelErr.value = "";
  try {
    // Lazy, click-time CDN import - nothing is bundled or downloaded until you ask.
    const mod: any = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3");
    mod.env.allowLocalModels = false;
    extractor = await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (p: any) => { if (p.status === "progress" && p.progress) modelPct.value = Math.round(p.progress); },
    });
    backend.value = "bert";
    modelStatus.value = "ready";
    await recompute();
  } catch (e) {
    modelStatus.value = "error";
    modelErr.value = e instanceof Error ? e.message : String(e);
  }
}

function setView(v: "rank" | "map" | "fingerprint") { view.value = v; recompute(); }

onMounted(async () => {
  const [core, ins] = await Promise.all([import("@michi-vz/core"), import("@michi-vz/insights")]);
  lib = {
    mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart,
    mountScatterChart: core.mountScatterChart,
    mountRadarChart: core.mountRadarChart,
    hashEmbed: ins.hashEmbed,
    cosineSimilarity: ins.cosineSimilarity,
  };
  await recompute();
  ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => recompute()); });
  if (host.value) ro.observe(host.value);
});
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); chart?.destroy(); });
</script>

<template>
  <div class="elab">
    <div class="elab-bar">
      <div class="elab-views">
        <button :class="{ on: view === 'rank' }" @click="setView('rank')">Ranking</button>
        <button :class="{ on: view === 'map' }" @click="setView('map')">Semantic map</button>
        <button :class="{ on: view === 'fingerprint' }" @click="setView('fingerprint')">Fingerprint</button>
      </div>
      <button class="elab-bert" :class="{ ready: modelStatus === 'ready' }" @click="loadBert" :disabled="modelStatus === 'loading'">
        <span v-if="modelStatus === ''">⚡ Load real BERT</span>
        <span v-else-if="modelStatus === 'loading'">Loading MiniLM… {{ modelPct }}%</span>
        <span v-else-if="modelStatus === 'ready'">✓ BERT (MiniLM)</span>
        <span v-else>⚠ model unavailable</span>
      </button>
    </div>

    <div class="elab-search">
      <input v-model="query" @input="recompute" type="text" placeholder="Type a term: revenue, customers, cost, growth…" aria-label="query" />
    </div>

    <div class="elab-stage" ref="host"></div>

    <p class="elab-cap">
      <span v-if="view === 'rank'"><strong>Ranking</strong> — bar length = similarity of each label to your query.</span>
      <span v-else-if="view === 'map'"><strong>Semantic map</strong> — x = finance-ness, y = people-ness; dots cluster by meaning, size = match to your query.</span>
      <span v-else><strong>Fingerprint</strong> — the top 3 matches scored across five concept axes (their "shape of meaning").</span>
    </p>

    <p class="elab-legend">
      <span class="dot bold"></span><strong>Bold</strong> = a real match to your query&nbsp;·&nbsp;
      <span class="dot fade"></span><span class="fade-text">faded</span> = weak or no match.
      <span v-if="backend === 'hash'">Model-free matches <em>spelling</em> (so "customers" finds "Customer churn"); load BERT and <em>meaning</em> matches too (income ≈ revenue).</span>
      <span v-else>Now semantic: matched by <em>meaning</em>, not spelling.</span>
    </p>

    <ul class="elab-ranked">
      <li v-for="(r, i) in ranked" :key="i" :class="{ dim: r.score < MATCH }">
        <span class="elab-rank-label">{{ r.label }}</span>
        <span class="elab-rank-bar"><i :style="{ width: Math.round(r.score * 100) + '%' }"></i></span>
        <span class="elab-rank-score">{{ r.score.toFixed(2) }}</span>
      </li>
    </ul>
    <p v-if="modelStatus === 'error'" class="elab-err">⚠ Couldn't load the model ({{ modelErr }}). Still fully usable model-free.</p>
  </div>
</template>

<style scoped>
.elab { border: 1px solid var(--vp-c-divider); border-radius: 8px; margin: 18px 0; background: var(--vp-c-bg-soft); overflow: hidden; }
.elab-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
.elab-views { display: inline-flex; border: 1px solid var(--vp-c-divider); border-radius: 999px; overflow: hidden; }
.elab-views button { font: inherit; font-size: 12.5px; padding: 4px 12px; border: none; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.elab-views button.on { background: var(--vp-c-brand-1); color: #fff; }
.elab-bert { font: inherit; font-size: 12.5px; padding: 4px 12px; border: 1px solid var(--vp-c-brand-1); border-radius: 999px; background: var(--vp-c-bg-soft); color: var(--vp-c-brand-1); cursor: pointer; }
.elab-bert.ready { background: var(--vp-c-brand-1); color: #fff; }
.elab-bert:disabled { opacity: 0.7; cursor: progress; }
.elab-search { padding: 12px 16px 6px; }
.elab-search input { width: 100%; box-sizing: border-box; font: inherit; font-size: 14px; padding: 8px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.elab-search input:focus { outline: none; border-color: var(--vp-c-brand-1); }
.elab-stage { padding: 8px 16px 0; }
.elab-cap, .elab-legend { margin: 6px 16px; font-size: 13px; line-height: 1.55; color: var(--vp-c-text-2); }
.elab-legend .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; vertical-align: middle; margin-right: 4px; }
.elab-legend .dot.bold { background: var(--vp-c-brand-1); }
.elab-legend .dot.fade { background: var(--vp-c-text-3); opacity: 0.4; }
.elab-legend .fade-text { opacity: 0.5; }
.elab-ranked { list-style: none; margin: 6px 0 10px; padding: 0 16px; }
.elab-ranked li { display: grid; grid-template-columns: 1fr 90px 34px; align-items: center; gap: 10px; padding: 4px 0; font-size: 13px; border-top: 1px solid var(--vp-c-divider); font-weight: 600; }
.elab-ranked li.dim { opacity: 0.45; font-weight: 400; }
.elab-rank-bar { height: 6px; border-radius: 3px; background: var(--vp-c-bg); overflow: hidden; }
.elab-rank-bar i { display: block; height: 100%; min-width: 1px; background: var(--vp-c-brand-1); transition: width 0.18s ease; }
.elab-rank-score { font-family: var(--vp-font-family-mono); font-size: 11.5px; color: var(--vp-c-text-3); text-align: right; }
.elab-err { margin: 0 16px 12px; font-size: 12.5px; color: var(--vp-c-text-3); }
</style>
