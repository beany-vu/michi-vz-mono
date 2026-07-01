// Embeddings - vectorize text (a chart's context, a series label) so we can measure
// semantic similarity: search charts, cluster series, dashboard-wide RAG. The model
// path lazy-loads Transformers.js (BERT / MiniLM, WebGPU) and is opt-in; the default
// is a deterministic, model-free hashing embedder so similarity works offline and is
// fully testable. (MiniLM has a training-data caveat - disclose before production use.)
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
    v[fnv1a(t) % dim] += 1; // whole word - keeps exact matches strong
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

export interface ReconcileGroup {
  /** Representative label for the group (the cluster medoid). */
  name: string;
  /** Every raw label that merged into this group, in encounter order. */
  members: string[];
}

export interface ReconcileOptions extends EmbedOptions {
  /** Minimum cosine to merge into a group. Default: 0.7 (transformers) / 0.6 (hash). */
  threshold?: number;
  /** Confidence gate: a label only merges when it is at least this much closer to its best
   * group than to the next-best (best - secondBest >= margin). Default 0.05; set 0 to disable. */
  margin?: number;
  /** Reuse a prebuilt embedder instead of creating one from the EmbedOptions. */
  embedder?: Embedder;
}

/** Pick a group's representative: the MEDOID (member closest to all the others), with a small
 * tidiness nudge toward a clean Title-Case, single-spaced name so groups read naturally. */
function medoid(members: string[], vecs: number[][]): string {
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < members.length; i++) {
    let s = 0;
    for (let j = 0; j < members.length; j++) if (i !== j) s += cosineSimilarity(vecs[i], vecs[j]);
    if (/^[A-Z][a-z]/.test(members[i]) && !/\s{2,}/.test(members[i])) s += 1e-3;
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return members[best];
}

/** Merge messy labels that mean the same thing. The same entity often arrives spelled many
 * ways ("United States" / "united states" / "USA"); grouping by exact match splits it into
 * several buckets with wrong totals. This embeds each label and greedily clusters by cosine
 * similarity (single-linkage), with a confidence gate so a label only joins a group when it is
 * decisively closer to it than to any other - distinct entities never collapse just by being
 * near. Returns groups whose `name` is the medoid; sum your series by `name` for clean totals.
 *
 * The model-free default merges spelling/case/typos offline; `{ backend: "transformers" }` also
 * merges synonyms/abbreviations/translations. For authoritative canonical names (USA ->
 * United States), pair this with an alias list or an LLM (see the docs "Certify" recipe). */
export async function reconcileLabels(
  labels: string[],
  options: ReconcileOptions = {}
): Promise<ReconcileGroup[]> {
  const embedder = options.embedder ?? (await createEmbedder(options));
  const threshold = options.threshold ?? (embedder.backend === "transformers" ? 0.7 : 0.6);
  const margin = options.margin ?? 0.05;
  const vecs = await embedder.embed(labels);
  const clusters: { members: string[]; vecs: number[][] }[] = [];
  labels.forEach((label, i) => {
    let best: (typeof clusters)[number] | null = null;
    let bestSim = -Infinity;
    let secondSim = -Infinity;
    for (const c of clusters) {
      let s = 0;
      for (const v of c.vecs) {
        const x = cosineSimilarity(vecs[i], v);
        if (x > s) s = x; // single-linkage: closeness to the nearest member
      }
      if (s > bestSim) {
        secondSim = bestSim;
        bestSim = s;
        best = c;
      } else if (s > secondSim) {
        secondSim = s;
      }
    }
    const confident = best && bestSim >= threshold && (secondSim < 0 || bestSim - secondSim >= margin);
    if (confident && best) {
      best.members.push(label);
      best.vecs.push(vecs[i]);
    } else {
      clusters.push({ members: [label], vecs: [vecs[i]] });
    }
  });
  return clusters.map((c) => ({ name: medoid(c.members, c.vecs), members: c.members }));
}
