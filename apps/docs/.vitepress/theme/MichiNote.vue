<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import { ui, localeKeyFromLang } from "../i18n";

// The cat behind the name, once, at the bottom of the home page: a photo and one
// honest sentence. Localized like everything else; the photo needs no translation.
const { lang } = useData();
const t = computed(() => ui[localeKeyFromLang(lang.value)]);
</script>

<template>
  <section class="mv-michi-note">
    <img src="/michi.jpg" :alt="t.michiNoteAlt" loading="lazy" width="160" height="160" />
    <div>
      <p class="mv-michi-kicker">{{ t.michiNoteKicker }}</p>
      <p>{{ t.michiNoteText }}</p>
    </div>
  </section>
</template>
