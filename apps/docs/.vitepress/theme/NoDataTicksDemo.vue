<script setup lang="ts">
// One live chart, one checkbox: flip `fillPeriodTicks` on/off so readers SEE the
// continuous-timeline mode fill in the missing periods (faded, with a "no data" hover
// tooltip) instead of shipping two static charts. The applied state is driven from the
// Vue ref (never a plain read of a non-reactive api) so the toggle always re-applies.
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from "vue";

const props = defineProps<{
  /** Web-component tag; defaults to the line chart. */
  element?: string;
  /** Returns the element props (sparse dataSet/series + axis config). Called client-side. */
  make: () => Record<string, unknown>;
  height?: number;
  label?: string;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const on = ref(false);
let ro: ResizeObserver | null = null;
let raf = 0;

// clientWidth INCLUDES padding; sizing the chart from it overflows the padded
// stage and the excess gets clipped at the right edge (worse on canvas, which
// hard-clips at its backing store). Subtract the horizontal padding.
function innerWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
}

function buildNode() {
  if (!host.value) return;
  const node: any = document.createElement(props.element ?? "michi-vz-line-chart");
  const p = props.make();
  // Mirror ChartDemo's mapping: title -> chartTitle; the demo owns width/height.
  const { title, width: _w, height: _h, ...rest } = p as any;
  if (title) node.chartTitle = title;
  Object.assign(node, rest);
  node.fillPeriodTicks = on.value;
  node.height = props.height ?? 360;
  node.style.display = "block";
  node.width = innerWidth(host.value);
  host.value.appendChild(node);
  el.value = node;
}

// Re-apply on toggle. The WC `fillPeriodTicks` property is reactive (triggers update()).
watch(on, (v) => {
  if (el.value) el.value.fillPeriodTicks = v;
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
  <div class="nd-demo">
    <label class="nd-toggle">
      <input type="checkbox" v-model="on" />
      {{ label ?? "Fill missing periods - show every month, fade the gaps" }}
    </label>
    <div class="nd-stage michi-vz-calm" ref="host"></div>
    <p class="nd-hint">
      Toggle it on: the empty months appear as <em>faded</em> ticks. Hover one to see its "no data"
      tooltip. First and last periods are always kept, either way.
    </p>
  </div>
</template>

<style scoped>
.nd-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.nd-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.nd-toggle input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.nd-stage {
  padding: 12px 16px;
}
.nd-hint {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
</style>
