import { describe, it, expect } from "vitest";
import { mountRibbonChart } from "../src/engine/ribbonChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { RibbonChartProps, RibbonDataRow } from "../src/types";

const series: RibbonDataRow[] = [
  { date: "2001", "Fruit Sales": 10, Veg: 5 },
  { date: "2002", "Fruit Sales": 14, Veg: 8 },
  { date: "2003", "Fruit Sales": 9, Veg: 12 },
];
const keys = ["Fruit Sales", "Veg"];

function mount(extra: Partial<RibbonChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRibbonChart(host, { series, keys, title: "Demo", width: 600, height: 300, ...extra });
  return { host, chart };
}

describe("mountRibbonChart (jsdom)", () => {
  it("renders a stacked column rect per (date,key) with data-label-safe", () => {
    const { host, chart } = mount();
    const cols = host.querySelectorAll<SVGRectElement>("rect.bar");
    expect(cols.length).toBe(6); // 3 dates x 2 keys
    const safes = Array.from(cols).map((c) => c.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Fruit Sales")); // "Fruit_Sales"
    chart.destroy();
    host.remove();
  });

  it("renders ribbon connectors between adjacent dates per key", () => {
    const { host, chart } = mount();
    // 2 gaps x 2 keys = 4 ribbon paths
    expect(host.querySelectorAll("path.ribbon").length).toBe(4);
    chart.destroy();
    host.remove();
  });

  it("removes a disabled key from columns and ribbons", () => {
    const { host, chart } = mount({ disabledItems: ["Veg"] });
    expect(host.querySelectorAll("rect.bar").length).toBe(3); // 3 dates x 1 key
    expect(host.querySelectorAll("path.ribbon").length).toBe(2); // 2 gaps x 1 key
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

  it("exposes a ribbon context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("ribbon-chart");
    if (ca.chartType === "ribbon-chart") {
      expect(ca.keys).toEqual(keys);
      expect(ca.series.find((s) => s.key === "Fruit Sales")!.total).toBe(33); // 10+14+9
    }
    // legendData rows per active key (consumer colour-authority / docs legend hook).
    expect(ca.legendData!.map((l) => l.label)).toEqual(keys);
    expect(ca.legendData![0].dataLabelSafe).toBe(sanitizeForClassName("Fruit Sales"));
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("re-ranks the stack per date so a key's vertical position follows its value (legacy parity)", () => {
    const { host, chart } = mount();
    const rects = Array.from(host.querySelectorAll<SVGRectElement>("rect.bar"));
    // Columns are emitted date-major: [0,1] = 2001, [2,3] = 2002, [4,5] = 2003.
    const byDate = (i: number, label: string) =>
      rects.slice(i * 2, i * 2 + 2).find((r) => r.getAttribute("data-label") === label)!;
    const y = (r: SVGRectElement) => Number(r.getAttribute("y"));
    // 2001: Fruit (10) outranks Veg (5) -> Fruit on top (smaller y), Veg at the bottom.
    expect(y(byDate(0, "Fruit Sales"))).toBeLessThan(y(byDate(0, "Veg")));
    // 2003: Veg (12) outranks Fruit (9) -> the stack order flips.
    expect(y(byDate(2, "Veg"))).toBeLessThan(y(byDate(2, "Fruit Sales")));
    chart.destroy();
    host.remove();
  });

  it("fires onDataWarning for empty data and update/destroy work", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    mountRibbonChart(host, { series: [], keys: [], width: 400, height: 200, onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => (w as { type: string }).type === "empty-dataset")).toBe(true);
    host.remove();

    const m = mount();
    m.chart.update({ series: series.slice(0, 1), keys, width: 600, height: 300 });
    expect(m.host.querySelectorAll("rect.bar").length).toBe(2); // 1 date x 2 keys, no ribbons
    expect(m.host.querySelectorAll("path.ribbon").length).toBe(0);
    m.chart.destroy();
    expect(m.host.querySelectorAll("svg").length).toBe(0);
    m.host.remove();
  });
});
