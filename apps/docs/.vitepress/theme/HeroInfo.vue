<script setup lang="ts">
// Custom hero-info block (overrides VitePress's default name/text/tagline) so the
// headline dominates and can carry a single red accent word - the one red moment
// in the hero. Copy is read from the page's own frontmatter (hero.eyebrow /
// hero.headLead / hero.headAccent / hero.tagline), so each locale's index.md
// localizes it for free. Actions and the crest image still come from frontmatter.
import { useData } from "vitepress";

const { frontmatter } = useData();
</script>

<template>
  <div class="mv-hero-info">
    <p v-if="frontmatter.hero?.eyebrow" class="mv-eyebrow">{{ frontmatter.hero.eyebrow }}</p>
    <!-- headLead + accent kept on ONE line so the inter-word space survives Vue's
         whitespace condensing (the source of the earlier "enjoydebugging" bug). -->
    <h1 class="mv-headline">{{ frontmatter.hero?.headLead }} <span v-if="frontmatter.hero?.headAccent" class="mv-head-accent">{{ frontmatter.hero.headAccent }}</span></h1>
    <p v-if="frontmatter.hero?.tagline" class="mv-hero-sub">{{ frontmatter.hero.tagline }}</p>
  </div>
</template>
