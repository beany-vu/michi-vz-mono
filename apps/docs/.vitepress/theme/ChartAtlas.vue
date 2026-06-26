<script setup lang="ts">
import { ref } from "vue";
import CatalogCard from "./CatalogCard.vue";

// Single source for the home gallery. Each card pulls its LIVE chart from
// @michi-vz/examples by `examplesKey`, and links to its spec page by `slug`,
// so the home never drifts from the chart pages. Order + roman numerals match
// the chart catalog order (charts/index.md).
const CARDS = [
  { examplesKey: "line-chart", slug: "line", name: "Line", family: "Trends", roman: "I", blurb: "Trends over time across one or many series. The dashed run is a gap in the data (detectGaps).", tag: "<michi-vz-line-chart> · SVG/canvas" },
  { examplesKey: "area-chart", slug: "area", name: "Area", family: "Composition", roman: "II", blurb: "Part to whole over time: how each component's share of a stacked total shifts.", tag: "<michi-vz-area-chart> · SVG/canvas" },
  { examplesKey: "scatter-chart", slug: "scatter", name: "Scatter", family: "Correlation", roman: "III", blurb: "The relationship between two numeric variables; bubble size encodes a third.", tag: "<michi-vz-scatter-chart> · SVG/canvas" },
  { examplesKey: "range-chart", slug: "range", name: "Range", family: "Trends", roman: "IV", blurb: "Min to max bands per series: forecasts, confidence intervals, or observed ranges.", tag: "<michi-vz-range-chart> · SVG/canvas" },
  { examplesKey: "ribbon-chart", slug: "ribbon", name: "Ribbon", family: "Composition", roman: "V", blurb: "Stacked columns per period, linked by ribbons that trace each category over time.", tag: "<michi-vz-ribbon-chart> · SVG/canvas" },
  { examplesKey: "radar-chart", slug: "radar", name: "Radar", family: "Comparison", roman: "VI", blurb: "Compare several entities across a shared set of axes at a glance.", tag: "<michi-vz-radar-chart> · SVG/canvas" },
  { examplesKey: "vertical-stack-bar-chart", slug: "vertical-stack-bar", name: "Vertical Stack Bar", family: "Composition", roman: "VII", blurb: "Stacked vertical bars per category, with an explicit missing-data guard.", tag: "<michi-vz-vertical-stack-bar-chart> · SVG/canvas" },
  { examplesKey: "comparable-horizontal-bar-chart", slug: "comparable", name: "Comparable Bar", family: "Comparison", roman: "VIII", blurb: "Two overlaid horizontal sub-bars per label: a based vs compared value.", tag: "<michi-vz-comparable-horizontal-bar-chart> · SVG/canvas" },
  { examplesKey: "dual-horizontal-bar-chart", slug: "dual", name: "Dual Bar", family: "Comparison", roman: "IX", blurb: "Diverging bars from a centre line: population pyramids and tornado charts.", tag: "<michi-vz-dual-horizontal-bar-chart> · SVG/canvas" },
  { examplesKey: "bar-bell-chart", slug: "bar-bell", name: "Bar-Bell", family: "Composition", roman: "X", blurb: "Cumulative horizontal segments per row with end-cap circles at each step.", tag: "<michi-vz-bar-bell-chart> · SVG/canvas" },
  { examplesKey: "gap-chart", slug: "gap", name: "Gap", family: "Comparison", roman: "XI", blurb: "Two values per label joined by a gap bar that emphasises the difference.", tag: "<michi-vz-gap-chart> · SVG/canvas" },
];

const FAMILIES = ["All", "Trends", "Composition", "Comparison", "Correlation"];
const active = ref("All");
const visible = (family: string) => active.value === "All" || active.value === family;
</script>

<template>
  <section id="chart-atlas" class="mv-atlas">
    <div class="mv-section-head">
      <span class="mv-mark">&#10022;</span>
      <h2>Chart atlas</h2>
      <span class="mv-rule"></span>
      <span class="mv-section-roman">§ I</span>
    </div>
    <p class="mv-lede">
      Pick a chart by the question you are asking. Every card is a live component on real data:
      hover to feel the interaction, click to open its full spec.
    </p>

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
      <CatalogCard v-for="c in CARDS" v-show="visible(c.family)" :key="c.slug" v-bind="c" />
    </div>
  </section>
</template>
