<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import CatBand from "./CatBand.vue";
import WhySpotlight from "./WhySpotlight.vue";
import ChartAtlas from "./ChartAtlas.vue";
import HeroInfo from "./HeroInfo.vue";
import HomeFeatures from "./HomeFeatures.vue";

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
    <!-- Custom hero copy: eyebrow + headline with one red accent word + sub. -->
    <template #home-hero-info>
      <HeroInfo />
    </template>

    <!-- Factual meta line under the hero CTAs - plain text, one accent-free line -->
    <template #home-hero-actions-after>
      <div class="mv-hero-meta">
        <span v-for="m in META" :key="m" class="mv-meta-chip">{{ m }}</span>
      </div>
    </template>

    <!-- The stock feature grid is replaced by three calm blocks: the red-cat
         signature band, the "why" spotlight (live chart + selling-point tabs),
         then the chart atlas grid (kept as the centerpiece). -->
    <template #home-features-after>
      <HomeFeatures />
      <CatBand />
      <WhySpotlight />
      <ChartAtlas />
    </template>
  </Layout>
</template>
