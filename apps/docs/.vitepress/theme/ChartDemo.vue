<script setup lang="ts">
import { ref, onMounted, shallowRef } from "vue";
import { examples } from "@michi-vz/examples";

const props = defineProps<{ chart: string; index?: number }>();
const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const ctx = ref<string>("");
const title = ref<string>("");

onMounted(async () => {
  // Register the web components client-side only (never during SSR).
  await import("@michi-vz/wc");
  const ex = (examples as any)[props.chart]?.[props.index ?? 0];
  if (!ex || !host.value) return;
  title.value = ex.title;
  const node: any = document.createElement(ex.element);
  const { title: t, ...rest } = ex.props;
  if (t) node.chartTitle = t;
  Object.assign(node, rest);
  node.style.maxWidth = "100%";
  host.value.appendChild(node);
  el.value = node;
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
      <span class="chart-demo-tag">SVG · live</span>
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
.chart-demo-stage { padding: 18px 16px; overflow: auto; }
.chart-demo-foot { padding: 0 16px 12px; }
.chart-demo-btn { font: inherit; font-size: 12.5px; color: var(--vp-c-brand-1); background: none; border: none; cursor: pointer; padding: 0; }
.chart-demo-ctx { max-height: 300px; overflow: auto; font-size: 12px; margin: 0 16px 16px; }
</style>
