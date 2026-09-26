// AreaChart `stacked: false` - overlapping areas for series that do not add up
// (shares, rates, indices). Every active key's area runs from the baseline (y0 = 0)
// up to its OWN value; the y domain is the largest single value; larger areas are
// drawn first so smaller ones stay visible; hover picks the nearest TOP edge.
import { describe, it, expect, vi, afterEach } from "vitest";
import { mountAreaChart } from "../src/engine/areaChart";
import { processAreaChartData } from "../src/areaChart/data";
import { buildAreaColors } from "../src/areaChart/colors";
import { createAreaScales } from "../src/areaChart/scales";
import {
  buildAreaRenderModel,
  AREA_OVERLAP_FILL_OPACITY,
  AREA_OVERLAP_LINE_WIDTH,
} from "../src/areaChart/renderModel";
import { buildAreaMarkBatch } from "../src/areaChart/renderWebgpu";
import { checkAreaOptions } from "../src/validate/areaWarnings";
import { createManualTicker } from "../src/animation/ticker";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { AreaChartProps, AreaDataRow, DataWarning } from "../src/types";

// Keys are listed Small, Big, Mid on purpose: the legend/keys order must NOT be the
// draw order. Means: Big 0.667 > Mid 0.35 > Small 0.15. Per-row sums reach 1.4, the
// largest single value is 0.9.
const series: AreaDataRow[] = [
  { date: 2020, Small: 0.1, Big: 0.6, Mid: 0.3 },
  { date: 2021, Small: 0.2, Big: 0.5, Mid: 0.4 },
  { date: 2022, Small: 0.15, Big: 0.9, Mid: 0.35 },
];
const keys = ["Small", "Big", "Mid"];
const colorsMapping = { Small: "#0000ff", Big: "#ff0000", Mid: "#00ff00" };

function mount(extra: Partial<AreaChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountAreaChart(host, {
    series,
    keys,
    colorsMapping,
    stacked: false,
    width: 600,
    height: 300,
    xAxisDataType: "number",
    ...extra,
  });
  return { host, chart };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("processAreaChartData stacked:false (pure layer)", () => {
  it("draws every key from the baseline to its OWN value - no stack accumulation", () => {
    const r = processAreaChartData(series, { keys, xAxisDataType: "number", stacked: false });
    const mid = r.stacked.find((s) => s.key === "Mid")!;
    expect(mid.values[0]).toEqual({ 0: 0, 1: 0.3, data: series[0] });
    expect(mid.values[2]).toEqual({ 0: 0, 1: 0.35, data: series[2] });
    const small = r.stacked.find((s) => s.key === "Small")!;
    expect(small.values.map((v) => v[0])).toEqual([0, 0, 0]);
    expect(small.values.map((v) => v[1])).toEqual([0.1, 0.2, 0.15]);
  });

  it("y domain = the largest SINGLE value (not the per-row sum), never floored at 100", () => {
    const r = processAreaChartData(series, { keys, xAxisDataType: "number", stacked: false });
    expect(r.yAxisDomain).toEqual([0, 0.9]);
    // the stacked default still floors at 100 (sums reach only 1.4)
    const s = processAreaChartData(series, { keys, xAxisDataType: "number" });
    expect(s.yAxisDomain).toEqual([0, 100]);
  });

  it("the y domain follows disabledItems (max over ACTIVE keys only)", () => {
    const r = processAreaChartData(series, {
      keys,
      disabledItems: ["Big"],
      xAxisDataType: "number",
      stacked: false,
    });
    expect(r.activeKeys).toEqual(["Small", "Mid"]);
    expect(r.yAxisDomain).toEqual([0, 0.4]);
    expect(r.stacked.map((s) => s.key).sort()).toEqual(["Mid", "Small"]);
  });

  it("an explicit yAxisDomain or forcePercentageScale still wins", () => {
    const a = processAreaChartData(series, {
      keys,
      xAxisDataType: "number",
      stacked: false,
      yAxisDomain: [0, 2],
    });
    expect(a.yAxisDomain).toEqual([0, 2]);
    const b = processAreaChartData(series, {
      keys,
      xAxisDataType: "number",
      stacked: false,
      forcePercentageScale: true,
    });
    expect(b.yAxisDomain).toEqual([0, 100]);
  });

  it("an all-zero overlap chart falls back to a [0, 1] domain instead of collapsing", () => {
    const r = processAreaChartData([{ date: 2020, A: 0, B: 0 }], {
      keys: ["A", "B"],
      xAxisDataType: "number",
      stacked: false,
    });
    expect(r.yAxisDomain).toEqual([0, 1]);
  });

  it('ignores stackOffset "expand" (treated as "none"): values stay absolute', () => {
    const plain = processAreaChartData(series, {
      keys,
      xAxisDataType: "number",
      stacked: false,
    });
    const withExpand = processAreaChartData(series, {
      keys,
      xAxisDataType: "number",
      stacked: false,
      stackOffset: "expand",
    });
    expect(withExpand).toEqual(plain);
  });

  it("returns the series in DRAW order (largest mean first); activeKeys keep the keys order", () => {
    const r = processAreaChartData(series, { keys, xAxisDataType: "number", stacked: false });
    expect(r.activeKeys).toEqual(keys);
    expect(r.stacked.map((s) => s.key)).toEqual(["Big", "Mid", "Small"]);
  });

  it("stacked omitted is byte-identical to stacked: true (the default is unchanged)", () => {
    const omitted = processAreaChartData(series, { keys, xAxisDataType: "number" });
    const explicit = processAreaChartData(series, {
      keys,
      xAxisDataType: "number",
      stacked: true,
    });
    expect(explicit).toEqual(omitted);
    // still the cumulative d3.stack: Big sits on top of Small at 2020 -> [0.1, 0.7]
    const big = omitted.stacked.find((s) => s.key === "Big")!;
    expect(big.values[0][0]).toBeCloseTo(0.1, 10);
    expect(big.values[0][1]).toBeCloseTo(0.7, 10);
  });
});

describe("checkAreaOptions (validate)", () => {
  it('warns when stackOffset "expand" is combined with stacked: false', () => {
    const w = checkAreaOptions({ stacked: false, stackOffset: "expand" });
    expect(w).toHaveLength(1);
    expect(w[0].type).toBe("ignored-option");
    expect(w[0].message).toMatch(/expand/);
  });

  it("stays quiet for either option on its own", () => {
    expect(checkAreaOptions({ stackOffset: "expand" })).toEqual([]);
    expect(checkAreaOptions({ stacked: false })).toEqual([]);
    expect(checkAreaOptions({ stacked: true, stackOffset: "expand" })).toEqual([]);
    expect(checkAreaOptions({})).toEqual([]);
  });
});

describe("mountAreaChart stacked:false - SVG renderer", () => {
  it("renders one path.area + one path.area-line per active key", () => {
    const { host, chart } = mount();
    const areas = Array.from(host.querySelectorAll<SVGPathElement>("path.area"));
    const lines = Array.from(host.querySelectorAll<SVGPathElement>("path.area-line"));
    expect(areas).toHaveLength(3);
    expect(lines).toHaveLength(3);
    for (const a of areas) {
      expect(a.getAttribute("fill-opacity")).toBe(String(AREA_OVERLAP_FILL_OPACITY));
      expect(a.getAttribute("data-label-safe")).toBeTruthy();
    }
    for (const l of lines) {
      const label = l.getAttribute("data-label")!;
      expect(l.getAttribute("data-label-safe")).toBe(label); // plain labels sanitize to themselves
      expect(l.getAttribute("fill")).toBe("none");
      expect(l.getAttribute("stroke-width")).toBe(String(AREA_OVERLAP_LINE_WIDTH));
      // the top line takes the series colour
      expect(l.getAttribute("stroke")).toBe(colorsMapping[label as keyof typeof colorsMapping]);
      expect(l.getAttribute("d")).toMatch(/^M/);
    }
    chart.destroy();
  });

  it("draws larger areas first: the smaller area comes LATER in the DOM", () => {
    const { host, chart } = mount();
    const order = Array.from(host.querySelectorAll("path.area")).map((a) =>
      a.getAttribute("data-label"),
    );
    expect(order).toEqual(["Big", "Mid", "Small"]);
    // every top line is drawn above every fill
    const all = Array.from(host.querySelectorAll("path.area, path.area-line"));
    const lastArea = all.map((n) => n.getAttribute("class")).lastIndexOf("area");
    const firstLine = all.map((n) => n.getAttribute("class")).indexOf("area-line");
    expect(firstLine).toBeGreaterThan(lastArea);
    chart.destroy();
  });

  it("keeps the legend (keys) order and the colours unchanged", () => {
    const { chart } = mount();
    const ctx = chart.getContext()!;
    expect(ctx.legendData!.map((l) => l.label)).toEqual(keys);
    expect(ctx.legendData!.map((l) => l.color)).toEqual([
      colorsMapping.Small,
      colorsMapping.Big,
      colorsMapping.Mid,
    ]);
    chart.destroy();
  });

  it("disabledItems removes both the area and its top line", () => {
    const { host, chart } = mount({ disabledItems: ["Big"] });
    expect(host.querySelectorAll("path.area")).toHaveLength(2);
    expect(host.querySelectorAll("path.area-line")).toHaveLength(2);
    expect(host.querySelector('[data-label="Big"]')).toBeNull();
    chart.destroy();
  });

  it("highlightItems dims the other series (area + line)", () => {
    const { host, chart } = mount({ highlightItems: ["Small"] });
    for (const el of Array.from(host.querySelectorAll("path.area, path.area-line"))) {
      const dimmed = el.getAttribute("data-label") !== "Small";
      expect(el.getAttribute("opacity")).toBe(dimmed ? "0.05" : "1");
    }
    chart.destroy();
  });

  it("the y axis spans the largest single value (0.9), not 100", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    if (ctx.chartType === "area-chart") expect(ctx.yAxis.domain).toEqual([0, 0.9]);
    const labels = Array.from(host.querySelectorAll(".mv-y-axis .mv-axis-label")).map((n) =>
      Number(n.textContent),
    );
    expect(labels.length).toBeGreaterThan(1);
    expect(Math.max(...labels)).toBeLessThanOrEqual(1);
    expect(Math.max(...labels)).toBeGreaterThanOrEqual(0.9);
    chart.destroy();
  });

  it('stackOffset "expand" is ignored with a data warning; ticks are not percentages', () => {
    let warned: DataWarning[] = [];
    const { host, chart } = mount({
      stackOffset: "expand",
      onDataWarning: (w) => (warned = w),
    });
    expect(warned.some((w) => w.type === "ignored-option")).toBe(true);
    const ctx = chart.getContext()!;
    if (ctx.chartType === "area-chart") expect(ctx.yAxis.domain).toEqual([0, 0.9]);
    const labels = Array.from(host.querySelectorAll(".mv-y-axis .mv-axis-label")).map(
      (n) => n.textContent ?? "",
    );
    expect(labels.some((l) => l.includes("%"))).toBe(false);
    chart.destroy();
  });

  it("the context summary names the overlapping mode; SVG and canvas contexts match", () => {
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "canvas" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.summary).toMatch(/^Overlapping area chart/);
    expect(ca.summary).not.toMatch(/Combined total/);
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    b.chart.destroy();
  });

  it("the stacked default is unchanged: no top lines, opaque fills with the white seam", () => {
    const { host, chart } = mount({ stacked: undefined });
    expect(host.querySelectorAll("path.area")).toHaveLength(3);
    expect(host.querySelectorAll("path.area-line")).toHaveLength(0);
    for (const a of Array.from(host.querySelectorAll("path.area"))) {
      expect(a.getAttribute("fill-opacity")).toBeNull();
      expect(a.getAttribute("stroke")).toBe("#fff");
    }
    // stacked keeps keys order bottom-to-top
    expect(
      Array.from(host.querySelectorAll("path.area")).map((a) => a.getAttribute("data-label")),
    ).toEqual(keys);
    expect(chart.getContext()!.summary).toMatch(/^Stacked area chart/);
    chart.destroy();
  });
});

describe("mountAreaChart stacked:false - hover picks the nearest TOP edge", () => {
  // NON-default margin + a non-zero svg rect offset: the host->plot conversion must
  // hold (jsdom's zero rect would mask a missing/double offset).
  const margin = { top: 30, right: 20, bottom: 40, left: 100 };
  const SVG_LEFT = 7;
  const SVG_TOP = 11;

  function linePoints(host: HTMLElement, key: string): Array<[number, number]> {
    const d = host.querySelector(`path.area-line[data-label="${key}"]`)!.getAttribute("d")!;
    return d
      .replace(/^M/, "")
      .split("L")
      .map((p) => p.split(",").map(Number) as [number, number]);
  }

  function setup(extra: Partial<AreaChartProps> = {}) {
    const onHighlightItem = vi.fn();
    const m = mount({ margin, curve: "curveLinear", onHighlightItem, ...extra });
    const svg = m.host.querySelector("svg")!;
    svg.getBoundingClientRect = () =>
      ({
        left: SVG_LEFT,
        top: SVG_TOP,
        right: SVG_LEFT + 600,
        bottom: SVG_TOP + 300,
        width: 600,
        height: 300,
        x: SVG_LEFT,
        y: SVG_TOP,
        toJSON() {},
      }) as DOMRect;
    const overlay = m.host.querySelector<SVGRectElement>(".tpRef")!;
    const tooltip = m.host.querySelector<HTMLDivElement>(".tooltip")!;
    const move = (x: number, y: number) =>
      overlay.dispatchEvent(
        new MouseEvent("mousemove", { clientX: x + SVG_LEFT, clientY: y + SVG_TOP }),
      );
    return { ...m, onHighlightItem, tooltip, move };
  }

  it("inside all three areas, the cursor just above Small's top edge picks Small", () => {
    const { host, chart, onHighlightItem, tooltip, move } = setup();
    const [x, smallY] = linePoints(host, "Small")[1]; // 2021
    // the row sits inside the plot, offset by the non-default left margin
    expect(x).toBeGreaterThan(margin.left);
    move(x + 2, smallY - 3);
    expect(onHighlightItem).toHaveBeenLastCalledWith(["Small"]);
    expect(tooltip.style.visibility).toBe("visible");
    expect(tooltip.innerHTML).toContain("Small");
    chart.destroy();
  });

  it("near Big's top edge picks Big; between two edges the closer one wins", () => {
    const { host, chart, onHighlightItem, move } = setup();
    const [x, bigY] = linePoints(host, "Big")[1];
    const [, midY] = linePoints(host, "Mid")[1];
    move(x, bigY + 2);
    expect(onHighlightItem).toHaveBeenLastCalledWith(["Big"]);
    // closer to Mid (below Big's edge, above Mid's)
    move(x, midY - (midY - bigY) * 0.25);
    expect(onHighlightItem).toHaveBeenLastCalledWith(["Mid"]);
    chart.destroy();
  });

  it("uses the nearest row by x, as today", () => {
    const { host, chart, onHighlightItem, move } = setup();
    const pts = linePoints(host, "Big");
    const [x2022, bigY2022] = pts[2];
    move(x2022 - 5, bigY2022);
    expect(onHighlightItem).toHaveBeenLastCalledWith(["Big"]);
    chart.destroy();
  });

  it("skips a key with no value at that row (a missing value is not a zero share)", () => {
    const gappy: AreaDataRow[] = [
      { date: 2020, Small: 0.1, Big: 0.6, Mid: 0.3 },
      { date: 2021, Big: 0.5, Mid: 0.4 }, // Small missing
      { date: 2022, Small: 0.15, Big: 0.9, Mid: 0.35 },
    ];
    const { host, chart, onHighlightItem, move } = setup({ series: gappy });
    const [x] = linePoints(host, "Mid")[1];
    // right on the baseline, where a missing-as-0 Small would sit
    move(x, 300 - margin.bottom - 1);
    expect(onHighlightItem).toHaveBeenLastCalledWith(["Mid"]);
    chart.destroy();
  });

  it("above the plot (in the top margin) nothing is hit", () => {
    const { host, chart, onHighlightItem, tooltip, move } = setup();
    const [x] = linePoints(host, "Big")[1];
    move(x, margin.top - 10);
    expect(onHighlightItem).toHaveBeenLastCalledWith([]);
    expect(tooltip.style.visibility).toBe("hidden");
    chart.destroy();
  });

  it("the stacked default still hit-tests by band containment", () => {
    const { host, chart, onHighlightItem, move } = setup({ stacked: undefined });
    // In stacked mode the top band is the last key (Mid); hover at its middle.
    const midPath = host.querySelector('path.area[data-label="Mid"]')!;
    expect(midPath).not.toBeNull();
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("area-chart");
    // x of 2021 on the non-default margin: plot spans [100, 580] over [2020, 2022].
    const x = 340;
    // Stacked sums at 2021: Small 0.2, Big 0.7, Mid 1.1 on a [0,100] niced domain,
    // so every band is squashed at the bottom: a point just above the baseline is
    // inside Small's band.
    move(x, 300 - margin.bottom - 0.1);
    expect(onHighlightItem).toHaveBeenLastCalledWith(["Small"]);
    chart.destroy();
  });
});

describe("mountAreaChart stacked:false - canvas renderer", () => {
  interface Op {
    op: "fill" | "stroke";
    style: string;
    alpha: number;
    lineWidth: number;
    d: string;
  }

  function fakeCanvas(): Op[] {
    const ops: Op[] = [];
    vi.stubGlobal(
      "Path2D",
      class {
        d: string;
        constructor(d?: string) {
          this.d = d ?? "";
        }
      },
    );
    const state = { fillStyle: "", strokeStyle: "", globalAlpha: 1, lineWidth: 1 };
    const fakeCtx = {
      ...state,
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      font: "",
      fill(p: { d: string }) {
        ops.push({
          op: "fill",
          style: this.fillStyle,
          alpha: this.globalAlpha,
          lineWidth: this.lineWidth,
          d: p.d,
        });
      },
      stroke(p: { d: string }) {
        ops.push({
          op: "stroke",
          style: this.strokeStyle,
          alpha: this.globalAlpha,
          lineWidth: this.lineWidth,
          d: p.d,
        });
      },
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => fakeCtx as unknown as CanvasRenderingContext2D,
    );
    return ops;
  }

  it("fills each area at low alpha, then strokes each top line in the same colour", () => {
    const ops = fakeCanvas();
    const { chart } = mount({ renderer: "canvas" });
    const fills = ops.filter((o) => o.op === "fill");
    const strokes = ops.filter((o) => o.op === "stroke");
    expect(fills).toHaveLength(3);
    expect(strokes).toHaveLength(3);
    // larger areas first
    expect(fills.map((f) => f.style)).toEqual([
      colorsMapping.Big,
      colorsMapping.Mid,
      colorsMapping.Small,
    ]);
    for (const f of fills) expect(f.alpha).toBeCloseTo(AREA_OVERLAP_FILL_OPACITY, 10);
    for (const s of strokes) {
      expect(s.alpha).toBe(1);
      expect(s.lineWidth).toBe(AREA_OVERLAP_LINE_WIDTH);
    }
    expect(strokes.map((s) => s.style)).toEqual(fills.map((f) => f.style));
    // no white seam in overlap mode, and every fill precedes every stroke
    expect(strokes.some((s) => s.style === "#fff")).toBe(false);
    const lastFill = ops.map((o) => o.op).lastIndexOf("fill");
    const firstStroke = ops.map((o) => o.op).indexOf("stroke");
    expect(firstStroke).toBeGreaterThan(lastFill);
    chart.destroy();
  });

  it("dims non-highlighted series on canvas too", () => {
    const ops = fakeCanvas();
    const { chart } = mount({ renderer: "canvas", highlightItems: ["Small"] });
    const fills = ops.filter((o) => o.op === "fill");
    const bigFill = fills.find((f) => f.style === colorsMapping.Big)!;
    const smallFill = fills.find((f) => f.style === colorsMapping.Small)!;
    expect(bigFill.alpha).toBeCloseTo(0.05 * AREA_OVERLAP_FILL_OPACITY, 10);
    expect(smallFill.alpha).toBeCloseTo(AREA_OVERLAP_FILL_OPACITY, 10);
    chart.destroy();
  });

  it("the stacked default still paints opaque fills with the white seam", () => {
    const ops = fakeCanvas();
    const { chart } = mount({ renderer: "canvas", stacked: undefined });
    const fills = ops.filter((o) => o.op === "fill");
    const strokes = ops.filter((o) => o.op === "stroke");
    expect(fills).toHaveLength(3);
    for (const f of fills) expect(f.alpha).toBe(1);
    expect(strokes.every((s) => s.style === "#fff")).toBe(true);
    chart.destroy();
  });
});

describe("stacked:false - WebGPU mark batch", () => {
  function model(stacked: boolean, highlightItems: string[] = []) {
    const p = processAreaChartData(series, { keys, xAxisDataType: "number", stacked });
    const colors = buildAreaColors(keys, [], colorsMapping);
    const scales = createAreaScales(
      p.xAxisDomain,
      p.yAxisDomain,
      600,
      300,
      { top: 50, right: 50, bottom: 50, left: 60 },
      "number",
    );
    const m = buildAreaRenderModel(p.stacked, scales, colors, {
      xAxisDataType: "number",
      highlightItems,
      stacked,
    });
    const fill = new Map(Object.entries(colorsMapping));
    return buildAreaMarkBatch(m, fill, scales, "number");
  }

  // Each triangle vertex is [x, y, r, g, b, a] (premultiplied).
  const alphas = (tri: number[]) => {
    const out: number[] = [];
    for (let i = 5; i < tri.length; i += 6) out.push(tri[i]);
    return out;
  };

  it("overlap: low-alpha bands first, then full-alpha top strokes", () => {
    const batch = model(false);
    // 3 rows -> 2 segments -> 4 triangles (12 verts) per band and per stroke; 3 keys.
    expect(batch.triangles.length).toBe(3 * 12 * 6 * 2);
    const a = alphas(batch.triangles);
    const bands = a.slice(0, 36);
    const strokes = a.slice(36);
    for (const v of bands) expect(v).toBeCloseTo(AREA_OVERLAP_FILL_OPACITY, 6);
    for (const v of strokes) expect(v).toBeCloseTo(1, 6);
    // the first band is Big (red): premultiplied r == alpha, g == b == 0
    expect(batch.triangles[2]).toBeCloseTo(AREA_OVERLAP_FILL_OPACITY, 6);
    expect(batch.triangles[3]).toBe(0);
    expect(batch.triangles[4]).toBe(0);
  });

  it("overlap: a dimmed series is much fainter on the GPU too", () => {
    const batch = model(false, ["Small"]);
    const a = alphas(batch.triangles);
    // band order Big, Mid, Small: Big's band is dimmed
    expect(a[0]).toBeCloseTo(0.05 * AREA_OVERLAP_FILL_OPACITY, 6);
    expect(a[24]).toBeCloseTo(AREA_OVERLAP_FILL_OPACITY, 6);
  });

  it("stacked default: opaque band + white seam per series, unchanged", () => {
    const batch = model(true);
    const a = alphas(batch.triangles);
    expect(a.every((v) => Math.abs(v - 1) < 1e-6)).toBe(true);
  });

  it("mounting renderer=webgpu in overlap mode falls back to canvas without throwing", () => {
    __resetGPUDeviceForTest();
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
    try {
      const { host, chart } = mount({ renderer: "webgpu" });
      expect(host.querySelector("canvas")).not.toBeNull();
      expect(host.querySelectorAll("path.area-line")).toHaveLength(0);
      chart.destroy();
    } finally {
      delete (navigator as unknown as { gpu?: unknown }).gpu;
      __resetGPUDeviceForTest();
    }
  });
});

describe("stacked:false - animation + no-data paths keep working", () => {
  it("progressiveDraw clips the content group that holds both the fills and the top lines", () => {
    const ticker = createManualTicker();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountAreaChart(
      host,
      {
        series,
        keys,
        stacked: false,
        width: 600,
        height: 300,
        xAxisDataType: "number",
        progressiveDraw: true,
      },
      { ticker },
    );
    const root = host.querySelector("g.area-chart-content")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
    expect(root.querySelectorAll("path.area-line")).toHaveLength(3);
    expect(typeof chart.replay).toBe("function");
    chart.destroy();
  });

  it("timeline mounts in overlap mode and exposes its controller", () => {
    const ticker = createManualTicker();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountAreaChart(
      host,
      {
        series,
        keys,
        stacked: false,
        width: 600,
        height: 300,
        xAxisDataType: "number",
        timeline: true,
      },
      { ticker },
    );
    expect(chart.timeline).toBeDefined();
    const root = host.querySelector("g.area-chart-content")!;
    expect(root.querySelectorAll("path.area-line")).toHaveLength(3);
    chart.destroy();
  });

  it("an empty series renders no marks and does not throw", () => {
    const { host, chart } = mount({ series: [] });
    expect(host.querySelectorAll("path.area, path.area-line")).toHaveLength(0);
    chart.update({ series, keys, stacked: false, width: 600, height: 300 });
    expect(host.querySelectorAll("path.area-line")).toHaveLength(3);
    chart.destroy();
  });
});
