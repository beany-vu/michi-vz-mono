import { describe, it, expect } from "vitest";
import { contrastRatio, findDuplicateColors, auditContext } from "../src/a11y";

describe("contrastRatio", () => {
  it("black on white is 21:1, same color is 1:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 3);
  });

  it("supports short hex and is symmetric", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(contrastRatio("#000", "#fff"), 5);
  });

  it("returns NaN for unparseable colors", () => {
    expect(Number.isNaN(contrastRatio("tomato-ish", "#fff"))).toBe(true);
  });
});

describe("findDuplicateColors", () => {
  it("groups labels sharing the same color (case-insensitive)", () => {
    const groups = findDuplicateColors({ A: "#ff0000", B: "#FF0000", C: "#00ff00" });
    expect(groups).toEqual([["A", "B"]]);
  });

  it("returns empty when all colors are distinct", () => {
    expect(findDuplicateColors({ A: "#ff0000", B: "#00ff00" })).toEqual([]);
  });
});

describe("auditContext", () => {
  const base = {
    summary: "Line chart with 2 series.",
    a11yTable: { headers: ["label", "value"], rows: [["A", 1], ["B", 2]] },
    colorsMapping: { A: "#1f77b4", B: "#d62728" },
    series: [{ label: "A" }, { label: "B" }],
  };

  it("passes a healthy context with an ok finding", () => {
    const findings = auditContext(base);
    expect(findings.some((f) => f.kind === "err" || f.kind === "warn")).toBe(false);
    expect(findings.some((f) => f.kind === "ok")).toBe(true);
  });

  it("flags a missing summary as an error", () => {
    const findings = auditContext({ ...base, summary: "" });
    expect(findings.some((f) => f.kind === "err" && f.text.toLowerCase().includes("summary"))).toBe(true);
  });

  it("flags duplicate series colors", () => {
    const findings = auditContext({ ...base, colorsMapping: { A: "#d62728", B: "#d62728" } });
    expect(findings.some((f) => f.kind === "warn" && f.text.includes("same color"))).toBe(true);
  });

  it("flags a low-contrast series color naming the background it fails on", () => {
    // pale yellow: fine on dark, unreadable on light
    const findings = auditContext({ ...base, colorsMapping: { A: "#ffe97a", B: "#1f77b4" } });
    expect(findings.some((f) => f.kind === "warn" && f.text.includes("light background"))).toBe(true);
  });

  it("flags an a11y table with fewer rows than series", () => {
    const findings = auditContext({
      ...base,
      a11yTable: { headers: ["label"], rows: [["A"]] },
      series: [{ label: "A" }, { label: "B" }, { label: "C" }],
    });
    expect(findings.some((f) => f.kind === "warn" && f.text.toLowerCase().includes("table"))).toBe(true);
  });
});
