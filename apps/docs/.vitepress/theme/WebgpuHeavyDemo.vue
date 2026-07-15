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
  /** Opt-in colour key. `true` = auto from getContext().legendData (the dimuon
   * resonances); an array = explicit rows for charts whose per-mark labels are all
   * unique (the collision-event bubbles). Most heavy demos have far too many
   * categories for a legend (30 ribbons, 120 rows) and leave this off. */
  legend?: boolean | Array<{ label: string; color: string }>;
}>();

const host = ref<HTMLDivElement>();
const el = shallowRef<any>(null);
const status = ref<"pending" | "webgpu" | "canvas">("pending");
const fellBack = ref(false);
// At this density a per-row label can't work, so the chart's own ChartContext
// summary stands in: the same deterministic sentence an AI agent (or a screen
// reader) gets from getContext(). Pages whose heavy data has a FEW meaningful
// groups opt into a colour legend via the `legend` prop (capped at 12 rows).
const summary = ref("");
const legendRows = ref<Array<{ label: string; color: string; pale?: string }>>([]);
let ro: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let raf = 0;
let started = false;
let cancelScheduled: (() => void) | null = null;

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
  node.width = innerWidth(host.value);
  node.addEventListener("michi-vz:dataprocessed", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    summary.value = detail?.summary ?? "";
    if (Array.isArray(props.legend)) {
      legendRows.value = props.legend;
    } else if (props.legend) {
      const rows = Array.isArray(detail?.legendData) ? detail.legendData : [];
      legendRows.value =
        rows.length > 1 && rows.length <= 12
          ? rows.map((l: any) => ({
              label: String(l.label),
              color: String(l.color || ""),
              // Split charts (treemap) pair each group's pale remainder tint.
              ...(l.paleColor ? { pale: String(l.paleColor) } : {}),
            }))
          : [];
    }
  });
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

async function start() {
  if (started) return;
  started = true;
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
}

// Generating tens of thousands of points + the first render is a real
// main-thread burst; run it in an idle slice so it never janks scrolling
// (or, without requestIdleCallback, at least off the current task).
function scheduleStart() {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(() => void start(), { timeout: 500 });
    cancelScheduled = () => w.cancelIdleCallback?.(id);
  } else {
    const id = window.setTimeout(() => void start(), 1);
    cancelScheduled = () => clearTimeout(id);
  }
}

onMounted(() => {
  if (!host.value) return;
  // Lazy-mount: heavy demos sit below the fold; building 50k points inside the
  // nav click's mount tick is what made chart pages feel laggy. Only build when
  // the stage nears the viewport (same pattern as the homepage CatalogCard).
  if (typeof IntersectionObserver === "undefined") {
    scheduleStart();
    return;
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io?.disconnect();
        io = null;
        scheduleStart();
      }
    },
    { rootMargin: "240px" },
  );
  io.observe(host.value);
});

onBeforeUnmount(() => {
  io?.disconnect();
  ro?.disconnect();
  cancelAnimationFrame(raf);
  cancelScheduled?.();
  el.value?.remove?.();
  el.value = null;
});
</script>

<template>
  <div class="gpu-demo">
    <div class="gpu-caveat" role="note">
      <strong>⚗️ Experimental - not yet stable.</strong>
      WebGPU rendering is an opt-in preview. It needs a WebGPU-capable browser (Chrome / Edge, or
      Safari 26+); everywhere else it falls back to canvas automatically. Axes, labels and tooltips
      stay on the SVG layer - only the data marks are painted on the GPU.
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
    <ul v-if="legendRows.length" class="gpu-legend">
      <li v-for="item in legendRows" :key="item.label">
        <span v-if="item.pale" class="gpu-swatch" :style="{ background: item.pale }"></span>
        <span class="gpu-swatch" :style="{ background: item.color }"></span>
        {{ item.label }}
      </li>
    </ul>
    <p v-if="summary" class="gpu-summary">
      <span class="gpu-summary-tag">ChartContext summary</span>
      {{ summary }}
    </p>
    <p v-if="fellBack" class="gpu-note">
      Your browser has no WebGPU adapter available, so these marks are drawn with the canvas 2D
      renderer instead. The chart is otherwise identical.
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
/* Opt-in colour key (same compact swatch rows as ChartDemo's legend). */
.gpu-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  list-style: none;
  margin: 0;
  padding: 0 16px 10px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}
.gpu-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.gpu-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}
.gpu-legend li .gpu-swatch + .gpu-swatch {
  margin-left: -3px;
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
.gpu-summary {
  margin: 0 16px 12px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
}
.gpu-summary-tag {
  display: inline-block;
  margin-right: 8px;
  padding: 1px 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 10.5px;
  letter-spacing: 0.04em;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  white-space: nowrap;
}
</style>
