import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  hashEmbed,
  createEmbedder,
  findSimilar,
  matchLabels,
  reconcileLabels,
} from "../src/embeddings";

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
    const items = [
      "quarterly revenue forecast",
      "customer churn rate",
      "annual revenue growth projection",
    ];
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
      const groups = await reconcileLabels(["alpha", "alphaa", "beta"], {
        threshold: 0.999,
        margin: 0,
      });
      expect(groups).toHaveLength(3);
    });
  });

  describe("matchLabels (hash fallback)", () => {
    it("matches exact labels regardless of list order, similarity ~1", async () => {
      const r = await matchLabels(["Apple", "Banana"], ["Banana", "Apple"]);
      expect(r.matches).toHaveLength(2);
      const bySource = Object.fromEntries(r.matches.map((m) => [m.source, m]));
      expect(bySource["Apple"].target).toBe("Apple");
      expect(bySource["Banana"].target).toBe("Banana");
      for (const m of r.matches) expect(m.similarity).toBeCloseTo(1, 6);
      expect(r.unmatchedSource).toHaveLength(0);
      expect(r.unmatchedTarget).toHaveLength(0);
    });

    it("matches spelling/case variants (hashEmbed lowercases)", async () => {
      const r = await matchLabels(["United States", "germany"], ["united states", "Germany"]);
      expect(r.matches).toHaveLength(2);
      const bySource = Object.fromEntries(r.matches.map((m) => [m.source, m.target]));
      expect(bySource["United States"]).toBe("united states");
      expect(bySource["germany"]).toBe("Germany");
    });

    it("does NOT cross-match distinct entities (threshold gate)", async () => {
      // hash shares no trigrams between "USA" and "united states" (same finding as the
      // reconcileLabels test above), and Germany/Japan share nothing either.
      const r = await matchLabels(["USA", "Germany"], ["United States", "Japan"]);
      expect(r.matches).toHaveLength(0);
      expect(r.unmatchedSource.map((u) => u.label).sort()).toEqual(["Germany", "USA"]);
      expect(r.unmatchedTarget.map((u) => u.label).sort()).toEqual(["Japan", "United States"]);
      // closest-miss hints are still reported (some target, with its low similarity)
      for (const u of r.unmatchedSource) {
        expect(u.closest).not.toBeNull();
        expect(u.similarity).toBeLessThan(0.6);
      }
    });

    it("margin gate blocks an ambiguous source (two near-equal targets)", async () => {
      // "alphaa" sits between "alpha" and "alphab" (heavy trigram overlap with both).
      // threshold 0 admits the pair; a deliberately strict margin then rejects it
      // because best and second-best are closer than 0.5 to each other.
      const strict = await matchLabels(["alphaa"], ["alpha", "alphab"], {
        threshold: 0,
        margin: 0.5,
      });
      expect(strict.matches).toHaveLength(0);
      expect(strict.unmatchedSource.map((u) => u.label)).toEqual(["alphaa"]);
      // same call with the margin disabled matches - proves the margin was the gate
      const loose = await matchLabels(["alphaa"], ["alpha", "alphab"], {
        threshold: 0,
        margin: 0,
      });
      expect(loose.matches).toHaveLength(1);
      expect(loose.matches[0].source).toBe("alphaa");
    });

    it("mutual best match resolves collisions: closer source wins, loser reported", async () => {
      // Both sources want target "Alpha"; the exact-match source wins the mutual contest.
      // threshold lowered + margin 0 so the mutual check is the only deciding gate.
      const r = await matchLabels(["Alpha", "Alphaa"], ["Alpha", "Beta"], {
        threshold: 0.3,
        margin: 0,
      });
      expect(r.matches).toHaveLength(1);
      expect(r.matches[0]).toMatchObject({ source: "Alpha", target: "Alpha" });
      expect(r.unmatchedSource.map((u) => u.label)).toEqual(["Alphaa"]);
      expect(r.unmatchedSource[0].closest).toBe("Alpha"); // the near-miss is named
      expect(r.unmatchedTarget.map((u) => u.label)).toEqual(["Beta"]);
    });

    it("mutual:false allows many-to-one onto the same target", async () => {
      const r = await matchLabels(["Alpha", "Alphaa"], ["Alpha", "Beta"], {
        threshold: 0.3,
        margin: 0,
        mutual: false,
      });
      expect(r.matches).toHaveLength(2);
      expect(r.matches.map((m) => m.target)).toEqual(["Alpha", "Alpha"]);
      expect(r.unmatchedSource).toHaveLength(0);
      expect(r.unmatchedTarget.map((u) => u.label)).toEqual(["Beta"]);
    });

    it("every label lands in exactly one bucket (matches or unmatched)", async () => {
      const source = ["Revenue", "Foobar"];
      const target = ["Revenue", "Bazqux"];
      const r = await matchLabels(source, target);
      expect(r.matches.map((m) => m.source)).toEqual(["Revenue"]);
      const allSource = [
        ...r.matches.map((m) => m.source),
        ...r.unmatchedSource.map((u) => u.label),
      ];
      const allTarget = [
        ...r.matches.map((m) => m.target),
        ...r.unmatchedTarget.map((u) => u.label),
      ];
      expect(allSource.sort()).toEqual([...source].sort());
      expect(allTarget.sort()).toEqual([...target].sort());
    });

    it("empty inputs return everything unmatched, no crash", async () => {
      const both = await matchLabels([], []);
      expect(both).toEqual({ matches: [], unmatchedSource: [], unmatchedTarget: [] });

      const noTarget = await matchLabels(["Apple"], []);
      expect(noTarget.matches).toHaveLength(0);
      expect(noTarget.unmatchedSource).toEqual([{ label: "Apple", closest: null, similarity: 0 }]);
      expect(noTarget.unmatchedTarget).toHaveLength(0);

      const noSource = await matchLabels([], ["Apple"]);
      expect(noSource.matches).toHaveLength(0);
      expect(noSource.unmatchedSource).toHaveLength(0);
      expect(noSource.unmatchedTarget).toEqual([{ label: "Apple", closest: null, similarity: 0 }]);
    });

    it("duplicate source labels: one wins, the other is reported unmatched (mutual)", async () => {
      const r = await matchLabels(["Germany", "Germany"], ["germany"]);
      expect(r.matches).toHaveLength(1);
      expect(r.matches[0]).toMatchObject({ source: "Germany", target: "germany" });
      expect(r.unmatchedSource).toHaveLength(1);
      expect(r.unmatchedSource[0].label).toBe("Germany");
      expect(r.unmatchedSource[0].closest).toBe("germany");
      expect(r.unmatchedTarget).toHaveLength(0);
    });

    it("backend:'transformers' degrades gracefully to hash in this environment", async () => {
      // the model dep is not installed in the test env; createEmbedder falls back to hash
      const r = await matchLabels(["Apple"], ["apple"], { backend: "transformers" });
      expect(r.matches).toHaveLength(1);
      expect(r.matches[0].similarity).toBeCloseTo(1, 6);
    });

    it("explicit defaults produce the same result as omitted options (drift guard)", async () => {
      const source = ["United States", "germany", "Nippon"];
      const target = ["united states", "Germany", "Japan"];
      const implicit = await matchLabels(source, target);
      const explicit = await matchLabels(source, target, {
        threshold: 0.6,
        margin: 0.05,
        mutual: true,
      });
      expect(implicit).toEqual(explicit);
    });
  });
});
