<script setup lang="ts">
// The same comparable chart three times, side by side, at different `barRadius`
// values (default 5, then 2, then 0), so readers compare the corners directly
// instead of flipping a toggle. Panels are narrow on purpose: that is where bars
// get thin enough for the default radius to turn them into pills. A renderer
// switch shows svg and canvas round the corners identically.
import { ref, watch, onMounted, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{
    /** @michi-vz/examples key, e.g. "comparable-horizontal-bar-chart". */
    chart: string;
    /** Example index within that chart's list. */
    index?: number;
    /** Radii to show, in order. The DEFAULT (5) panel omits the prop entirely. */
    radii?: number[];
    /** Localised word for "default" in the caption. */
    defaultLabel?: string;
    hint?: string;
    height?: number;
  }>(),
  { index: 1, radii: () => [5, 2, 0], defaultLabel: "default", height: 260 },
);

const DEFAULT_RADIUS = 5;
// Compact plot insets for a narrow panel (the caption above replaces the title).
const COMPACT: Record<string, Record<string, unknown>> = {
  "michi-vz-comparable-horizontal-bar-chart": {
    margin: { top: 12, right: 14, bottom: 28, left: 104 },
    tickHtmlWidth: 96,
  },
  "michi-vz-comparable-vertical-bar-chart": {
    margin: { top: 28, right: 10, bottom: 30, left: 40 },
  },
};

const RENDERERS = ["canvas", "svg"] as const;
const panels = ref<HTMLDivElement[]>([]);
const renderer = ref<(typeof RENDERERS)[number]>("canvas");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodes: any[] = [];
let ro: ResizeObserver | null = null;
let raf = 0;

const caption = (r: number) =>
  r === DEFAULT_RADIUS ? `barRadius: ${r} (${props.defaultLabel})` : `barRadius: ${r}`;

// clientWidth INCLUDES padding; subtract it or the chart overflows the panel.
function innerWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(180, Math.floor(el.clientWidth - pad));
}

watch(renderer, (v) => {
  for (const n of nodes) n.renderer = v;
});

onMounted(async () => {
  await import("@michi-vz/wc"); // register custom elements client-side only
  const { examples } = await import("@michi-vz/examples");
  const ex = (examples as Record<string, any[]>)[props.chart]?.[props.index];
  if (!ex) return;
  // The demo owns size, title and radius; everything else comes from the example.
  const { title: _t, width: _w, height: _h, barRadius: _r, renderer: _rr, ...rest } = ex.props;
  props.radii.forEach((r, i) => {
    const stage = panels.value[i];
    if (!stage) return;
    const node: any = document.createElement(ex.element);
    Object.assign(node, rest, COMPACT[ex.element] ?? {});
    if (r !== DEFAULT_RADIUS) node.barRadius = r;
    node.renderer = renderer.value;
    node.height = props.height;
    node.width = innerWidth(stage);
    node.style.display = "block";
    stage.appendChild(node);
    nodes.push(node);
  });
  ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      nodes.forEach((n, i) => {
        const stage = panels.value[i];
        if (!stage) return;
        const w = innerWidth(stage);
        if (w !== n.width) n.width = w;
      });
    });
  });
  panels.value.forEach((p) => ro?.observe(p));
});

onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
  for (const n of nodes) n.remove?.();
  nodes.length = 0;
});
</script>

<template>
  <div class="br-demo">
    <div class="br-switch" role="radiogroup" aria-label="renderer">
      <button
        v-for="r in RENDERERS"
        :key="r"
        type="button"
        role="radio"
        :aria-checked="renderer === r"
        :class="{ on: renderer === r }"
        @click="renderer = r"
      >
        {{ r }}
      </button>
    </div>
    <div class="br-grid">
      <figure v-for="(r, i) in radii" :key="i" class="br-panel">
        <figcaption>
          <code>{{ caption(r) }}</code>
        </figcaption>
        <div class="br-stage michi-vz-calm" :ref="(el) => (panels[i] = el as HTMLDivElement)"></div>
      </figure>
    </div>
    <p v-if="hint" class="br-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.br-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 18px 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.br-switch {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.br-switch button {
  padding: 5px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.br-switch button.on {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.br-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1px;
  background: var(--vp-c-divider);
}
.br-panel {
  margin: 0;
  min-width: 0;
  background: var(--vp-c-bg-soft);
}
.br-panel figcaption {
  padding: 10px 12px 0;
  font-size: 12.5px;
}
.br-stage {
  padding: 6px 8px 10px;
}
.br-hint {
  margin: 0;
  padding: 12px 16px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  border-top: 1px solid var(--vp-c-divider);
}
</style>
