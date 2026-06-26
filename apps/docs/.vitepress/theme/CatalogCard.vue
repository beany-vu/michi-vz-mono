<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef } from "vue";
import { examples } from "@michi-vz/examples";

const props = defineProps<{
  examplesKey: string;
  slug: string;
  name: string;
  family: string;
  roman: string;
  blurb: string;
  tag: string;
}>();

const stage = ref<HTMLDivElement>();
const node = shallowRef<any>(null);
const mounted = ref(false);
let ro: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let raf = 0;
const PREVIEW_H = 124;

// Mount the real web component once, sized to fit the compact preview pane.
async function mountChart() {
  if (mounted.value || !stage.value) return;
  mounted.value = true;
  await import("@michi-vz/wc");
  const ex = (examples as any)[props.examplesKey]?.[0];
  if (!ex || !stage.value) return;

  const el: any = document.createElement(ex.element);
  // We own width/height for the thumbnail; drop title/size from the example.
  const { title: _t, width: _w, height: _h, margin, ...rest } = ex.props;
  Object.assign(el, rest);
  el.height = PREVIEW_H;
  if (margin) el.margin = margin;
  el.width = Math.max(160, stage.value.clientWidth);
  el.style.display = "block";
  el.setAttribute("aria-hidden", "true"); // the card link supplies the name
  stage.value.appendChild(el);
  node.value = el;

  ro = new ResizeObserver((entries) => {
    const w = Math.max(160, Math.floor(entries[0].contentRect.width));
    if (w === el.width) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.width = w;
    });
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
      <div class="mv-card-preview">
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
