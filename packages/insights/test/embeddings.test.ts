import { describe, it, expect } from "vitest";
import { cosineSimilarity, hashEmbed, createEmbedder, findSimilar } from "../src/embeddings";

describe("embeddings", () => {
  it("cosineSimilarity handles parallel / orthogonal / opposite", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 6);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1, 6);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it("hashEmbed is deterministic and L2-normalized", () => {
    const a = hashEmbed("revenue forecast");
    expect(a).toEqual(hashEmbed("revenue forecast"));
    expect(Math.sqrt(a.reduce((s, x) => s + x * x, 0))).toBeCloseTo(1, 6);
  });

  it("findSimilar ranks by meaning (hash fallback) — revenue items beat churn", async () => {
    const items = ["quarterly revenue forecast", "customer churn rate", "annual revenue growth projection"];
    const ranked = await findSimilar("revenue", items, (t) => t);
    expect(ranked).toHaveLength(3);
    // both revenue items outrank the churn item (which shares no tokens with "revenue")
    expect(ranked[2].item).toContain("churn");
    expect(ranked[0].score).toBeGreaterThan(ranked[2].score);
  });

  it("createEmbedder falls back to hash when the model dep is absent", async () => {
    const e = await createEmbedder({ backend: "transformers" });
    expect(e.backend).toBe("hash");
    const [v] = await e.embed(["hello world"]);
    expect(v.length).toBe(128);
  });
});
