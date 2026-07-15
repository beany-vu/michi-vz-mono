<script setup lang="ts">
// MERGE (1 of 4). Reconcile messy labels in three steps: Raw → Reconcile → Certify.
//   - "⚡ Instant" (default): show the result a model WOULD produce, precomputed, with no
//     download or wait - so the payoff is immediate and convincing.
//   - "Real model": actually download the model and run it live (MiniLM ~23 MB for Reconcile;
//     a small LLM, Qwen/Gemma, for Certify), with sizes + a load %, all in-browser via WebGPU.
// Reconcile = an embedding model merges by similarity (a confidence gate keeps distinct countries
// apart); Certify = a small LLM confirms each group is one country and stamps the canonical name.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useEmbedder, EMBED_CATALOG } from "./useEmbedder";
import { useLlm, LLM_CATALOG } from "./useLlm";
import EmbedPicker from "./EmbedPicker.vue";

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
// The result a good model produces - precomputed for the instant preview. (US 80, Japan/Germany 43.)
const PREVIEW_GROUPS = [
  {
    name: "United States",
    total: 80,
    members: ["United States", "United  States", "united states", "USA"],
  },
  { name: "Japan", total: 43, members: ["Japan", "japan", "Nippon"] },
  { name: "Germany", total: 43, members: ["Germany", "germany", "Deutschland"] },
];

const { model, embed, ensureLib, loadedModel } = useEmbedder();
const {
  status: llmStatus,
  pct: llmPct,
  errMsg: llmErr,
  load: llmLoad,
  generate: llmGen,
} = useLlm();

type Mode = "raw" | "reconciled" | "certified";
const mode = ref<Mode>("raw");
const preview = ref(true); // ⚡ instant by default; real model on demand
// loadedModel is a reactive ref (set to the model id once loaded), so backend recomputes when the
// download finishes. (bertReady() read a non-reactive var, so the computed never re-ran.)
const backend = computed<"hash" | "bert">(() => (loadedModel.value ? "bert" : "hash"));
const embName = computed(() => EMBED_CATALOG.find((m) => m.id === model.value)?.name ?? "a model");
const groups = ref<Array<{ name: string; total: number; members: string[] }>>([]);
const certified = ref<Array<{ name: string; total: number; members: string[] }>>([]);
const certifying = ref(false);
// Default to Gemma 2 (2B): more reliable on country names than the tiny 0.5B (which can mislabel).
const llmId = ref(LLM_CATALOG.find((m) => m.id.includes("gemma"))?.id ?? LLM_CATALOG[0].id);
const selectedLlm = computed(() => LLM_CATALOG.find((m) => m.id === llmId.value) ?? LLM_CATALOG[0]);
const shown = computed(() =>
  mode.value === "certified" && certified.value.length ? certified.value : groups.value,
);
const fmtSize = (mb: number) => (mb >= 1000 ? `~${(mb / 1000).toFixed(1)} GB` : `~${mb} MB`);

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

// Representative = the cluster's MEDOID (member closest to all the others), with a small
// tidiness nudge to break ties toward a clean Title-Case, single-spaced name.
function representative(
  members: string[],
  vecs: number[][],
  cos: (a: number[], b: number[]) => number,
): string {
  let bi = 0;
  let bs = -Infinity;
  for (let i = 0; i < members.length; i++) {
    let s = 0;
    for (let j = 0; j < members.length; j++) if (i !== j) s += cos(vecs[i], vecs[j]);
    if (/^[A-Z][a-z]/.test(members[i]) && !/\s{2,}/.test(members[i])) s += 1e-3;
    if (s > bs) {
      bs = s;
      bi = i;
    }
  }
  return members[bi];
}

async function reconcile() {
  if (preview.value) {
    groups.value = PREVIEW_GROUPS.map((g) => ({ ...g, members: [...g.members] }));
    certified.value = [];
    return;
  }
  const cos = lib.cosineSimilarity;
  const vecs = await embed(
    RAW.map((r) => r.label),
    backend.value,
  );
  // MiniLM places DISTINCT country names surprisingly close (measured: Germany↔USA 0.67), while
  // true synonyms are higher (USA≈United States 0.89). Threshold sits in (0.68, 0.74].
  const th = backend.value === "bert" ? 0.7 : 0.6;
  const margin = backend.value === "bert" ? 0.05 : 0.04; // confidence gate: best - secondBest
  const cl: Array<{ vecs: number[][]; total: number; members: string[] }> = [];
  RAW.forEach((row, i) => {
    let best: (typeof cl)[number] | null = null;
    let bestSim = -Infinity;
    let secondSim = -Infinity;
    for (const c of cl) {
      let s = 0;
      for (const v of c.vecs) {
        const x = cos(vecs[i], v);
        if (x > s) s = x;
      } // single-linkage
      if (s > bestSim) {
        secondSim = bestSim;
        bestSim = s;
        best = c;
      } else if (s > secondSim) {
        secondSim = s;
      }
    }
    const confident = best && bestSim >= th && (secondSim < 0 || bestSim - secondSim >= margin);
    if (confident && best) {
      best.total += row.value;
      best.members.push(row.label);
      best.vecs.push(vecs[i]);
    } else {
      cl.push({ vecs: [vecs[i]], total: row.value, members: [row.label] });
    }
  });
  groups.value = cl
    .map((c) => ({
      name: representative(c.members, c.vecs, cos),
      total: c.total,
      members: c.members,
    }))
    .sort((a, b) => b.total - a.total);
  certified.value = [];
}

// Pull a clean country name out of a small model's (sometimes chatty) reply.
function cleanCountry(s: string): string {
  let t = (s.split("\n").find((l) => l.trim()) ?? "").trim();
  t = t.replace(
    /^(the\s+country\s+is\s+|country\s*[:=]?\s*|answer\s*[:=]?\s*|it'?s\s+|that'?s\s+)/i,
    "",
  );
  t = t.replace(/^["'`*\s]+|["'`*.\s]+$/g, "");
  return t || s.trim();
}

// A tiny canonical alias list normalizes rote abbreviations even a 0.5B model gets lazy on
// (USA → United States); the LLM still earns its keep on open-ended translations (Deutschland).
const ALIAS: Record<string, string> = {
  us: "United States",
  usa: "United States",
  "united states of america": "United States",
  america: "United States",
  uk: "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  uae: "United Arab Emirates",
  deutschland: "Germany",
  nippon: "Japan",
  nihon: "Japan",
  nederland: "Netherlands",
  holland: "Netherlands",
  espana: "Spain",
  italia: "Italy",
  brasil: "Brazil",
};
function canonicalize(name: string): string {
  const key = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^the\s+/, "")
    .trim();
  return ALIAS[key] ?? name;
}

async function certify() {
  if (!groups.value.length) await reconcile();
  if (preview.value) {
    certified.value = PREVIEW_GROUPS.map((g) => ({ ...g, members: [...g.members] }));
    render();
    return;
  }
  certifying.value = true;
  try {
    await llmLoad(selectedLlm.value); // loads on demand; size shown before it starts
    const byCanon = new Map<string, { name: string; total: number; members: string[] }>();
    for (const g of groups.value) {
      const sample = g.members.slice(0, 4).join(", ");
      const prompt = `What country do these names refer to? ${sample}. Reply with ONLY the full official English country name (for example "United States", not "USA"), nothing else.`;
      const canon = canonicalize(cleanCountry(await llmGen(prompt)));
      const key = canon
        .toLowerCase()
        .replace(/^the\s+/, "")
        .replace(/[^a-z0-9]/g, ""); // group-safe key
      const cur = byCanon.get(key);
      if (cur) {
        cur.total += g.total;
        cur.members.push(...g.members);
      } else byCanon.set(key, { name: canon, total: g.total, members: [...g.members] });
    }
    certified.value = [...byCanon.values()].sort((a, b) => b.total - a.total);
    render();
  } catch {
    /* llmErr surfaced in the panel */
  } finally {
    certifying.value = false;
  }
}

function render() {
  if (!lib || !host.value) return;
  chart?.destroy();
  const w = width();
  const ds =
    mode.value === "raw"
      ? RAW.map((r) => ({ label: r.label, valueBased: r.value, valueCompared: 0, color: GREY }))
      : shown.value.map((g, i) => ({
          label: g.name,
          valueBased: g.total,
          valueCompared: 0,
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
  if (m === "certified") await certify();
  else if (m === "reconciled" && !groups.value.length) await reconcile();
  render();
}

async function setPreview(v: boolean) {
  if (preview.value === v) return;
  preview.value = v;
  groups.value = [];
  certified.value = [];
  if (mode.value === "certified") await certify();
  else if (mode.value === "reconciled") await reconcile();
  render();
}

async function onLoaded() {
  if (mode.value === "raw") mode.value = "reconciled";
  await reconcile();
  render();
}

onMounted(async () => {
  const { core, ins } = await ensureLib();
  lib = {
    mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart,
    cosineSimilarity: ins.cosineSimilarity,
  };
  await render();
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
        <li :class="{ on: mode === 'reconciled', done: mode === 'certified' }">
          <button class="elab-step" @click="setMode('reconciled')">
            <span class="n">{{ mode === "certified" ? "✓" : "2" }}</span> Reconcile
          </button>
        </li>
        <li :class="{ on: mode === 'certified' }">
          <button class="elab-step" @click="setMode('certified')">
            <span class="n">3</span> Certify
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
            title="Real model: download the actual model (MiniLM ~23 MB to reconcile; a small LLM for certify) and run it live in your browser - WebGPU, nothing sent to a server."
          >
            Real model
          </button>
        </div>
        <EmbedPicker v-if="!preview" @loaded="onLoaded" />
      </div>
    </div>

    <div class="elab-content">
      <p class="elab-scenario">
        Three countries reported sales, but three data sources spelled them
        <strong>10 different ways</strong>. <strong>Reconcile</strong> merges by similarity (the
        embedding model); <strong>Certify</strong> adds a second specialist - a small LLM that
        confirms each merge and names it.
        <template v-if="preview"
          >The result below is shown <strong>instantly</strong>; switch to
          <strong>Real model</strong> to download the model and run it yourself.</template
        >
      </p>

      <p class="elab-result">
        <strong>{{ RAW.length }}</strong> raw labels
        <template v-if="mode === 'certified'"
          >→ <strong class="elab-hit">{{ shown.length }}</strong> certified countries{{
            preview ? " (instant preview)" : ` (by ${selectedLlm.name})`
          }}</template
        >
        <template v-else-if="mode === 'reconciled'"
          >→ <strong class="elab-hit">{{ groups.length }}</strong>
          {{
            preview
              ? "countries (instant preview)"
              : backend === "bert"
                ? `groups (${embName} - synonyms merged)`
                : "groups (fuzzy - spelling/case/typos merged)"
          }}</template
        >
        <template v-else>- messy, duplicated, wrong totals</template>
      </p>

      <div v-if="mode === 'certified' && !preview" class="elab-certify">
        <div class="elab-llm">
          <span class="elab-llm-lbl">Confirm with</span>
          <select v-model="llmId" :disabled="certifying" aria-label="confirm model">
            <option v-for="m in LLM_CATALOG" :key="m.id" :value="m.id">
              {{ m.name }} · {{ fmtSize(m.sizeMB) }}
            </option>
          </select>
          <button class="elab-go" @click="certify" :disabled="certifying">
            <span v-if="certifying && llmStatus === 'loading'"
              >Loading {{ selectedLlm.name }}… {{ llmPct }}%</span
            >
            <span v-else-if="certifying">Certifying…</span>
            <span v-else>Run ✦</span>
          </button>
        </div>
        <p class="elab-note">
          A <strong>cascade</strong>, not one big model: the embedding model proposes the merges,
          this small LLM names each group, and a tiny alias list tidies rote abbreviations (<code
            >USA</code
          >
          → United States) so synonyms fold in reliably. The weights download
          <strong>once</strong> ({{ fmtSize(selectedLlm.sizeMB) }}) and run in your browser (WebGPU)
          - nothing is sent to a server.
        </p>
        <p v-if="llmStatus === 'error'" class="elab-err">
          ⚠ {{ llmErr }} (a recent Chrome/Edge with WebGPU is needed for in-browser LLMs).
        </p>
      </div>

      <div class="elab-stage" ref="host"></div>

      <p class="elab-cap" v-if="mode !== 'raw' && shown.length">
        <span v-for="(g, i) in shown" :key="i" class="elab-group">
          <b :style="{ color: PALETTE[i % PALETTE.length] }">{{ g.name }}</b>
          <span class="elab-mem">← {{ g.members.join(", ") }}</span>
        </span>
      </p>
      <p class="elab-legend">
        <template v-if="mode === 'certified'">
          <span v-if="preview"
            >A small LLM confirms each group is one country and stamps the authoritative name -
            <code>USA</code> → United States, <code>Deutschland</code> → Germany,
            <code>Nippon</code> → Japan, with correct totals. <strong>Shown instantly</strong>;
            switch to <strong>Real model</strong> to download a small LLM ({{ selectedLlm.name }})
            and run it.</span
          >
          <span v-else
            >{{ selectedLlm.name }} read each group's <em>meaning</em>, confirmed they're the same
            country, and returned the authoritative name - so even <code>USA</code>,
            <code>Deutschland</code> and <code>Nippon</code> fold in with correct totals.</span
          >
        </template>
        <template v-else-if="mode === 'reconciled'">
          <span v-if="preview"
            >An embedding model groups the 10 spellings <em>by meaning</em> into the 3 real
            countries - even <code>USA</code> / <code>Deutschland</code> / <code>Nippon</code>,
            which share no letters. <strong>Shown instantly</strong>; switch to
            <strong>Real model</strong> to download MiniLM (~23 MB) and run it.</span
          >
          <span v-else-if="backend === 'hash'"
            >Model-free merges <em>spelling</em> (case, spaces, typos) offline - but
            <code>USA</code>, <code>Deutschland</code>, <code>Nippon</code> stay split (no shared
            letters). <strong>Load {{ embName }}</strong> (top-right) to merge by meaning.</span
          >
          <span v-else
            ><strong>{{ embName }}</strong> merged the abbreviations and translations too - down to
            the 3 real countries. Use <strong>Certify</strong> to have a small LLM confirm each and
            stamp the canonical name.</span
          >
        </template>
        <template v-else
          >Charted raw, each spelling is its own bar - the totals are wrong and split. Step through
          <strong>Reconcile</strong> and <strong>Certify</strong> to fix them.</template
        >
      </p>
    </div>
  </div>
</template>
