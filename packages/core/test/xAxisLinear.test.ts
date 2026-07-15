import { describe, it, expect } from "vitest";
import { scaleLinear } from "d3-scale";
import { renderXAxisLinear } from "../src/render/svg/xAxisLinear";

function svgRoot(): SVGSVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg");
}
const MARGIN = { top: 10, right: 20, bottom: 30, left: 20 };

function render(scale: ReturnType<typeof scaleLinear>, extra: Record<string, unknown>, n: number) {
  const svg = svgRoot();
  renderXAxisLinear(svg, scale, {
    width: 800,
    height: 100,
    margin: MARGIN,
    xAxisDataType: "number",
    format: (v) => `Label ${v}`,
    tickValues: Array.from({ length: n }, (_, i) => i),
    enableExplicitTickValues: true,
    ...extra,
  });
  return Array.from(svg.querySelectorAll("text.mv-axis-label"));
}

describe("renderXAxisLinear adaptive density (autoRotate + maxTicks)", () => {
  it("drops non-finite explicit tickValues before rendering labels", () => {
    const labels = render(
      scaleLinear().domain([0, 4]).range([20, 780]),
      { tickValues: [0, NaN, Infinity, 4] },
      0,
    );
    expect(labels.map((l) => l.textContent)).toEqual(["Label 0", "Label 4"]);
  });

  it("sorts and de-duplicates explicit tickValues before rendering labels", () => {
    const labels = render(
      scaleLinear().domain([0, 4]).range([20, 780]),
      { tickValues: [4, 2, 2, 0, 4] },
      0,
    );
    expect(labels.map((l) => l.textContent)).toEqual(["Label 0", "Label 2", "Label 4"]);
  });

  it("keeps ALL labels and tilts them -45° at medium density (fits rotated, not horizontal)", () => {
    // 8 labels, ~30px gap: too tight for ~49px horizontal labels, but >= the 18px
    // rotated spacing → show all 8, rotated.
    const labels = render(scaleLinear().domain([0, 7]).range([20, 230]), { autoRotate: true }, 8);
    expect(labels.length).toBe(8); // none thinned - there's room when rotated
    expect(labels.every((l) => (l.getAttribute("transform") ?? "").includes("rotate(-45)"))).toBe(
      true,
    );
  });

  it("keeps ALL labels horizontal when they comfortably fit", () => {
    const labels = render(scaleLinear().domain([0, 1]).range([20, 780]), { autoRotate: true }, 2);
    expect(labels.length).toBe(2);
    expect(labels.every((l) => l.getAttribute("text-anchor") === "middle")).toBe(true);
    expect(labels.every((l) => !(l.getAttribute("transform") ?? "").includes("rotate"))).toBe(true);
  });

  it("thins to maxTicks (keeping FIRST + LAST) only when too dense even rotated", () => {
    // 48 labels, ~10px gap: below the 18px rotated threshold → collapse to 5.
    const labels = render(
      scaleLinear().domain([0, 47]).range([20, 500]),
      { autoRotate: true, maxTicks: 5 },
      48,
    );
    const texts = labels.map((l) => l.textContent);
    expect(texts.length).toBe(5);
    expect(texts[0]).toBe("Label 0");
    expect(texts[texts.length - 1]).toBe("Label 47");
  });

  it("honours maxTicks as a hard cap when autoRotate is off (no rotation)", () => {
    const labels = render(scaleLinear().domain([0, 11]).range([20, 780]), { maxTicks: 4 }, 12);
    const texts = labels.map((l) => l.textContent);
    expect(texts.length).toBe(4);
    expect(texts[0]).toBe("Label 0");
    expect(texts[texts.length - 1]).toBe("Label 11");
    expect(labels.every((l) => !(l.getAttribute("transform") ?? "").includes("rotate"))).toBe(true);
  });
});

describe("renderXAxisLinear zero line (showZeroLine independent of showGrid)", () => {
  const zeroDomainOpts = {
    width: 800,
    height: 100,
    margin: MARGIN,
    xAxisDataType: "number" as const,
    format: (v: number) => String(v),
    ticks: 5,
  };

  it("draws ONLY the solid zero line when showGrid is off - not a full dashed grid", () => {
    const svg = svgRoot();
    renderXAxisLinear(svg, scaleLinear().domain([-10, 10]).range([20, 780]), {
      ...zeroDomainOpts,
      showGrid: false,
      showZeroLine: true,
    });
    const lines = Array.from(svg.querySelectorAll("line.mv-grid"));
    expect(lines.length).toBe(1);
    expect(lines[0].getAttribute("class")).toContain("mv-tick-zero");
    expect(lines[0].getAttribute("stroke-dasharray")).toBe("none");
  });

  it("draws no lines at all when showGrid is off and showZeroLine is not set", () => {
    const svg = svgRoot();
    renderXAxisLinear(svg, scaleLinear().domain([-10, 10]).range([20, 780]), {
      ...zeroDomainOpts,
      showGrid: false,
    });
    expect(svg.querySelectorAll("line.mv-grid").length).toBe(0);
  });

  it("still draws every tick's grid line when showGrid is on (unchanged full-grid behaviour)", () => {
    const svg = svgRoot();
    renderXAxisLinear(svg, scaleLinear().domain([-10, 10]).range([20, 780]), {
      ...zeroDomainOpts,
      showGrid: true,
      showZeroLine: true,
    });
    const lines = Array.from(svg.querySelectorAll("line.mv-grid"));
    expect(lines.length).toBe(5);
    const zero = lines.find((l) => (l.getAttribute("class") ?? "").includes("mv-tick-zero"))!;
    expect(zero.getAttribute("stroke-dasharray")).toBe("none");
    expect(
      lines.filter((l) => l !== zero).every((l) => l.getAttribute("stroke-dasharray") !== "none"),
    ).toBe(true);
  });
});

describe("renderXAxisLinear no-data ticks (fillPeriodTicks marking)", () => {
  const cls = (l: Element) => l.getAttribute("class") ?? "";

  it("marks ONLY the noDataValues labels faded + tags them with data-mv-value", () => {
    const labels = render(
      scaleLinear().domain([0, 4]).range([20, 780]),
      { noDataValues: new Set([1, 3]) },
      5,
    );
    expect(labels.length).toBe(5);
    const faded = labels.filter((l) => cls(l).includes("mv-tick-nodata"));
    expect(faded.map((l) => l.getAttribute("data-mv-value")).sort()).toEqual(["1", "3"]);
    // faded labels keep the base class AND become hover targets
    expect(faded.every((l) => cls(l).includes("mv-axis-label"))).toBe(true);
    expect(faded.every((l) => l.getAttribute("pointer-events") === "all")).toBe(true);
    // the other three labels are untouched
    expect(labels.filter((l) => !cls(l).includes("mv-tick-nodata")).length).toBe(3);
  });

  it("marks nothing when noDataValues is omitted", () => {
    const labels = render(scaleLinear().domain([0, 4]).range([20, 780]), {}, 5);
    expect(labels.some((l) => cls(l).includes("mv-tick-nodata"))).toBe(false);
  });
});
