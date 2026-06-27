// Embeddings — vectorize text (a chart's context, a series label) so we can measure
// semantic similarity: search charts, cluster series, dashboard-wide RAG. The model
// path lazy-loads Transformers.js (BERT / MiniLM, WebGPU) and is opt-in; the default
// is a deterministic, model-free hashing embedder so similarity works offline and is
// fully testable. (MiniLM has a training-data caveat — disclose before production use.)
import { optionalImport } from "../internal/lazyImport";

/** Cosine similarity of two vectors (0 when either is zero-length). */
export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic, model-free hashing embedder → L2-normalized vector. Hashes each
 * word PLUS its character 3-grams (with `#word#` boundaries), so fuzzy lexical matches
 * work: "customer" ≈ "customers", "forecast" ≈ "forecasting", typos partially match.
 * True synonyms with no shared letters (revenue ≈ income) still need a real model
 * (`backend:"transformers"`). Crude but useful; the always-available fallback. */
export function hashEmbed(text: string, dim = 128): number[] {
  const v = new Array(dim).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    v[fnv1a(t) % dim] += 1; // whole word — keeps exact matches strong
    const w = `#${t}#`;
    if (w.length <= 3) {
      v[fnv1a(w) % dim] += 1;
    } else {
      for (let i = 0; i + 3 <= w.length; i++) v[fnv1a(w.slice(i, i + 3)) % dim] += 1;
    }
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export type EmbedBackend = "hash" | "transformers";

export interface EmbedOptions {
  backend?: EmbedBackend;
  model?: string;
  dim?: number;
}

export interface Embedder {
  backend: EmbedBackend;
  embed(texts: string[]): Promise<number[][]>;
}

/** Build an embedder. backend:"transformers" lazy-loads MiniLM (WebGPU) and falls
 * back to the hashing embedder if the dep/model is unavailable. */
export async function createEmbedder(options: EmbedOptions = {}): Promise<Embedder> {
  if ((options.backend ?? "hash") === "transformers") {
    const mod = await optionalImport<{ pipeline?: (task: string, model?: string) => Promise<(t: string, o?: unknown) => Promise<{ data: ArrayLike<number> }>> }>(
      "@huggingface/transformers"
    );
    const pipeline = mod?.pipeline;
    if (pipeline) {
      try {
        const extractor = await pipeline("feature-extraction", options.model ?? "Xenova/all-MiniLM-L6-v2");
        return {
          backend: "transformers",
          async embed(texts) {
            const out: number[][] = [];
            for (const t of texts) {
              const res = await extractor(t, { pooling: "mean", normalize: true });
              out.push(Array.from(res.data));
            }
            return out;
          },
        };
      } catch {
        /* fall through to hash */
      }
    }
  }
  const dim = options.dim ?? 128;
  return {
    backend: "hash",
    async embed(texts) {
      return texts.map((t) => hashEmbed(t, dim));
    },
  };
}

export interface SimilarItem<T> {
  item: T;
  score: number;
}

/** Rank items by semantic similarity of `text(item)` to `query` (descending). */
export async function findSimilar<T>(
  query: string,
  items: T[],
  text: (item: T) => string,
  options: EmbedOptions = {}
): Promise<SimilarItem<T>[]> {
  const embedder = await createEmbedder(options);
  const [q] = await embedder.embed([query]);
  const vecs = await embedder.embed(items.map(text));
  return items
    .map((item, i) => ({ item, score: cosineSimilarity(q, vecs[i]) }))
    .sort((a, b) => b.score - a.score);
}
