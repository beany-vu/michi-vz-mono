<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import ChartAtlas from "./ChartAtlas.vue";

const { Layout } = DefaultTheme;

// Small, factual proof chips shown under the hero actions. No marketing fluff.
const META = [
  "12 charts",
  "5 outputs",
  "SVG or canvas",
  "getContext() on every chart",
  "tree-shakeable",
  "MIT",
];
</script>

<template>
  <Layout>
    <!-- Heraldic eyebrow above the hero name -->
    <template #home-hero-info-before>
      <div class="mv-eyebrow">The chart atlas&nbsp;·&nbsp;pick a chart by the question</div>
    </template>

    <!-- Factual meta chips under the hero CTAs -->
    <template #home-hero-actions-after>
      <div class="mv-hero-meta">
        <span v-for="m in META" :key="m" class="mv-meta-chip">{{ m }}</span>
      </div>
    </template>

    <!-- The returning live chart catalog, below the feature row -->
    <template #home-features-after>
      <ChartAtlas />
    </template>
  </Layout>
</template>
