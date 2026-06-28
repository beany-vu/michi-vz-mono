import { describe, it, expect } from "vitest";
import { mountPieChart } from "../src/engine/pieChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { PieChartProps, PieDataItem } from "../src/types";

const data: PieDataItem[] = [
  { label: "Coffee", value: 100 },
  { label: "Tea", value: 60 },
  { label: "Cocoa", value: 40 },
];

function mount(props: Partial<PieChartProps> & { dataSet: PieDataItem[] }) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountPieChart(host, { width: 400, height: 400, title: "Demo", ...props });
  return { host, chart };
}

describe("mountPieChart (jsdom)", () => {
  it("renders one arc per slice with the colour-contract attributes", () => {
    const { host, chart } = mount({ dataSet: data });
    const slices = host.querySelectorAll<SVGPathElement>("path.slice");
    expect(slices.length).toBe(3);
    const safes = Array.from(slices).map((s) => s.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Coffee"));
    expect(slices[0].getAttribute("data-label")).toBeTruthy();
    expect(slices[0].getAttribute("d")).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("exposes a pie context with shares + largest slice", () => {
    const { host, chart } = mount({ dataSet: data });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("pie-chart");
    if (ctx.chartType === "pie-chart") {
      expect(ctx.mode).toBe("pie");
      expect(ctx.slices.length).toBe(3);
      expect(ctx.stats.total).toBe(200);
      expect(ctx.stats.largestSlice).toEqual({ label: "Coffee", value: 100, share: 0.5 });
      const tea = ctx.slices.find((s) => s.label === "Tea")!;
      expect(tea.share).toBeCloseTo(0.3, 5);
    }
    chart.destroy();
    host.remove();
  });

  it("donut mode (innerRadiusRatio > 0) reports mode 'donut' and slices still sum to total", () => {
    const { host, chart } = mount({ dataSet: data, innerRadiusRatio: 0.5 });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "pie-chart") {
      expect(ctx.mode).toBe("donut");
      expect(ctx.innerRadiusRatio).toBe(0.5);
      const sum = ctx.slices.reduce((a, s) => a + s.value, 0);
      expect(sum).toBe(200);
      // Full sweep around the circle (last slice ends at 2π).
      const last = ctx.slices[ctx.slices.length - 1];
      expect(last.endAngle).toBeCloseTo(Math.PI * 2, 5);
    }
    expect(host.querySelectorAll("path.slice").length).toBe(3);
    chart.destroy();
    host.remove();
  });

  it("produces identical context in SVG and canvas (renderer aside)", () => {
    const a = mount({ dataSet: data, renderer: "svg" });
    const b = mount({ dataSet: data, renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("a11y table has Label/Value/Share and mirrors the summary", () => {
    const { host, chart } = mount({ dataSet: data });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "pie-chart") {
      expect(ctx.a11yTable.headers).toEqual(["Label", "Value", "Share"]);
      expect(ctx.summary).toContain("Pie chart");
    }
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Pie chart");
    chart.destroy();
    host.remove();
  });

  it("sortByValue=false keeps data order; default sorts descending", () => {
    const unsorted: PieDataItem[] = [
      { label: "A", value: 10 },
      { label: "B", value: 50 },
      { label: "C", value: 20 },
    ];
    const def = mount({ dataSet: unsorted });
    const keep = mount({ dataSet: unsorted, sortByValue: false });
    const cd = def.chart.getContext()!;
    const ck = keep.chart.getContext()!;
    if (cd.chartType === "pie-chart") expect(cd.slices.map((s) => s.label)).toEqual(["B", "C", "A"]);
    if (ck.chartType === "pie-chart") expect(ck.slices.map((s) => s.label)).toEqual(["A", "B", "C"]);
    def.chart.destroy();
    def.host.remove();
    keep.chart.destroy();
    keep.host.remove();
  });

  it("disabledItems drops a slice; filter keeps the top-N", () => {
    const disabled = mount({ dataSet: data, disabledItems: ["Cocoa"] });
    const dctx = disabled.chart.getContext()!;
    if (dctx.chartType === "pie-chart") expect(dctx.slices.map((s) => s.label)).toEqual(["Coffee", "Tea"]);
    disabled.chart.destroy();
    disabled.host.remove();

    const top = mount({ dataSet: data, filter: { limit: 2, sortingDir: "desc" } });
    const tctx = top.chart.getContext()!;
    if (tctx.chartType === "pie-chart") {
      expect(tctx.slices.map((s) => s.label).sort()).toEqual(["Coffee", "Tea"]);
    }
    top.chart.destroy();
    top.host.remove();
  });

  it("fires onChartDataProcessed and warns on empty / negative data", () => {
    let ctxType = "";
    const a = mount({ dataSet: data, onChartDataProcessed: (c) => (ctxType = c.chartType) });
    expect(ctxType).toBe("pie-chart");
    a.chart.destroy();
    a.host.remove();

    let warned: unknown[] = [];
    const b = mount({ dataSet: [], onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    b.chart.destroy();
    b.host.remove();

    let warned2: unknown[] = [];
    const c = mount({
      dataSet: [{ label: "X", value: -5 }],
      onDataWarning: (w) => (warned2 = w),
    });
    expect(warned2.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    c.chart.destroy();
    c.host.remove();
  });

  it("renders a legend when showLegend is set", () => {
    const { host, chart } = mount({ dataSet: data, showLegend: true });
    expect(host.querySelectorAll("rect.pie-legend-swatch").length).toBe(3);
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount({ dataSet: data });
    chart.update({ dataSet: data.slice(0, 2), width: 400, height: 400 });
    expect(host.querySelectorAll("path.slice").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
