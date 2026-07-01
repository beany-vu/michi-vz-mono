<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import CatBand from "./CatBand.vue";
import ChartAtlas from "./ChartAtlas.vue";

const { Layout } = DefaultTheme;

// Small, factual proof chips shown under the hero actions. No marketing fluff.
const META = [
  "SVG · canvas · WebGPU",
  "getContext() on every chart",
  "tree-shakeable",
];
</script>

<template>
  <Layout>
    <!-- Factual meta line under the hero CTAs - plain text, one accent-free line -->
    <template #home-hero-actions-after>
      <div class="mv-hero-meta">
        <span v-for="m in META" :key="m" class="mv-meta-chip">{{ m }}</span>
      </div>
    </template>

    <!-- The stock feature grid is replaced by two calm blocks: the red-cat
         signature band, then the chart atlas grid (kept as the centerpiece). -->
    <template #home-features-after>
      <CatBand />
      <ChartAtlas />
    </template>
  </Layout>
</template>
