import { describe, it, expect } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { buildJetPath, buildFrothSlices } from "../src/fountainChart/geometry";
import { processFountainData } from "../src/fountainChart/data";
import { buildFountainColors } from "../src/fountainChart/colors";
import { createFountainScales } from "../src/fountainChart/scales";
import { buildFountainRenderModel } from "../src/fountainChart/renderModel";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { FountainChartProps, FountainDataItem, Margin } from "../src/types";

const MARGIN: Margin = { top: 50, right: 40, bottom: 50, left: 60 };

const snapshot: FountainDataItem[] = [
  { label: "Jet d'Eau", value: 140, spread: 30 },
  { label: "Zurich", value: 90, spread: 10 },
  { label: "Bern", value: 60, spread: 25 },
];

const trend: FountainDataItem[] = [
  { label: "Flow", value: 50, spread: 8, date: 2001 },
  { label: "Flow", value: 70, spread: 10, date: 2002 },
  { label: "Flow", value: 95, spread: 14, date: 2003 },
];

function mount(data: FountainDataItem[], extra: Partial<FountainChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(host, { dataSet: data, title: "Demo", width: 600, height: 320, ...extra });
  return { host, chart };
}

function buildModel(
  data: FountainDataItem[],
  opts: { style?: "jet" | "plume"; xAxisDataType?: "band" | "number" | "date_annual"; yAxisDomain?: [number, number]; width?: number; height?: number } = {}
) {
  const processed = processFountainData(data, opts.xAxisDataType ?? "band", undefined, opts.yAxisDomain);
  const colors = buildFountainColors(processed.items);
  const scales = createFountainScales(
    processed.mode, processed.labels, processed.items.length,
    processed.xDomain, processed.yAxisDomain, opts.width ?? 600, opts.height ?? 320, MARGIN, processed.temporalType
  );
  const model = buildFountainRenderModel(processed.items, processed.mode, processed.temporalType, scales, colors, {
    style: opts.style ?? "jet", frothLayers: 8, bloomExponent: 3, stemFraction: 0.08,
    showDroplets: true, showMist: true, showTrendLine: true, highlightItems: [], maxDensity: processed.maxDensity,
  });
  return { processed, scales, model };
}

describe("fountain geometry (pure)", () => {
  const plumeBase = { xCenter: 100, yApex: 50, yBase: 250, stemHalf: 6, crownDrift: 0, bloomExponent: 3 };

  it("plume buildJetPath: valid finite path with an apex arc when blooming", () => {
    const d = buildJetPath({ ...plumeBase, bloomHalf: 40 });
    expect(d.startsWith("M")).toBe(true);
    expect(d).not.toMatch(/NaN|Infinity/);
    expect(d).toContain("A");
    expect(d.trimEnd().endsWith("Z")).toBe(true);
  });

  it("plume collapses to a clean spike (no arc) when spread is ~zero", () => {
    const d = buildJetPath({ ...plumeBase, bloomHalf: 6 });
    expect(d).not.toContain("A");
    expect(d).not.toMatch(/NaN/);
  });

  it("buildFrothSlices returns exactly N slices", () => {
    expect(buildFrothSlices({ ...plumeBase, bloomHalf: 40 }, 8, 0.18)).toHaveLength(8);
    expect(buildFrothSlices({ ...plumeBase, bloomHalf: 40 }, 3, 0.18)).toHaveLength(3);
  });

  it("crownDrift bends the column right but the path stays finite", () => {
    const straight = buildJetPath({ ...plumeBase, bloomHalf: 30, crownDrift: 0 });
    const drifted = buildJetPath({ ...plumeBase, bloomHalf: 30, crownDrift: 40 });
    expect(drifted).not.toEqual(straight);
    expect(drifted).not.toMatch(/NaN|Infinity/);
  });
});

describe("fountain render model", () => {
  it("plume: N froth slices, bloom clamped to slot, hit box brackets the apex", () => {
    const { model, scales } = buildModel(snapshot, { style: "plume" });
    expect(model.jets).toHaveLength(3);
    for (const jet of model.jets) {
      expect(jet.slicePaths).toHaveLength(8);
      expect(jet.bloomHalf).toBeLessThanOrEqual(scales.slotWidth * 0.45 + 0.001);
      expect(jet.hit.left).toBeLessThanOrEqual(jet.xCenter);
      expect(jet.hit.right).toBeGreaterThanOrEqual(jet.xCenter);
      expect(jet.hit.top).toBeLessThanOrEqual(jet.yApex);
    }
  });

  it("jet: a fraying froth-slice column, no mist or droplets", () => {
    const { model } = buildModel(snapshot, { style: "jet" });
    for (const jet of model.jets) {
      expect(jet.style).toBe("jet");
      expect(jet.slicePaths.length).toBeGreaterThan(0);
      expect(jet.mistPath).toBeNull();
      expect(jet.dropletPaths).toHaveLength(0);
    }
  });

  it("anchors jets to the plot bottom even with a non-zero yAxisDomain floor", () => {
    const { model } = buildModel(snapshot, { style: "jet", yAxisDomain: [50, 200], height: 320 });
    const plotBottom = 320 - MARGIN.bottom; // 270
    for (const jet of model.jets) expect(jet.yBase).toBeCloseTo(plotBottom, 0);
  });

  it("lean semantics: absent = decorative wind, 0 = truly upright, sign picks the side", () => {
    const data: FountainDataItem[] = [
      { label: "Wind", value: 100, spread: 10 },
      { label: "Upright", value: 100, spread: 10, lean: 0 },
      { label: "Right", value: 100, spread: 10, lean: 0.8 },
      { label: "Left", value: 100, spread: 10, lean: -0.8 },
    ];
    const { model } = buildModel(data, { style: "jet" });
    const bias = (j: (typeof model.jets)[number]) =>
      (j.hit.right - j.xCenter) - (j.xCenter - j.hit.left);
    const [wind, upright, right, left] = model.jets;
    expect(bias(upright)).toBeCloseTo(0, 5); // explicit 0 stands straight
    expect(bias(wind)).toBeGreaterThan(0); // no lean keeps the signature drift
    expect(bias(right)).toBeGreaterThan(bias(wind)); // data lean outdrifts the wind
    expect(bias(left)).toBeLessThan(0); // negative lean bends the other way
    expect(upright.outlinePath).not.toEqual(wind.outlinePath);
  });

  it("plume stays upright when lean is absent", () => {
    const { model } = buildModel([{ label: "P", value: 100, spread: 20 }], { style: "plume" });
    const j = model.jets[0];
    expect((j.hit.right - j.xCenter) - (j.xCenter - j.hit.left)).toBeCloseTo(0, 5);
  });

  it("trend slot width comes from the MIN date gap, so clustered dates do not collide", () => {
    // three clustered years + one far outlier; average spacing would be huge.
    const data: FountainDataItem[] = [
      { label: "x", value: 50, spread: 6, date: 2000 },
      { label: "x", value: 55, spread: 6, date: 2001 },
      { label: "x", value: 60, spread: 6, date: 2002 },
      { label: "x", value: 80, spread: 6, date: 2050 },
    ];
    const { model } = buildModel(data, { style: "jet", xAxisDataType: "number", width: 600 });
    // average-spacing sizing would give a reach > 50px; min-gap sizing keeps it tiny.
    for (const jet of model.jets) expect(jet.bloomHalf).toBeLessThan(30);
  });
});

describe("mountFountainChart (jsdom)", () => {
  it("defaults to the jet style: a fraying froth column, no mist/droplets", () => {
    const { host, chart } = mount(snapshot);
    const safe = sanitizeForClassName("Jet d'Eau");
    expect(host.querySelectorAll(`path.mv-fountain-jet[data-label-safe="${safe}"]`).length).toBeGreaterThan(1);
    expect(host.querySelectorAll("path.mv-fountain-mist").length).toBe(0);
    expect(host.querySelectorAll("path.mv-fountain-droplet").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("plume style: frothLayers froth paths per jet, mist, droplet arcs", () => {
    const { host, chart } = mount(snapshot, { style: "plume", frothLayers: 8 });
    const safe = sanitizeForClassName("Jet d'Eau");
    expect(host.querySelectorAll(`path.mv-fountain-jet[data-label-safe="${safe}"]`).length).toBe(8);
    expect(host.querySelectorAll("path.mv-fountain-mist").length).toBe(3);
    expect(host.querySelectorAll("path.mv-fountain-droplet").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("can disable droplets and mist", () => {
    const { host, chart } = mount(snapshot, { style: "plume", showDroplets: false, showMist: false });
    expect(host.querySelectorAll("path.mv-fountain-droplet").length).toBe(0);
    expect(host.querySelectorAll("path.mv-fountain-mist").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("snapshot mode: band x-axis, mode=snapshot, single-jet KPI summary", () => {
    const { host, chart } = mount([{ label: "Jet d'Eau", value: 140, spread: 35 }]);
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("fountain-chart");
    if (ctx.chartType === "fountain-chart") {
      expect(ctx.mode).toBe("snapshot");
      expect(ctx.xAxis.type).toBe("band");
      expect(ctx.jets[0].upperBound).toBe(175);
      expect(ctx.summary).toContain("uncertainty");
      // Snapshot mode carries one legend row per jet.
      expect(ctx.legendData!.map((l) => l.label)).toEqual(["Jet d'Eau"]);
    }
    expect(host.querySelector(".mv-x-axis-band")).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("trend mode: linear axis, trend line, positive slope and date-sorted a11y even for UNSORTED input", () => {
    const unsorted: FountainDataItem[] = [
      { label: "Flow", value: 95, spread: 14, date: 2003 },
      { label: "Flow", value: 50, spread: 8, date: 2001 },
      { label: "Flow", value: 70, spread: 10, date: 2002 },
    ];
    const { host, chart } = mount(unsorted, { xAxisDataType: "number" });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "fountain-chart") {
      expect(ctx.mode).toBe("trend");
      expect(ctx.xAxis.type).toBe("number");
      expect(ctx.stats.trendSlope!).toBeGreaterThan(0); // rising by DATE, not input order
      expect(ctx.a11yTable.rows[0][0]).toBe("2001"); // rows sorted ascending by period
      expect(ctx.a11yTable.rows[2][0]).toBe("2003");
    }
    expect(host.querySelector("path.mv-fountain-trend")).toBeTruthy();
    chart.destroy();
    host.remove();
  });

  it("forecast (predicted) jets render a dashed outline in both styles", () => {
    const data: FountainDataItem[] = [
      { label: "Now", value: 100, spread: 10 },
      { label: "Next", value: 120, spread: 40, predicted: true },
    ];
    for (const style of ["plume", "jet"] as const) {
      const { host, chart } = mount(data, { style });
      expect(host.querySelectorAll("path.mv-fountain-outline").length).toBe(1);
      const ctx = chart.getContext()!;
      if (ctx.chartType === "fountain-chart") expect(ctx.stats.predictedCount).toBe(1);
      chart.destroy();
      host.remove();
    }
  });

  it("context carries the lean flag: null when not encoded, the signed value when it is", () => {
    const { host, chart } = mount([
      { label: "Wind", value: 100, spread: 10 },
      { label: "Late tail", value: 100, spread: 10, lean: 0.8 },
    ]);
    const ctx = chart.getContext()!;
    if (ctx.chartType === "fountain-chart") {
      expect(ctx.jets[0].lean).toBeNull();
      expect(ctx.jets[1].lean).toBe(0.8);
    }
    chart.destroy();
    host.remove();
  });

  it("context is identical in SVG and canvas (renderer aside)", () => {
    const a = mount(snapshot, { renderer: "svg" });
    const b = mount(snapshot, { renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });

  it("warns on empty data, duplicate snapshot labels, and crowding", () => {
    let warned: Array<{ type: string }> = [];
    const h1 = document.createElement("div");
    document.body.appendChild(h1);
    mountFountainChart(h1, { dataSet: [], onDataWarning: (w) => (warned = w) });
    expect(warned.some((w) => w.type === "empty-dataset")).toBe(true);
    h1.remove();

    let dup: Array<{ type: string }> = [];
    const h2 = document.createElement("div");
    document.body.appendChild(h2);
    mountFountainChart(h2, {
      dataSet: [{ label: "A", value: 10, spread: 1 }, { label: "A", value: 20, spread: 2 }],
      width: 600, height: 300, onDataWarning: (w) => (dup = w),
    });
    expect(dup.some((w) => w.type === "duplicate-label")).toBe(true);
    h2.remove();

    let crowd: Array<{ type: string }> = [];
    const many: FountainDataItem[] = Array.from({ length: 12 }, (_, i) => ({ label: `c${i}`, value: 10 + i, spread: 2 }));
    const h3 = document.createElement("div");
    document.body.appendChild(h3);
    mountFountainChart(h3, { dataSet: many, width: 600, height: 300, onDataWarning: (w) => (crowd = w) });
    expect(crowd.some((w) => w.type === "layout-overflow")).toBe(true);
    h3.remove();
  });

  it("update() re-renders and destroy() cleans the host", () => {
    const { host, chart } = mount(snapshot);
    chart.update({ dataSet: [{ label: "Solo", value: 50, spread: 5 }], width: 600, height: 320 });
    const ctx = chart.getContext()!;
    if (ctx.chartType === "fountain-chart") expect(ctx.jets).toHaveLength(1);
    chart.destroy();
    expect(host.querySelector("svg")).toBeNull();
    host.remove();
  });
});

describe("snapshot-mode band axis thinning", () => {
  it("thins a dense category axis to a readable subset keeping both endpoints", () => {
    const many: FountainDataItem[] = Array.from({ length: 200 }, (_, i) => ({
      label: `Jet ${i + 1}`,
      value: 40 + (i % 30),
      spread: 5,
    }));
    const { host, chart } = mount(many, { width: 700 });
    const texts = Array.from(host.querySelectorAll(".mv-x-axis-band text")).map(
      (t) => t.textContent ?? ""
    );
    expect(texts.length).toBeGreaterThanOrEqual(2);
    expect(texts.length).toBeLessThan(40);
    expect(texts).toContain("Jet 1");
    expect(texts).toContain("Jet 200");
    chart.destroy();
    host.remove();
  });

  it("keeps every label when the categories fit", () => {
    const few: FountainDataItem[] = Array.from({ length: 4 }, (_, i) => ({
      label: `J${i + 1}`,
      value: 40 + i,
      spread: 5,
    }));
    const { host, chart } = mount(few, { width: 700 });
    const texts = Array.from(host.querySelectorAll(".mv-x-axis-band text")).map(
      (t) => t.textContent ?? ""
    );
    expect(texts).toEqual(["J1", "J2", "J3", "J4"]);
    chart.destroy();
    host.remove();
  });
});
