import { describe, it, expect } from "vitest";
import { processGapChartData } from "../src/gapChart/data";
import { buildGapColors } from "../src/gapChart/colors";
import { buildGapContext } from "../src/context/buildContext";
import { checkGapData } from "../src/validate/dataWarnings";
import { sanitizeForClassName } from "../src/math/sanitize";
import { mountGapChart } from "../src/engine/gapChart";
import { buildGapLegendItems } from "../src/gapChart/renderSvg";
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

  it("emits legendData (label/dataLabelSafe/disabled) - the colour-authority hook", () => {
    const r = processGapChartData(sample, undefined, []);
    const ctx = buildGapContext({
      title: "Demo",
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: r.xAxisDomain,
      processedDataSet: r.processedDataSet,
      colorsMapping: {},
      disabledItems: ["Beta"],
    });
    expect(Array.isArray(ctx.legendData)).toBe(true);
    expect(ctx.legendData!.length).toBe(ctx.series.length);
    const beta = ctx.legendData!.find((l) => l.label === "Beta")!;
    expect(beta.disabled).toBe(true);
    expect(beta.dataLabelSafe).toBe("Beta");
  });

  it("emits renderedData keyed by label (legacy useGapChartMetadata parity)", () => {
    // thd's TradeSimulationSnapshot reads value1/value2 off renderedData to size its
    // x-axis ticks. Shape must be { [label]: [item] } - a single-element array per row.
    const r = processGapChartData(sample, undefined, []);
    const ctx = buildGapContext({
      title: "Demo",
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: r.xAxisDomain,
      processedDataSet: r.processedDataSet,
      colorsMapping: {},
    });
    expect(Object.keys(ctx.renderedData).sort()).toEqual(["Alpha One", "Beta", "Gamma"]);
    expect(ctx.renderedData["Beta"]).toHaveLength(1);
    expect(ctx.renderedData["Beta"][0].value1).toBe(50);
    expect(ctx.renderedData["Beta"][0].value2).toBe(20);
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

  it("enriches the <svg> with SEO semantics: title/desc/metadata (JSON-LD) + aria-hidden", () => {
    const { host, chart } = mount();
    const svg = host.querySelector("svg")!;
    expect(svg.querySelector(":scope > title.mv-title")?.textContent).toBe("Demo");
    expect(svg.querySelector(":scope > desc.mv-desc")?.textContent).toContain("Gap chart");
    const meta = JSON.parse(svg.querySelector(":scope > metadata.mv-metadata")!.textContent!);
    expect(meta["@type"]).toBe("ImageObject");
    expect(meta.creator.name).toBe("michi-vz");
    expect(meta.description).toContain("Gap chart");
    // SVG hidden from AT (the .mv-a11y table is the screen-reader rep); still crawlable.
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    // re-render does not duplicate the semantic nodes
    chart.update({ dataSet: sample, title: "Demo", width: 600, height: 300 });
    expect(svg.querySelectorAll(":scope > title.mv-title").length).toBe(1);
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

describe("buildGapLegendItems (port of useGapChartLegend)", () => {
  it("builds value1/gap/value2 in order, colouring from shapeColorsMapping in shape mode", () => {
    const items = buildGapLegendItems(
      { value1: "Baseline", gap: "Change", value2: "After" },
      "circle",
      "square",
      "shape",
      { value1: "#17becf", gap: "#d2d7dd", value2: "#673ab7" }
    );
    expect(items.map((i) => i.type)).toEqual(["value1", "gap", "value2"]);
    expect(items.map((i) => i.color)).toEqual(["#17becf", "#d2d7dd", "#673ab7"]);
    expect(items[0].shape).toBe("circle");
    expect(items[2].shape).toBe("square");
  });

  it("falls back to legacy defaults in label mode (#666 markers, #999 gap)", () => {
    const items = buildGapLegendItems(
      { value1: "A", gap: "G", value2: "B" },
      "circle",
      "circle",
      "label"
    );
    expect(items.map((i) => i.color)).toEqual(["#666", "#999", "#666"]);
  });

  it("skips roles with a falsy label (e.g. value2:'' in percentage mode) and returns [] when no mapping", () => {
    const items = buildGapLegendItems({ value1: "Only", value2: "" }, "circle", "square", "shape", {
      value1: "#abc",
    });
    expect(items.map((i) => i.type)).toEqual(["value1"]);
    expect(buildGapLegendItems(undefined, "circle", "circle", "shape")).toEqual([]);
  });
});

describe("mountGapChart legend (showLegend)", () => {
  function mountLegend(extra: Partial<GapChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGapChart(host, {
      dataSet: sample,
      width: 600,
      height: 300,
      colorMode: "shape",
      shapeColorsMapping: { value1: "#17becf", value2: "#673ab7" },
      shapesLabelsMapping: { value1: "Baseline trade", value2: "Trade after policy change" },
      shapeValue1: "circle",
      shapeValue2: "square",
      ...extra,
    });
    return { host, chart };
  }

  it("renders the legend with shape colours + labels when showLegend=true", () => {
    const { host, chart } = mountLegend({ showLegend: true });
    const legend = host.querySelector(".gap-legend")!;
    expect(legend).not.toBeNull();
    const labels = Array.from(legend.querySelectorAll("foreignObject div")).map((d) => d.textContent);
    expect(labels).toEqual(["Baseline trade", "Trade after policy change"]);
    // value1 = circle path in its mapped colour; value2 = square rect in its mapped colour
    expect(legend.querySelector('path[fill="#17becf"]')).not.toBeNull();
    expect(legend.querySelector('rect[fill="#673ab7"]')).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("renders no legend by default / when showLegend is false", () => {
    const a = mountLegend();
    expect(a.host.querySelector(".gap-legend")).toBeNull();
    a.chart.destroy();
    a.host.remove();
    const b = mountLegend({ showLegend: false });
    expect(b.host.querySelector(".gap-legend")).toBeNull();
    b.chart.destroy();
    b.host.remove();
  });
});

describe("mountGapChart enableExplicitTickValues threading", () => {
  function labelCount(enableExplicitTickValues?: boolean) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGapChart(host, {
      dataSet: sample,
      width: 600,
      height: 300,
      xAxisDataType: "number",
      tickValues: [7, 23, 41],
      enableExplicitTickValues,
    });
    const n = host.querySelectorAll(".mv-x-axis .mv-axis-label").length;
    chart.destroy();
    host.remove();
    return n;
  }

  it("honours explicit tickValues by default (true); lets d3 choose ticks when false", () => {
    expect(labelCount(true)).toBe(3); // exactly the 3 supplied ticks
    expect(labelCount()).toBe(3); // default true
    expect(labelCount(false)).not.toBe(3); // d3-computed, ignores the explicit values
  });
});
