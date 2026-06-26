import { describe, it, expect } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { LineChartProps, LineDataItem } from "../src/types";

const annual = (vals: number[], start = 2016): { date: number; value: number; certainty: boolean }[] =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));

const sample: LineDataItem[] = [
  { label: "Alpha One", color: "#ff0000", series: annual([10, 20, 15]) },
  { label: "Beta", color: "#00ff00", series: annual([5, 8, 12]) },
];

function mount(extra: Partial<LineChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, {
    dataSet: sample,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    ...extra,
  });
  return { host, chart };
}

describe("mountLineChart (jsdom)", () => {
  it("renders a line path per series carrying data-label-safe", () => {
    const { host, chart } = mount();
    const lines = host.querySelectorAll<SVGPathElement>("path.line");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const safes = Array.from(lines).map((l) => l.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("draws a dashed run when detectGaps flags a gap", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "Gappy", color: "#00f", series: [
        { date: 2016, value: 1, certainty: true },
        { date: 2017, value: 2, certainty: true },
        { date: 2024, value: 3, certainty: true },
      ] }],
      detectGaps: true,
    });
    const dashed = host.querySelectorAll('path.line[stroke-dasharray="4,4"]');
    expect(dashed.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
    host.remove();
  });

  it("draws a single-point guide line for one-point series", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "Solo", color: "#abc", series: [{ date: 2016, value: 42, certainty: true }] }],
      singlePointLine: true,
    });
    expect(host.querySelectorAll("line.single-point-line").length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("renders data-point marks only when showDataPoints", () => {
    const off = mount();
    expect(off.host.querySelectorAll(".data-point").length).toBe(0);
    off.chart.destroy();
    off.host.remove();

    const on = mount({ showDataPoints: true });
    expect(on.host.querySelectorAll(".data-point").length).toBe(6); // 2 series x 3 pts
    on.chart.destroy();
    on.host.remove();
  });

  it("builds an a11y mirror with one row per series", () => {
    const { host, chart } = mount();
    const rows = host.querySelectorAll(".mv-a11y table tbody tr");
    expect(rows.length).toBe(2);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Line chart");
    chart.destroy();
    host.remove();
  });

  it("exposes a line-chart context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("line-chart");
    if (ca.chartType === "line-chart") expect(ca.series.length).toBe(2);
    expect(ca.renderer).toBe("svg");
    expect(cb.renderer).toBe("canvas");
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("reports the largest mover in the summary", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    // Alpha One: 10->15 (+5); Beta: 5->12 (+7) => Beta is the largest mover.
    expect(ctx.summary).toContain("Beta");
    chart.destroy();
    host.remove();
  });

  it("fires onDataWarning for a duplicate date", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountLineChart(host, {
      dataSet: [{ label: "Dup", series: [
        { date: 2016, value: 1, certainty: true },
        { date: 2016, value: 2, certainty: true },
      ] }],
      xAxisDataType: "date_annual",
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "duplicate-date")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ dataSet: sample.slice(0, 1), width: 600, height: 300, xAxisDataType: "date_annual" });
    expect(host.querySelectorAll("g.data-group").length).toBe(1);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
