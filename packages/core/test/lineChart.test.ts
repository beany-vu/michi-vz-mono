import { describe, it, expect } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { LineChartProps, LineDataItem } from "../src/types";

const annual = (vals: number[], start = 2016): { date: number; value: number; certainty: boolean }[] =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));

const sample: LineDataItem[] = [
  { label: "Alpha One", color: "#ff0000", series: annual([10, 20, 15]) },
  { label: "Beta", color: "#00ff00", series: annual([5, 8, 12]) },
];

function mount(extra: Partial<LineChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, {
    dataSet: sample,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    ...extra,
  });
  return { host, chart };
}

describe("mountLineChart (jsdom)", () => {
  it("renders a line path per series carrying data-label-safe", () => {
    const { host, chart } = mount();
    const lines = host.querySelectorAll<SVGPathElement>("path.line");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const safes = Array.from(lines).map((l) => l.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("injects svgChildren (axis-title text) into a .mv-svg-children group", () => {
    const { host, chart } = mount({ svgChildren: '<text x="50" y="25">Trade after policy change</text>' });
    const g = host.querySelector(".mv-svg-children")!;
    expect(g).not.toBeNull();
    expect(g.querySelector("text")!.textContent).toBe("Trade after policy change");
    chart.destroy();
    host.remove();
  });

  it("draws a dashed run when detectGaps flags a gap", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "Gappy", color: "#00f", series: [
        { date: 2016, value: 1, certainty: true },
        { date: 2017, value: 2, certainty: true },
        { date: 2024, value: 3, certainty: true },
      ] }],
      detectGaps: true,
    });
    const dashed = host.querySelectorAll('path.line[stroke-dasharray="4,4"]');
    expect(dashed.length).toBeGreaterThanOrEqual(1);
    chart.destroy();
    host.remove();
  });

  it("draws a single-point guide line for one-point series", () => {
    const { host, chart } = mount({
      dataSet: [{ label: "Solo", color: "#abc", series: [{ date: 2016, value: 42, certainty: true }] }],
      singlePointLine: true,
    });
    expect(host.querySelectorAll("line.single-point-line").length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("renders data-point marks only when showDataPoints", () => {
    const off = mount();
    expect(off.host.querySelectorAll(".data-point").length).toBe(0);
    off.chart.destroy();
    off.host.remove();

    const on = mount({ showDataPoints: true });
    expect(on.host.querySelectorAll(".data-point").length).toBe(6); // 2 series x 3 pts
    on.chart.destroy();
    on.host.remove();
  });

  it("builds an a11y mirror with one row per series", () => {
    const { host, chart } = mount();
    const rows = host.querySelectorAll(".mv-a11y table tbody tr");
    expect(rows.length).toBe(2);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Line chart");
    chart.destroy();
    host.remove();
  });

  it("exposes a line-chart context, identical in SVG and canvas (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.chartType).toBe("line-chart");
    if (ca.chartType === "line-chart") expect(ca.series.length).toBe(2);
    expect(ca.renderer).toBe("svg");
    expect(cb.renderer).toBe("canvas");
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("emits visibleItems (not-disabled + has-data) - legacy useLineChartMetadataExpose parity", () => {
    // Market/ProductDiversification read this off onChartDataProcessed for master/slave colour sync.
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    if (ctx.chartType === "line-chart") expect(ctx.visibleItems).toEqual(["Alpha One", "Beta"]);
    chart.destroy();
    host.remove();

    const off = mount({ disabledItems: ["Beta"] });
    const ctx2 = off.chart.getContext()!;
    if (ctx2.chartType === "line-chart") expect(ctx2.visibleItems).toEqual(["Alpha One"]);
    off.chart.destroy();
    off.host.remove();
  });

  it("reports the largest mover in the summary", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    // Alpha One: 10->15 (+5); Beta: 5->12 (+7) => Beta is the largest mover.
    expect(ctx.summary).toContain("Beta");
    chart.destroy();
    host.remove();
  });

  it("fires onDataWarning for a duplicate date", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountLineChart(host, {
      dataSet: [{ label: "Dup", series: [
        { date: 2016, value: 1, certainty: true },
        { date: 2016, value: 2, certainty: true },
      ] }],
      xAxisDataType: "date_annual",
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "duplicate-date")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ dataSet: sample.slice(0, 1), width: 600, height: 300, xAxisDataType: "date_annual" });
    expect(host.querySelectorAll("g.data-group").length).toBe(1);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});

// Formats an epoch-ms tick value back to its UTC year / year-month label.
const yearLabel = (d: number | string) => String(new Date(Number(d)).getUTCFullYear());
const monthLabel = (d: number | string) => {
  const dt = new Date(Number(d));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
};
// Scope to the x-axis group - `.mv-axis-label` is shared with the y-axis labels.
const axisTexts = (host: HTMLElement) =>
  Array.from(host.querySelectorAll(".mv-x-axis text.mv-axis-label")).map((l) => l.textContent);

describe("mountLineChart x-axis: first + last never dropped (Layer 1)", () => {
  it("annual 2020-2024: renders a tick for BOTH the first (2020) and last (2024) year", () => {
    const { host, chart } = mount({
      xAxisDataType: "date_annual",
      width: 900,
      xAxisFormat: yearLabel,
      dataSet: [
        { label: "S", color: "#00f", series: [2020, 2021, 2022, 2023, 2024].map((y, i) => ({ date: y, value: i + 1, certainty: true })) },
      ],
    });
    const labels = axisTexts(host);
    expect(labels).toContain("2020");
    expect(labels).toContain("2024");
    chart.destroy();
    host.remove();
  });

  it("monthly with NON-round endpoints (2020-02 .. 2023-11): keeps the true first + last month", () => {
    // raw d3 scaleTime().ticks() would snap to Januarys and drop both ends; the fix
    // feeds the real periods so the endpoints survive (thinned or not, order preserved).
    const months: { date: string; value: number; certainty: boolean }[] = [];
    let y = 2020;
    let m = 2;
    for (let i = 0; i < 46; i++) {
      months.push({ date: `${y}-${String(m).padStart(2, "0")}`, value: i, certainty: true });
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
    const { host, chart } = mount({
      xAxisDataType: "date_monthly",
      width: 900,
      xAxisFormat: monthLabel,
      dataSet: [{ label: "S", color: "#00f", series: months }],
    });
    const labels = axisTexts(host);
    expect(labels[0]).toBe("2020-02");
    expect(labels[labels.length - 1]).toBe("2023-11");
    chart.destroy();
    host.remove();
  });
});

describe("mountLineChart fillPeriodTicks (Layer 2)", () => {
  const withGap = {
    xAxisDataType: "date_annual" as const,
    width: 900,
    xAxisFormat: yearLabel,
    fillPeriodTicks: true,
    // 2022 is MISSING from the data
    dataSet: [
      { label: "S", color: "#00f", series: [2020, 2021, 2023, 2024].map((yr) => ({ date: yr, value: 1, certainty: true })) },
    ],
  };

  it("draws the missing period (2022) as a faded no-data tick; present years stay normal", () => {
    const { host, chart } = mount(withGap);
    const faded = Array.from(host.querySelectorAll("text.mv-tick-nodata")).map((l) => l.textContent);
    expect(faded).toContain("2022");
    const normal = Array.from(host.querySelectorAll(".mv-x-axis text.mv-axis-label"))
      .filter((l) => !(l.getAttribute("class") ?? "").includes("mv-tick-nodata"))
      .map((l) => l.textContent);
    expect(normal).toContain("2020");
    expect(normal).toContain("2024");
    chart.destroy();
    host.remove();
  });

  it("hovering a no-data tick shows the custom tooltip", () => {
    const { host, chart } = mount({ ...withGap, noDataTickTooltip: () => "No data for this year" });
    const faded = host.querySelector<SVGTextElement>("text.mv-tick-nodata")!;
    const tooltip = host.querySelector<HTMLDivElement>(".tooltip")!;
    faded.dispatchEvent(new MouseEvent("mouseenter"));
    expect(tooltip.style.visibility).toBe("visible");
    expect(tooltip.innerHTML).toContain("No data for this year");
    faded.dispatchEvent(new MouseEvent("mouseleave"));
    expect(tooltip.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });

  it("does nothing when fillPeriodTicks is off (no faded ticks)", () => {
    const { host, chart } = mount({ ...withGap, fillPeriodTicks: false });
    expect(host.querySelectorAll("text.mv-tick-nodata").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});
