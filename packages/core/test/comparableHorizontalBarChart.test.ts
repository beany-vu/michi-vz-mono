import { describe, it, expect } from "vitest";
import { mountComparableHorizontalBarChart } from "../src/engine/comparableHorizontalBarChart";
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
});
