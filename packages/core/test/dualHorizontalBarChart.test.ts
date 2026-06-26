import { describe, it, expect } from "vitest";
import { mountDualHorizontalBarChart } from "../src/engine/dualHorizontalBarChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { DualBarChartProps, DualBarDataPoint } from "../src/types";

const dataSet: DualBarDataPoint[] = [
  { label: "Alpha One", value1: 20, value2: 14 },
  { label: "Beta", value1: 35, value2: 28 },
  { label: "Gamma", value1: 10, value2: 22 },
];

function mount(extra: Partial<DualBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountDualHorizontalBarChart(host, { dataSet, title: "Demo", width: 600, height: 300, ...extra });
  return { host, chart };
}

describe("mountDualHorizontalBarChart (jsdom)", () => {
  it("renders two bars per label (value1 right, value2 left) with data-label-safe", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll("rect.bar").length).toBe(6);
    expect(host.querySelectorAll("rect.bar.value1").length).toBe(3);
    expect(host.querySelectorAll("rect.bar.value2").length).toBe(3);
    expect(host.querySelector('rect.bar[data-label-safe="Alpha_One"]')).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("value1 bar sits right of centre, value2 bar left of centre", () => {
    const { host, chart } = mount({ width: 600 });
    const center = 300;
    const v1 = host.querySelector<SVGRectElement>("rect.bar.value1")!;
    const v2 = host.querySelector<SVGRectElement>("rect.bar.value2")!;
    expect(Number(v1.getAttribute("x"))).toBeGreaterThanOrEqual(center - 0.5);
    expect(Number(v2.getAttribute("x"))).toBeLessThanOrEqual(center + 0.5);
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per label", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(3);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Label", "Value 1", "Value 2"]);
    chart.destroy();
    host.remove();
  });

  it("exposes a dual-bar context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("dual-horizontal-bar-chart");
    if (ca.chartType === "dual-horizontal-bar-chart") {
      expect(ca.stats.count).toBe(3);
      expect(ca.stats.total1).toBe(65); // 20+35+10
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("excludes disabled labels, fires onDataWarning, update/destroy work", () => {
    const off = mount({ disabledItems: ["Gamma"] });
    expect(off.host.querySelectorAll("rect.bar").length).toBe(4);
    off.chart.destroy();
    off.host.remove();

    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountDualHorizontalBarChart(host, {
      dataSet: [{ label: "Bad", value1: NaN, value2: 1 }],
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
