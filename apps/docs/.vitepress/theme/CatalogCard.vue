<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { previews } from "./previews";

const props = defineProps<{
  examplesKey: string;
  slug: string;
  name: string;
  family: string;
  roman: string;
  blurb: string;
  tag: string;
}>();

// Radar has its own circular rings, so it opts out of the L-axis frame.
const showFrame = props.examplesKey !== "radar-chart";

const stage = ref<HTMLDivElement>();
const chart = shallowRef<{ update: (p: any) => void; destroy: () => void } | null>(null);
const mounted = ref(false);
let ro: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let raf = 0;
const PREVIEW_H = 124;
// Tiny thumbnail margin: axis labels are hidden, so marks fill the frame. This
// is the whole reason the card mounts the engine (the <michi-vz-*> elements
// expose no `margin`, so a wc thumbnail can't escape the large default margins).
const THUMB_MARGIN = { top: 6, right: 6, bottom: 8, left: 10 };

// Mount the real chart engine once, sized to the compact preview pane.
function mountChart() {
  if (mounted.value || !stage.value) return;
  mounted.value = true;
  const ex = previews[props.examplesKey];
  if (!ex || !stage.value) return;

  const height = stage.value.clientHeight || PREVIEW_H;
  const sized = (w: number) => ({
    ...ex.props,
    width: Math.max(160, w),
    height,
    margin: THUMB_MARGIN,
  });

  stage.value.setAttribute("aria-hidden", "true"); // the card link supplies the name
  chart.value = ex.mount(stage.value, sized(stage.value.clientWidth));

  ro = new ResizeObserver((entries) => {
    const w = Math.max(160, Math.floor(entries[0].contentRect.width));
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => chart.value?.update(sized(w)));
  });
  ro.observe(stage.value);
}

onMounted(() => {
  if (!stage.value) return;
  // Lazy-mount: only build the chart when the card nears the viewport.
  if (typeof IntersectionObserver === "undefined") {
    mountChart();
    return;
  }
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io?.disconnect();
        mountChart();
      }
    },
    { rootMargin: "240px" },
  );
  io.observe(stage.value);
});

onBeforeUnmount(() => {
  ro?.disconnect();
  io?.disconnect();
  cancelAnimationFrame(raf);
  chart.value?.destroy();
});
</script>

<template>
  <a
    class="mv-card"
    :href="`/charts/${slug}`"
    :data-family="family.toLowerCase()"
    :aria-label="`${name} chart, ${family}`"
  >
    <div class="mv-card-crest" aria-hidden="true">
      <svg class="mv-crest-mark" viewBox="0 0 24 40" fill="none">
        <circle cx="12" cy="8" r="5.2" stroke="currentColor" stroke-width="2" />
        <line x1="12" y1="13" x2="12" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="12" y1="29" x2="17.5" y2="29" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="12" y1="33" x2="16" y2="33" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <div class="mv-card-crest-foot">
        <div class="mv-roman">{{ roman }}</div>
        <h3 class="mv-card-name">{{ name }}</h3>
        <div class="mv-card-family">{{ family }}</div>
      </div>
    </div>

    <div class="mv-card-body">
      <div class="mv-card-preview" :data-frame="showFrame">
        <div class="mv-card-stage" ref="stage"></div>
        <div class="mv-card-skeleton" v-if="!mounted"></div>
      </div>
      <p class="mv-card-desc">{{ blurb }}</p>
      <div class="mv-card-foot">
        <span class="mv-card-tag">{{ tag }}</span>
        <span class="mv-card-go">View&nbsp;<span class="mv-arw">&rsaquo;</span></span>
      </div>
    </div>
  </a>
</template>
