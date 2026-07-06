<script setup lang="ts">
import { ref, computed } from "vue";
import { useData } from "vitepress";
import CatalogCard from "./CatalogCard.vue";
import { atlas, localeKeyFromLang } from "../i18n";

// Atlas intro copy follows the active locale (this is one shared component).
const { lang } = useData();
const intro = computed(() => atlas[localeKeyFromLang(lang.value)]);

// Single source for the home gallery. Each card pulls its LIVE chart from
// @michi-vz/examples by `examplesKey`, and links to its spec page by `slug`,
// so the home never drifts from the chart pages. Order + roman numerals match
// the chart catalog order (charts/index.md).
const CARDS = [
  { examplesKey: "line-chart", slug: "line", name: "Line", family: "Trends", roman: "I", blurb: "Trends over time across one or many series. The dashed run is a gap in the data (detectGaps).", tag: "<michi-vz-line-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "fan-chart", slug: "fan", name: "Fan", family: "Trends", roman: "II", blurb: "A forecast fan: history, a dashed forecast median, and nested confidence bands that widen with the horizon.", tag: "<michi-vz-fan-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "area-chart", slug: "area", name: "Area", family: "Composition", roman: "III", blurb: "Part to whole over time: how each component's share of a stacked total shifts.", tag: "<michi-vz-area-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "scatter-chart", slug: "scatter", name: "Scatter", family: "Correlation", roman: "IV", blurb: "The relationship between two numeric variables; bubble size encodes a third.", tag: "<michi-vz-scatter-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "range-chart", slug: "range", name: "Range", family: "Trends", roman: "V", blurb: "Min to max bands per series: forecasts, confidence intervals, or observed ranges.", tag: "<michi-vz-range-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "ribbon-chart", slug: "ribbon", name: "Ribbon", family: "Composition", roman: "VI", blurb: "Stacked columns per period, linked by ribbons that trace each category over time.", tag: "<michi-vz-ribbon-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "radar-chart", slug: "radar", name: "Radar", family: "Comparison", roman: "VII", blurb: "Compare several entities across a shared set of axes at a glance.", tag: "<michi-vz-radar-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "vertical-stack-bar-chart", slug: "vertical-stack-bar", name: "Vertical Stack Bar", family: "Composition", roman: "VIII", blurb: "Stacked vertical bars per category, with an explicit missing-data guard.", tag: "<michi-vz-vertical-stack-bar-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "comparable-horizontal-bar-chart", slug: "comparable", name: "Comparable Bar", family: "Comparison", roman: "IX", blurb: "Two overlaid horizontal sub-bars per label: a based vs compared value.", tag: "<michi-vz-comparable-horizontal-bar-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "comparable-vertical-bar-chart", slug: "comparable-vertical-bar", name: "Comparable Vertical Bar", family: "Comparison", roman: "X", blurb: "Two full-bandwidth overlapping columns per category, with a change arrow above each pair - the vertical sibling of Comparable Bar.", tag: "<michi-vz-comparable-vertical-bar-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "dual-horizontal-bar-chart", slug: "dual", name: "Dual Bar", family: "Comparison", roman: "X", blurb: "Diverging bars from a centre line: population pyramids and tornado charts.", tag: "<michi-vz-dual-horizontal-bar-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "bar-bell-chart", slug: "bar-bell", name: "Bar-Bell", family: "Composition", roman: "XI", blurb: "Cumulative horizontal segments per row with end-cap circles at each step.", tag: "<michi-vz-bar-bell-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "gap-chart", slug: "gap", name: "Gap", family: "Comparison", roman: "XII", blurb: "Two values per label joined by a gap bar that emphasises the difference.", tag: "<michi-vz-gap-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "treemap-chart", slug: "treemap", name: "Treemap", family: "Composition", roman: "XIII", blurb: "Hierarchical tiles sized by value; each splits into two parts (e.g. realized vs untapped). Falls back to a stack on narrow screens.", tag: "<michi-vz-treemap-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "pie-chart", slug: "pie", name: "Pie / Donut", family: "Composition", roman: "XIV", blurb: "Slices sized by share of a whole; set innerRadiusRatio for a donut. Per-slice % labels and an optional legend.", tag: "<michi-vz-pie-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "bubble-chart", slug: "bubble", name: "Bubble", family: "Composition", roman: "XV", blurb: "Circles sized by value, pulled into a cluster by gravity; each can split into a realized core inside a lighter untapped ring.", tag: "<michi-vz-bubble-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "sankey-chart", slug: "sankey", name: "Sankey", family: "Flow", roman: "XVI", blurb: "Flows between nodes laid out in columns; each band's thickness is the flow value. Built on d3-sankey.", tag: "<michi-vz-sankey-chart> · SVG · canvas · WebGPU" },
  { examplesKey: "fountain-chart", slug: "fountain", name: "Fountain (Jet d'Eau)", family: "Comparison", roman: "XVII", blurb: "A Jet d'Eau: apex height is the value, the blooming plume is the uncertainty. Categorical x = snapshot/comparison, temporal x = trend.", tag: "<michi-vz-fountain-chart> · SVG · canvas · WebGPU" },
];

const FAMILIES = ["All", "Trends", "Composition", "Comparison", "Correlation", "Flow"];
const active = ref("All");
const visible = (family: string) => active.value === "All" || active.value === family;
</script>

<template>
  <section id="chart-atlas" class="mv-atlas">
    <div class="mv-atlas-intro">
      <p class="mv-eyebrow">{{ intro.eyebrow }}</p>
      <h2 class="mv-atlas-title">
        <span>{{ intro.headLead }}</span>
        <span class="mv-head-accent"> {{ intro.headAccent }}</span>
      </h2>
      <p class="mv-lede">{{ intro.sub }}</p>
    </div>

    <div class="mv-filter" role="group" aria-label="Filter charts by the question they answer">
      <button
        v-for="f in FAMILIES"
        :key="f"
        class="mv-chip"
        :class="{ on: active === f }"
        :aria-pressed="active === f"
        type="button"
        @click="active = f"
      >
        {{ f }}
      </button>
    </div>

    <div class="mv-grid">
      <CatalogCard v-for="(c, i) in CARDS" v-show="visible(c.family)" :key="c.slug" v-bind="c" :roman="String(i + 1)" />
    </div>
  </section>
</template>
