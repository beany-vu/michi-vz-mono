<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

// "Four charts of Michi" — the homepage feature band.
// Each block is a REAL <michi-vz-*> web component, rendered in SVG and fed
// hand-crafted data until the data itself traces an (orange, like Michi) cat.
// All axes/grids/labels are stripped via CSS (these are light-DOM components,
// so the docs stylesheet reaches inside them) — only the silhouette remains.
// Swiss-minimal frame, one gold heraldic mark, so it still belongs to the
// Geneva homepage while reading quiet and Nordic.

const ORANGE = "#d9772f";
const CHART_H = 152;

// --- LINE: cat-head OUTLINE — cheeks → sharp ear → V-notch → sharp ear → cheeks
const LINE_SERIES = [
  [0.5, 2.2], [1.8, 3.0], [2.9, 3.8], [3.35, 7.0], [5.0, 3.7],
  [6.65, 7.0], [7.1, 3.8], [8.2, 3.0], [9.5, 2.2],
].map(([date, value]) => ({ date, value, certainty: true }));

// --- AREA: a filled "loaf" cat — rounded body, head + two ears on the right
const AREA_SERIES = [
  [0.0, 0.0], [0.5, 2.3], [1.6, 3.05], [3.2, 3.5], [4.8, 3.5], [6.0, 3.4],
  [6.8, 3.6], [7.3, 4.4], [7.75, 5.5], [8.05, 4.6], [8.35, 5.5], [8.75, 4.3],
  [9.1, 2.7], [9.5, 1.1], [10.0, 0.0],
].map(([date, michi]) => ({ date, michi }));

// --- RADAR: cat-head POLYGON — two ear spikes (axes near 11 & 1 o'clock)
const RADAR_AXES = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
const RADAR_VALUES = [45, 100, 40, 72, 60, 55, 62, 55, 60, 72, 40, 100];

// --- SCATTER: cat-FACE constellation — ears, head ring, eyes, nose, whiskers
function buildFace() {
  const pts: { x: number; y: number; d: number; label: string; color: string }[] = [];
  const push = (x: number, y: number, d: number) =>
    pts.push({ x, y, d, label: "p" + pts.length, color: ORANGE });
  // ears (triangle clusters)
  push(2.7, 8.3, 26); push(3.5, 8.3, 26); push(3.1, 9.5, 26);
  push(6.5, 8.3, 26); push(7.3, 8.3, 26); push(6.9, 9.5, 26);
  // head outline ring (top gap left for the ears)
  const cx = 5, cy = 5, r = 2.7;
  for (let a = 20; a <= 340; a += 32) {
    if (a > 62 && a < 118) continue;
    const rad = (a * Math.PI) / 180;
    push(cx + r * Math.cos(rad), cy + r * Math.sin(rad), 18);
  }
  // eyes + nose
  push(4.0, 5.7, 60); push(6.0, 5.7, 60); push(5.0, 4.5, 42);
  // whiskers
  push(3.2, 4.6, 11); push(2.4, 4.7, 11); push(3.2, 4.0, 11); push(2.4, 3.9, 11);
  push(6.8, 4.6, 11); push(7.6, 4.7, 11); push(6.8, 4.0, 11); push(7.6, 3.9, 11);
  return pts;
}
const FACE = buildFace();

// Frame a point cloud so it sits centred and undistorted (equal px/unit on both
// axes) inside whatever aspect ratio the card happens to be.
function fitDomain(minX: number, maxX: number, minY: number, maxY: number, pw: number, ph: number) {
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const bw = maxX - minX, bh = maxY - minY;
  const aspect = pw / ph;
  let domW: number, domH: number;
  if (bw / bh > aspect) { domW = bw; domH = bw / aspect; }
  else { domH = bh; domW = bh * aspect; }
  return {
    x: [cx - domW / 2, cx + domW / 2] as [number, number],
    y: [cy - domH / 2, cy + domH / 2] as [number, number],
  };
}

type Spec = {
  tag: string;
  title: string;
  sub: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: (w: number, h: number) => Record<string, any>;
};

const SPECS: Spec[] = [
  {
    tag: "michi-vz-line-chart",
    title: "One engine, five ways",
    sub: "React · Vue · Svelte · Angular · web components",
    build: (w, h) => ({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [0, 10],
      yAxisDomain: [1.7, 7.3],
      showDataPoints: false,
      showGridLines: false,
      showVerticalGridLines: false,
      highlightZeroLine: false,
      margin: { top: 14, right: 14, bottom: 14, left: 14 },
      width: w, height: h,
      dataSet: [{ label: "Michi", color: ORANGE, curve: "curveLinear", series: LINE_SERIES }],
    }),
  },
  {
    tag: "michi-vz-scatter-chart",
    title: "SVG or canvas",
    sub: "Either renderer, painted in your own CSS.",
    build: (w, h) => {
      const m = 12;
      const dom = fitDomain(2.2, 7.8, 3.5, 9.8, Math.max(40, w - 2 * m), h - 2 * m);
      return {
        renderer: "svg",
        xAxisDataType: "number",
        xAxisDomain: dom.x,
        yAxisDomain: dom.y,
        sizeRange: [2.5, 9.5],
        showGrid: false,
        margin: { top: m, right: m, bottom: m, left: m },
        width: w, height: h,
        dataSet: FACE,
      };
    },
  },
  {
    tag: "michi-vz-radar-chart",
    title: "Explains itself",
    sub: "getContext() returns a plain-language snapshot.",
    build: (w, h) => ({
      renderer: "svg",
      axes: RADAR_AXES,
      maxValue: 100,
      fillOpacity: 0.92,
      showFilled: true,
      rings: 4,
      margin: { top: 2, right: 2, bottom: 2, left: 2 },
      width: w, height: h,
      series: [{ label: "Michi", color: ORANGE, values: RADAR_VALUES }],
    }),
  },
  {
    tag: "michi-vz-area-chart",
    title: "Insights, experimental",
    sub: "An opt-in AI layer narrates what each chart shows.",
    build: (w, h) => ({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [0, 10],
      yAxisDomain: [0, 5.6],
      keys: ["michi"],
      colorsMapping: { michi: ORANGE },
      margin: { top: 12, right: 12, bottom: 12, left: 12 },
      width: w, height: h,
      series: AREA_SERIES,
    }),
  },
];

const hosts = ref<(HTMLDivElement | null)[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const els: any[] = [];
let ro: ResizeObserver | null = null;
let raf = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setHost(el: any, i: number) {
  hosts.value[i] = (el as HTMLDivElement) ?? null;
}

function buildOne(i: number) {
  const host = hosts.value[i];
  const spec = SPECS[i];
  if (!host) return;
  const w = Math.max(180, Math.floor(host.clientWidth));
  host.querySelector(spec.tag)?.remove();
  const el = document.createElement(spec.tag);
  Object.assign(el, spec.build(w, CHART_H));
  (el as HTMLElement).style.display = "block";
  host.appendChild(el);
  els[i] = el;
}

onMounted(async () => {
  // Register the web components client-side only (never during SSR).
  await import("@michi-vz/wc");
  SPECS.forEach((_, i) => buildOne(i));

  // Rebuild a chart when its card width changes (rAF-throttled). Rebuilding
  // (vs. setting .width) lets the scatter recompute its framing domain too.
  ro = new ResizeObserver((entries) => {
    let dirty = false;
    for (const e of entries) {
      const i = hosts.value.indexOf(e.target as HTMLDivElement);
      const el = els[i];
      if (i < 0) continue;
      const w = Math.max(180, Math.floor(e.contentRect.width));
      if (!el || el.width !== w) dirty = true;
    }
    if (!dirty) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => SPECS.forEach((_, i) => buildOne(i)));
  });
  hosts.value.forEach((h) => h && ro!.observe(h));
});

onBeforeUnmount(() => {
  ro?.disconnect();
  cancelAnimationFrame(raf);
});
</script>

<template>
  <section class="cat-band">
    <div class="cat-band-inner">
      <div class="mv-section-head">
        <span class="mv-mark">&#10022;</span>
        <h2>Same engine, secretly a cat</h2>
      </div>
      <p class="mv-lede">
        Every block below is a real michi-vz chart (a line, a scatter, a radar, an area),
        fed data until it turned into Michi, our orange cat in Geneva. The serious demos
        live in the atlas underneath.
      </p>

      <div class="cat-grid">
        <figure v-for="(s, i) in SPECS" :key="s.tag" class="cat-card">
          <div class="cat-chart" :ref="(el) => setHost(el, i)"></div>
          <figcaption>
            <span class="cat-title">{{ s.title }}</span>
            <span class="cat-sub">{{ s.sub }}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-band {
  max-width: 1152px;
  margin: 8px auto 0;
  padding: 8px 24px 8px;
}
.mv-lede {
  max-width: 60ch;
}

/* Swiss grid: four equal cells joined by hairline rules (gap over a divider bg). */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--vp-c-divider);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 6px;
}
.cat-card {
  margin: 0;
  background: var(--vp-c-bg);
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cat-chart {
  height: 152px;
  width: 100%;
}
.cat-card figcaption {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cat-title {
  font-family: "Josefin Sans", system-ui, sans-serif;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}
.cat-sub {
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--vp-c-text-3);
}

@media (max-width: 960px) {
  .cat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 520px) {
  .cat-grid { grid-template-columns: 1fr; }
}
</style>

<!--
  Non-scoped: reach INTO the light-DOM web components to strip every bit of
  chart chrome, leaving only the data silhouette (the cat). Scoped to `.cat-band`
  so no other chart on the site is affected.
-->
<style>
.cat-band .mv-x-axis,
.cat-band .mv-y-axis,
.cat-band .mv-axis-label,
.cat-band .mv-grid,
.cat-band .mv-zero-line,
.cat-band .mv-tick,
.cat-band .mv-tick-dot,
.cat-band .mv-radar-grid,
.cat-band .title,
.cat-band .mv-crosshair,
.cat-band .mv-mouse-line,
.cat-band .mv-hover-line {
  display: none !important;
}
.cat-band .cat-chart svg {
  overflow: visible;
}
</style>
