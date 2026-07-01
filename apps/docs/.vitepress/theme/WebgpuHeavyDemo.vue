<script setup lang="ts">
// Reusable EXPERIMENTAL heavy-data WebGPU demo. Mounts ANY michi-vz web-component
// element with renderer="webgpu" over a caller-supplied heavy dataset, and reports
// the ACTUAL backend honestly (WebGPU needs an adapter, not just navigator.gpu -
// under software rasterizers / locked-down browsers it falls back to canvas). Each
// chart page passes a `make` function that returns the element's props; it is called
// CLIENT-SIDE only (onMounted) so SSR never generates the large dataset.
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";

const props = defineProps<{
  /** Web-component tag, e.g. "michi-vz-line-chart". */
  element: string;
  /** Returns the props object for the element (dataSet + axis config, etc.). */
  make: () => Record<string, unknown>;
  /** Short human label for the dataset size, e.g. "20,000 points". */
  caption?: string;
  height?: number;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const status = ref<"pending" | "webgpu" | "canvas">("pending");
const fellBack = ref(false);
let ro: ResizeObserver | null = null;
let raf = 0;

function buildNode() {
  if (!host.value) return;
  const node: any = document.createElement(props.element);
  const p = props.make();
  // Mirror ChartDemo's prop mapping: title -> chartTitle; we own width/height/renderer.
  const { title, width: _w, height: _h, renderer: _r, ...rest } = p as any;
  if (title) node.chartTitle = title;
  Object.assign(node, rest);
  // Calm/Nordic axes for the demos: fewer ticks (round values come from the engine
  // default). Charts name the y-tick prop differently (yTicks vs yTicksQty), so set
  // both; make() can override by returning its own.
  if (node.yTicksQty == null) node.yTicksQty = 5;
  if (node.yTicks == null) node.yTicks = 5;
  if (node.ticks == null) node.ticks = 6;
  node.renderer = "webgpu";
  node.height = props.height ?? 380;
  node.style.display = "block";
  node.width = Math.max(280, host.value.clientWidth);
  host.value.appendChild(node);
  el.value = node;
}

async function detectBackend() {
  const gpu = typeof navigator !== "undefined" ? navigator.gpu : undefined;
  if (!gpu) {
    status.value = "canvas";
    fellBack.value = true;
    return;
  }
  try {
    const adapter = await gpu.requestAdapter();
    const ok = !!adapter;
    status.value = ok ? "webgpu" : "canvas";
    fellBack.value = !ok;
  } catch {
    status.value = "canvas";
    fellBack.value = true;
  }
}

onMounted(async () => {
  // Register the custom elements client-side only (never during SSR).
  await import("@michi-vz/wc");
  if (!host.value) return;
  buildNode();
  detectBackend();

  ro = new ResizeObserver((entries) => {
    const w = Math.max(280, Math.floor(entries[0].contentRect.width));
    if (!el.value || w === el.value.width) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (el.value) el.value.width = w; // WC width property is reactive
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
  <div class="gpu-demo">
    <div class="gpu-caveat" role="note">
      <strong>⚗️ Experimental - not yet stable.</strong>
      WebGPU rendering is an opt-in preview. It needs a WebGPU-capable browser
      (Chrome / Edge, or Safari 26+); everywhere else it falls back to canvas
      automatically. Axes, labels and tooltips stay on the SVG layer - only the
      data marks are painted on the GPU.
    </div>
    <div class="gpu-bar">
      <span class="gpu-title">
        Heavy-data demo<template v-if="caption"> · {{ caption }}</template>
      </span>
      <span
        class="gpu-pill"
        :class="{ on: status === 'webgpu', warn: status === 'canvas', wait: status === 'pending' }"
      >
        <template v-if="status === 'webgpu'">● WebGPU active</template>
        <template v-else-if="status === 'canvas'">▲ Fell back to canvas</template>
        <template v-else>… detecting</template>
      </span>
    </div>
    <div class="gpu-stage michi-vz-calm" ref="host"></div>
    <p v-if="fellBack" class="gpu-note">
      Your browser has no WebGPU adapter available, so these marks are drawn with the
      canvas 2D renderer instead. The chart is otherwise identical.
    </p>
  </div>
</template>

<style scoped>
.gpu-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.gpu-caveat {
  font-size: 13px;
  line-height: 1.5;
  padding: 12px 16px;
  background: var(--vp-c-warning-soft, #fff8e6);
  border-bottom: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}
.gpu-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.gpu-title {
  font-family: "Josefin Sans", system-ui, sans-serif;
  font-weight: 600;
}
.gpu-pill {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.03em;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
.gpu-pill.on {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: transparent;
}
.gpu-pill.warn {
  background: var(--vp-c-warning-soft, #fff8e6);
  color: var(--vp-c-warning-1, #8a6d00);
}
.gpu-stage {
  padding: 12px 16px;
}
.gpu-note {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
