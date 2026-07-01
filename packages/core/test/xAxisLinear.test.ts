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
  it("keeps ALL labels and tilts them -45° at medium density (fits rotated, not horizontal)", () => {
    // 8 labels, ~30px gap: too tight for ~49px horizontal labels, but >= the 18px
    // rotated spacing → show all 8, rotated.
    const labels = render(scaleLinear().domain([0, 7]).range([20, 230]), { autoRotate: true }, 8);
    expect(labels.length).toBe(8); // none thinned - there's room when rotated
    expect(labels.every((l) => (l.getAttribute("transform") ?? "").includes("rotate(-45)"))).toBe(true);
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
      48
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

describe("renderXAxisLinear no-data ticks (fillPeriodTicks marking)", () => {
  const cls = (l: Element) => l.getAttribute("class") ?? "";

  it("marks ONLY the noDataValues labels faded + tags them with data-mv-value", () => {
    const labels = render(
      scaleLinear().domain([0, 4]).range([20, 780]),
      { noDataValues: new Set([1, 3]) },
      5
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
