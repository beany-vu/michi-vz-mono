<script setup lang="ts">
// Live "play through years" demo: a gap or scatter chart with the timeline prop
// on, so the chart's own built-in play button + period scrubber drive it. The
// dataset is built here (several periods per label) so every locale shows the
// same story; locale pages pass translated hint text via props.
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { examples } from "@michi-vz/examples";

const props = defineProps<{
  /** "gap" | "scatter" use hand-tuned datasets; any other value is an example
   *  key ("pie-chart", "bubble-chart", ...) whose first example dataset is
   *  cloned across five years with drifting values. */
  chart?: string;
  hint?: string;
  height?: number;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
// Renderer switcher: svg and canvas both animate the timeline; webgpu paints
// the full frame instantly by design (no reveal machinery on the GPU path).
const renderer = ref<"svg" | "canvas" | "webgpu">("svg");
let ro: ResizeObserver | null = null;
let raf = 0;

const YEARS = [2018, 2019, 2020, 2021, 2022];

function makeGapProps(): Record<string, unknown> {
  const base: Record<string, [number, number]> = {
    Kenya: [34, 48],
    Ghana: [28, 39],
    Morocco: [52, 61],
    Senegal: [22, 30],
    Rwanda: [18, 33],
  };
  const dataSet = YEARS.flatMap((year, yi) =>
    Object.entries(base).map(([label, [v1, v2]]) => ({
      label,
      value1: Math.round(v1 + yi * (label.length % 3) * 1.6),
      value2: Math.round(v2 + yi * ((label.length + 1) % 4) * 2.1),
      date: String(year),
    }))
  );
  return { dataSet, timeline: { speedMs: 1200, loop: true }, showLegend: true };
}

function makeScatterProps(): Record<string, unknown> {
  const seeds: Record<string, [number, number, number]> = {
    Kenya: [18, 61, 30],
    Ghana: [24, 63, 22],
    Morocco: [34, 72, 26],
    Senegal: [15, 65, 12],
    Rwanda: [9, 66, 9],
    Tunisia: [39, 74, 8],
  };
  const dataSet = YEARS.flatMap((year, yi) =>
    Object.entries(seeds).map(([label, [gdp, life, pop]]) => ({
      label,
      x: Math.round((gdp + yi * (2 + (label.length % 3))) * 10) / 10,
      y: Math.round((life + yi * 0.7) * 10) / 10,
      d: pop + yi,
      date: String(year),
    }))
  );
  return {
    dataSet,
    xAxisDataType: "number",
    timeline: { speedMs: 1200, loop: true },
    pointLabels: true,
  };
}

// Cumulative charts play over the years already IN their data: no transform,
// just flip the prop on. Snapshot charts get their example dataset cloned
// across YEARS with per-row numeric drift so the playback visibly moves.
const CUMULATIVE_KEYS = new Set([
  "line-chart",
  "area-chart",
  "range-chart",
  "fan-chart",
  "vertical-stack-bar-chart",
  "ribbon-chart",
  "fountain-chart",
]);
// radar/bar-bell tag rows with `period` (their `date` means something else).
const PERIOD_KEYED = new Set(["radar-chart", "bar-bell-chart"]);
const FROZEN_KEYS = new Set(["date", "period", "label", "id", "code", "lng", "lat"]);

function driftRow(row: Record<string, unknown>, yi: number, ri: number): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(row)) {
    if (FROZEN_KEYS.has(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) {
      // Deterministic per-row drift: each row rises or dips on its own cadence.
      const drift = 1 + yi * (0.06 + ((ri % 4) * 0.045)) * (ri % 3 === 2 ? -0.6 : 1);
      out[k] = Math.round(v * drift * 100) / 100;
    } else if (Array.isArray(v) && v.every(c => c && typeof c === "object")) {
      // Hierarchies (treemap/radial-tree children): drift the whole subtree.
      out[k] = (v as Array<Record<string, unknown>>).map((c, ci) => driftRow(c, yi, ri + ci + 1));
    } else if (Array.isArray(v) && v.every(c => typeof c === "number" || c === null)) {
      // Radar-style per-axis value arrays.
      const drift = 1 + yi * (0.05 + ((ri % 3) * 0.05));
      out[k] = v.map(c => (typeof c === "number" ? Math.round(c * drift * 100) / 100 : c));
    }
  }
  return out;
}

function makeGenericProps(chartKey: string): Record<string, unknown> | null {
  const list = (examples as any)[chartKey] as Array<{ props: Record<string, unknown> }> | undefined;
  if (!list?.length) return null;
  let ex = list[0];

  if (CUMULATIVE_KEYS.has(chartKey)) {
    // The data already spans years; the timeline draws up to the active one.
    // Some charts' FIRST example is categorical (fountain's snapshot mode has
    // no time axis at all), so pick the first TEMPORAL example instead.
    const temporal = list.find(e => {
      const p = e.props as any;
      const rows = (p.dataSet ?? p.series ?? []) as Array<{ date?: unknown }>;
      return String(p.xAxisDataType ?? "").startsWith("date") || rows[0]?.date !== undefined;
    });
    if (temporal) ex = temporal;
    const { width: _w1, height: _h1, ...rest } = ex.props as any;
    const timeline: Record<string, unknown> = { speedMs: 1200, loop: true };
    if (chartKey === "line-chart") timeline.tipLabel = true;
    return { ...rest, timeline };
  }

  const base = ex.props as Record<string, unknown>;
  const { width: _w, height: _h, ...rest } = base as any;

  // Snapshot charts: clone the rows per year with drifting values.
  const periodField = PERIOD_KEYED.has(chartKey) ? "period" : "date";
  const rowsKey = Array.isArray(base.dataSet)
    ? "dataSet"
    : Array.isArray((base as any).series)
      ? "series"
      : Array.isArray((base as any).links)
        ? "links"
        : null;
  if (!rowsKey) return null;
  const rows = base[rowsKey] as Array<Record<string, unknown>>;
  const cloned = YEARS.flatMap((year, yi) =>
    rows.map((row, ri) => ({ ...driftRow(row, yi, ri), [periodField]: String(year) }))
  );
  return { ...rest, [rowsKey]: cloned, timeline: { speedMs: 1200, loop: true } };
}

function buildNode() {
  if (!host.value) return;
  const chart = props.chart ?? "gap";
  const tag =
    chart === "gap"
      ? "michi-vz-gap-chart"
      : chart === "scatter"
        ? "michi-vz-scatter-chart"
        : `michi-vz-${chart}`;
  const node: any = document.createElement(tag);
  const p =
    chart === "gap"
      ? makeGapProps()
      : chart === "scatter"
        ? makeScatterProps()
        : makeGenericProps(chart);
  if (!p) return;
  const { title, ...rest } = p as any;
  if (title) node.chartTitle = title;
  Object.assign(node, rest);
  node.renderer = renderer.value;
  node.height = props.height ?? 380;
  node.style.display = "block";
  // host.value.clientWidth INCLUDES .tld-stage's own horizontal padding (12px
  // 16px 6px); sizing the chart from the raw clientWidth renders it 32px wider
  // than the space actually available, and the outer .tld-demo's
  // `overflow: hidden` silently clips the excess off the right edge (worse on
  // canvas, which has no overflow:visible escape hatch the way SVG marks do).
  const stageStyle = getComputedStyle(host.value);
  const stagePadX = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
  node.width = Math.max(280, host.value.clientWidth - stagePadX);
  host.value.appendChild(node);
  el.value = node;
}

// Renderer flips remount the element (the engine keeps its own per-mount state).
watch(renderer, () => {
  el.value?.remove?.();
  el.value = null;
  buildNode();
});

onMounted(async () => {
  await import("@michi-vz/wc"); // register custom elements client-side only
  if (!host.value) return;
  buildNode();
  ro = new ResizeObserver((entries) => {
    const w = Math.max(280, Math.floor(entries[0].contentRect.width));
    if (!el.value || w === el.value.width) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (el.value) el.value.width = w;
    });
  });
  ro.observe(host.value);
});

onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
  el.value?.remove?.();
  el.value = null;
});
</script>

<template>
  <div class="tld-demo">
    <div class="tld-bar">
      <div class="tld-renderers" role="group" aria-label="Renderer">
        <button
          v-for="r in ['svg', 'canvas', 'webgpu']"
          :key="r"
          type="button"
          class="tld-renderer"
          :class="{ active: renderer === r }"
          :aria-pressed="renderer === r"
          @click="renderer = r as any"
        >
          {{ r }}
        </button>
      </div>
      <span v-if="renderer === 'webgpu'" class="tld-note">webgpu paints the full frame instantly (no sweep)</span>
    </div>
    <div class="tld-stage michi-vz-calm" ref="host"></div>
    <p class="tld-hint">
      {{
        hint ??
        "Press the play button under the chart: it steps through the years, one snapshot at a time. Drag the scrubber to jump to any year."
      }}
    </p>
  </div>
</template>

<style scoped>
.tld-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.tld-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.tld-renderers {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}
.tld-renderer {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.tld-renderer + .tld-renderer {
  border-left: 1px solid var(--vp-c-divider);
}
.tld-renderer.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.tld-note {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.tld-stage {
  padding: 12px 16px 6px;
}
.tld-hint {
  margin: 0;
  padding: 6px 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
