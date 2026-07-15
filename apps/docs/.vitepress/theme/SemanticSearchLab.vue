<script setup lang="ts">
// FIND (3 of 4). Semantic search over a dashboard's series. Type what you want in plain
// English ("money coming in") and embeddings rank the KPIs by MEANING, not keyword - so a
// query with no shared letters still finds the right series. Model-free matches on words
// (good for "customer"); BERT matches on meaning (needed for "money coming in" → Revenue).
// Shares the MiniLM model with the other labs (useEmbedder). Bars render on canvas.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useEmbedder } from "./useEmbedder";
import EmbedPicker from "./EmbedPicker.vue";

const BRAND = "#931f1a"; // Geneva crest red (matches the lab accent)
const GREY = "#cbd2da";
// A small dashboard's KPIs - the "series" you'd search across.
const SERIES = [
  "Revenue",
  "Operating costs",
  "New customers",
  "Customer churn",
  "Website traffic",
  "Support tickets",
  "Headcount",
  "Marketing spend",
];
// Chips: the first matches by WORDS (works offline); the rest need MEANING (load BERT).
const CHIPS = ["customer", "money coming in", "people leaving us", "how many staff", "cost of ads"];

const { embed, ensureLib, loadedModel } = useEmbedder();
// reactive ref so backend updates once the model finishes downloading
const backend = computed<"hash" | "bert">(() => (loadedModel.value ? "bert" : "hash"));
const query = ref("customer");
const ranked = ref<Array<{ label: string; score: number }>>([]);
const host = ref<HTMLDivElement>();

/* eslint-disable @typescript-eslint/no-explicit-any */
let lib: any = null;
let chart: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */
let labelVecs: number[][] | null = null;
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
const top = computed(() => ranked.value[0] ?? null);

// Cache the series vectors per backend (recompute only when the backend changes).
let cachedFor: "hash" | "bert" | null = null;
async function seriesVecs(): Promise<number[][]> {
  if (!labelVecs || cachedFor !== backend.value) {
    labelVecs = await embed(SERIES, backend.value);
    cachedFor = backend.value;
  }
  return labelVecs;
}

async function search() {
  const cos = lib.cosineSimilarity;
  const [q] = await embed([query.value || " "], backend.value);
  const vecs = await seriesVecs();
  ranked.value = SERIES.map((label, i) => ({ label, score: cos(q, vecs[i]) })).sort(
    (a, b) => b.score - a.score,
  );
  render();
}

function render() {
  if (!lib || !host.value || !ranked.value.length) return;
  chart?.destroy();
  const w = width();
  const ds = ranked.value.map((r, i) => ({
    label: r.label,
    valueBased: Math.max(0, Math.round(r.score * 100)),
    valueCompared: 0,
    color: i === 0 ? BRAND : GREY,
  }));
  const margin = { top: 12, right: 36, bottom: 30, left: 156 };
  const h = margin.top + margin.bottom + ds.length * 30;
  chart = lib.mountComparableHorizontalBarChart(host.value, {
    dataSet: ds,
    renderer: "canvas",
    width: w,
    height: h,
    margin,
  });
}

function pick(c: string) {
  query.value = c;
  search();
}
async function onLoaded() {
  labelVecs = null;
  await search();
}

onMounted(async () => {
  const { core, ins } = await ensureLib();
  lib = {
    mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart,
    cosineSimilarity: ins.cosineSimilarity,
  };
  await search();
  ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => render());
  });
  if (host.value) ro.observe(host.value);
});
onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
  chart?.destroy();
});
</script>

<template>
  <div class="elab">
    <div class="elab-bar">
      <div class="elab-search">
        <span class="elab-mag">⌕</span>
        <input
          v-model="query"
          @keyup.enter="search"
          placeholder="describe a metric…"
          aria-label="search query"
        />
        <button class="elab-go" @click="search">Search</button>
      </div>
      <EmbedPicker @loaded="onLoaded" />
    </div>

    <div class="elab-content">
      <p class="elab-scenario">
        A dashboard with <strong>8 KPIs</strong>. Don't remember the exact name? Ask in plain
        English - embeddings rank every series by what your words <em>mean</em>, then highlight the
        best match.
      </p>

      <div class="elab-chips">
        <button
          v-for="c in CHIPS"
          :key="c"
          class="elab-chip"
          :class="{ on: query === c }"
          @click="pick(c)"
        >
          {{ c }}
        </button>
      </div>

      <p class="elab-result" v-if="top">
        Best match: <strong class="elab-hit">{{ top.label }}</strong>
        <span class="elab-mem"
          >· {{ Math.round(top.score * 100) }}% similar · ranked by
          {{ backend === "bert" ? "meaning (BERT)" : "shared words (model-free)" }}</span
        >
      </p>

      <div class="elab-stage" ref="host"></div>

      <p class="elab-legend">
        <span v-if="backend === 'hash'"
          >Model-free ranks by <em>shared letters</em>, so <code>customer</code> finds the customer
          KPIs - but <code>money coming in</code> can't reach <code>Revenue</code> (no letters in
          common). <strong>Load a model</strong> (top-right) to search by <em>meaning</em>.</span
        >
        <span v-else
          >The model ranks by <em>meaning</em>: <code>money coming in</code> → Revenue,
          <code>people leaving us</code> → Customer churn, <code>cost of ads</code> → Marketing
          spend - none of which share a word with the match.</span
        >
      </p>
    </div>
  </div>
</template>
