import { describe, it, expect } from "vitest";
import { mountRadarChart } from "../src/engine/radarChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { RadarChartProps, RadarDataItem } from "../src/types";

const axes = ["Speed", "Power", "Range", "Agility", "Cost"];
const series: RadarDataItem[] = [
  { label: "Model A", color: "#f00", values: [8, 6, 7, 9, 5] },
  { label: "Model B", color: "#00f", values: [5, 9, 6, 4, 8] },
];

function mount(extra: Partial<RadarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadarChart(host, { series, axes, title: "Demo", width: 500, height: 500, ...extra });
  return { host, chart };
}

describe("mountRadarChart (jsdom)", () => {
  it("renders one polygon per series carrying data-label-safe, with N vertices", () => {
    const { host, chart } = mount();
    const polys = host.querySelectorAll<SVGPolygonElement>("polygon.radar-area");
    expect(polys.length).toBe(2);
    const safes = Array.from(polys).map((p) => p.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Model A")); // "Model_A"
    // each polygon has 5 vertices (5 axes)
    expect(polys[0].getAttribute("points")!.trim().split(" ").length).toBe(5);
    chart.destroy();
    host.remove();
  });

  it("renders a polar grid (rings + spokes + axis labels)", () => {
    const { host, chart } = mount({ rings: 4 });
    expect(host.querySelectorAll(".mv-radar-grid polygon").length).toBe(4); // 4 rings
    expect(host.querySelectorAll(".mv-radar-grid line").length).toBe(5); // 5 spokes
    expect(host.querySelectorAll(".mv-radar-grid text").length).toBe(5); // 5 axis labels
    chart.destroy();
    host.remove();
  });

  it("excludes disabled series", () => {
    const { host, chart } = mount({ disabledItems: ["Model B"] });
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per series + axis columns", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(2);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Series", ...axes]);
    chart.destroy();
    host.remove();
  });

  it("exposes a radar context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("radar-chart");
    if (ca.chartType === "radar-chart") {
      expect(ca.axes).toEqual(axes);
      const mA = ca.series.find((s) => s.label === "Model A")!;
      expect(mA.peakAxis).toBe("Agility"); // value 9 is highest
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("warns on too-few axes and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    mountRadarChart(host, { series, axes: ["A", "B"], width: 400, height: 400, onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    host.remove();

    const m = mount();
    m.chart.update({ series: series.slice(0, 1), axes, width: 500, height: 500 });
    expect(m.host.querySelectorAll("polygon.radar-area").length).toBe(1);
    m.chart.destroy();
    expect(m.host.querySelectorAll("svg").length).toBe(0);
    m.host.remove();
  });
});
