// Shared SMALL in-browser LLM for the optional "Certify" step - the second specialist in a
// cascade (not a mixture-of-experts; that's internal to one model). The embedding model
// PROPOSES merges cheaply; this small generative model CONFIRMS each group is one entity and
// returns the canonical name - the standard entity-resolution recipe (embeddings narrow,
// LLM adjudicates). Deliberately small: nothing here is multi-GB. Runs via WebLLM (MLC,
// WebGPU); model ids + sizes are from MLC's prebuilt config.ts. Mirrors narrate()'s WebLLM path.
import { ref } from "vue";

export interface LlmModel {
  id: string;
  name: string;
  /** Approx download in MB (from MLC prebuiltAppConfig vram_required_MB). */
  sizeMB: number;
  note: string;
}

// Small only. Qwen first: smallest that still knows multilingual country names
// (Deutschland, Nippon). Phi-3.5 (3.7 GB) and DeepSeek-7B (5.1 GB) are intentionally absent.
export const LLM_CATALOG: LlmModel[] = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", name: "Qwen2.5 (0.5B)", sizeMB: 945, note: "smallest, multilingual" },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Llama 3.2 (1B)", sizeMB: 879, note: "small, general" },
  { id: "gemma-2-2b-it-q4f16_1-MLC", name: "Gemma 2 (2B)", sizeMB: 1895, note: "most reliable, larger" },
];

type Status = "" | "loading" | "ready" | "error";
const status = ref<Status>("");
const pct = ref(0);
const errMsg = ref("");
const loadedId = ref("");
/* eslint-disable @typescript-eslint/no-explicit-any */
let engine: any = null;
let webllmMod: any = null;
/* eslint-enable @typescript-eslint/no-explicit-any */

async function ensureWebllm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!webllmMod) webllmMod = await import(/* @vite-ignore */ "https://esm.run/@mlc-ai/web-llm");
  return webllmMod;
}

async function load(model: LlmModel) {
  if (status.value === "loading") return;
  if (status.value === "ready" && loadedId.value === model.id) return;
  status.value = "loading";
  pct.value = 0;
  errMsg.value = "";
  engine = null;
  try {
    const mod = await ensureWebllm();
    const known = (mod.prebuiltAppConfig?.model_list ?? []).some((m: { model_id: string }) => m.model_id === model.id);
    if (!known) throw new Error(`"${model.id}" isn't in this WebLLM build's catalog.`);
    engine = await mod.CreateMLCEngine(model.id, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initProgressCallback: (p: any) => { if (typeof p?.progress === "number") pct.value = Math.round(p.progress * 100); },
    });
    loadedId.value = model.id;
    status.value = "ready";
  } catch (e) {
    status.value = "error";
    // WebGPU is the usual culprit on unsupported browsers.
    errMsg.value = e instanceof Error ? e.message : String(e);
    throw e;
  }
}

/** Short, deterministic completion from the loaded model. */
async function generate(prompt: string, maxTokens = 16): Promise<string> {
  if (!engine) throw new Error("No model loaded.");
  const r = await engine.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: maxTokens,
  });
  return (r.choices?.[0]?.message?.content ?? "").trim();
}

export function useLlm() {
  return { status, pct, errMsg, loadedId, load, generate };
}
