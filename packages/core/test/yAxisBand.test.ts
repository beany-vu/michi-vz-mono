import { describe, it, expect } from "vitest";
import { scaleBand } from "d3-scale";
import { renderYAxisBand } from "../src/render/svg/yAxisBand";

const MARGIN = { top: 20, right: 20, bottom: 30, left: 100 };

function svgParent(): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg");
}

function bandScale(labels: string[], height = 380) {
  return scaleBand<string>()
    .domain(labels)
    .range([MARGIN.top, height - MARGIN.bottom]);
}

function labelTexts(parent: SVGElement): string[] {
  return Array.from(parent.querySelectorAll(".mv-ylabel span")).map((s) => s.textContent ?? "");
}

describe("renderYAxisBand label thinning", () => {
  it("renders every label when bands are tall enough", () => {
    const labels = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    const parent = svgParent();
    renderYAxisBand(parent, bandScale(labels), { width: 700, margin: MARGIN });
    expect(labelTexts(parent)).toEqual(labels);
  });

  it("thins dense domains to a readable subset that keeps both endpoints", () => {
    const labels = Array.from({ length: 120 }, (_, i) => `Row ${i + 1}`);
    const parent = svgParent();
    renderYAxisBand(parent, bandScale(labels), { width: 700, margin: MARGIN });
    const texts = labelTexts(parent);
    expect(texts.length).toBeGreaterThanOrEqual(2);
    expect(texts.length).toBeLessThanOrEqual(25);
    expect(texts[0]).toBe("Row 1");
    expect(texts[texts.length - 1]).toBe("Row 120");
  });

  it("thins the per-band grid lines together with the labels", () => {
    const labels = Array.from({ length: 120 }, (_, i) => `Row ${i + 1}`);
    const parent = svgParent();
    renderYAxisBand(parent, bandScale(labels), { width: 700, margin: MARGIN, showGrid: true });
    const lines = parent.querySelectorAll("line.mv-grid").length;
    const texts = labelTexts(parent);
    expect(lines).toBe(texts.length);
  });

  it("lands thinned ticks on round values for numeric domains", () => {
    const labels = Array.from({ length: 120 }, (_, i) => String(2000 + i));
    const parent = svgParent();
    renderYAxisBand(parent, bandScale(labels), { width: 700, margin: MARGIN });
    const texts = labelTexts(parent);
    expect(texts.length).toBeLessThanOrEqual(25);
    expect(texts).toContain("2000");
    expect(texts).toContain("2119");
    // interior ticks snap to the nice-number ladder, not arbitrary years
    const interior = texts.filter((t) => t !== "2000" && t !== "2119");
    expect(interior.length).toBeGreaterThan(0);
    for (const t of interior) expect(Number(t) % 10).toBe(0);
  });

  it("honours an explicit maxTicks cap", () => {
    const labels = Array.from({ length: 120 }, (_, i) => `Row ${i + 1}`);
    const parent = svgParent();
    renderYAxisBand(parent, bandScale(labels), { width: 700, margin: MARGIN, maxTicks: 5 });
    expect(labelTexts(parent).length).toBeLessThanOrEqual(7);
  });

  it("still renders nothing when hideTickLabels is set", () => {
    const labels = Array.from({ length: 120 }, (_, i) => `Row ${i + 1}`);
    const parent = svgParent();
    renderYAxisBand(parent, bandScale(labels), {
      width: 700,
      margin: MARGIN,
      hideTickLabels: true,
    });
    expect(labelTexts(parent)).toEqual([]);
  });
});
