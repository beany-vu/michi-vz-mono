<script setup lang="ts">
// One live SymbolMapChart, one segmented switch: flip `positionMode` between
// "precise" (true lng/lat, overlaps allowed) and "force" (legacy de-overlap sim)
// so readers SEE the positional drift the simulation introduces - the reason
// precise mode exists. Mirrors NoDataTicksDemo's build/resize pattern; the mode
// is driven from the Vue ref so the toggle always re-applies.
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from "vue";

const props = defineProps<{
  labelPrecise?: string;
  labelForce?: string;
  hint?: string;
  height?: number;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const mode = ref<"precise" | "force">("precise");
let ro: ResizeObserver | null = null;
let raf = 0;

watch(mode, (v) => {
  if (el.value) el.value.positionMode = v;
});

onMounted(async () => {
  await import("@michi-vz/wc"); // register custom elements client-side only
  const { examples } = await import("@michi-vz/examples");
  if (!host.value) return;
  const p = examples["symbol-map-chart"][1].props as Record<string, unknown>;
  const node: any = document.createElement("michi-vz-symbol-map-chart");
  const { title, width: _w, height: _h, ...rest } = p as any;
  if (title) node.chartTitle = title;
  Object.assign(node, rest);
  node.positionMode = mode.value;
  node.height = props.height ?? 380;
  node.style.display = "block";
  // clientWidth INCLUDES the stage's own horizontal padding; sizing the chart
  // from it overflows the padded stage and the excess clips off the right edge.
  const stageStyle = getComputedStyle(host.value);
  const stagePadX = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
  node.width = Math.max(280, host.value.clientWidth - stagePadX);
  host.value.appendChild(node);
  el.value = node;
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
  <div class="pm-demo">
    <div class="pm-switch" role="radiogroup">
      <button
        type="button"
        role="radio"
        :aria-checked="mode === 'precise'"
        :class="{ on: mode === 'precise' }"
        @click="mode = 'precise'"
      >
        {{ labelPrecise ?? "precise - true positions" }}
      </button>
      <button
        type="button"
        role="radio"
        :aria-checked="mode === 'force'"
        :class="{ on: mode === 'force' }"
        @click="mode = 'force'"
      >
        {{ labelForce ?? "force - de-overlap" }}
      </button>
    </div>
    <div class="pm-stage michi-vz-calm" ref="host"></div>
    <p class="pm-hint">
      {{
        hint ??
        "Switch to force and watch the bubbles drift off their true coordinates to resolve collisions. With a visible landmass, precise is usually the honest choice."
      }}
    </p>
  </div>
</template>

<style scoped>
.pm-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.pm-switch {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.pm-switch button {
  padding: 5px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.pm-switch button.on {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.pm-stage {
  padding: 12px 16px;
}
.pm-hint {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
