import { describe, it, expect } from "vitest";
import { mountBarBellChart } from "../src/engine/barBellChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { BarBellChartProps, BarBellDataRow } from "../src/types";

const dataSet: BarBellDataRow[] = [
  { date: "2001", "Fruit Sales": 10, Veg: 5 },
  { date: "2002", "Fruit Sales": 14, Veg: 8 },
  { date: "2003", "Fruit Sales": 9, Veg: 12 },
];
const keys = ["Fruit Sales", "Veg"];

function mount(extra: Partial<BarBellChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountBarBellChart(host, { dataSet, keys, title: "Demo", width: 600, height: 300, ...extra });
  return { host, chart };
}

describe("mountBarBellChart (jsdom)", () => {
  it("renders an end-cap circle per (row,key) with data-label-safe", () => {
    const { host, chart } = mount();
    const caps = host.querySelectorAll(".bar-bell-cap");
    expect(caps.length).toBe(6); // 3 rows x 2 keys
    const safes = Array.from(caps).map((c) => c.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Fruit Sales")); // "Fruit_Sales"
    chart.destroy();
    host.remove();
  });

  it("stacks segments cumulatively (Veg cap x > Fruit cap x in the same row)", () => {
    const { host, chart } = mount();
    const row1Caps = Array.from(host.querySelectorAll<SVGCircleElement>(".bar-bell-cap")).slice(0, 2);
    const fruitX = Number(row1Caps[0].getAttribute("cx"));
    const vegX = Number(row1Caps[1].getAttribute("cx"));
    expect(vegX).toBeGreaterThan(fruitX); // Veg sits to the right of Fruit (cumulative)
    chart.destroy();
    host.remove();
  });

  it("removes a disabled key from the rendered caps", () => {
    const { host, chart } = mount({ disabledItems: ["Veg"] });
    expect(host.querySelectorAll(".bar-bell-cap").length).toBe(3); // 3 rows x 1 key
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per date + a Total column", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(3);
    const headers = Array.from(host.querySelectorAll(".mv-a11y table thead th")).map((t) => t.textContent);
    expect(headers).toEqual(["Date", "Fruit Sales", "Veg", "Total"]);
    chart.destroy();
    host.remove();
  });

  it("exposes a bar-bell context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("bar-bell-chart");
    if (ca.chartType === "bar-bell-chart") {
      expect(ca.keys).toEqual(keys);
      expect(ca.series.find((s) => s.key === "Fruit Sales")!.total).toBe(33); // 10+14+9
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("fires onDataWarning for empty data and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    mountBarBellChart(host, { dataSet: [], keys: [], width: 400, height: 200, onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    host.remove();

    const m = mount();
    m.chart.update({ dataSet: dataSet.slice(0, 1), keys, width: 600, height: 300 });
    expect(m.host.querySelectorAll(".bar-bell-cap").length).toBe(2); // 1 row x 2 keys
    m.chart.destroy();
    expect(m.host.querySelectorAll("svg").length).toBe(0);
    m.host.remove();
  });
});
