<script setup lang="ts">
// Live progressiveDraw demo: one line chart that draws itself left to right with
// tip labels trailing each line's end, plus a replay button (the WC element's
// replay() method). Locale pages pass translated button/hint text via props; the
// dataset is built here so every locale shows the same chart.
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";

const props = defineProps<{
  replayLabel?: string;
  hint?: string;
  height?: number;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
let ro: ResizeObserver | null = null;
let raf = 0;

function makeProps(): Record<string, unknown> {
  const mk = (base: number, amp: number, drift: number) =>
    Array.from({ length: 14 }, (_, i) => ({
      date: 2010 + i,
      value: Math.round((base + Math.sin(i / 1.8) * amp + i * drift) * 10) / 10,
      certainty: true,
    }));
  return {
    dataSet: [
      { label: "Exports", color: "#2c6fbb", series: mk(38, 6, 2.1) },
      { label: "Imports", color: "#e07b39", series: mk(52, 4, 1.2) },
      { label: "Services", color: "#1f9e57", series: mk(20, 3, 1.7) },
    ],
    xAxisDataType: "date_annual",
    progressiveDraw: { durationMs: 2400, tipLabel: true },
  };
}

function buildNode() {
  if (!host.value) return;
  const node: any = document.createElement("michi-vz-line-chart");
  Object.assign(node, makeProps());
  node.height = props.height ?? 360;
  node.style.display = "block";
  node.width = Math.max(280, host.value.clientWidth);
  host.value.appendChild(node);
  el.value = node;
}

function replay() {
  el.value?.replay?.();
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
  <div class="pdw-demo">
    <div class="pdw-bar">
      <button class="pdw-replay" type="button" @click="replay">
        {{ replayLabel ?? "Replay the reveal" }}
      </button>
    </div>
    <div class="pdw-stage michi-vz-calm" ref="host"></div>
    <p class="pdw-hint">
      {{
        hint ??
        "Each line grows from the first year to the last; the label rides the tip and settles at the line's end. With reduced motion enabled, the chart renders fully drawn instantly."
      }}
    </p>
  </div>
</template>

<style scoped>
.pdw-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.pdw-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.pdw-replay {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.pdw-replay:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.pdw-stage {
  padding: 12px 16px;
}
.pdw-hint {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
