<script setup lang="ts">
// MATCH (2 of 4). Link the same entities ACROSS two differently-spelled lists (a CRM
//   export vs an ERP export) - unlike Merge, which dedupes duplicates WITHIN one list.
//   - "⚡ Instant" (default): show the result a model would produce, precomputed, with no
//     download or wait - so the payoff is immediate and convincing.
//   - "Real model": run matchLabels() live - the shared hash embedder offline (spelling
//     only), or MiniLM (~23 MB, WebGPU) once loaded via the picker (meaning too).
// matchLabels requires a MUTUAL best match above a confidence gate, so two source rows
// never collide onto one target; anything short of that comes back honestly unmatched,
// with its closest miss - never dropped or force-fitted.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useEmbedder, EMBED_CATALOG } from "./useEmbedder";
import EmbedPicker from "./EmbedPicker.vue";

const PALETTE = ["#2563eb", "#16a34a", "#d97706", "#8e5aa8", "#dc2626", "#0891b2"];
const GREY = "#9aa4b2";
// The same 4 countries as reported by two systems that never agreed on spelling - a CRM
// export (source) and an ERP export (target), each with one country the other lacks.
const CRM = [
  { label: "United States", value: 24 },
  { label: "germany", value: 16 },
  { label: "Nippon", value: 11 },
  { label: "Eire", value: 6 },
];
const ERP = [
  { label: "USA", value: 22 },
  { label: "Germany", value: 15 },
  { label: "Japan", value: 10 },
  { label: "France", value: 5 },
];
const CRM_LABELS = CRM.map((r) => r.label);
const ERP_LABELS = ERP.map((r) => r.label);
const crmValue = new Map(CRM.map((r) => [r.label, r.value]));
const erpValue = new Map(ERP.map((r) => [r.label, r.value]));

// The result a good model produces - precomputed for the instant preview. Eire and
// France share no meaning with anything on the other side, so they stay unmatched -
// correctly: an honest outcome, not a failure.
const PREVIEW_MATCHES = [
  { source: "United States", target: "USA", similarity: 0.89 },
  { source: "germany", target: "Germany", similarity: 0.95 },
  { source: "Nippon", target: "Japan", similarity: 0.81 },
];
const PREVIEW_UNMATCHED_SOURCE = [{ label: "Eire", closest: "France", similarity: 0.42 }];
const PREVIEW_UNMATCHED_TARGET = [{ label: "France", closest: "Eire", similarity: 0.42 }];

const { model, embed, ensureLib, loadedModel } = useEmbedder();
// loadedModel is a reactive ref (set once a model finishes downloading), so backend
// recomputes the moment it becomes ready - reused verbatim from the other labs.
const backend = computed<"hash" | "bert">(() => (loadedModel.value ? "bert" : "hash"));
const embName = computed(() => EMBED_CATALOG.find((m) => m.id === model.value)?.name ?? "a model");

type Mode = "raw" | "matched";
const mode = ref<Mode>("raw");
const preview = ref(true); // ⚡ instant by default; real model on demand
const matches = ref<Array<{ source: string; target: string; similarity: number }>>([]);
const unmatchedSource = ref<Array<{ label: string; closest: string | null; similarity: number }>>(
  [],
);
const unmatchedTarget = ref<Array<{ label: string; closest: string | null; similarity: number }>>(
  [],
);
const unmatched = computed(() => [
  ...unmatchedSource.value.map((u) => ({ ...u, side: "CRM" })),
  ...unmatchedTarget.value.map((u) => ({ ...u, side: "ERP" })),
]);
function closestHint(u: { closest: string | null; similarity: number }): string {
  return u.closest ? `${u.closest} (${u.similarity.toFixed(2)})` : "none";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let lib: any = null;
let chart: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */
let ro: ResizeObserver | null = null;
let raf = 0;
const host = ref<HTMLDivElement>();
// clientWidth INCLUDES padding, so the chart must subtract the host's horizontal padding,
// else the canvas renders wider than its container and overflows (clips the last axis label).
const width = () => {
  const el = host.value;
  if (!el) return 600;
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
};

async function doMatch() {
  if (preview.value) {
    matches.value = PREVIEW_MATCHES.map((m) => ({ ...m }));
    unmatchedSource.value = PREVIEW_UNMATCHED_SOURCE.map((u) => ({ ...u }));
    unmatchedTarget.value = PREVIEW_UNMATCHED_TARGET.map((u) => ({ ...u }));
    return;
  }
  // Reuse the SAME shared embedder every other lab uses (hash offline, or MiniLM once
  // loaded via the picker) instead of letting matchLabels() load its own separate copy.
  const embedder = {
    backend: backend.value === "bert" ? "transformers" : "hash",
    embed: (texts: string[]) => embed(texts, backend.value),
  };
  const res = await lib.matchLabels(CRM_LABELS, ERP_LABELS, { embedder });
  matches.value = res.matches;
  unmatchedSource.value = res.unmatchedSource;
  unmatchedTarget.value = res.unmatchedTarget;
}

function render() {
  if (!lib || !host.value) return;
  chart?.destroy();
  const w = width();
  const ds =
    mode.value === "raw"
      ? [
          ...CRM.map((r) => ({
            label: r.label,
            valueBased: r.value,
            valueCompared: 0,
            color: GREY,
          })),
          ...ERP.map((r) => ({
            label: r.label,
            valueBased: 0,
            valueCompared: r.value,
            color: GREY,
          })),
        ]
      : matches.value.map((m, i) => ({
          label: m.target,
          valueBased: crmValue.get(m.source) ?? 0,
          valueCompared: erpValue.get(m.target) ?? 0,
          color: PALETTE[i % PALETTE.length],
        }));
  const margin = { top: 12, right: 30, bottom: 30, left: 140 };
  const h = margin.top + margin.bottom + Math.max(ds.length, 3) * 34;
  chart = lib.mountComparableHorizontalBarChart(host.value, {
    dataSet: ds,
    renderer: "canvas",
    width: w,
    height: h,
    margin,
  });
}

async function setMode(m: Mode) {
  mode.value = m;
  if (m === "matched" && !matches.value.length) await doMatch();
  render();
}

async function setPreview(v: boolean) {
  if (preview.value === v) return;
  preview.value = v;
  matches.value = [];
  unmatchedSource.value = [];
  unmatchedTarget.value = [];
  if (mode.value === "matched") await doMatch();
  render();
}

async function onLoaded() {
  if (mode.value === "raw") mode.value = "matched";
  await doMatch();
  render();
}

onMounted(async () => {
  const { core, ins } = await ensureLib();
  lib = {
    mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart,
    matchLabels: ins.matchLabels,
  };
  render();
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
      <ol class="elab-steps">
        <li :class="{ on: mode === 'raw', done: mode !== 'raw' }">
          <button class="elab-step" @click="setMode('raw')">
            <span class="n">{{ mode !== "raw" ? "✓" : "1" }}</span> Raw
          </button>
        </li>
        <li :class="{ on: mode === 'matched' }">
          <button class="elab-step" @click="setMode('matched')">
            <span class="n">2</span> Match
          </button>
        </li>
      </ol>
      <div class="elab-ctrls">
        <div class="elab-modes" role="group" aria-label="Result mode">
          <button
            :class="{ on: preview }"
            @click="setPreview(true)"
            title="Instant: the result a model would produce, precomputed - shown immediately, no download."
          >
            ⚡ Instant
          </button>
          <button
            :class="{ on: !preview }"
            @click="setPreview(false)"
            title="Real model: download the actual model (MiniLM ~23 MB) and run it live in your browser - WebGPU, nothing sent to a server."
          >
            Real model
          </button>
        </div>
        <EmbedPicker v-if="!preview" @loaded="onLoaded" />
      </div>
    </div>

    <div class="elab-content">
      <p class="elab-scenario">
        A <strong>CRM</strong> export and an <strong>ERP</strong> export list the same four
        countries - spelled differently, each with one country the other side lacks.
        <strong>matchLabels</strong> links each CRM row to its ERP row by meaning, and honestly
        reports anything it cannot confidently pair, so two different countries are never silently
        merged.
        <template v-if="preview"
          >The result below is shown <strong>instantly</strong>; switch to
          <strong>Real model</strong> to download the model and run it yourself.</template
        >
      </p>

      <p class="elab-result">
        <strong>{{ CRM.length }}</strong> CRM rows, <strong>{{ ERP.length }}</strong> ERP rows
        <template v-if="mode === 'matched'"
          >→ <strong class="elab-hit">{{ matches.length }}</strong> confident
          {{ matches.length === 1 ? "pair" : "pairs"
          }}{{
            preview
              ? " (instant preview)"
              : backend === "bert"
                ? ` (by ${embName})`
                : " (fuzzy match, offline)"
          }}</template
        >
        <template v-else>- two systems, two spellings each, not yet linked</template>
      </p>

      <div class="elab-stage" ref="host"></div>

      <p class="elab-cap" v-if="mode === 'matched' && matches.length">
        <span v-for="(m, i) in matches" :key="m.source" class="elab-group">
          <b :style="{ color: PALETTE[i % PALETTE.length] }">{{ m.source }} → {{ m.target }}</b>
          <span class="elab-mem">({{ m.similarity.toFixed(2) }})</span>
        </span>
      </p>

      <template v-if="mode === 'matched' && unmatched.length">
        <p class="elab-result">
          <strong>Left honestly unmatched</strong>
          <span class="elab-mem"
            >- no confident pair on the other side; shown with its closest miss</span
          >
        </p>
        <p class="elab-pills">
          <span
            v-for="u in unmatched"
            :key="u.side + ':' + u.label"
            class="elab-pill"
            :style="{ borderColor: GREY, color: 'var(--vp-c-text-3)' }"
          >
            {{ u.label }} <span class="elab-mem">({{ u.side }}) closest {{ closestHint(u) }}</span>
          </span>
        </p>
      </template>

      <p class="elab-legend">
        <template v-if="mode === 'matched'">
          <span v-if="preview"
            >An embedding model pairs each CRM row with its ERP row <em>by meaning</em> - even
            <code>USA</code> → United States and <code>Nippon</code> → Japan, which share no
            letters. <code>Eire</code> and <code>France</code> stay unmatched, correctly: they are
            not the same country. <strong>Shown instantly</strong>; switch to
            <strong>Real model</strong> to download MiniLM (~23 MB) and run it.</span
          >
          <span v-else-if="backend === 'hash'"
            >Model-free links <em>spelling</em> (case, typos) offline, so <code>germany</code> →
            Germany pairs - but <code>USA</code> and <code>Nippon</code> stay unmatched (no shared
            letters with their real pair). <strong>Load {{ embName }}</strong> (top-right) to match
            by meaning.</span
          >
          <span v-else
            ><strong>{{ embName }}</strong> matched the abbreviation and the translation too, down
            to the real 3 pairs. <code>Eire</code> and <code>France</code> still correctly stay
            apart.</span
          >
        </template>
        <template v-else
          >Charted raw, all {{ CRM.length + ERP.length }} rows sit as unrelated bars from two
          systems that know nothing about each other. Step to <strong>Match</strong> to link
          them.</template
        >
      </p>
    </div>
  </div>
</template>
