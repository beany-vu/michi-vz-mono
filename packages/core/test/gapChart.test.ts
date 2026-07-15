import { describe, it, expect } from "vitest";
import { processGapChartData } from "../src/gapChart/data";
import { buildGapColors } from "../src/gapChart/colors";
import { createGapScales } from "../src/gapChart/scales";
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

  it("adds visual padding around a zero endpoint so percentage baseline markers do not sit on the axis edge", () => {
    const r = processGapChartData(
      [{ label: "Positive change", value1: 10, value2: 0 }],
      undefined,
      [],
    );

    expect(r.xAxisDomain[0]).toBeCloseTo(-1, 5);
    expect(r.xAxisDomain[1]).toBeCloseTo(11, 5);
  });

  it("uses range-based padding for asymmetric mixed-sign percentage changes", () => {
    const r = processGapChartData(
      [
        { label: "Large negative", value1: -100, value2: 0 },
        { label: "Small positive", value1: 1, value2: 0 },
      ],
      undefined,
      [],
    );

    expect(r.xAxisDomain[0]).toBeCloseTo(-110.1, 5);
    expect(r.xAxisDomain[1]).toBeCloseTo(11.1, 5);
  });

  it("applies filter sort + limit, keeping all labels for colour stability", () => {
    const r = processGapChartData(
      sample,
      {
        limit: 2,
        date: "2024",
        criteria: "value1",
        sortingDir: "desc",
      },
      [],
    );
    expect(r.processedDataSet.map((d) => d.label)).toEqual(["Beta", "Alpha One"]);
    expect(r.allLabels).toEqual(["Beta", "Alpha One"]);
  });

  it("derives difference when omitted", () => {
    const r = processGapChartData([{ label: "X", value1: 8, value2: 3 }], undefined, []);
    expect(r.processedDataSet[0].difference).toBe(5);
  });

  it("ignores non-finite explicit tickValues when deriving the x-domain", () => {
    const r = processGapChartData(sample, undefined, [], [NaN, 0, Infinity, 80]);
    expect(r.xAxisDomain).toEqual([0, 80]);
  });

  it("sorts and de-duplicates explicit tickValues before deriving the x-domain", () => {
    const r = processGapChartData(sample, undefined, [], [80, 0, 40, 40, 0]);
    expect(r.xAxisDomain).toEqual([0, 80]);
  });

  it("falls back to the data domain when explicit tickValues have fewer than two finite values", () => {
    const r = processGapChartData(sample, undefined, [], [NaN, Infinity]);
    expect(r.xAxisDomain[0]).toBe(0);
    expect(r.xAxisDomain[1]).toBeCloseTo(55, 5);
  });

  it("falls back to the data domain when explicit tickValues collapse to one unique value", () => {
    const r = processGapChartData(sample, undefined, [], [5, 5, 5]);
    expect(r.xAxisDomain[0]).toBe(0);
    expect(r.xAxisDomain[1]).toBeCloseTo(55, 5);
  });

  it("uses a safe empty domain when malformed data has no finite values", () => {
    const r = processGapChartData([{ label: "Bad", value1: NaN, value2: Infinity }], undefined, []);
    expect(r.xAxisDomain).toEqual([0, 0]);
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
    const chart = mountGapChart(host, {
      dataSet: sample,
      title: "Demo",
      width: 600,
      height: 300,
      ...extra,
    });
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

  it("xAxisDomain overrides the derived zero-baseline domain", () => {
    // Derived domain is [0, 55]; forcing [4, 55] zooms in, pushing Gamma's
    // markers (value 5) near the left edge instead of ~9% across.
    const auto = mount();
    const zoom = mount({ xAxisDomain: [4, 55] });
    const gammaX = (host: HTMLElement) => {
      const bar = host.querySelector<SVGRectElement>('rect.gap-bar[data-label="Gamma"]')!;
      return Number(bar.getAttribute("x"));
    };
    expect(gammaX(zoom.host)).toBeLessThan(gammaX(auto.host));
    auto.chart.destroy();
    auto.host.remove();
    zoom.chart.destroy();
    zoom.host.remove();
  });

  it("interactiveRowLabels: scrubbing the gutter draws a leader line and shows the tooltip", () => {
    const { host, chart } = mount({ interactiveRowLabels: true });
    const strip = host.querySelector<SVGRectElement>(".mv-row-scrub")!;
    strip.dispatchEvent(new MouseEvent("pointermove", { clientY: 60, bubbles: true }));
    expect(host.querySelector(".mv-row-leader")).toBeTruthy();
    expect(host.querySelector<HTMLDivElement>(".tooltip")!.style.visibility).toBe("visible");
    strip.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
    expect(host.querySelector(".mv-row-leader")).toBeNull();
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
    chart.update({
      dataSet: sample.slice(0, 1),
      title: "Demo",
      width: 600,
      height: 300,
    });
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
      { value1: "#17becf", gap: "#d2d7dd", value2: "#673ab7" },
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
      "label",
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
      shapesLabelsMapping: {
        value1: "Baseline trade",
        value2: "Trade after policy change",
      },
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
    const labels = Array.from(legend.querySelectorAll("foreignObject div")).map(
      (d) => d.textContent,
    );
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

  it("ignores tickValues for the mark scale domain when explicit ticks are disabled", () => {
    const { host, chart } = mountLegend({
      dataSet: [{ label: "Overflow guard", value1: 10, value2: 0 }],
      tickValues: [0, 1],
      enableExplicitTickValues: false,
    });

    // If hidden explicit ticks still define the x-domain, the mark at value=10
    // projects thousands of pixels beyond the visible/generated axis. With
    // explicit ticks disabled, the chart falls back to the padded data domain
    // and the marker remains inside the SVG width.
    const marker = host.querySelector<SVGPathElement>(".gap-marker.value1-marker")!;
    const x = Number(marker.getAttribute("transform")?.match(/translate\(([-0-9.]+)/)?.[1]);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThanOrEqual(600);

    chart.destroy();
    host.remove();
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

describe("showZeroLineForXAxis (GapChart)", () => {
  function mount(extra: Partial<GapChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGapChart(host, {
      dataSet: sample,
      title: "Demo",
      width: 600,
      height: 300,
      ...extra,
    });
    return { host, chart };
  }

  it("draws a solid zero line only when showZeroLineForXAxis is true", () => {
    // Default domain is [0, 55] (see processGapChartData test above), so a zero
    // tick is always present - only its dash style should change with the prop.
    const off = mount();
    const zeroLineOff = off.host.querySelector(".mv-x-axis line.mv-tick-zero")!;
    expect(zeroLineOff.getAttribute("stroke-dasharray")).not.toBe("none");
    off.chart.destroy();
    off.host.remove();

    const on = mount({ showZeroLineForXAxis: true });
    const zeroLineOn = on.host.querySelector(".mv-x-axis line.mv-tick-zero")!;
    expect(zeroLineOn.getAttribute("stroke-dasharray")).toBe("none");
    on.chart.destroy();
    on.host.remove();
  });
});

describe("createGapScales - maxBarHeight cap (parity with ComparableBarChart)", () => {
  const margin = { top: 50, right: 150, bottom: 100, left: 150 };

  it("caps the row thickness and centres bands when few rows would balloon", () => {
    const labels = ["Africa", "Rest of the World"];
    const uncapped = createGapScales([0, 100], labels, 1000, 500, margin, "number");
    expect(uncapped.yScale.bandwidth()).toBeGreaterThan(80); // 2 rows over ~350px = huge

    const capped = createGapScales([0, 100], labels, 1000, 500, margin, "number", true, 40);
    expect(capped.yScale.bandwidth()).toBeLessThanOrEqual(40 + 0.5);
    // centred: equal whitespace above the first band and below the last
    const top = capped.yScale(labels[0])!;
    const bottom = capped.yScale(labels[1])! + capped.yScale.bandwidth();
    const plotMid = (margin.top + (500 - margin.bottom)) / 2;
    expect((top + bottom) / 2).toBeCloseTo(plotMid, 1);
  });

  it("is a no-op for dense charts whose natural bandwidth is already below the cap", () => {
    const labels = Array.from({ length: 20 }, (_, i) => `row${i}`);
    const plain = createGapScales([0, 100], labels, 1000, 500, margin, "number");
    const withCap = createGapScales([0, 100], labels, 1000, 500, margin, "number", true, 40);
    expect(withCap.yScale.bandwidth()).toBeCloseTo(plain.yScale.bandwidth(), 5);
  });
});

describe("mountGapChart maxBarHeight (engine wiring)", () => {
  function mount(extra: Partial<GapChartProps> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGapChart(host, {
      dataSet: sample,
      title: "Demo",
      width: 600,
      height: 300,
      ...extra,
    });
    return { host, chart };
  }

  it("caps row thickness end-to-end through mountGapChart props", () => {
    // The y-axis label foreignObject spans exactly one band's height.
    const bandHeight = (host: HTMLElement) =>
      Number(host.querySelector(".mv-ylabel-fo")?.getAttribute("height"));

    const uncapped = mount({ dataSet: sample.slice(0, 2), width: 1000, height: 500 });
    const capped = mount({
      dataSet: sample.slice(0, 2),
      width: 1000,
      height: 500,
      maxBarHeight: 40,
    });
    expect(bandHeight(capped.host)).toBeLessThanOrEqual(40 + 0.5);
    expect(bandHeight(capped.host)).toBeLessThan(bandHeight(uncapped.host));
    uncapped.chart.destroy();
    uncapped.host.remove();
    capped.chart.destroy();
    capped.host.remove();
  });
});

describe("mountGapChart dense y-axis thinning", () => {
  it("thins 120 row labels to a readable subset (marks stay per-row)", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const dense: GapDataItem[] = Array.from({ length: 120 }, (_, i) => ({
      label: `Row ${i + 1}`,
      value1: 10 + (i % 7),
      value2: 20 + (i % 11),
      difference: 10,
      date: "2024",
    }));
    const chart = mountGapChart(host, {
      dataSet: dense,
      title: "Dense",
      width: 700,
      height: 380,
    });
    expect(host.querySelectorAll("rect.gap-bar").length).toBe(120);
    const labels = host.querySelectorAll(".mv-ylabel-fo").length;
    expect(labels).toBeGreaterThanOrEqual(2);
    expect(labels).toBeLessThanOrEqual(25);
    chart.destroy();
    host.remove();
  });
});
