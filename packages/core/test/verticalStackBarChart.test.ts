import { describe, it, expect } from "vitest";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { VerticalStackBarChartProps, VerticalStackBarDataSet } from "../src/types";

const sample: VerticalStackBarDataSet[] = [
  { seriesKey: "Africa", seriesKeyAbbreviation: "AF", series: [
    { date: "2001", Africa: "10" }, { date: "2002", Africa: "12" }] },
  { seriesKey: "Non-LDC", seriesKeyAbbreviation: "NL", series: [
    { date: "2001", "Non-LDC": "20" }, { date: "2002", "Non-LDC": "18" }] },
];

function mount(extra: Partial<VerticalStackBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountVerticalStackBarChart(host, {
    dataSet: sample,
    title: "Demo",
    width: 600,
    height: 360,
    ...extra,
  });
  return { host, chart };
}

describe("mountVerticalStackBarChart (jsdom)", () => {
  it("renders one bar rect per (DataSet,date) with data-label-safe", () => {
    const { host, chart } = mount();
    const bars = host.querySelectorAll<SVGRectElement>("rect.bar");
    expect(bars.length).toBe(4); // 2 datasets x 2 dates, 1 segment each
    const safes = Array.from(bars).map((b) => b.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Non-LDC")); // "Non_LDC"
    chart.destroy();
    host.remove();
  });

  it("does NOT paint cross-DataSet stub rects even with missingDataMarker (the guard)", () => {
    const { host, chart } = mount({ missingDataMarker: { height: 2 } });
    // Without the hasOwnProperty guard this would be 8 (4 real + 4 phantom stubs).
    expect(host.querySelectorAll("rect.bar").length).toBe(4);
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per date + a Total column", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(2); // 2 dates
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Date", "Africa", "Non-LDC", "Total"]);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Stacked bar chart");
    chart.destroy();
    host.remove();
  });

  it("exposes a vertical-stack-bar context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("vertical-stack-bar-chart");
    if (ca.chartType === "vertical-stack-bar-chart") {
      expect(ca.keys).toEqual(["Africa", "Non-LDC"]);
      expect(ca.series.find((s) => s.key === "Africa")!.total).toBe(22); // 10+12
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("honors explicit key order", () => {
    const { host, chart } = mount({ keys: ["Non-LDC", "Africa"] });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "vertical-stack-bar-chart") expect(ctx.keys).toEqual(["Non-LDC", "Africa"]);
    chart.destroy();
    host.remove();
  });

  it("fires onChartDataProcessed with the context and onDataWarning on empty data", () => {
    let ctxType = "";
    const a = mount({ onChartDataProcessed: (c) => (ctxType = c.chartType) });
    expect(ctxType).toBe("vertical-stack-bar-chart");
    a.chart.destroy();
    a.host.remove();

    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    mountVerticalStackBarChart(host, { dataSet: [], width: 400, height: 200, onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ dataSet: sample.slice(0, 1), width: 600, height: 360 });
    expect(host.querySelectorAll("rect.bar").length).toBe(2); // 1 dataset x 2 dates
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
