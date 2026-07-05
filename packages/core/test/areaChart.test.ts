import { describe, it, expect } from "vitest";
import { mountAreaChart } from "../src/engine/areaChart";
import { processAreaChartData } from "../src/areaChart/data";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { AreaChartProps, AreaDataRow } from "../src/types";

const series: AreaDataRow[] = [
  { date: 2020, "Fruit Sales": 10, Veg: 5, Dairy: 3 },
  { date: 2021, "Fruit Sales": 12, Veg: 6, Dairy: 4 },
  { date: 2022, "Fruit Sales": 9, Veg: 8, Dairy: 6 },
];
const keys = ["Fruit Sales", "Veg", "Dairy"];

function mount(extra: Partial<AreaChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountAreaChart(host, {
    series,
    keys,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "number",
    ...extra,
  });
  return { host, chart };
}

describe("processAreaChartData (stack)", () => {
  it("stacks active keys cumulatively and drops disabled keys", () => {
    const r = processAreaChartData(series, { keys, xAxisDataType: "number" });
    expect(r.activeKeys).toEqual(keys);
    // Veg layer at 2020 sits on top of Fruit Sales (10): [10, 15]
    const veg = r.stacked.find((s) => s.key === "Veg")!;
    expect(veg.values[0][0]).toBe(10);
    expect(veg.values[0][1]).toBe(15);

    const r2 = processAreaChartData(series, { keys, disabledItems: ["Veg"], xAxisDataType: "number" });
    expect(r2.activeKeys).toEqual(["Fruit Sales", "Dairy"]);
    // Dairy now stacks directly on Fruit Sales (10): [10, 13]
    const dairy = r2.stacked.find((s) => s.key === "Dairy")!;
    expect(dairy.values[0][0]).toBe(10);
    expect(dairy.values[0][1]).toBe(13);
  });
});

describe("mountAreaChart (jsdom)", () => {
  it("emits legendData (label/dataLabelSafe) on the context - the colour-authority hook", () => {
    // Without legendData, thd's setMetadata early-returns and stacked fills resolve transparent.
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    expect(ctx.legendData!.map((l) => l.label)).toEqual(keys);
    const fruit = ctx.legendData!.find((l) => l.label === "Fruit Sales")!;
    expect(fruit.dataLabelSafe).toBe(sanitizeForClassName("Fruit Sales")); // "Fruit_Sales"
    chart.destroy();
    host.remove();
  });

  it("renders one area path per key carrying data-label-safe", () => {
    const { host, chart } = mount();
    const areas = host.querySelectorAll<SVGPathElement>("path.area");
    expect(areas.length).toBe(3);
    const safes = Array.from(areas).map((a) => a.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Fruit Sales")); // "Fruit_Sales"
    chart.destroy();
    host.remove();
  });

  it("removes a disabled key from the rendered stack", () => {
    const { host, chart } = mount({ disabledItems: ["Veg"] });
    expect(host.querySelectorAll("path.area").length).toBe(2);
    chart.destroy();
    host.remove();
  });

  it("builds an a11y mirror with one row per key", () => {
    const { host, chart } = mount();
    const rows = host.querySelectorAll(".mv-a11y table tbody tr");
    expect(rows.length).toBe(3);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("area chart");
    chart.destroy();
    host.remove();
  });

  it("exposes an area-chart context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("area-chart");
    if (ca.chartType === "area-chart") {
      expect(ca.keys).toEqual(keys);
      // Fruit Sales total = 10+12+9 = 31
      expect(ca.series.find((s) => s.key === "Fruit Sales")!.total).toBe(31);
    }
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("reports the largest series in the summary", () => {
    const { host, chart } = mount();
    // Fruit Sales total 31 is the largest.
    expect(chart.getContext()!.summary).toContain("Fruit Sales");
    chart.destroy();
    host.remove();
  });

  it("fires onDataWarning for a non-finite value", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    mountAreaChart(host, {
      series: [{ date: 2020, A: NaN }],
      keys: ["A"],
      width: 400,
      height: 200,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-finite-value")).toBe(true);
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ series, keys: ["Fruit Sales"], width: 600, height: 300, xAxisDataType: "number" });
    expect(host.querySelectorAll("path.area").length).toBe(1);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});

describe("processAreaChartData stackOffset (Task B1.2)", () => {
  const twoSeries: AreaDataRow[] = [
    { date: 2020, A: 10, B: 5 }, // total 15: A -> [0, 2/3], B -> [2/3, 1]
    { date: 2021, A: 0, B: 0 }, // zero-total slice: must render as 0s, not NaN
  ];

  it('defaults to "none" - byte-identical to today\'s absolute stack', () => {
    const withDefault = processAreaChartData(series, { keys, xAxisDataType: "number" });
    const withNone = processAreaChartData(series, {
      keys,
      xAxisDataType: "number",
      stackOffset: "none",
    });
    expect(withNone).toEqual(withDefault);
    // and it's still the plain d3.stack cumulative sum, e.g. Veg on top of Fruit Sales.
    const veg = withDefault.stacked.find((s) => s.key === "Veg")!;
    expect(veg.values[0]).toEqual({ 0: 10, 1: 15, data: series[0] });
  });

  it('"expand" normalizes a two-series slice to fractions summing to 1', () => {
    const r = processAreaChartData(twoSeries, {
      keys: ["A", "B"],
      xAxisDataType: "number",
      stackOffset: "expand",
    });
    const a = r.stacked.find((s) => s.key === "A")!;
    const b = r.stacked.find((s) => s.key === "B")!;
    // Row 0 (10, 5 / total 15): A is the bottom band [0, 10/15]; B stacks on top [10/15, 1].
    expect(a.values[0][0]).toBe(0);
    expect(a.values[0][1]).toBeCloseTo(10 / 15, 10);
    expect(b.values[0][0]).toBeCloseTo(10 / 15, 10);
    expect(b.values[0][1]).toBe(1);
    // the two bands' heights sum to exactly the whole slice.
    const heightA = a.values[0][1] - a.values[0][0];
    const heightB = b.values[0][1] - b.values[0][0];
    expect(heightA + heightB).toBeCloseTo(1, 10);
  });

  it('"expand" leaves a zero-total slice at 0 (no NaN) - matches d3 stackOffsetExpand\'s own divide-by-zero guard', () => {
    const r = processAreaChartData(twoSeries, {
      keys: ["A", "B"],
      xAxisDataType: "number",
      stackOffset: "expand",
    });
    const a = r.stacked.find((s) => s.key === "A")!;
    const b = r.stacked.find((s) => s.key === "B")!;
    expect(a.values[1][0]).toBe(0);
    expect(a.values[1][1]).toBe(0);
    expect(b.values[1][0]).toBe(0);
    expect(b.values[1][1]).toBe(0);
    expect(Number.isNaN(a.values[1][1])).toBe(false);
    expect(Number.isNaN(b.values[1][1])).toBe(false);
  });

  it('"expand" forces the y-axis domain to [0,1], overriding yAxisDomain/forcePercentageScale', () => {
    const r = processAreaChartData(twoSeries, {
      keys: ["A", "B"],
      xAxisDataType: "number",
      stackOffset: "expand",
      forcePercentageScale: true,
      yAxisDomain: [0, 50],
    });
    expect(r.yAxisDomain).toEqual([0, 1]);
  });
});

describe("mountAreaChart stackOffset expand (jsdom)", () => {
  const twoSeries: AreaDataRow[] = [
    { date: 2020, A: 10, B: 5 },
    { date: 2021, A: 8, B: 8 },
  ];

  it("reports a [0,1] y-axis domain in the context", () => {
    const { host, chart } = mount({ series: twoSeries, keys: ["A", "B"], stackOffset: "expand" });
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("area-chart");
    if (ctx.chartType === "area-chart") expect(ctx.yAxis.domain).toEqual([0, 1]);
    chart.destroy();
    host.remove();
  });

  it("formats y-axis ticks as percentages by default", () => {
    const { host, chart } = mount({ series: twoSeries, keys: ["A", "B"], stackOffset: "expand" });
    const labels = Array.from(host.querySelectorAll(".mv-y-axis .mv-axis-label")).map(
      (n) => n.textContent
    );
    expect(labels.some((l) => l?.includes("%"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("an explicit yAxisFormat overrides the default percent formatter in expand mode", () => {
    const { host, chart } = mount({
      series: twoSeries,
      keys: ["A", "B"],
      stackOffset: "expand",
      yAxisFormat: (d) => `custom:${d}`,
    });
    const labels = Array.from(host.querySelectorAll(".mv-y-axis .mv-axis-label")).map(
      (n) => n.textContent
    );
    expect(labels.every((l) => l?.startsWith("custom:"))).toBe(true);
    expect(labels.some((l) => l?.includes("%"))).toBe(false);
    chart.destroy();
    host.remove();
  });

  it("exposes an identical expand-mode context across SVG and canvas renderers", () => {
    const a = mount({ series: twoSeries, keys: ["A", "B"], stackOffset: "expand", renderer: "svg" });
    const b = mount({ series: twoSeries, keys: ["A", "B"], stackOffset: "expand", renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });
});

describe("mountAreaChart fillPeriodTicks (Layer 2)", () => {
  it("marks a missing period (2022) as a faded no-data tick", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountAreaChart(host, {
      series: [
        { date: 2020, "Fruit Sales": 10, Veg: 5, Dairy: 3 },
        { date: 2021, "Fruit Sales": 12, Veg: 6, Dairy: 4 },
        { date: 2023, "Fruit Sales": 9, Veg: 8, Dairy: 6 },
      ],
      keys,
      width: 900,
      height: 300,
      xAxisDataType: "date_annual",
      xAxisFormat: (d) => String(new Date(Number(d)).getUTCFullYear()),
      fillPeriodTicks: true,
    });
    const faded = Array.from(host.querySelectorAll("text.mv-tick-nodata")).map((l) => l.textContent);
    expect(faded).toContain("2022");
    chart.destroy();
    host.remove();
  });

  it("no-data tick hover works THROUGH the topmost overlay (overlay mousemove, not mouseenter)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountAreaChart(host, {
      series: [
        { date: 2020, "Fruit Sales": 10, Veg: 5, Dairy: 3 },
        { date: 2021, "Fruit Sales": 12, Veg: 6, Dairy: 4 },
        { date: 2023, "Fruit Sales": 9, Veg: 8, Dairy: 6 },
      ],
      keys,
      width: 900,
      height: 300,
      xAxisDataType: "date_annual",
      xAxisFormat: (d) => String(new Date(Number(d)).getUTCFullYear()),
      fillPeriodTicks: true,
      noDataTickTooltip: () => "No area data here",
    });
    const faded = host.querySelector<SVGTextElement>("text.mv-tick-nodata")!;
    // jsdom returns a zero rect; give the faded label a real box to hit-test against.
    faded.getBoundingClientRect = () =>
      ({ left: 100, right: 140, top: 400, bottom: 420, width: 40, height: 20, x: 100, y: 400, toJSON() {} }) as DOMRect;
    const overlay = host.querySelector<SVGRectElement>(".tpRef")!;
    const tooltip = host.querySelector<HTMLDivElement>(".tooltip")!;
    // The overlay (topmost) captures the move; onOverlayMove must detect the faded label.
    overlay.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 410 }));
    expect(tooltip.style.visibility).toBe("visible");
    expect(tooltip.innerHTML).toContain("No area data here");
    // moving onto the empty plot clears it (normal hit-test finds no row)
    overlay.dispatchEvent(new MouseEvent("mousemove", { clientX: 5, clientY: 5 }));
    expect(tooltip.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });
});
