import { describe, it, expect } from "vitest";
import { cosineSimilarity, hashEmbed, createEmbedder, findSimilar, reconcileLabels } from "../src/embeddings";

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

  it("findSimilar ranks by meaning (hash fallback) - revenue items beat churn", async () => {
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

  describe("reconcileLabels (hash fallback)", () => {
    it("merges spelling/case variants and keeps no-shared-letter labels apart", async () => {
      const groups = await reconcileLabels([
        "United States",
        "united states",
        "USA",
        "Germany",
        "germany",
      ]);
      // hash merges case variants (United States/united states, Germany/germany) but USA
      // shares no letters with "united states", so it stays its own group: 3 groups total.
      expect(groups).toHaveLength(3);
      const byName = Object.fromEntries(groups.map((g) => [g.name, g.members]));
      // medoid picks the tidy Title-Case representative
      expect(byName["United States"]).toEqual(["United States", "united states"]);
      expect(byName["Germany"]).toEqual(["Germany", "germany"]);
      expect(byName["USA"]).toEqual(["USA"]);
    });

    it("every input label lands in exactly one group", async () => {
      const labels = ["Apple", "apple", "APPLE", "Banana", "banana"];
      const groups = await reconcileLabels(labels);
      const members = groups.flatMap((g) => g.members);
      expect(members.sort()).toEqual([...labels].sort());
    });

    it("a high threshold keeps everything separate", async () => {
      const groups = await reconcileLabels(["alpha", "alphaa", "beta"], { threshold: 0.999, margin: 0 });
      expect(groups).toHaveLength(3);
    });
  });
});
