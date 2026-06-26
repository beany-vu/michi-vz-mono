<script setup lang="ts">
// Renders a MUI-style API props table from the build-time generated
// .vitepress/data/props.json (produced by scripts/extract-props.mjs from
// packages/core/src/types.ts). Chart-specific props first, then a collapsible
// "Common props" block shared by every chart.
import { computed } from "vue";
import data from "../data/props.json";

const props = defineProps<{ chart: string }>();
const entry = computed(() => (data.charts as Record<string, any>)[props.chart]);
const specific = computed(() => entry.value?.props.filter((p: any) => !p.common) ?? []);
const common = computed(() => entry.value?.props.filter((p: any) => p.common) ?? []);
</script>

<template>
  <div v-if="entry" class="mv-props">
    <table class="mv-props-table">
      <thead>
        <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr v-for="p in specific" :key="p.name">
          <td class="mv-c-name">
            <code>{{ p.name }}</code><span v-if="!p.optional" class="mv-req" title="required">*</span>
          </td>
          <td><code class="mv-c-type">{{ p.type }}</code></td>
          <td>
            <code v-if="p.default" class="mv-c-default">{{ p.default }}</code>
            <span v-else class="mv-dash">—</span>
          </td>
          <td>{{ p.description || "—" }}</td>
        </tr>
      </tbody>
    </table>

    <details class="mv-props-common">
      <summary>Common props — shared by every chart ({{ common.length }})</summary>
      <table class="mv-props-table">
        <thead>
          <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in common" :key="p.name">
            <td class="mv-c-name"><code>{{ p.name }}</code></td>
            <td><code class="mv-c-type">{{ p.type }}</code></td>
            <td>
              <code v-if="p.default" class="mv-c-default">{{ p.default }}</code>
              <span v-else class="mv-dash">—</span>
            </td>
            <td>{{ p.description || "—" }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
  <p v-else class="mv-props-missing">No API data for <code>{{ chart }}</code>.</p>
</template>

<style scoped>
.mv-props { margin: 18px 0; }
.mv-props-table {
  display: table;
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 14px;
}
.mv-props-table th,
.mv-props-table td {
  border: 1px solid var(--vp-c-divider);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}
.mv-props-table th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
  white-space: nowrap;
}
.mv-props-table tr:nth-child(even) td { background: var(--vp-c-bg-soft); }
.mv-c-name code { font-weight: 600; color: var(--vp-c-brand-1); white-space: nowrap; }
.mv-c-type, .mv-c-default { font-size: 12.5px; white-space: pre-wrap; }
.mv-c-type { color: var(--vp-c-text-2); }
.mv-req { color: var(--vp-c-danger-1, #e4572e); margin-left: 2px; font-weight: 700; }
.mv-dash { color: var(--vp-c-text-3); }
.mv-props-common { margin-top: 14px; }
.mv-props-common summary {
  cursor: pointer;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  padding: 6px 0;
}
.mv-props-common[open] summary { margin-bottom: 8px; }
.mv-props-missing { color: var(--vp-c-text-3); }
</style>
