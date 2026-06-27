<script setup lang="ts">
// Reconcile messy labels: the same entity arrives spelled many ways across data
// sources ("United States" / "united states" / "USA"), so a chart splits it into
// several bars with WRONG totals. Embeddings group labels by meaning and merge them.
// Model-free (hash, char n-grams) fixes spelling/case/typos offline; "Load BERT"
// adds true synonyms/abbreviations/translations (USA ≈ United States, Deutschland ≈
// Germany). Bars render on canvas. Client-only (dynamic import) so SSR is untouched.
import { ref, onMounted, onBeforeUnmount } from "vue";

const PALETTE = ["#2563eb", "#16a34a", "#d97706", "#8e5aa8", "#dc2626", "#0891b2"];
const GREY = "#9aa4b2";
// Raw rows as three sources might report them. Same 3 countries, 10 spellings.
const RAW = [
  { label: "United States", value: 22 },
  { label: "United  States", value: 18 },
  { label: "united states", value: 15 },
  { label: "USA", value: 25 },
  { label: "Germany", value: 17 },
  { label: "germany", value: 12 },
  { label: "Deutschland", value: 14 },
  { label: "Japan", value: 19 },
  { label: "japan", value: 11 },
  { label: "Nippon", value: 13 },
];

const mode = ref<"raw" | "reconciled">("raw");
const backend = ref<"hash" | "bert">("hash");
const modelStatus = ref<"" | "loading" | "ready" | "error">("");
const modelPct = ref(0);
const modelErr = ref("");
const groups = ref<Array<{ name: string; total: number; members: string[] }>>([]);
const host = ref<HTMLDivElement>();

/* eslint-disable @typescript-eslint/no-explicit-any */
let lib: any = null;
let extractor: any = null;
let chart: any = null;
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

async function reconcile() {
  const cos = lib.cosineSimilarity;
  const vecs = await embed(RAW.map((r) => r.label));
  const th = backend.value === "bert" ? 0.45 : 0.6;
  const cl: Array<{ name: string; vec: number[]; total: number; members: string[] }> = [];
  RAW.forEach((row, i) => {
    let best = null as null | (typeof cl)[number];
    let bestSim = 0;
    for (const c of cl) {
      const s = cos(vecs[i], c.vec);
      if (s > bestSim) { bestSim = s; best = c; }
    }
    if (best && bestSim >= th) {
      best.total += row.value;
      best.members.push(row.label);
      // prefer the tidiest representative: Title Case, no extra spaces
      if (/^[A-Z][a-z]/.test(row.label) && !/\s{2,}/.test(row.label) && row.label.length >= best.name.length) best.name = row.label;
    } else {
      cl.push({ name: row.label, vec: vecs[i], total: row.value, members: [row.label] });
    }
  });
  groups.value = cl.map(({ name, total, members }) => ({ name, total, members })).sort((a, b) => b.total - a.total);
}

function render() {
  if (!lib || !host.value) return;
  chart?.destroy();
  const w = width();
  const ds = mode.value === "raw"
    ? RAW.map((r) => ({ label: r.label, valueBased: r.value, valueCompared: 0, color: GREY }))
    : groups.value.map((g, i) => ({ label: g.name, valueBased: g.total, valueCompared: 0, color: PALETTE[i % PALETTE.length] }));
  const h = 40 + ds.length * 30;
  chart = lib.mountComparableHorizontalBarChart(host.value, { dataSet: ds, renderer: "canvas", width: w, height: h });
}

async function refresh() { if (mode.value === "reconciled") await reconcile(); render(); }
function setMode(m: "raw" | "reconciled") { mode.value = m; refresh(); }

async function loadBert() {
  if (modelStatus.value === "loading" || modelStatus.value === "ready") return;
  modelStatus.value = "loading"; modelErr.value = "";
  try {
    const mod: any = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3");
    mod.env.allowLocalModels = false;
    extractor = await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (p: any) => { if (p.status === "progress" && p.progress) modelPct.value = Math.round(p.progress); },
    });
    backend.value = "bert";
    modelStatus.value = "ready";
    mode.value = "reconciled";
    await refresh();
  } catch (e) {
    modelStatus.value = "error";
    modelErr.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(async () => {
  const [core, ins] = await Promise.all([import("@michi-vz/core"), import("@michi-vz/insights")]);
  lib = { mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart, hashEmbed: ins.hashEmbed, cosineSimilarity: ins.cosineSimilarity };
  await refresh();
  ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => render()); });
  if (host.value) ro.observe(host.value);
});
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); chart?.destroy(); });
</script>

<template>
  <div class="elab">
    <div class="elab-bar">
      <div class="elab-views">
        <button :class="{ on: mode === 'raw' }" @click="setMode('raw')">Raw labels</button>
        <button :class="{ on: mode === 'reconciled' }" @click="setMode('reconciled')">Reconcile ✦</button>
      </div>
      <button class="elab-bert" :class="{ ready: modelStatus === 'ready' }" @click="loadBert" :disabled="modelStatus === 'loading'">
        <span v-if="modelStatus === ''">⚡ Load real BERT</span>
        <span v-else-if="modelStatus === 'loading'">Loading MiniLM… {{ modelPct }}%</span>
        <span v-else-if="modelStatus === 'ready'">✓ BERT (MiniLM)</span>
        <span v-else>⚠ model unavailable</span>
      </button>
    </div>

    <p class="elab-scenario">
      Three countries reported sales, but three data sources spelled them
      <strong>10 different ways</strong>. Charted raw, each spelling is its own bar - so the totals are
      <strong>wrong and split</strong>. Hit <strong>Reconcile</strong> to group labels that <em>mean</em> the same.
    </p>

    <p class="elab-result">
      <strong>{{ RAW.length }}</strong> raw labels
      <template v-if="mode === 'reconciled'">→ <strong class="elab-hit">{{ groups.length }}</strong> real groups
        ({{ backend === "bert" ? "with BERT - synonyms merged" : "fuzzy - spelling/case/typos merged" }})</template>
      <template v-else>— messy, duplicated, wrong totals</template>
    </p>

    <div class="elab-stage" ref="host"></div>

    <p class="elab-cap" v-if="mode === 'reconciled'">
      <span v-for="(g, i) in groups" :key="i" class="elab-group">
        <b :style="{ color: PALETTE[i % PALETTE.length] }">{{ g.name }}</b>
        <span class="elab-mem">← {{ g.members.join(", ") }}</span>
      </span>
    </p>
    <p class="elab-legend">
      <span v-if="backend === 'hash'">Model-free merges <em>spelling</em> (case, spaces, typos) offline - but
        <code>USA</code>, <code>Deutschland</code>, <code>Nippon</code> stay split (no shared letters).
        <strong>Load BERT</strong> to merge those by <em>meaning</em>.</span>
      <span v-else>BERT merged the abbreviations and translations too - 10 messy labels collapse to the 3 real countries.</span>
    </p>
    <p v-if="modelStatus === 'error'" class="elab-err">⚠ Couldn't load the model ({{ modelErr }}). Fuzzy reconcile still works offline.</p>
  </div>
</template>

<style scoped>
.elab { border: 1px solid var(--vp-c-divider); border-radius: 8px; margin: 18px 0; background: var(--vp-c-bg-soft); overflow: hidden; }
.elab-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
.elab-views { display: inline-flex; border: 1px solid var(--vp-c-divider); border-radius: 999px; overflow: hidden; }
.elab-views button { font: inherit; font-size: 12.5px; padding: 4px 13px; border: none; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.elab-views button.on { background: var(--vp-c-brand-1); color: #fff; }
.elab-bert { font: inherit; font-size: 12.5px; padding: 4px 12px; border: 1px solid var(--vp-c-brand-1); border-radius: 999px; background: var(--vp-c-bg-soft); color: var(--vp-c-brand-1); cursor: pointer; }
.elab-bert.ready { background: var(--vp-c-brand-1); color: #fff; }
.elab-bert:disabled { opacity: 0.7; cursor: progress; }
.elab-scenario { margin: 12px 16px 4px; font-size: 13px; line-height: 1.55; color: var(--vp-c-text-2); }
.elab-result { margin: 4px 16px 0; font-size: 13.5px; color: var(--vp-c-text-2); }
.elab-hit { color: var(--vp-c-brand-1); }
.elab-stage { padding: 8px 16px 0; }
.elab-cap, .elab-legend { margin: 6px 16px; font-size: 12.5px; line-height: 1.6; color: var(--vp-c-text-2); }
.elab-group { display: inline-block; margin-right: 14px; white-space: nowrap; }
.elab-mem { color: var(--vp-c-text-3); margin-left: 3px; }
.elab-legend code { font-size: 11.5px; }
.elab-err { margin: 0 16px 12px; font-size: 12.5px; color: var(--vp-c-text-3); }
</style>
