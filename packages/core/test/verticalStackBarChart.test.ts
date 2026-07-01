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

  it("onChartDataProcessed is idempotent - fires once per distinct context (no dispatch loop)", () => {
    // ByTrend (Tariff Structure) runs TWO colour writers - useColorV2 for the
    // fixed buckets AND onChartDataProcessed=setMetadata. If the engine re-emits
    // an unchanged context every render, the second writer never converges →
    // "Maximum update depth exceeded". The guard emits only when the serialized
    // context actually changes. Mirrors comparableHorizontalBarChart.
    let calls = 0;
    const onChartDataProcessed = () => {
      calls++;
    };
    const { host, chart } = mount({ onChartDataProcessed });
    expect(calls).toBe(1); // initial render
    chart.update({ dataSet: sample, title: "Demo", width: 600, height: 360, onChartDataProcessed });
    expect(calls).toBe(1); // unchanged context → NOT re-emitted
    chart.update({ dataSet: sample.slice(0, 1), title: "Demo", width: 600, height: 360, onChartDataProcessed });
    expect(calls).toBe(2); // changed data → emitted once more
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

  it("calls tooltipFormatter with the legacy {item,key,seriesKey,series} object, not a flat rect", () => {
    // thd consumers do `data.item[data.key]` and read `data.series`. The legacy chart
    // passed { item, key, seriesKey, series, isMissing }; the engine must match, or the
    // formatter throws on `undefined.item[...]` and no tooltip renders.
    let received: unknown = null;
    const { host, chart } = mount({
      renderer: "svg",
      tooltipFormatter: (d) => {
        received = d;
        return "ok";
      },
    });
    const bar = host.querySelector<SVGRectElement>("rect.bar")!;
    bar.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

    expect(received).toBeTruthy();
    const d = received as {
      item: Record<string, unknown>;
      key: string;
      seriesKey: string;
      series: unknown[];
    };
    expect(d.item).toBeDefined(); // the data row, not undefined
    expect(typeof d.key).toBe("string"); // the hovered segment key
    expect(d.seriesKey).toBeDefined();
    expect(Array.isArray(d.series)).toBe(true);
    // the exact access the consumer makes - must resolve, not throw
    expect(d.item[d.key]).toBeDefined();

    chart.destroy();
    host.remove();
  });

  it("reverses legend/colour order for keysOrder=bottomToTop, leaving stack key order forward", () => {
    // Legacy colour parity: the consumer colour authority assigns colours by
    // appearance order in legendData, and the legacy reversed it for bottomToTop.
    const ds: VerticalStackBarDataSet[] = [
      { seriesKey: "trade", seriesKeyAbbreviation: "T", series: [{ date: "2001", A: 5, B: 3, C: 1 }] },
    ];
    const top = mount({ keys: ["A", "B", "C"], keysOrder: "topToBottom", dataSet: ds });
    const bot = mount({ keys: ["A", "B", "C"], keysOrder: "bottomToTop", dataSet: ds });
    const topCtx = top.chart.getContext()!;
    const botCtx = bot.chart.getContext()!;
    if (topCtx.chartType === "vertical-stack-bar-chart") {
      expect(topCtx.legendData.map((l) => l.label)).toEqual(["A", "B", "C"]);
    }
    if (botCtx.chartType === "vertical-stack-bar-chart") {
      // legendData (colour order) reversed...
      expect(botCtx.legendData.map((l) => l.label)).toEqual(["C", "B", "A"]);
      // ...but keys (stack order) stays forward so A is still anchored at the bottom.
      expect(botCtx.keys).toEqual(["A", "B", "C"]);
    }
    top.chart.destroy();
    top.host.remove();
    bot.chart.destroy();
    bot.host.remove();
  });

  it("rotates dense x-axis labels (-45) instead of overlapping them horizontally", () => {
    // 14 wide monthly labels in a 600px chart: don't fit horizontally, so the
    // band axis must tilt them -45 (the legacy behaviour) rather than smear them.
    const dates = Array.from({ length: 14 }, (_, i) => `2020-${String(i + 1).padStart(2, "0")}`);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountVerticalStackBarChart(host, {
      dataSet: [
        {
          seriesKey: "trade",
          seriesKeyAbbreviation: "T",
          series: dates.map((d, i) => ({ date: d, Land: 10 + i })),
        },
      ],
      width: 600,
      height: 360,
      renderer: "svg",
      keys: ["Land"],
    });
    const labels = host.querySelectorAll<SVGTextElement>(".mv-x-axis-band .mv-axis-label");
    expect(labels.length).toBeGreaterThan(0);
    const rotated = Array.from(labels).some((t) =>
      (t.getAttribute("transform") || "").includes("rotate(-45)")
    );
    expect(rotated).toBe(true);
    chart.destroy();
    host.remove();
  });
});
