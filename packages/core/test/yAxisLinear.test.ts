import { describe, it, expect } from "vitest";
import { scaleLinear, scaleLog } from "d3-scale";
import { renderYAxisLinear } from "../src/render/svg/yAxisLinear";
import type { LinearOrLogScale } from "../src/render/svg/yAxisLinear";

function svgRoot(): SVGSVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg");
}
const MARGIN = { top: 10, right: 20, bottom: 30, left: 40 };

function render(scale: LinearOrLogScale, extra: Partial<Parameters<typeof renderYAxisLinear>[2]> = {}) {
  const svg = svgRoot();
  renderYAxisLinear(svg, scale, {
    width: 400,
    height: 300,
    margin: MARGIN,
    format: (v) => String(v),
    ...extra,
  });
  return {
    labels: Array.from(svg.querySelectorAll("text.mv-axis-label")),
    grid: Array.from(svg.querySelectorAll("line.mv-grid")),
  };
}

describe("renderYAxisLinear - log-mode label thinning (B3.5)", () => {
  it("wide log domain (4+ decades): labels ONLY the powers of 10 within the domain", () => {
    const scale = scaleLog()
      .base(10)
      .domain([0.0007, 446])
      .range([300 - MARGIN.bottom, MARGIN.top])
      .clamp(true)
      .nice(); // nice() -> [0.0001, 1000], 7 decades
    const { labels, grid } = render(scale, { ticks: 10 });

    const labelValues = labels.map((l) => Number(l.textContent)).sort((a, b) => a - b);
    expect(labelValues).toEqual([0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000]);
    expect(labels.length).toBe(8);

    // Minor ticks still get gridlines (unlabeled) - thinning is label-only.
    expect(grid.length).toBeGreaterThan(labels.length);
  });

  it("wide log domain: minor tick gridlines carry no label text", () => {
    const scale = scaleLog()
      .base(10)
      .domain([1, 100000])
      .range([300 - MARGIN.bottom, MARGIN.top])
      .clamp(true)
      .nice(); // [1, 100000], 5 decades
    const { labels } = render(scale, { ticks: 10 });
    const values = labels.map((l) => Number(l.textContent));
    // every rendered label is an exact power of 10
    expect(values.every((v) => Number.isInteger(Math.log10(v)))).toBe(true);
    // and none of the interstitial minor values (2,3,4,...) leaked a label
    expect(values).not.toContain(2);
    expect(values).not.toContain(500);
  });

  it("guarantees every domain power of 10 is labeled even if a low tick count would otherwise skip a boundary", () => {
    // scaleLog().ticks(3) on [1, 1e10] returns [1, 1e5, 1e10] - silently dropping
    // 10/100/.../1e9. The renderer must not inherit that gap.
    const scale = scaleLog()
      .base(10)
      .domain([1, 1e10])
      .range([300 - MARGIN.bottom, MARGIN.top])
      .clamp(true);
    const { labels } = render(scale, { ticks: 3 });
    const values = labels.map((l) => Number(l.textContent)).sort((a, b) => a - b);
    expect(values).toEqual([1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000]);
  });

  it("narrow log domain (~1 decade): keeps the existing per-tick label behavior (no thinning)", () => {
    const scale = scaleLog()
      .base(10)
      .domain([2, 20])
      .range([300 - MARGIN.bottom, MARGIN.top])
      .clamp(true)
      .nice(); // [1, 100], 2 decades - at the threshold, not past it
    const { labels, grid } = render(scale, { ticks: 10 });
    // Every rendered tick gets a label (same set as gridlines) - unchanged behavior.
    expect(labels.length).toBe(grid.length);
    expect(labels.length).toBeGreaterThan(2);
  });

  it("respects an explicit yAxisFormat on the thinned (powers-of-10-only) label subset", () => {
    const scale = scaleLog()
      .base(10)
      .domain([0.01, 10000])
      .range([300 - MARGIN.bottom, MARGIN.top])
      .clamp(true)
      .nice();
    const { labels } = render(scale, { ticks: 10, format: (v) => `$${v}` });
    expect(labels.every((l) => (l.textContent ?? "").startsWith("$"))).toBe(true);
    const raw = labels.map((l) => Number((l.textContent ?? "").slice(1))).sort((a, b) => a - b);
    expect(raw).toEqual([0.01, 0.1, 1, 10, 100, 1000, 10000]);
  });

  it("linear mode is byte-identical: every generated tick still gets a label", () => {
    const scale = scaleLinear().domain([0, 1000]).range([300 - MARGIN.bottom, MARGIN.top]).nice();
    const { labels, grid } = render(scale, { ticks: 10 });
    expect(labels.length).toBe(grid.length);
    expect(labels.length).toBeGreaterThan(0);
    const values = labels.map((l) => Number(l.textContent));
    expect(values).toEqual(scale.ticks(10));
  });
});
