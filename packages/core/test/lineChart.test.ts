import { describe, it, expect } from "vitest";
import { scaleLinear, scaleLog } from "d3-scale";
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

  it("canvas renderer: the no-data tooltip survives the host mousemove hit-test", () => {
    // Regression: in canvas mode onHostMove runs a data hit-test on every mousemove and
    // hides the tooltip when no mark is near - which was stealing the no-data tick tooltip
    // the moment the cursor moved over the (below-plot) faded label. SVG mode returns early
    // so it never showed there.
    const { host, chart } = mount({
      ...withGap,
      renderer: "canvas",
      noDataTickTooltip: () => "No data for this year",
    });
    const faded = host.querySelector<SVGTextElement>("text.mv-tick-nodata")!;
    const tooltip = host.querySelector<HTMLDivElement>(".tooltip")!;
    faded.dispatchEvent(new MouseEvent("mouseenter"));
    expect(tooltip.style.visibility).toBe("visible");
    // a host mousemove away from any data mark must NOT steal the no-data tooltip
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 0, clientY: 0 }));
    expect(tooltip.style.visibility).toBe("visible");
    expect(tooltip.innerHTML).toContain("No data for this year");
    // leaving the tick clears it
    faded.dispatchEvent(new MouseEvent("mouseleave"));
    expect(tooltip.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });
});

describe("mountLineChart enableMouseLine crosshair (legacy mouse-line parity)", () => {
  // Legacy michi-vz showed the vertical mouse line by DEFAULT (enableMouseLine=true),
  // solid #a9a9a9, snapped to the nearest data point x, hidden on mouseleave. The mono
  // port had flipped the default off and followed the raw cursor - these pin the
  // restored contract. jsdom getBoundingClientRect() is all-zero, so clientX maps
  // straight to the model's projected svg x.
  const pointXs = (host: HTMLElement): number[] =>
    Array.from(
      new Set(
        Array.from(host.querySelectorAll<SVGCircleElement>("circle.data-point")).map((c) =>
          Number(c.getAttribute("cx"))
        )
      )
    ).sort((a, b) => a - b);

  it("renders .mv-mouse-line by default (no prop passed)", () => {
    const { host, chart } = mount();
    expect(host.querySelector("line.mv-mouse-line")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("omits .mv-mouse-line when enableMouseLine is explicitly false", () => {
    const { host, chart } = mount({ enableMouseLine: false });
    expect(host.querySelector("line.mv-mouse-line")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("snaps the line to the nearest data point x on mousemove, not the raw cursor x", () => {
    const { host, chart } = mount({ showDataPoints: true });
    const xs = pointXs(host);
    const target = xs[1]; // middle of the 3 annual ticks, safely inside the plot
    const line = host.querySelector<SVGLineElement>("line.mv-mouse-line")!;
    host.dispatchEvent(
      new MouseEvent("mousemove", { clientX: target + 4, clientY: 100, bubbles: true })
    );
    expect(line.style.visibility).toBe("visible");
    expect(line.getAttribute("x1")).toBe(String(target));
    expect(line.getAttribute("x1")).not.toBe(String(target + 4));
    expect(line.getAttribute("x2")).toBe(line.getAttribute("x1"));
    chart.destroy();
    host.remove();
  });

  it("hides the line when the cursor leaves the host", () => {
    const { host, chart } = mount({ showDataPoints: true });
    const xs = pointXs(host);
    const line = host.querySelector<SVGLineElement>("line.mv-mouse-line")!;
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: xs[1], clientY: 100, bubbles: true }));
    expect(line.style.visibility).toBe("visible");
    host.dispatchEvent(new MouseEvent("mouseleave"));
    expect(line.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });

  it("carries no inline stroke attributes - styling comes from CORE_CSS vars", () => {
    // A class CSS rule overrides presentation attributes (y-band gridline gotcha),
    // so inline stroke/dasharray attrs here would be dead weight at best.
    const { host, chart } = mount();
    const line = host.querySelector<SVGLineElement>("line.mv-mouse-line")!;
    expect(line.getAttribute("stroke")).toBeNull();
    expect(line.getAttribute("stroke-width")).toBeNull();
    expect(line.getAttribute("stroke-dasharray")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("accepts a MouseLineConfig object and applies it via the crosshair CSS vars", () => {
    const { host, chart } = mount({
      enableMouseLine: { stroke: "red", strokeWidth: 2, strokeDasharray: "4,2" },
    });
    const line = host.querySelector<SVGLineElement>("line.mv-mouse-line")!;
    expect(line.style.getPropertyValue("--michi-vz-crosshair")).toBe("red");
    expect(line.style.getPropertyValue("--michi-vz-crosshair-width")).toBe("2");
    expect(line.style.getPropertyValue("--michi-vz-crosshair-dash")).toBe("4,2");
    chart.destroy();
    host.remove();
  });

  it("config snap:false tracks the raw cursor x instead of snapping", () => {
    const { host, chart } = mount({ showDataPoints: true, enableMouseLine: { snap: false } });
    const xs = pointXs(host);
    const raw = xs[1] + 4;
    const line = host.querySelector<SVGLineElement>("line.mv-mouse-line")!;
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: raw, clientY: 100, bubbles: true }));
    expect(line.getAttribute("x1")).toBe(String(raw));
    chart.destroy();
    host.remove();
  });

  it("stays hidden when every series is disabled (empty hit data, dataState still ready)", () => {
    // dataState derives from the RAW dataSet while hit data derives from the processed
    // (post-disabledItems) set - the line element mounts but must never show at a
    // stale or arbitrary x when there is nothing to snap to.
    const { host, chart } = mount({ disabledItems: ["Alpha One", "Beta"] });
    const line = host.querySelector<SVGLineElement>("line.mv-mouse-line");
    expect(line).not.toBeNull();
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 100, bubbles: true }));
    expect(line!.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });
});

describe("mountLineChart yAxisScale (log y-axis)", () => {
  // Round powers of 10 so the expected pixel math is exact and easy to eyeball.
  const powersOfTen: LineDataItem[] = [
    {
      label: "Powers",
      color: "#00f",
      series: [
        { date: 2016, value: 10, certainty: true },
        { date: 2017, value: 100, certainty: true },
        { date: 2018, value: 1000, certainty: true },
      ],
    },
  ];
  const margin = { top: 20, right: 20, bottom: 20, left: 40 };

  it("maps known values to the pixel positions of an equivalently-built d3 scaleLog", () => {
    const { host, chart } = mount({
      dataSet: powersOfTen,
      yAxisScale: "log",
      showDataPoints: true,
      width: 600,
      height: 300,
      margin,
    });
    const expected = scaleLog()
      .domain([10, 1000])
      .range([300 - margin.bottom, margin.top])
      .clamp(true)
      .nice();
    const dots = host.querySelectorAll<SVGCircleElement>('circle.data-point[data-label="Powers"]');
    expect(dots.length).toBe(3);
    expect(Number(dots[0].getAttribute("cy"))).toBe(expected(10));
    expect(Number(dots[1].getAttribute("cy"))).toBe(expected(100));
    expect(Number(dots[2].getAttribute("cy"))).toBe(expected(1000));
    chart.destroy();
    host.remove();
  });

  it("defaults to a linear y-axis when yAxisScale is omitted (unchanged pixel math)", () => {
    const { host, chart } = mount({
      dataSet: powersOfTen,
      showDataPoints: true,
      width: 600,
      height: 300,
      margin,
    });
    const expected = scaleLinear()
      .domain([10, 1000])
      .range([300 - margin.bottom, margin.top])
      .clamp(true)
      .nice();
    const dots = host.querySelectorAll<SVGCircleElement>('circle.data-point[data-label="Powers"]');
    expect(Number(dots[1].getAttribute("cy"))).toBe(expected(100));
    chart.destroy();
    host.remove();
  });

  it("drops non-positive values (incl. exactly zero) in log mode, keeps only the positives, and warns with the dropped count", () => {
    const mixed: LineDataItem[] = [
      {
        label: "Mixed",
        color: "#f00",
        series: [
          { date: 2016, value: -5, certainty: true },
          { date: 2017, value: 0, certainty: true },
          { date: 2018, value: 20, certainty: true },
          { date: 2019, value: 40, certainty: true },
        ],
      },
    ];
    let warned: unknown[] = [];
    const { host, chart } = mount({
      dataSet: mixed,
      yAxisScale: "log",
      showDataPoints: true,
      onDataWarning: (w) => (warned = w),
    });
    // Only the 2 positive points (20, 40) are drawn - the negative and the zero are dropped.
    const dots = host.querySelectorAll('circle.data-point[data-label="Mixed"]');
    expect(dots.length).toBe(2);
    const warning = warned.find(
      (w) => (w as { type: string }).type === "non-positive-log-value"
    ) as { type: string; message: string; label?: string } | undefined;
    expect(warning).toBeDefined();
    expect(warning!.label).toBe("Mixed");
    expect(warning!.message).toContain("2");
    chart.destroy();
    host.remove();
  });

  it("does NOT drop non-positive values or warn about them in default linear mode", () => {
    const mixed: LineDataItem[] = [
      {
        label: "Mixed",
        series: [
          { date: 2016, value: -5, certainty: true },
          { date: 2017, value: 20, certainty: true },
        ],
      },
    ];
    let warned: unknown[] = [];
    const { host, chart } = mount({
      dataSet: mixed,
      showDataPoints: true,
      onDataWarning: (w) => (warned = w),
    });
    expect(host.querySelectorAll('circle.data-point[data-label="Mixed"]').length).toBe(2);
    expect(warned.some((w) => (w as { type: string }).type === "non-positive-log-value")).toBe(false);
    chart.destroy();
    host.remove();
  });

  it("falls back to the no-data state (no crash) when every value in the dataSet is non-positive", () => {
    const allNonPositive: LineDataItem[] = [
      {
        label: "AllBad",
        series: [
          { date: 2016, value: 0, certainty: true },
          { date: 2017, value: -3, certainty: true },
        ],
      },
    ];
    expect(() => {
      const { host, chart } = mount({ dataSet: allNonPositive, yAxisScale: "log" });
      expect(host.getAttribute("data-mv-state")).toBe("nodata");
      expect(host.querySelector(".mv-nodata")).not.toBeNull();
      expect(host.querySelectorAll("path.line").length).toBe(0);
      chart.destroy();
      host.remove();
    }).not.toThrow();
  });

  it("still fires the dropped-value warning even when the fallback renders no-data", () => {
    const allNonPositive: LineDataItem[] = [
      { label: "AllBad", series: [{ date: 2016, value: 0, certainty: true }] },
    ];
    let warned: unknown[] = [];
    const { host, chart } = mount({
      dataSet: allNonPositive,
      yAxisScale: "log",
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => (w as { type: string }).type === "non-positive-log-value")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("exposes an identical line-chart context in SVG and canvas with yAxisScale=log (renderer aside)", () => {
    // Extends the existing svg/canvas context-parity test with a dropped-point case,
    // proving buildLineContext stays renderer-agnostic in log mode too.
    const mixed: LineDataItem[] = [
      {
        label: "Mixed",
        series: [
          { date: 2016, value: -5, certainty: true },
          { date: 2017, value: 20, certainty: true },
          { date: 2018, value: 40, certainty: true },
        ],
      },
    ];
    const a = mount({ dataSet: mixed, yAxisScale: "log", renderer: "svg" });
    const b = mount({ dataSet: mixed, yAxisScale: "log", renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.renderer).toBe("svg");
    expect(cb.renderer).toBe("canvas");
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("thins y-axis labels to powers of 10 on a wide (4+ decade) log domain, keeping minor gridlines unlabeled (B3.5)", () => {
    // Reproduces the sdg-trade demo smear: values from 0.0007 to 446 (~6 raw
    // decades, nice()s to 0.0001..1000 = 7 decades) used to label EVERY d3 log
    // tick (1,2,3…9,10,20,30…), overprinting into unreadable text.
    const wideRange: LineDataItem[] = [
      {
        label: "Wide",
        color: "#00f",
        series: annual([0.0007, 446, 12]),
      },
    ];
    const { host, chart } = mount({
      dataSet: wideRange,
      yAxisScale: "log",
      // Bypass the default Intl formatter's 3-fraction-digit rounding (it would
      // otherwise print 0.0001 as "0") so the assertion below reads the exact
      // labeled value, not a presentation artifact.
      yAxisFormat: (v) => String(v),
      width: 600,
      height: 300,
    });
    const yLabels = Array.from(host.querySelectorAll(".mv-y-axis text.mv-axis-label")).map(
      (l) => l.textContent
    );
    const yGrid = host.querySelectorAll(".mv-y-axis line.mv-grid");
    // Every remaining label is an exact power of 10 (no "2", "30", "500", …).
    expect(yLabels.length).toBeGreaterThan(0);
    for (const text of yLabels) {
      const n = Number(text);
      expect(Number.isFinite(n)).toBe(true);
      expect(Number.isInteger(Math.log10(n))).toBe(true);
    }
    // Minor ticks are still drawn as gridlines, just unlabeled.
    expect(yGrid.length).toBeGreaterThan(yLabels.length);
    chart.destroy();
    host.remove();
  });

  it("respects an explicit yAxisFormat on the thinned wide-log-domain label subset", () => {
    const wideRange: LineDataItem[] = [
      { label: "Wide", color: "#00f", series: annual([0.001, 5000, 3]) },
    ];
    const { host, chart } = mount({
      dataSet: wideRange,
      yAxisScale: "log",
      yAxisFormat: (v) => `~${v}~`,
      width: 600,
      height: 300,
    });
    const yLabels = Array.from(host.querySelectorAll(".mv-y-axis text.mv-axis-label")).map(
      (l) => l.textContent
    );
    expect(yLabels.length).toBeGreaterThan(0);
    expect(yLabels.every((t) => t!.startsWith("~") && t!.endsWith("~"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("keeps every generated y-tick labeled on a narrow (~1 decade) log domain", () => {
    const narrowRange: LineDataItem[] = [
      { label: "Narrow", color: "#0f0", series: annual([2, 20, 3]) },
    ];
    const { host, chart } = mount({
      dataSet: narrowRange,
      yAxisScale: "log",
      width: 600,
      height: 300,
    });
    const yLabels = host.querySelectorAll(".mv-y-axis text.mv-axis-label");
    const yGrid = host.querySelectorAll(".mv-y-axis line.mv-grid");
    expect(yLabels.length).toBe(yGrid.length);
    expect(yLabels.length).toBeGreaterThan(2);
    chart.destroy();
    host.remove();
  });

  it("linear mode y-axis labeling is unaffected (every tick still labeled)", () => {
    const { host, chart } = mount({
      dataSet: powersOfTen,
      width: 600,
      height: 300,
      margin,
    });
    const yLabels = host.querySelectorAll(".mv-y-axis text.mv-axis-label");
    const yGrid = host.querySelectorAll(".mv-y-axis line.mv-grid");
    expect(yLabels.length).toBe(yGrid.length);
    chart.destroy();
    host.remove();
  });
});
