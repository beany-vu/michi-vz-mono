<script setup lang="ts">
// Persona feature tiles under the hero. Replaces VitePress's `features:` grid so
// the icons are monochrome and carry the michi-vz brand colour (multicolour emoji
// could not be themed). Copy follows the active locale.
import { computed } from "vue";
import { useData } from "vitepress";
import { features, localeKeyFromLang, type FeatureIcon } from "../i18n";

const { lang } = useData();
const tiles = computed(() => features[localeKeyFromLang(lang.value)]);

// Lucide-style stroke icons, drawn in currentColor (set to brand red by CSS).
const ICONS: Record<FeatureIcon, string> = {
  inspect: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  ai: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8.5 13.2 11 15.5 12 13.2 13 12 15.5 10.8 13 8.5 12 10.8 11z"/>',
  a11y: '<circle cx="12" cy="4.2" r="1.4"/><path d="M4.5 8.2c2.4 1 4.9 1.5 7.5 1.5s5.1-.5 7.5-1.5"/><path d="M12 9.7v5M12 14.7 8.5 20.5M12 14.7 15.5 20.5"/>',
  local: '<rect width="15" height="10" x="4.5" y="11" rx="2.2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
};
</script>

<template>
  <section class="mv-features" aria-label="Highlights">
    <div class="mv-features-grid">
      <article v-for="t in tiles" :key="t.title" class="mv-feature">
        <span class="mv-feature-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
               stroke-linecap="round" stroke-linejoin="round" v-html="ICONS[t.icon]" />
        </span>
        <h3 class="mv-feature-title">{{ t.title }}</h3>
        <p class="mv-feature-detail">{{ t.detail }}</p>
      </article>
    </div>
  </section>
</template>
