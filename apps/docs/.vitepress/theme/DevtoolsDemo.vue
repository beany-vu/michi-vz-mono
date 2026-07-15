<script setup lang="ts">
// Live demo of @michi-vz/devtools: an in-page inspector for every mounted chart.
// Mounts a forecast line (actual points + explicit `predicted: true` points) and a
// button that mounts the devtools: the floating, draggable Michi shield appears and
// toggles the panel (the real out-of-box flow). The panel reads each chart's live
// ChartContext (incl. actual vs predicted), and can drive highlight/disable, run
// agent tools, and edit the dataSet. Client-only (dynamic import) so SSR never
// touches the engine. This is the real package, not a mock.
import { ref, onMounted, onBeforeUnmount } from "vue";

/* eslint-disable @typescript-eslint/no-explicit-any */
let api: any = null;
let chart: any = null;
let devtools: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */

const host = ref<HTMLDivElement>();
const loadError = ref("");
const devtoolsMounted = ref(false);
// Mirror live context into refs (never read the non-reactive `api`/`chart` from a computed).
const summary = ref("");
const actual = ref(0);
const predicted = ref(0);
let ro: ResizeObserver | null = null;
let raf = 0;

function widthOf(el: HTMLElement | undefined) {
  if (!el) return 600;
  const cs = getComputedStyle(el);
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(280, el.clientWidth - pad);
}

// Revenue: 2018-2022 observed, 2023-2025 forecast (predicted: true, drawn dashed via
// certainty). Cost: a flat baseline with one genuine spike so the devtools Insights
// tab's "Detect anomalies" action has something real to flag.
const DATASET = [
  {
    label: "Revenue",
    series: [
      { date: 2018, value: 42, certainty: true },
      { date: 2019, value: 55, certainty: true },
      { date: 2020, value: 63, certainty: true },
      { date: 2021, value: 88, certainty: true },
      { date: 2022, value: 104, certainty: true },
      { date: 2023, value: 121, certainty: false, predicted: true },
      { date: 2024, value: 140, certainty: false, predicted: true },
      { date: 2025, value: 162, certainty: false, predicted: true },
    ],
  },
  {
    label: "Cost",
    series: [
      { date: 2018, value: 30, certainty: true },
      { date: 2019, value: 31, certainty: true },
      { date: 2020, value: 29, certainty: true },
      { date: 2021, value: 30, certainty: true },
      { date: 2022, value: 95, certainty: true },
      { date: 2023, value: 31, certainty: true },
      { date: 2024, value: 30, certainty: true },
      { date: 2025, value: 32, certainty: true },
    ],
  },
];

function refreshReadout() {
  const ctx = chart?.getContext?.();
  if (!ctx) return;
  summary.value = ctx.summary ?? "";
  const s = ctx.series?.[0];
  actual.value = s?.actualCount ?? 0;
  predicted.value = s?.predictedCount ?? 0;
}

function mountChart() {
  if (!api || !host.value) return;
  chart?.destroy?.();
  chart = api.mountLineChart(host.value, {
    dataSet: DATASET,
    title: "Revenue (actual + forecast)",
    width: widthOf(host.value),
    height: 300,
    xAxisDataType: "number",
    showDataPoints: true,
    // canvas renderer: the devtools Hit-test tab streams the host hit-test live
    renderer: "canvas",
    onChartDataProcessed: () => refreshReadout(),
  });
  // Attach @michi-vz/insights so the devtools Insights tab offers one-click
  // Narrate / Detect anomalies for this chart (the 2022 Cost spike gets flagged).
  chart.use?.(api.narrate());
  chart.use?.(api.anomaly({ method: "zscore", threshold: 2 }));
  refreshReadout();
}

function toggleDevtools() {
  if (!api) return;
  if (devtools) {
    devtools.destroy();
    devtools = null;
    devtoolsMounted.value = false;
  } else {
    // Default behavior on purpose: the floating Michi shield appears (bottom right)
    // and the panel opens from it - the same first-run flow an app gets.
    devtools = api.mountDevtools();
    devtoolsMounted.value = true;
  }
}

onMounted(async () => {
  try {
    const [core, dt, insights] = await Promise.all([
      import("@michi-vz/core"),
      import("@michi-vz/devtools"),
      import("@michi-vz/insights"),
    ]);
    api = {
      mountLineChart: core.mountLineChart,
      mountDevtools: dt.mountDevtools,
      narrate: insights.narrate,
      anomaly: insights.anomaly,
    };
    // Enable the hook BEFORE the chart mounts (the documented order) so the chart
    // registers itself even though the panel only opens on the button click.
    core.enableDevtools();
    mountChart();
    ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(mountChart);
    });
    if (host.value) ro.observe(host.value);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  }
});

onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
  devtools?.destroy?.();
  chart?.destroy?.();
});
</script>

<template>
  <div class="devtools-demo">
    <p v-if="loadError" class="err">Failed to load: {{ loadError }}</p>
    <div class="devtools-demo__bar">
      <button class="devtools-demo__btn" @click="toggleDevtools">
        {{ devtoolsMounted ? "Remove devtools" : "Mount devtools" }}
      </button>
      <span class="devtools-demo__hint">
        {{
          devtoolsMounted
            ? "Now click the floating Michi shield (bottom right) or press Ctrl/Cmd+Shift+M. Drag it anywhere."
            : "Mounts the real package: the floating Michi shield appears and toggles the panel."
        }}
      </span>
    </div>
    <div ref="host" class="devtools-demo__chart"></div>
    <p class="devtools-demo__readout">
      <strong>What the panel sees:</strong> {{ summary }}
      <span class="badge actual">actual {{ actual }}</span>
      <span class="badge predicted">predicted {{ predicted }}</span>
    </p>
  </div>
</template>

<style scoped>
.devtools-demo__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.devtools-demo__btn {
  background: var(--vp-c-brand-1, #b8860b);
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 6px 14px;
  font-weight: 600;
  cursor: pointer;
}
.devtools-demo__hint {
  color: var(--vp-c-text-2);
  font-size: 13px;
}
.devtools-demo__chart {
  width: 100%;
  padding: 4px;
}
.devtools-demo__readout {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
}
.badge.actual {
  background: #1f3a2a;
  color: #7fdca0;
}
.badge.predicted {
  background: #3a2f1f;
  color: #ffce7a;
}
.err {
  color: var(--vp-c-danger-1, #e45649);
}
</style>
