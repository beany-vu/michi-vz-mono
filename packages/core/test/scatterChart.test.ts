import { describe, it, expect } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import { buildScatterContext } from "../src/context/buildScatterContext";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

const dataSet: ScatterDataPoint[] = [
  { label: "Point A", x: 1, y: 2, d: 5 },
  { label: "Beta", x: 3, y: 6, d: 10 },
  { label: "Gamma", x: 5, y: 10, d: 2 },
  { label: "Delta", x: 7, y: 14, d: 8 },
];

function mount(extra: Partial<ScatterChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "number",
    ...extra,
  });
  return { host, chart };
}

describe("buildScatterContext", () => {
  it("computes a Pearson correlation (perfectly linear => ~1)", () => {
    const ctx = buildScatterContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [0, 7],
      yAxisDomain: [0, 14],
      points: dataSet,
      colorsMapping: {},
    });
    // y = 2x exactly -> correlation 1
    expect(ctx.stats.correlation).toBe(1);
    expect(ctx.summary).toContain("correlation");
  });
});

describe("mountScatterChart (jsdom)", () => {
  it("renders one mark per point carrying data-label-safe", () => {
    const { host, chart } = mount();
    const marks = host.querySelectorAll(".scatter-point");
    expect(marks.length).toBe(4);
    const safes = Array.from(marks).map((m) => m.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Point A")); // "Point_A"
    chart.destroy();
    host.remove();
  });

  it("excludes disabled points", () => {
    const { host, chart } = mount({ disabledItems: ["Beta", "Gamma"] });
    expect(host.querySelectorAll(".scatter-point").length).toBe(2);
    chart.destroy();
    host.remove();
  });

  it("scales bubble radius by the d value (bigger d => bigger r)", () => {
    const { host, chart } = mount();
    const circles = Array.from(host.querySelectorAll<SVGCircleElement>("circle.scatter-point"));
    const beta = circles.find((c) => c.getAttribute("data-label") === "Beta")!; // d=10 (max)
    const gamma = circles.find((c) => c.getAttribute("data-label") === "Gamma")!; // d=2 (min)
    expect(Number(beta.getAttribute("r"))).toBeGreaterThan(Number(gamma.getAttribute("r")));
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per point", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(4);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Scatter plot");
    chart.destroy();
    host.remove();
  });

  it("exposes a scatter context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("scatter-plot-chart");
    if (ca.chartType === "scatter-plot-chart") expect(ca.pointCount).toBe(4);
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onDataWarning for a non-finite coordinate", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountScatterChart(host, {
      dataSet: [{ label: "Bad", x: NaN, y: 1 }],
      width: 400,
      height: 200,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ dataSet: dataSet.slice(0, 2), width: 600, height: 300, xAxisDataType: "number" });
    expect(host.querySelectorAll(".scatter-point").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
