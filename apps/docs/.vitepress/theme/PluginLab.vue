<script setup lang="ts">
// Live demos for the @michi-vz/insights sub-paths that the other demos don't cover yet:
//   feature = "sonify"   -> hear a series as pitch (sonify / valuesToTones, Web Audio)
//           | "sql"       -> shape raw rows into a chart (aggregate group-by)
//           | "goalseek"  -> what growth/run-rate hits a target (requiredGrowth / requiredRunRate)
//           | "montecarlo"-> a fan of simulated futures + P(above target) (monteCarloForecast)
//           | "changepoints" -> where the trend regime shifts (detectChangepoints)
//           | "seasonal"  -> split a series into trend + seasonal + noise (decompose / detectPeriod)
// Every util is model-free and deterministic; this is the package, not a mock. Client-only
// (dynamic import) so SSR never touches the engine.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{ feature: string }>();
const feature = props.feature;

/* eslint-disable @typescript-eslint/no-explicit-any */
let api: any = null;
let charts: any[] = [];
/* eslint-enable @typescript-eslint/no-explicit-any */
const loadError = ref("");
const renderer = ref<"canvas" | "svg">("canvas");
let ro: ResizeObserver | null = null;
let raf = 0;

const host = ref<HTMLDivElement>();
const host2 = ref<HTMLDivElement>();

// clientWidth INCLUDES padding, so subtract the host's horizontal padding or the canvas
// overflows its container (clips the last axis label).
function widthOf(el: HTMLElement | undefined) {
  if (!el) return 600;
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(260, el.clientWidth - pad);
}
const pt = (date: number, value: number, certainty = true) => ({ date, value, certainty });

// ---------------------------------------------------------------- shared series
// A revenue-ish ramp reused by goal-seek / Monte Carlo (a banker's line).
const RAMP: [number, number][] = [[2017, 42], [2018, 55], [2019, 63], [2020, 71], [2021, 88], [2022, 104], [2023, 121]];
const rampVals = RAMP.map((p) => p[1]);

// ============================================================ sonify
// A recognisable rise-fall-rise shape so the ear can follow the pitch.
const SONIFY_VALS = [3, 5, 8, 12, 16, 13, 9, 6, 8, 12, 15, 18];
const SONIFY_DUR = 2.6;
const tones = ref<Array<{ freq: number; value: number }>>([]);
const playingIdx = ref(-1);
const playing = ref(false);
let stepTimer: ReturnType<typeof setInterval> | null = null;
const freqLo = computed(() => Math.min(...tones.value.map((t) => t.freq)));
const freqHi = computed(() => Math.max(...tones.value.map((t) => t.freq)));
function barH(freq: number) {
  const lo = freqLo.value, hi = freqHi.value;
  const f = hi > lo ? (freq - lo) / (hi - lo) : 0.5;
  return Math.round(14 + f * 64); // px
}
function playSonify() {
  if (!api || playing.value) return;
  playing.value = true;
  playingIdx.value = -1;
  api.sonify(SONIFY_VALS, { duration: SONIFY_DUR }); // graceful no-op without Web Audio
  const stepMs = (SONIFY_DUR / SONIFY_VALS.length) * 1000;
  let i = 0;
  stepTimer = setInterval(() => {
    playingIdx.value = i;
    i += 1;
    if (i >= SONIFY_VALS.length) {
      if (stepTimer) clearInterval(stepTimer);
      setTimeout(() => { playingIdx.value = -1; playing.value = false; }, stepMs);
    }
  }, stepMs);
}

// ============================================================ sql / aggregate
const SQL_ROWS = [
  { region: "North", product: "Widget", revenue: 42, target: 38 },
  { region: "North", product: "Gadget", revenue: 28, target: 30 },
  { region: "North", product: "Bundle", revenue: 35, target: 30 },
  { region: "South", product: "Widget", revenue: 19, target: 22 },
  { region: "South", product: "Gadget", revenue: 24, target: 20 },
  { region: "South", product: "Bundle", revenue: 14, target: 16 },
  { region: "East", product: "Widget", revenue: 51, target: 45 },
  { region: "East", product: "Gadget", revenue: 33, target: 40 },
  { region: "East", product: "Bundle", revenue: 29, target: 28 },
  { region: "West", product: "Widget", revenue: 22, target: 25 },
  { region: "West", product: "Gadget", revenue: 17, target: 18 },
  { region: "West", product: "Bundle", revenue: 12, target: 15 },
];
const groupKey = ref<"region" | "product">("region");
const aggRows = ref<Array<Record<string, unknown>>>([]);

// ============================================================ goal-seek
// `goal` is a ref (not a computed) because `api` is a plain, non-reactive variable:
// a computed reading it would evaluate once (api still null) and never refresh.
const target = ref(200);
const horizon = ref(4);
const goal = ref<{ current: number; g: number; rr: number; histG: number; onTrack: boolean } | null>(null);

// ============================================================ monte carlo
// Its own target, sat near the forecast median so the odds are a genuine coin-toss
// (not saturated at 0/100%) and re-rolling the seed visibly shifts them.
const MC_TARGET = 180;
const mcSeed = ref(7);
const mc = ref<{ runs: number; pAbove: number; pBelow: number } | null>(null);

// ============================================================ changepoints
const CP_VALS: [number, number][] = [[2013, 8], [2014, 12], [2015, 17], [2016, 23], [2017, 30], [2018, 33], [2019, 31], [2020, 25], [2021, 17], [2022, 10], [2023, 6]];
const changepoints = ref<Array<{ year: number; slopeBefore: number; slopeAfter: number }>>([]);

// ============================================================ seasonal
// trend up + a 4-step (quarterly) wave + light noise - a textbook seasonal series.
const SEAS_VALS = [52, 61, 49, 58, 60, 70, 56, 66, 69, 80, 64, 75, 78, 90, 73, 85];
const seasonal = ref<{ period: number; residSd: number } | null>(null);

// ---------------------------------------------------------------- mounting
function destroyCharts() { for (const c of charts) c?.destroy(); charts = []; }

function mountLine(el: HTMLElement | undefined, dataSet: any[], opts: any = {}) {
  if (!el || !api) return null;
  const c = api.mountLineChart(el, {
    dataSet,
    xAxisDataType: opts.xType ?? "date_annual",
    renderer: renderer.value,
    showDataPoints: opts.points ?? true,
    width: widthOf(el),
    height: opts.height ?? 280,
  });
  charts.push(c);
  return c;
}

function buildSeasonalSegments() {
  // colour the line by regime: split CP_VALS at each changepoint index, each segment a series.
  const cps = api.detectChangepoints(CP_VALS.map((p) => p[1]), {});
  changepoints.value = cps.map((c: any) => ({ year: CP_VALS[c.index][0], slopeBefore: c.slopeBefore, slopeAfter: c.slopeAfter }));
  const cuts = [0, ...cps.map((c: any) => c.index), CP_VALS.length - 1].sort((a, b) => a - b);
  const palette = ["#2563eb", "#dc2626", "#16a34a", "#d97706"];
  const segs: any[] = [];
  for (let s = 0; s < cuts.length - 1; s++) {
    const from = cuts[s], to = cuts[s + 1];
    const slice = CP_VALS.slice(from, to + 1); // overlap the boundary point so the line is continuous
    segs.push({ label: `Regime ${s + 1}`, color: palette[s % palette.length], series: slice.map((p) => pt(p[0], p[1])) });
  }
  return segs;
}

function mountFeature() {
  destroyCharts();
  loadError.value = "";
  try {
    if (feature === "sonify") {
      tones.value = api.valuesToTones(SONIFY_VALS, { duration: SONIFY_DUR }).map((t: any) => ({ freq: t.freq, value: t.value }));
      mountLine(host.value, [{ label: "Daily visitors (k)", color: "#2563eb", series: SONIFY_VALS.map((v, i) => pt(2012 + i, v)) }], { height: 220 });
    } else if (feature === "sql") {
      aggRows.value = api.aggregate(SQL_ROWS, {
        groupBy: groupKey.value,
        measures: { revenue: { col: "revenue", fn: "sum" }, target: { col: "target", fn: "sum" } },
        orderBy: { key: "revenue", dir: "desc" },
      });
      const dataSet = aggRows.value.map((r) => ({ label: String(r[groupKey.value]), valueBased: Number(r.revenue), valueCompared: Number(r.target) }));
      const margin = { top: 10, right: 26, bottom: 30, left: 120 };
      const h = margin.top + margin.bottom + Math.max(dataSet.length, 3) * 34;
      const c = api.mountComparableHorizontalBarChart(host.value, { dataSet, renderer: renderer.value, width: widthOf(host.value), height: h, margin });
      charts.push(c);
    } else if (feature === "goalseek") {
      const current = rampVals[rampVals.length - 1];
      const g = api.requiredGrowth(current, target.value, horizon.value); // multiplicative / period
      const rr = api.requiredRunRate(current, target.value, horizon.value); // additive / period
      const histG = current / rampVals[0] > 0 ? Math.pow(current / rampVals[0], 1 / (rampVals.length - 1)) - 1 : 0;
      goal.value = { current, g, rr, histG, onTrack: histG >= g };
      const lastYear = RAMP[RAMP.length - 1][0];
      // required-pace path: compound `current` by g, dashed (certainty:false) so it reads as a plan.
      const pace = [pt(lastYear, current)];
      for (let k = 1; k <= horizon.value; k++) pace.push(pt(lastYear + k, current * Math.pow(1 + g, k), false));
      mountLine(host.value, [
        { label: "Actual", color: "#2563eb", series: RAMP.map((p) => pt(p[0], p[1])) },
        { label: "Required pace", color: "#cda14a", series: pace },
      ], { height: 280 });
    } else if (feature === "montecarlo") {
      const res = api.monteCarloForecast(rampVals, { horizon: 4, runs: 400, seed: mcSeed.value, level: 0.9 });
      mc.value = { runs: res.runs, pAbove: res.probabilityAbove(MC_TARGET), pBelow: res.probabilityBelow(MC_TARGET) };
      const lastYear = RAMP[RAMP.length - 1][0];
      // history as a thin band (min=max=value), forecast as a widening band of simulated futures.
      const hist = RAMP.map((p) => ({ date: p[0], valueMin: p[1], valueMax: p[1], valueMedium: p[1], certainty: true }));
      const fc = res.predictions.map((m: number, i: number) => ({ date: lastYear + i + 1, valueMin: res.lower[i], valueMax: res.upper[i], valueMedium: m, certainty: true }));
      const c = api.mountRangeChart(host.value, { dataSet: [{ label: "Revenue ($M)", color: "#2563eb", series: [...hist, ...fc] }], xAxisDataType: "date_annual", renderer: renderer.value, width: widthOf(host.value), height: 280 });
      charts.push(c);
    } else if (feature === "changepoints") {
      mountLine(host.value, buildSeasonalSegments(), { height: 280 });
    } else if (feature === "seasonal") {
      const period = api.detectPeriod(SEAS_VALS);
      const d = api.decompose(SEAS_VALS, period);
      const sd = Math.sqrt(d.residual.reduce((a: number, b: number) => a + b * b, 0) / d.residual.length);
      seasonal.value = { period: d.period, residSd: Math.round(sd * 10) / 10 };
      const base = 2010;
      mountLine(host.value, [
        { label: "Observed", color: "#9aa4b2", series: SEAS_VALS.map((v, i) => pt(base + i, v)) },
        { label: "Trend", color: "#2563eb", series: d.trend.map((v: number, i: number) => pt(base + i, Math.round(v * 10) / 10)) },
      ], { height: 220 });
      mountLine(host2.value, [
        { label: "Seasonal (repeats)", color: "#16a34a", series: d.seasonal.map((v: number, i: number) => pt(base + i, Math.round(v * 10) / 10)) },
      ], { height: 170, points: false });
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  }
}

function setRenderer(r: "canvas" | "svg") { if (renderer.value === r) return; renderer.value = r; mountFeature(); }
function reroll() { mcSeed.value = (mcSeed.value * 1103515245 + 12345) % 2147483647 & 0xffff; mountFeature(); }

onMounted(async () => {
  try {
    const [core, ins] = await Promise.all([import("@michi-vz/core"), import("@michi-vz/insights")]);
    api = {
      mountLineChart: core.mountLineChart, mountRangeChart: core.mountRangeChart, mountComparableHorizontalBarChart: core.mountComparableHorizontalBarChart,
      sonify: ins.sonify, valuesToTones: ins.valuesToTones, aggregate: ins.aggregate,
      requiredGrowth: ins.requiredGrowth, requiredRunRate: ins.requiredRunRate,
      monteCarloForecast: ins.monteCarloForecast, detectChangepoints: ins.detectChangepoints,
      detectPeriod: ins.detectPeriod, decompose: ins.decompose,
    };
    mountFeature();
    ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mountFeature); });
    if (host.value) ro.observe(host.value);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  }
});
onBeforeUnmount(() => { ro?.disconnect(); cancelAnimationFrame(raf); if (stepTimer) clearInterval(stepTimer); destroyCharts(); });

const TITLES: Record<string, string> = {
  sonify: "sonify · hear the trend", sql: "aggregate · rows → chart", goalseek: "goal-seek · what hits the target",
  montecarlo: "monteCarlo · a fan of futures", changepoints: "changepoints · where the trend bends", seasonal: "decompose · trend + season + noise",
};
const pct = (x: number) => Math.round(x * 100);
</script>

<template>
  <div class="plab ai-glow">
    <div class="plab-bar">
      <span class="plab-title">{{ TITLES[feature] }}</span>
      <div class="plab-controls">
        <span class="plab-rtoggle" role="group" aria-label="renderer">
          <button :class="{ on: renderer === 'canvas' }" @click="setRenderer('canvas')">Canvas</button>
          <button :class="{ on: renderer === 'svg' }" @click="setRenderer('svg')">SVG</button>
        </span>
        <template v-if="feature === 'sql'">
          <span class="plab-rtoggle" role="group" aria-label="group by">
            <button :class="{ on: groupKey === 'region' }" @click="groupKey = 'region'; mountFeature()">by region</button>
            <button :class="{ on: groupKey === 'product' }" @click="groupKey = 'product'; mountFeature()">by product</button>
          </span>
        </template>
        <template v-else-if="feature === 'montecarlo'">
          <button class="plab-chip" @click="reroll">↻ Re-roll seed</button>
        </template>
      </div>
    </div>

    <div class="plab-content">
      <!-- SONIFY: play button + tone bars + line -->
      <template v-if="feature === 'sonify'">
        <div class="plab-stage" ref="host"></div>
        <div class="plab-sonify">
          <button class="plab-play" :class="{ playing }" @click="playSonify" :aria-pressed="playing">
            <span v-if="playing">♪ Playing…</span><span v-else>▶ Hear the trend</span>
          </button>
          <div class="plab-tones" aria-hidden="true">
            <i v-for="(t, i) in tones" :key="i" :class="{ on: i === playingIdx }" :style="{ height: barH(t.freq) + 'px' }"></i>
          </div>
        </div>
        <p class="plab-note">Each value becomes a pitch - low value, low note (220 Hz) up to a high note (880 Hz). A rising series sweeps up; a dip dips. <code>sonify()</code> is a graceful no-op without Web Audio, and <code>valuesToTones()</code> (the bars) is pure and testable. An accessibility win: the trend is now <em>audible</em>.</p>
      </template>

      <!-- SQL / AGGREGATE: raw rows -> grouped bars -->
      <template v-else-if="feature === 'sql'">
        <div class="plab-sql">
          <div class="plab-rawtable">
            <div class="plab-rawcap">{{ SQL_ROWS.length }} raw rows</div>
            <table>
              <thead><tr><th>region</th><th>product</th><th>rev</th><th>tgt</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in SQL_ROWS.slice(0, 6)" :key="i"><td>{{ r.region }}</td><td>{{ r.product }}</td><td>{{ r.revenue }}</td><td>{{ r.target }}</td></tr>
              </tbody>
            </table>
            <div class="plab-rawmore">…{{ SQL_ROWS.length - 6 }} more</div>
          </div>
          <div class="plab-sqlarrow">aggregate&nbsp;→</div>
          <div class="plab-stage plab-sqlchart" ref="host"></div>
        </div>
        <p class="plab-note">One call - <code>aggregate(rows, {{ '{ groupBy: "' + groupKey + '", measures: { revenue: { col:"revenue", fn:"sum" }, target: { col:"target", fn:"sum" } } }' }})</code> - rolls {{ SQL_ROWS.length }} rows into <strong>{{ aggRows.length }}</strong> bars (revenue vs target, sorted). Model-free and deterministic; opt into DuckDB-Wasm for real SQL over millions of rows.</p>
      </template>

      <!-- GOAL-SEEK -->
      <template v-else-if="feature === 'goalseek'">
        <div class="plab-stage" ref="host"></div>
        <div class="plab-goalrow">
          <label>Target <input type="number" v-model.number="target" min="130" max="400" step="10" @change="mountFeature" /></label>
          <label>in <input type="number" v-model.number="horizon" min="1" max="10" step="1" @change="mountFeature" /> periods</label>
        </div>
        <div v-if="goal" class="plab-verdict" :class="{ ok: goal.onTrack, bad: !goal.onTrack }">
          <div class="plab-verdict-line">From <strong>{{ goal.current }}</strong> to <strong>{{ target }}</strong> in {{ horizon }} periods needs <strong>{{ (goal.g * 100).toFixed(1) }}% / period</strong> (compounding) - or <strong>+{{ goal.rr.toFixed(1) }} / period</strong> flat.</div>
          <div class="plab-verdict-line">Recent pace is {{ (goal.histG * 100).toFixed(1) }}% / period → <strong>{{ goal.onTrack ? "on track ✓" : "behind, stretch needed" }}</strong>.</div>
        </div>
        <p class="plab-note">Forecasting runs time forward; <strong>goal-seek runs it backward</strong> from a target. <code>requiredGrowth()</code> and <code>requiredRunRate()</code> are plain arithmetic - the gold dashed line is the pace you'd have to hold. Change the target and watch it move.</p>
      </template>

      <!-- MONTE CARLO -->
      <template v-else-if="feature === 'montecarlo'">
        <div class="plab-stage" ref="host"></div>
        <div v-if="mc" class="plab-statrow">
          <div class="plab-stat"><span class="plab-statnum">{{ mc.runs }}</span><span class="plab-statlbl">simulated futures</span></div>
          <div class="plab-stat ok"><span class="plab-statnum">{{ pct(mc.pAbove) }}%</span><span class="plab-statlbl">finish above {{ MC_TARGET }}</span></div>
          <div class="plab-stat bad"><span class="plab-statnum">{{ pct(mc.pBelow) }}%</span><span class="plab-statlbl">finish below {{ MC_TARGET }}</span></div>
        </div>
        <p class="plab-note">A single forecast line hides the risk. <code>monteCarloForecast()</code> runs hundreds of futures - each step nudged by random shocks - and reports the <strong>band</strong> (the shaded range) plus the odds of clearing a target. Deterministic via a seeded RNG, so the same seed always replays; <strong>Re-roll</strong> shows how the spread shifts.</p>
      </template>

      <!-- CHANGEPOINTS -->
      <template v-else-if="feature === 'changepoints'">
        <div class="plab-stage" ref="host"></div>
        <div v-if="changepoints.length" class="plab-cps">
          <div v-for="(c, i) in changepoints" :key="i" class="plab-cp">
            Trend bent at <strong>{{ c.year }}</strong>: slope {{ c.slopeBefore.toFixed(1) }} → {{ c.slopeAfter.toFixed(1) }}
            <span class="plab-cp-tag" :class="{ down: c.slopeAfter < c.slopeBefore }">{{ c.slopeAfter < c.slopeBefore ? "▼ turned down" : "▲ turned up" }}</span>
          </div>
        </div>
        <p class="plab-note">Averages hide the moment a story changes. <code>detectChangepoints()</code> finds where the <em>slope</em> structurally shifts and the line is coloured by regime - here a clear peak-then-decline. Useful for "when did growth stall?" without eyeballing.</p>
      </template>

      <!-- SEASONAL -->
      <template v-else-if="feature === 'seasonal'">
        <div class="plab-stage" ref="host"></div>
        <div class="plab-stage plab-stage-tight" ref="host2"></div>
        <p v-if="seasonal" class="plab-note"><code>decompose()</code> splits the wiggly <strong>observed</strong> line into a smooth <strong>trend</strong> (top) and a repeating <strong>seasonal</strong> wave (bottom). <code>detectPeriod()</code> found the cycle length on its own: <strong>{{ seasonal.period }}</strong> steps. What's left over - the unexplained noise - has a standard deviation of just <strong>{{ seasonal.residSd }}</strong>, so trend + season explain almost all of it. This is how you separate "we grew" from "it's December again."</p>
      </template>

      <p v-if="loadError" class="plab-error">⚠ {{ loadError }}</p>
    </div>
  </div>
</template>

<style scoped>
/* bind the charts' ink colour to the theme so SVG/canvas text (e.g. the comparable-bar
   y-axis labels) stays legible in BOTH light and dark mode - it defaults to dark otherwise. */
.plab { border: 1px solid var(--vp-c-divider); border-radius: 10px; margin: 18px 0; background: var(--vp-c-bg-soft); overflow: hidden; --michi-vz-ink: var(--vp-c-text-1); }
.plab-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); }
.plab-title { font-family: "Josefin Sans", system-ui, sans-serif; font-weight: 600; }
.plab-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.plab-rtoggle { display: inline-flex; border: 1px solid var(--vp-c-divider); border-radius: 999px; overflow: hidden; }
.plab-rtoggle button { font: inherit; font-size: 12px; padding: 3px 11px; border: none; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.plab-rtoggle button.on { background: var(--vp-c-brand-1); color: #fff; }
.plab-chip { font: inherit; font-size: 12.5px; padding: 3px 11px; border: 1px solid var(--vp-c-divider); border-radius: 999px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; }
.plab-chip:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.plab-content { padding: 4px 18px 18px; }
.plab-stage { padding: 12px 0 0; }
.plab-stage-tight { padding-top: 2px; }
.plab-note { margin: 12px 2px 0; font-size: 13px; line-height: 1.6; color: var(--vp-c-text-2); }
.plab-note code { font-size: 11.5px; }
.plab-error { margin: 10px 2px 0; font-size: 13px; color: var(--vp-c-danger-1, #c0392b); }

/* sonify */
.plab-sonify { display: flex; align-items: flex-end; gap: 16px; margin-top: 8px; flex-wrap: wrap; }
.plab-play { font: inherit; font-size: 13.5px; font-weight: 600; padding: 8px 18px; border: 1px solid var(--vp-c-brand-1); border-radius: 999px; background: var(--vp-c-brand-1); color: #fff; cursor: pointer; white-space: nowrap; }
.plab-play.playing { background: var(--mv-gold, #cda14a); border-color: var(--mv-gold, #cda14a); }
.plab-tones { display: flex; align-items: flex-end; gap: 3px; height: 80px; flex: 1; min-width: 160px; }
.plab-tones i { flex: 1; min-width: 4px; background: linear-gradient(var(--vp-c-brand-1), var(--vp-c-brand-2, #b23a2e)); border-radius: 2px 2px 0 0; opacity: 0.45; transition: opacity 0.12s ease, transform 0.12s ease; }
.plab-tones i.on { opacity: 1; transform: scaleY(1.06); box-shadow: 0 0 8px -2px var(--mv-gold-bright, #e7b143); }

/* sql */
.plab-sql { display: flex; align-items: center; gap: 14px; margin-top: 8px; flex-wrap: wrap; }
.plab-rawtable { flex: 0 0 auto; }
.plab-rawcap { font-size: 11px; color: var(--vp-c-text-3); margin-bottom: 4px; font-family: var(--vp-font-family-mono); }
.plab-rawtable table { border-collapse: collapse; font-size: 11.5px; font-family: var(--vp-font-family-mono); }
.plab-rawtable th, .plab-rawtable td { border: 1px solid var(--vp-c-divider); padding: 2px 8px; text-align: right; color: var(--vp-c-text-2); }
.plab-rawtable th { background: var(--vp-c-bg); color: var(--vp-c-text-3); font-weight: 500; }
.plab-rawtable td:first-child, .plab-rawtable th:first-child, .plab-rawtable td:nth-child(2), .plab-rawtable th:nth-child(2) { text-align: left; }
.plab-rawmore { font-size: 11px; color: var(--vp-c-text-3); margin-top: 3px; font-family: var(--vp-font-family-mono); }
.plab-sqlarrow { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--vp-c-brand-1); white-space: nowrap; }
.plab-sqlchart { flex: 1; min-width: 240px; padding-top: 0; }

/* goal-seek */
.plab-goalrow { display: flex; gap: 16px; align-items: center; margin-top: 12px; font-size: 13px; flex-wrap: wrap; }
.plab-goalrow input { width: 64px; font: inherit; font-size: 13px; padding: 4px 8px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); margin-left: 4px; }
.plab-verdict { margin-top: 12px; padding: 10px 14px; border-radius: 8px; border-left: 3px solid; font-size: 13px; line-height: 1.6; }
.plab-verdict.ok { background: rgba(22, 163, 74, 0.08); border-color: #16a34a; }
.plab-verdict.bad { background: rgba(231, 177, 67, 0.12); border-color: var(--mv-gold-bright, #e7b143); }
.plab-verdict-line { color: var(--vp-c-text-1); }

/* monte carlo */
.plab-statrow { display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
.plab-stat { flex: 1; min-width: 110px; text-align: center; padding: 12px 8px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); }
.plab-stat.ok { border-color: rgba(22, 163, 74, 0.4); }
.plab-stat.bad { border-color: rgba(231, 177, 67, 0.5); }
.plab-statnum { display: block; font-family: "Josefin Sans", system-ui, sans-serif; font-size: 26px; font-weight: 700; color: var(--vp-c-text-1); line-height: 1.1; }
.plab-stat.ok .plab-statnum { color: #16a34a; }
.plab-stat.bad .plab-statnum { color: #b8860b; }
.plab-statlbl { display: block; font-size: 11.5px; color: var(--vp-c-text-3); margin-top: 3px; }

/* changepoints */
.plab-cps { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.plab-cp { font-size: 13px; color: var(--vp-c-text-2); padding: 6px 12px; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 6px; }
.plab-cp-tag { font-size: 11.5px; margin-left: 8px; color: #16a34a; font-weight: 600; }
.plab-cp-tag.down { color: #dc2626; }

/* AI glow: a calm pulse between Geneva crest-red and gold */
@keyframes plab-glow { 0%, 100% { box-shadow: 0 0 0 1px rgba(147, 31, 26, 0.14), 0 0 14px -5px rgba(147, 31, 26, 0.36); } 50% { box-shadow: 0 0 0 1px rgba(231, 177, 67, 0.3), 0 0 22px -3px rgba(231, 177, 67, 0.46); } }
.plab.ai-glow { animation: plab-glow 4.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .plab.ai-glow { animation: none; box-shadow: 0 0 14px -5px rgba(147, 31, 26, 0.36); } .plab-tones i { transition: none; } }
</style>
