<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { examples } from "@michi-vz/examples";

const props = defineProps<{ chart: string; index?: number; height?: number }>();
const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const ctx = ref<string>("");
const title = ref<string>("");
let ro: ResizeObserver | null = null;
let raf = 0;

onMounted(async () => {
  // Register the web components client-side only (never during SSR).
  await import("@michi-vz/wc");
  const ex = (examples as any)[props.chart]?.[props.index ?? 0];
  if (!ex || !host.value) return;
  title.value = ex.title;

  const node: any = document.createElement(ex.element);
  // We own width/height for responsiveness - drop any from the example.
  const { title: t, width: _w, height: _h, margin, ...rest } = ex.props;
  if (t) node.chartTitle = t;
  Object.assign(node, rest);
  node.height = props.height ?? 340;
  if (margin) node.margin = margin;
  node.style.display = "block";
  node.width = Math.max(280, host.value.clientWidth);
  host.value.appendChild(node);
  el.value = node;

  // Resize the chart to fill its container (rAF-throttled).
  ro = new ResizeObserver((entries) => {
    const w = Math.max(280, Math.floor(entries[0].contentRect.width));
    if (w === node.width) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { node.width = w; });
  });
  ro.observe(host.value);
});

onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
});

function toggleContext() {
  if (ctx.value) {
    ctx.value = "";
    return;
  }
  const c = el.value?.getContext?.();
  ctx.value = c ? JSON.stringify(c, null, 2) : "(context unavailable)";
}
</script>

<template>
  <div class="chart-demo">
    <div class="chart-demo-bar">
      <span class="chart-demo-title">{{ title || "Live example" }}</span>
      <span class="chart-demo-tag">SVG · live · responsive</span>
    </div>
    <div class="chart-demo-stage" ref="host"></div>
    <div class="chart-demo-foot">
      <button class="chart-demo-btn" @click="toggleContext">
        {{ ctx ? "▴ Hide" : "▾ Show" }} LLM context · getContext()
      </button>
    </div>
    <pre v-if="ctx" class="chart-demo-ctx">{{ ctx }}</pre>
  </div>
</template>

<style scoped>
.chart-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.chart-demo-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.chart-demo-title { font-family: "Spectral", Georgia, serif; font-weight: 600; }
.chart-demo-tag { font-family: var(--vp-font-family-mono); font-size: 11px; color: var(--vp-c-text-3); letter-spacing: 0.04em; }
.chart-demo-stage { padding: 12px 16px; }
.chart-demo-foot { padding: 0 16px 12px; }
.chart-demo-btn { font: inherit; font-size: 12.5px; color: var(--vp-c-brand-1); background: none; border: none; cursor: pointer; padding: 0; }
.chart-demo-ctx { max-height: 300px; overflow: auto; font-size: 12px; margin: 0 16px 16px; }
</style>
