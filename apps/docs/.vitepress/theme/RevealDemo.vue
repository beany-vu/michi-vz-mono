<script setup lang="ts">
// Live progressiveDraw (reveal) demo for any chart: mounts the chart's first
// @michi-vz/examples dataset with the reveal turned on, plus a replay button
// (the WC element's replay() method). Locale pages pass translated text.
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { examples } from "@michi-vz/examples";

const props = defineProps<{
  /** Example key = element suffix, e.g. "area-chart", "treemap-chart". */
  chart: string;
  replayLabel?: string;
  hint?: string;
  height?: number;
  /** Example index in the chart's examples list (default 0). */
  index?: number;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
// Renderer switcher: svg and canvas both animate; webgpu paints the full frame
// instantly by design (no reveal machinery on the GPU path).
const renderer = ref<"svg" | "canvas" | "webgpu">("svg");
let ro: ResizeObserver | null = null;
let raf = 0;

function buildNode() {
  if (!host.value) return;
  const ex = (examples as any)[props.chart]?.[props.index ?? 0];
  if (!ex) return;
  const node: any = document.createElement(`michi-vz-${props.chart}`);
  const { title, width: _w, height: _h, ...rest } = ex.props as any;
  if (title) node.chartTitle = title;
  Object.assign(node, rest);
  node.progressiveDraw = { durationMs: 2000 };
  node.renderer = renderer.value;
  node.height = props.height ?? 380;
  node.style.display = "block";
  // clientWidth INCLUDES the stage's own horizontal padding; sizing the chart
  // from it overflows the padded stage and the excess gets clipped at the
  // right edge by the outer wrapper's overflow:hidden (worse on canvas, which
  // hard-clips at its backing store instead of SVG's overflow:visible marks).
  const stageStyle = getComputedStyle(host.value);
  const stagePadX = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
  node.width = Math.max(280, host.value.clientWidth - stagePadX);
  host.value.appendChild(node);
  el.value = node;
}

function replay() {
  el.value?.replay?.();
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
  <div class="rvd-demo">
    <div class="rvd-bar">
      <button class="rvd-replay" type="button" @click="replay">
        {{ replayLabel ?? "Replay the reveal" }}
      </button>
      <div class="rvd-renderers" role="group" aria-label="Renderer">
        <button
          v-for="r in ['svg', 'canvas', 'webgpu']"
          :key="r"
          type="button"
          class="rvd-renderer"
          :class="{ active: renderer === r }"
          :aria-pressed="renderer === r"
          @click="renderer = r as any"
        >
          {{ r }}
        </button>
      </div>
      <span v-if="renderer === 'webgpu'" class="rvd-note">webgpu paints the full frame instantly</span>
    </div>
    <div class="rvd-stage michi-vz-calm" ref="host"></div>
    <p class="rvd-hint">
      {{
        hint ??
        "The marks wipe in from left to right; axes and titles stay put. With reduced motion enabled, the chart renders fully drawn instantly."
      }}
    </p>
  </div>
</template>

<style scoped>
.rvd-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.rvd-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.rvd-replay {
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
.rvd-replay:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.rvd-renderers {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}
.rvd-renderer {
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.rvd-renderer + .rvd-renderer {
  border-left: 1px solid var(--vp-c-divider);
}
.rvd-renderer.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.rvd-note {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.rvd-stage {
  padding: 12px 16px;
}
.rvd-hint {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
