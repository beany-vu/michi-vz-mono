<script setup lang="ts">
// The stock VPFooter only renders on sidebar-less pages (the homepage). This
// mirrors the same localized theme.footer strings at the bottom of every other
// page, via the layout-bottom slot. The VPFooter class is kept on the root so
// the existing .VPFooter .mv-foot-* rules in custom.css apply unchanged.
import { useData } from "vitepress";
import { useSidebar } from "vitepress/theme";

const { theme, frontmatter } = useData();
const { hasSidebar } = useSidebar();
</script>

<template>
  <footer
    v-if="frontmatter.layout !== 'home' && theme.footer"
    class="VPFooter mv-page-footer"
    :class="{ 'has-sidebar': hasSidebar }"
  >
    <div class="mv-page-footer-container">
      <!-- eslint-disable-next-line vue/no-v-html - trusted HTML from the site config -->
      <p v-if="theme.footer.message" class="message" v-html="theme.footer.message"></p>
      <p v-if="theme.footer.copyright" class="copyright" v-html="theme.footer.copyright"></p>
    </div>
  </footer>
</template>

<style scoped>
.mv-page-footer {
  position: relative;
  z-index: var(--vp-z-index-footer, 10);
  border-top: 1px solid var(--vp-c-gutter);
  padding: 32px 24px;
  background-color: var(--vp-c-bg);
}
@media (min-width: 960px) {
  .mv-page-footer.has-sidebar {
    padding-left: calc(var(--vp-sidebar-width) + 32px);
  }
}
@media (min-width: 1440px) {
  .mv-page-footer.has-sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width) + 32px);
  }
}
.mv-page-footer-container {
  margin: 0 auto;
  max-width: var(--vp-layout-max-width);
  text-align: center;
}
.message,
.copyright {
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}
</style>
