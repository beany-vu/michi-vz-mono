// Shared embedder for the three embeddings labs (Merge / Find / Sort). MiniLM is big,
// so we load it ONCE and share the extractor + status across every lab on the page via
// module-level singletons: load BERT in any lab and all three light up. Model-free
// (hash, char n-grams) is the always-available default; "Load BERT" upgrades to true
// meaning. Client-only (dynamic import) so SSR is untouched.
import { ref } from "vue";

type Status = "" | "loading" | "ready" | "error";

export interface EmbedModel {
  id: string;
  name: string;
  /** Approx download size in MB. */
  sizeMB: number;
  note: string;
}

// MiniLM has bigger, more accurate siblings - same idea, more nuance, larger download.
// Ordered small → large; the picker shows the size so a heavier pick is a choice, not a
// surprise. All run in-browser via Transformers.js (the @insights embeddings backend).
export const EMBED_CATALOG: EmbedModel[] = [
  { id: "Xenova/all-MiniLM-L6-v2", name: "MiniLM-L6", sizeMB: 23, note: "fast default" },
  { id: "Xenova/all-MiniLM-L12-v2", name: "MiniLM-L12", sizeMB: 34, note: "a bit sharper" },
  { id: "Xenova/all-mpnet-base-v2", name: "MPNet-base", sizeMB: 109, note: "best quality" },
];

// Module scope = shared singletons. Every useEmbedder() call returns the SAME refs.
const status = ref<Status>("");
const pct = ref(0);
const errMsg = ref("");
const model = ref<string>(EMBED_CATALOG[0].id);
const loadedModel = ref<string>("");
/* eslint-disable @typescript-eslint/no-explicit-any */
let extractor: any = null;
let coreMod: any = null;
let insMod: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Lazy-load @michi-vz/core + /insights once (charts + hash embedder + cosine). */
async function ensureLib() {
  if (!insMod || !coreMod) {
    const [c, i] = await Promise.all([import("@michi-vz/core"), import("@michi-vz/insights")]);
    coreMod = c;
    insMod = i;
  }
  return { core: coreMod, ins: insMod };
}

/** Lazy-load the chosen embedding model (Transformers.js) from the CDN. Idempotent per
 * model; picking a different model and calling again swaps it (re-embeds on next use). */
async function loadBert(modelId?: string) {
  const want = modelId ?? model.value;
  model.value = want;
  if (status.value === "loading") return;
  if (status.value === "ready" && loadedModel.value === want) return;
  status.value = "loading";
  pct.value = 0;
  errMsg.value = "";
  extractor = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3"
    );
    mod.env.allowLocalModels = false;
    extractor = await mod.pipeline("feature-extraction", want, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (p: any) => {
        if (p.status === "progress" && p.progress) pct.value = Math.round(p.progress);
      },
    });
    loadedModel.value = want;
    status.value = "ready";
  } catch (e) {
    status.value = "error";
    errMsg.value = e instanceof Error ? e.message : String(e);
  }
}

/** Embed texts. backend "bert" uses MiniLM when ready; otherwise the model-free hash. */
async function embed(texts: string[], backend: "hash" | "bert"): Promise<number[][]> {
  const { ins } = await ensureLib();
  if (backend === "bert" && extractor) {
    const out: number[][] = [];
    for (const t of texts) {
      const r = await extractor(t, { pooling: "mean", normalize: true });
      out.push(Array.from(r.data) as number[]);
    }
    return out;
  }
  return texts.map((t) => ins.hashEmbed(t, 128));
}

export function useEmbedder() {
  return {
    status,
    pct,
    errMsg,
    model,
    loadedModel,
    loadBert,
    embed,
    ensureLib,
    /** True once a model is loaded; labs default their backend to "bert" then. */
    bertReady: () => !!extractor,
  };
}
