import { describe, it, expect } from "vitest";
import { processGapChartData } from "../src/gapChart/data";
import { buildGapColors } from "../src/gapChart/colors";
import { buildGapContext } from "../src/context/buildContext";
import { checkGapData } from "../src/validate/dataWarnings";
import { sanitizeForClassName } from "../src/math/sanitize";
import { mountGapChart } from "../src/engine/gapChart";
import type { GapChartProps, GapDataItem } from "../src/types";

const sample: GapDataItem[] = [
  { label: "Alpha One", value1: 10, value2: 30, difference: -20, date: "2024" },
  { label: "Beta", value1: 50, value2: 20, difference: 30, date: "2024" },
  { label: "Gamma", value1: 5, value2: 5, difference: 0, date: "2024" },
];

describe("processGapChartData", () => {
  it("excludes disabled items and computes x-domain with 10% padding", () => {
    const r = processGapChartData(sample, undefined, ["Gamma"]);
    expect(r.processedDataSet.map((d) => d.label)).toEqual(["Alpha One", "Beta"]);
    expect(r.yAxisDomain).toEqual(["Alpha One", "Beta"]);
    // positives -> min 0, max = 50 * 1.1
    expect(r.xAxisDomain[0]).toBe(0);
    expect(r.xAxisDomain[1]).toBeCloseTo(55, 5);
  });

  it("applies filter sort + limit, keeping all labels for colour stability", () => {
    const r = processGapChartData(sample, {
      limit: 2,
      date: "2024",
      criteria: "value1",
      sortingDir: "desc",
    }, []);
    expect(r.processedDataSet.map((d) => d.label)).toEqual(["Beta", "Alpha One"]);
    expect(r.allLabels).toEqual(["Beta", "Alpha One"]);
  });

  it("derives difference when omitted", () => {
    const r = processGapChartData([{ label: "X", value1: 8, value2: 3 }], undefined, []);
    expect(r.processedDataSet[0].difference).toBe(5);
  });
});

describe("buildGapColors", () => {
  it("cycles the palette and respects colorsMapping", () => {
    const c = buildGapColors(["A", "B"], ["#111", "#222"], { A: "#abc" });
    expect(c.generatedColorsMapping.A).toBe("#abc");
    expect(c.generatedColorsMapping.B).toBe("#222"); // index 1 (one preset already)
  });

  it("uses transparent for unmapped labels under skipColorMappingDispatch", () => {
    const c = buildGapColors(["A"], ["#111"], undefined, "label", undefined, true);
    expect(c.generatedColorsMapping.A).toBe("transparent");
  });
});

describe("buildGapContext", () => {
  it("computes stats and a deterministic summary", () => {
    const r = processGapChartData(sample, undefined, []);
    const ctx = buildGapContext({
      title: "Demo",
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: r.xAxisDomain,
      processedDataSet: r.processedDataSet,
      colorsMapping: {},
    });
    expect(ctx.stats.count).toBe(3);
    expect(ctx.stats.maxGap).toEqual({ label: "Beta", value: 30 });
    expect(ctx.stats.minGap).toEqual({ label: "Gamma", value: 0 });
    expect(ctx.series.find((s) => s.label === "Beta")!.gap).toBe(30);
    expect(ctx.summary).toContain("Largest gap: Beta (30)");
  });
});

describe("checkGapData", () => {
  it("flags non-finite values, duplicates and difference mismatch", () => {
    const warnings = checkGapData([
      { label: "A", value1: NaN, value2: 1 },
      { label: "B", value1: 1, value2: 1 },
      { label: "B", value1: 2, value2: 1 },
      { label: "C", value1: 10, value2: 2, difference: 99 },
    ]);
    const types = warnings.map((w) => w.type);
    expect(types).toContain("non-finite-value");
    expect(types).toContain("duplicate-label");
    expect(types).toContain("difference-mismatch");
  });
});

describe("mountGapChart (jsdom)", () => {
  function mount(extra: Partial<GapChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGapChart(host, { dataSet: sample, title: "Demo", width: 600, height: 300, ...extra });
    return { host, chart };
  }

  it("renders gap-bar marks carrying the sanitized data-label-safe attribute", () => {
    const { host, chart } = mount();
    const bars = host.querySelectorAll<SVGRectElement>("rect.gap-bar");
    expect(bars.length).toBe(3);
    const safes = Array.from(bars).map((b) => b.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("Alpha One")); // "Alpha_One"
    chart.destroy();
    host.remove();
  });

  it("builds an a11y table mirror with one row per series", () => {
    const { host, chart } = mount();
    const rows = host.querySelectorAll(".mv-a11y table tbody tr");
    expect(rows.length).toBe(3);
    expect(host.querySelector(".mv-a11y")!.getAttribute("aria-label")).toContain("Gap chart");
    chart.destroy();
    host.remove();
  });

  it("produces an identical ChartContext in SVG and canvas mode (renderer aside)", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
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

  it("fires onDataWarning for malformed data", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    let warned: unknown[] = [];
    const chart = mountGapChart(host, {
      dataSet: [{ label: "A", value1: NaN, value2: 1 }],
      width: 400,
      height: 200,
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("update() re-renders and destroy() cleans up", () => {
    const { host, chart } = mount();
    chart.update({ dataSet: sample.slice(0, 1), title: "Demo", width: 600, height: 300 });
    expect(host.querySelectorAll("rect.gap-bar").length).toBe(1);
    chart.destroy();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
