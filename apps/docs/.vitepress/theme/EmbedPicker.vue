<script setup lang="ts">
// Shared embedding-model picker: a dropdown of models (each labelled with its download
// size, so a heavier pick is a deliberate choice) + a Load button that shows a live % while
// the weights stream in - so people know it's progressing and worth the wait. Model state is
// shared across every lab (useEmbedder), so loading here lights up all three. Selecting a
// model does NOT auto-download; you press Load, having seen the size.
import { computed } from "vue";
import { useEmbedder, EMBED_CATALOG } from "./useEmbedder";

const emit = defineEmits<{ (e: "loaded"): void }>();
const { status, pct, model, loadedModel, loadBert } = useEmbedder();
const name = computed(() => EMBED_CATALOG.find((m) => m.id === model.value)?.name ?? "BERT");
const fmtSize = (mb: number) => (mb >= 1000 ? `~${(mb / 1000).toFixed(1)} GB` : `~${mb} MB`);

async function go() {
  await loadBert(model.value);
  if (status.value === "ready") emit("loaded");
}
</script>

<template>
  <div class="ep">
    <select v-model="model" :disabled="status === 'loading'" aria-label="embedding model">
      <option v-for="m in EMBED_CATALOG" :key="m.id" :value="m.id">{{ m.name }} · {{ fmtSize(m.sizeMB) }}</option>
    </select>
    <button class="ep-btn" :class="{ ready: status === 'ready' && loadedModel === model }" @click="go" :disabled="status === 'loading'">
      <span v-if="status === 'loading'">Loading {{ name }}… {{ pct }}%</span>
      <span v-else-if="status === 'ready' && loadedModel === model">✓ {{ name }}</span>
      <span v-else-if="status === 'error'">⚠ retry</span>
      <span v-else>⚡ Load {{ name }}</span>
    </button>
  </div>
</template>
