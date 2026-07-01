import { describe, it, expect } from "vitest";
import { mountComparableHorizontalBarChart } from "../src/engine/comparableHorizontalBarChart";
import { createComparableBarScales } from "../src/comparableBar/scales";
import { processComparableBarData } from "../src/comparableBar/data";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { ComparableBarChartProps, ComparableBarDataPoint } from "../src/types";

const dataSet: ComparableBarDataPoint[] = [
  { label: "Alpha One", valueBased: 10, valueCompared: 18 },
  { label: "Beta", valueBased: 30, valueCompared: 22 },
  { label: "Gamma", valueBased: 15, valueCompared: 15 },
];

function mount(extra: Partial<ComparableBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountComparableHorizontalBarChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
}

describe("mountComparableHorizontalBarChart (jsdom)", () => {
  it("renders two bars per label (based + compared) with data-label-safe", () => {
    const { host, chart } = mount();
    const bars = host.querySelectorAll<SVGRectElement>("rect.bar");
    expect(bars.length).toBe(6); // 3 labels x 2 sub-bars
    expect(host.querySelectorAll("rect.bar.value-based").length).toBe(3);
    expect(host.querySelectorAll("rect.bar.value-compared").length).toBe(3);
    const safes = Array.from(bars).map((b) => b.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("applies the based/compared opacities", () => {
    const { host, chart } = mount({ valueBasedOpacity: 0.4, valueComparedOpacity: 0.95 });
    const based = host.querySelector("rect.bar.value-based")!;
    const compared = host.querySelector("rect.bar.value-compared")!;
    expect(based.getAttribute("opacity")).toBe("0.4");
    expect(compared.getAttribute("opacity")).toBe("0.95");
    chart.destroy();
    host.remove();
  });

  it("excludes disabled labels and applies top-N filter", () => {
    const off = mount({ disabledItems: ["Gamma"] });
    expect(off.host.querySelectorAll("rect.bar").length).toBe(4); // 2 labels x 2
    off.chart.destroy();
    off.host.remove();

    const filtered = mount({ filter: { limit: 1, criteria: "valueBased", sortingDir: "desc" } });
    const ctx = filtered.chart.getContext()!;
    if (ctx.chartType === "comparable-horizontal-bar-chart") {
      expect(ctx.series.map((s) => s.label)).toEqual(["Beta"]); // highest valueBased
    }
    filtered.chart.destroy();
    filtered.host.remove();
  });

  it("builds an a11y mirror with one row per label", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(3);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Label", "Based", "Compared", "Difference"]);
    chart.destroy();
    host.remove();
  });

  it("exposes a comparable-bar context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("comparable-horizontal-bar-chart");
    if (ca.chartType === "comparable-horizontal-bar-chart") {
      expect(ca.stats.count).toBe(3);
      expect(ca.series.find((s) => s.label === "Alpha One")!.difference).toBe(8); // 18-10
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onDataWarning for a non-finite value and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountComparableHorizontalBarChart(host, {
      dataSet: [{ label: "Bad", valueBased: NaN, valueCompared: 1 }],
      width: 400,
      height: 200,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    chart.update({ dataSet: dataSet.slice(0, 1), width: 400, height: 200 });
    expect(host.querySelectorAll("rect.bar").length).toBe(2);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });

  it("emits legendData (label/color/dataLabelSafe) on the context - the colour-authority hook", () => {
    // Without legendData, thd's setMetadata early-returns and every bar resolves
    // transparent. dataLabelSafe must equal sanitizeForClassName(label).
    const { host, chart } = mount({ colorsMapping: { Beta: "#abcdef" } });
    const ctx = chart.getContext()!;
    expect(Array.isArray(ctx.legendData)).toBe(true);
    expect(ctx.legendData!.map((l) => l.label)).toEqual(["Alpha One", "Beta", "Gamma"]);
    const beta = ctx.legendData!.find((l) => l.label === "Beta")!;
    expect(beta.color).toBe("#abcdef");
    expect(beta.dataLabelSafe).toBe(sanitizeForClassName("Beta"));
    const alpha = ctx.legendData!.find((l) => l.label === "Alpha One")!;
    expect(alpha.dataLabelSafe).toBe(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("onChartDataProcessed is idempotent - fires once per distinct context (no dispatch loop)", () => {
    // A consumer colour authority dispatches into redux on every call; re-firing an
    // unchanged context every render is the "Maximum update depth" loop.
    let calls = 0;
    const onChartDataProcessed = () => {
      calls++;
    };
    const { host, chart } = mount({ onChartDataProcessed });
    expect(calls).toBe(1); // initial
    chart.update({ dataSet, title: "Demo", width: 600, height: 300, onChartDataProcessed }); // same data
    expect(calls).toBe(1); // unchanged context → NOT re-emitted
    chart.update({ dataSet: dataSet.slice(0, 2), title: "Demo", width: 600, height: 300, onChartDataProcessed });
    expect(calls).toBe(2); // changed → emitted
    chart.destroy();
    host.remove();
  });

  it("xAxisPredefinedDomain (legacy alias) overrides the derived x-axis domain", () => {
    const { host, chart } = mount({ xAxisPredefinedDomain: [-50, 50] });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("comparable-horizontal-bar-chart");
    if (ctx.chartType === "comparable-horizontal-bar-chart") {
      expect(ctx.xAxis.domain).toEqual([-50, 50]);
    }
    chart.destroy();
    host.remove();
  });
});

describe("y-band gridlines respect showGrid (no phantom horizontal lines)", () => {
  it("draws NO .mv-y-axis .mv-grid line (the engine passes y-band showGrid:false)", () => {
    // Regression: the old `stroke=transparent` fallback was overridden by the
    // `.mv-grid { stroke }` CSS, so a dashed line drew under every bar despite showGrid:false.
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-y-axis .mv-grid").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});

describe("createComparableBarScales - maxBarHeight cap", () => {
  const margin = { top: 50, right: 10, bottom: 50, left: 20 };

  it("caps the band thickness and centres the bands when few rows would balloon", () => {
    const labels = ["Africa", "Rest of the World"];
    const uncapped = createComparableBarScales([0, 100], labels, 600, 500, margin);
    expect(uncapped.yScale.bandwidth()).toBeGreaterThan(120); // 2 rows over ~400px = huge

    const capped = createComparableBarScales([0, 100], labels, 600, 500, margin, undefined, 60);
    expect(capped.yScale.bandwidth()).toBeLessThanOrEqual(60 + 0.5);
    // centred: equal whitespace above the first band and below the last
    const top = capped.yScale(labels[0])!;
    const bottom = capped.yScale(labels[1])! + capped.yScale.bandwidth();
    const plotMid = (margin.top + (500 - margin.bottom)) / 2;
    expect((top + bottom) / 2).toBeCloseTo(plotMid, 1);
  });

  it("is a no-op for dense charts whose natural bandwidth is already below the cap", () => {
    const labels = Array.from({ length: 20 }, (_, i) => `row${i}`);
    const plain = createComparableBarScales([0, 100], labels, 600, 500, margin);
    const withCap = createComparableBarScales([0, 100], labels, 600, 500, margin, undefined, 60);
    expect(withCap.yScale.bandwidth()).toBeCloseTo(plain.yScale.bandwidth(), 5);
  });
});

describe("processComparableBarData - symmetricXDomain", () => {
  it("forces a symmetric domain [-M, M] with M = max(|min|, |max|)", () => {
    const data: ComparableBarDataPoint[] = [
      { label: "a", valueBased: -25, valueCompared: -25 },
      { label: "b", valueBased: 32, valueCompared: 32 },
    ];
    const sym = processComparableBarData(data, { symmetric: true });
    expect(sym.xAxisDomain).toEqual([-32, 32]); // 0 centred, sides mirror
    // asymmetric (default) keeps the raw [min, max] spanning zero
    const asym = processComparableBarData(data, {});
    expect(asym.xAxisDomain).toEqual([-25, 32]);
  });
});
