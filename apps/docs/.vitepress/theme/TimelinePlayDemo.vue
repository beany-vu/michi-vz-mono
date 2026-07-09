<script setup lang="ts">
// Live "play through years" demo: a gap or scatter chart with the timeline prop
// on, so the chart's own built-in play button + period scrubber drive it. The
// dataset is built here (several periods per label) so every locale shows the
// same story; locale pages pass translated hint text via props.
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";

const props = defineProps<{
  chart?: "gap" | "scatter";
  hint?: string;
  height?: number;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
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

function buildNode() {
  if (!host.value) return;
  const tag = props.chart === "scatter" ? "michi-vz-scatter-chart" : "michi-vz-gap-chart";
  const node: any = document.createElement(tag);
  Object.assign(node, props.chart === "scatter" ? makeScatterProps() : makeGapProps());
  node.height = props.height ?? 380;
  node.style.display = "block";
  node.width = Math.max(280, host.value.clientWidth);
  host.value.appendChild(node);
  el.value = node;
}

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
