<script setup lang="ts">
// SORT (3 of 3). Zero-shot categorize: a pile of free-text comments with no tags. Give embeddings
// just the theme NAMES (no keyword rules) and each comment drops into its nearest theme by meaning.
//   - "⚡ Instant" (default): the sorted result, precomputed - shown immediately, no download.
//   - "🔬 Real model": download MiniLM (~23 MB) and run the embedding match live in the browser.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useEmbedder } from "./useEmbedder";
import EmbedPicker from "./EmbedPicker.vue";

const PALETTE = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#8e5aa8"];
const GREY = "#9aa4b2";
const THEMES = ["Bugs & crashes", "Performance", "Pricing", "Design & UX", "Customer support"];
const COMMENTS = [
  "the app crashes every morning",
  "it crashed and I lost my work",
  "keeps freezing when I upload a file",
  "so slow to load anything",
  "it lags badly on big spreadsheets",
  "far too expensive for what it does",
  "the subscription price went up again",
  "love the clean new look",
  "the buttons are hard to find",
  "nobody answered my email for days",
  "great help from the support team",
  "billing charged me twice",
];
// The theme a strong model assigns each comment - precomputed for the instant preview.
const PREVIEW_IDX = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 2];

const { embed, ensureLib, loadedModel } = useEmbedder();
// reactive ref so backend updates once the model finishes downloading
const backend = computed<"hash" | "bert">(() => (loadedModel.value ? "bert" : "hash"));
const preview = ref(true);
const tagged = ref<Array<{ text: string; theme: string; themeIdx: number }>>([]);
const host = ref<HTMLDivElement>();

/* eslint-disable @typescript-eslint/no-explicit-any */
let lib: any = null;
let chart: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */
let ro: ResizeObserver | null = null;
let raf = 0;
// clientWidth INCLUDES padding, so subtract the host's horizontal padding, else the canvas
// renders wider than its container and overflows (clips the last axis label).
const width = () => {
  const el = host.value;
  if (!el) return 600;
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
};

// Counts per theme (kept in THEMES order so colours stay stable across runs).
const counts = computed(() => {
  const m = new Map<string, number>(THEMES.map((t) => [t, 0]));
  for (const t of tagged.value) m.set(t.theme, (m.get(t.theme) ?? 0) + 1);
  return THEMES.map((t) => ({ theme: t, n: m.get(t) ?? 0 }));
});
// Sorted view (preview, or real model loaded) vs the honest "untagged pile" (real + no model yet).
const sorted = computed(() => preview.value || backend.value === "bert");

async function categorize() {
  if (preview.value) {
    tagged.value = COMMENTS.map((text, i) => ({ text, theme: THEMES[PREVIEW_IDX[i]], themeIdx: PREVIEW_IDX[i] }));
    render();
    return;
  }
  if (backend.value === "hash") {
    tagged.value = COMMENTS.map((text) => ({ text, theme: "", themeIdx: -1 }));
    render();
    return;
  }
  const cos = lib.cosineSimilarity;
  const themeVecs = await embed(THEMES, "bert");
  const cVecs = await embed(COMMENTS, "bert");
  tagged.value = COMMENTS.map((text, i) => {
    let bi = 0;
    let bs = -Infinity;
    for (let t = 0; t < THEMES.length; t++) {
      const s = cos(cVecs[i], themeVecs[t]);
      if (s > bs) { bs = s; bi = t; }
    }
    return { text, theme: THEMES[bi], themeIdx: bi };
  });
  render();
}

function render() {
  if (!lib || !host.value) return;
  chart?.destroy();
  const w = width();
  const ds = sorted.value
    ? counts.value.map((c, i) => ({ label: c.theme, valueBased: c.n, valueCompared: 0, color: PALETTE[i % PALETTE.length] }))
    : [{ label: "Uncategorized", valueBased: COMMENTS.length, valueCompared: 0, color: GREY }];
  const margin = { top: 12, right: 28, bottom: 30, left: 190 };
  const h = margin.top + margin.bottom + Math.max(ds.length, 5) * 30;
  chart = lib.mountComparableHorizontalBarChart(host.value, { dataSet: ds, renderer: "canvas", width: w, height: h, margin });
}

async function setPreview(v: boolean) {
  if (preview.value === v) return;
  preview.value = v;
  await categorize();
}
async function onLoaded() { await categorize(); }

onMounted(async () => {
  const { core, ins } = await ensureLib();
  lib = { mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart, cosineSimilarity: ins.cosineSimilarity };
  await categorize();
  ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => render()); });
  if (host.value) ro.observe(host.value);
});
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); chart?.destroy(); });
</script>

<template>
  <div class="elab">
    <div class="elab-bar">
      <div class="elab-themes">
        <span class="elab-themes-lbl">Themes:</span>
        <span v-for="(t, i) in THEMES" :key="t" class="elab-theme" :style="{ color: PALETTE[i % PALETTE.length] }">{{ t }}</span>
      </div>
      <div class="elab-ctrls">
        <div class="elab-modes" role="group" aria-label="Result mode">
          <button :class="{ on: preview }" @click="setPreview(true)"
            title="Instant: the result a model would produce, precomputed - shown immediately, no download.">⚡ Instant</button>
          <button :class="{ on: !preview }" @click="setPreview(false)"
            title="Real model: download MiniLM (~23 MB) and run the embedding match live in your browser (WebGPU); nothing is sent to a server.">Real model</button>
        </div>
        <EmbedPicker v-if="!preview" @loaded="onLoaded" />
      </div>
    </div>

    <div class="elab-content">
    <p class="elab-scenario">
      <strong>{{ COMMENTS.length }}</strong> raw comments, no tags. Give embeddings just the
      <strong>theme names</strong> (no keyword rules) and each comment drops into its nearest theme - so
      unstructured text becomes a chart you can act on.
    </p>

    <p class="elab-result">
      <template v-if="sorted"><strong>{{ COMMENTS.length }}</strong> comments → sorted into
        <strong class="elab-hit">{{ THEMES.length }}</strong> themes by meaning{{ preview ? " (instant preview)" : "" }}</template>
      <template v-else><strong>{{ COMMENTS.length }}</strong> comments — <strong>one untagged pile</strong>;
        load a model to sort them</template>
    </p>

    <div class="elab-stage" ref="host"></div>

    <p class="elab-pills">
      <span v-for="(t, i) in tagged" :key="i" class="elab-pill"
        :style="{ borderColor: t.themeIdx < 0 ? GREY : PALETTE[t.themeIdx % PALETTE.length], color: t.themeIdx < 0 ? 'var(--vp-c-text-3)' : PALETTE[t.themeIdx % PALETTE.length] }">
        {{ t.text }}
      </span>
    </p>
    <p class="elab-legend">
      <span v-if="sorted">Each comment dropped into its nearest theme <em>by meaning</em> - even
        <code>keeps freezing</code> → Performance and <code>too expensive</code> → Pricing, which share no
        letters with their theme.<template v-if="preview"> <strong>Shown instantly</strong>; switch to
        <strong>Real model</strong> to download MiniLM (~23 MB) and run it.</template></span>
      <span v-else>Sorting by <em>meaning</em> needs a model - model-free cannot tell <code>keeps freezing</code>
        is a Performance issue (no shared letters), so all {{ COMMENTS.length }} stay one untagged pile.
        <strong>Load a model</strong> (top-right) to drop each comment into its theme.</span>
    </p>
    </div>
  </div>
</template>
