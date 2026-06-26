import { describe, it, expect } from "vitest";
import { mountRangeChart } from "../src/engine/rangeChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { RangeChartProps, RangeDataItem } from "../src/types";

const band = (mins: number[], maxs: number[], start = 2016): RangeDataItem["series"] =>
  mins.map((valueMin, i) => ({ date: start + i, valueMin, valueMax: maxs[i], certainty: true }));

const dataSet: RangeDataItem[] = [
  { label: "Region A", color: "#f00", series: band([5, 8, 6], [12, 16, 14]) },
  { label: "Region B", color: "#0a0", series: band([2, 3, 4], [6, 7, 9]) },
];

function mount(extra: Partial<RangeChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRangeChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    ...extra,
  });
  return { host, chart };
}

describe("mountRangeChart (jsdom)", () => {
  it("renders one band area path per series carrying data-label-safe", () => {
    const { host, chart } = mount();
    const areas = host.querySelectorAll<SVGPathElement>("path.area");
    expect(areas.length).toBe(2);
    const safes = Array.from(areas).map((a) => a.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Region A")); // "Region_A"
    chart.destroy();
    host.remove();
  });

  it("excludes disabled bands", () => {
    const { host, chart } = mount({ disabledItems: ["Region B"] });
    expect(host.querySelectorAll("path.area").length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per band", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(2);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Band", "Points", "Min", "Max", "Mean range"]);
    chart.destroy();
    host.remove();
  });

  it("exposes a range context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("range-chart");
    if (ca.chartType === "range-chart") {
      expect(ca.series.length).toBe(2);
      const rA = ca.series.find((s) => s.label === "Region A")!;
      expect(rA.minValue).toBe(5);
      expect(rA.maxValue).toBe(16);
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onDataWarning for a non-finite band and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountRangeChart(host, {
      dataSet: [{ label: "Bad", series: [{ date: 2016, valueMin: NaN, valueMax: 1, certainty: true }] }],
      width: 400,
      height: 200,
      xAxisDataType: "date_annual",
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    chart.update({ dataSet: dataSet.slice(0, 1), width: 400, height: 200, xAxisDataType: "date_annual" });
    expect(host.querySelectorAll("path.area").length).toBe(1);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
