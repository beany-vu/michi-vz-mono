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
    a11yTable: {
      headers: ["label", "value"],
      rows: [
        ["A", 1],
        ["B", 2],
      ],
    },
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
    expect(findings.some((f) => f.kind === "err" && f.text.toLowerCase().includes("summary"))).toBe(
      true,
    );
  });

  it("flags duplicate series colors", () => {
    const findings = auditContext({ ...base, colorsMapping: { A: "#d62728", B: "#d62728" } });
    expect(findings.some((f) => f.kind === "warn" && f.text.includes("same color"))).toBe(true);
  });

  it("flags a low-contrast series color naming the background it fails on", () => {
    // pale yellow: fine on dark, unreadable on light
    const findings = auditContext({ ...base, colorsMapping: { A: "#ffe97a", B: "#1f77b4" } });
    expect(findings.some((f) => f.kind === "warn" && f.text.includes("light background"))).toBe(
      true,
    );
  });

  it("flags an a11y table with fewer rows than series", () => {
    const findings = auditContext({
      ...base,
      a11yTable: { headers: ["label"], rows: [["A"]] },
      series: [{ label: "A" }, { label: "B" }, { label: "C" }],
    });
    expect(findings.some((f) => f.kind === "warn" && f.text.toLowerCase().includes("table"))).toBe(
      true,
    );
  });
});

describe("auditContext: one contrast check per distinct colour", () => {
  it("names every label sharing a low-contrast colour in ONE finding", () => {
    const findings = auditContext({
      summary: "Line chart with 2 series.",
      a11yTable: { headers: ["label"], rows: [["A"], ["B"]] },
      colorsMapping: { A: "#ffe97a", B: "#FFE97A" },
      series: [{ label: "A" }, { label: "B" }],
    });
    const light = findings.filter((f) => f.text.includes("light background"));
    expect(light).toHaveLength(1);
    expect(light[0].text).toContain("A");
    expect(light[0].text).toContain("B");
  });
});

describe("auditContext: colour ramps (choropleth, symbol map, colorScale)", () => {
  // ColorBrewer Purples, 5 classes; 10 regions binned into them.
  const purples = ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f"];
  const regions = [
    "Kenya",
    "Benin",
    "Ghana",
    "Mali",
    "Chad",
    "Niger",
    "Togo",
    "Congo",
    "Gabon",
    "Sudan",
  ];
  const colorsMapping = Object.fromEntries(regions.map((r, i) => [r, purples[i % 5]]));
  const ctx = {
    chartType: "choropleth-map-chart",
    summary: "Choropleth map of 10 regions.",
    a11yTable: { headers: ["region", "value"], rows: regions.map((r, i) => [r, i]) },
    colorsMapping,
  };
  const props = {
    colorScale: { domain: [10, 20, 30, 40], range: purples },
    noDataColor: "#d9d9d9",
  };

  it("audits the ramp instead of flagging same-bin regions and every pale step", () => {
    const findings = auditContext(ctx, { props });
    expect(findings.some((f) => f.text.includes("same color"))).toBe(false);
    expect(findings.some((f) => f.text.includes("background"))).toBe(false);
    expect(findings.filter((f) => f.kind !== "ok")).toEqual([]);
    expect(findings.some((f) => f.kind === "ok" && f.text.toLowerCase().includes("ramp"))).toBe(
      true,
    );
  });

  it("uses the ramp audit for a choropleth even without a colorScale prop", () => {
    const findings = auditContext(ctx, { props: {} });
    expect(findings.some((f) => f.text.includes("same color"))).toBe(false);
    expect(findings.some((f) => f.kind === "ok" && f.text.toLowerCase().includes("ramp"))).toBe(
      true,
    );
  });

  it("flags adjacent steps that are hard to tell apart", () => {
    const findings = auditContext(ctx, {
      props: { colorScale: { domain: [10, 20], range: ["#f2f0f7", "#9e9ac8", "#9c98c6"] } },
    });
    const step = findings.find((f) => f.kind === "warn" && f.text.includes("steps 2 and 3"));
    expect(step).toBeDefined();
  });

  it("flags a noDataColor that matches or nearly matches a ramp step", () => {
    const same = auditContext(ctx, { props: { ...props, noDataColor: "#F2F0F7" } });
    expect(same.some((f) => f.kind === "warn" && f.text.includes("noDataColor"))).toBe(true);
    const near = auditContext(ctx, { props: { ...props, noDataColor: "#f4f2f8" } });
    expect(near.some((f) => f.kind === "warn" && f.text.includes("noDataColor"))).toBe(true);
  });

  it("audits a symbol map's colorScale (echoed on the context) as a ramp", () => {
    const findings = auditContext({
      chartType: "symbol-map-chart",
      summary: "Symbol map.",
      a11yTable: { headers: ["label"], rows: [["A"], ["B"]] },
      colorsMapping: { A: "#f2f0f7", B: "#f2f0f7" },
      colorScale: { domain: [5], range: ["#f2f0f7", "#54278f"] },
    });
    expect(findings.some((f) => f.text.includes("same color"))).toBe(false);
    expect(findings.some((f) => f.kind === "ok" && f.text.toLowerCase().includes("ramp"))).toBe(
      true,
    );
  });
});
