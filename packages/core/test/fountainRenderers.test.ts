import { describe, it, expect } from "vitest";
import { buildFountainRenderModel } from "../src/fountainChart/renderModel";
import { resolveFountainData } from "../src/fountainChart/data";
import { buildFountainColors } from "../src/fountainChart/colors";
import { buildFountainScales, fountainYDomain } from "../src/fountainChart/scales";
import { resolveFountainWords, fountainValueFormatter } from "../src/fountainChart/labels";
import {
  buildFountainTextModel,
  fitFountainValueLabels,
  fountainBottomLayout,
  type FountainTextMeasure,
} from "../src/fountainChart/layout";
import {
  gateFountainText,
  renderFountainSvg,
  renderFountainSvgText,
} from "../src/fountainChart/renderSvg";
import { drawFountainCanvas } from "../src/fountainChart/renderCanvas";
import { buildFountainWebgpuBatch } from "../src/fountainChart/renderWebgpu";
import { markColor } from "../src/webgpu/marks";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { FountainChartProps, FountainDataItem, Margin } from "../src/types";
import { outsideBy } from "./fountainOutline";

// The three renderers draw the ONE render model (SPEC section 4). SVG is checked in
// the DOM; canvas through a recording 2D context (jsdom has none); WebGPU through the
// mark batch it would upload.

const NS = "http://www.w3.org/2000/svg";
const MARGIN: Margin = { top: 30, right: 110, bottom: 110, left: 64 };
const measure: FountainTextMeasure = (t, px) => t.length * px * 0.6;

const car: FountainDataItem = {
  label: "Car",
  value: 30,
  low: 22,
  high: 55,
  samples: [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48],
};
const bus: FountainDataItem = {
  label: "Bus",
  value: 40,
  low: 32,
  high: 65,
  samples: [38, 44, 36, 40, 65, 52, 39, 58, 35, 40, 32, 61, 37, 47, 40, 54, 34, 51, 38, 57],
};
const allow = {
  value: 45,
  label: "Time I allow: 45 min",
  goodSide: "below" as const,
  countLabel: "within 45 min",
};

function build(data: FountainDataItem[], o: Partial<FountainChartProps> = {}) {
  const resolved = resolveFountainData(data, { xAxisDataType: o.xAxisDataType });
  const colors = buildFountainColors(data, o.colors ?? ["#1f77b4", "#ff7f0e", "#2ca02c"]);
  const scales = buildFountainScales({
    mode: resolved.mode,
    temporalType: resolved.temporalType,
    labels: resolved.labels,
    periods: resolved.periods,
    yDomain: fountainYDomain(resolved.jets, { referenceLines: o.referenceLines }),
    width: 700,
    height: 460,
    margin: MARGIN,
  });
  const model = buildFountainRenderModel(resolved, scales, colors, {
    showRange: o.showRange,
    showSamples: o.showSamples,
    drift: o.drift,
    showTrendLine: o.showTrendLine,
    highlightItems: o.highlightItems,
    referenceLines: o.referenceLines,
    readingGuide: o.readingGuide,
    format: fountainValueFormatter(undefined, "en-US"),
    words: resolveFountainWords(o),
  });
  return { resolved, scales, model, colors };
}

function svgOf(model: ReturnType<typeof build>["model"]) {
  const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
  renderFountainSvg(svg, model, { enableTransitions: false });
  return svg;
}

/** Points of a polygon path "M x,y L x,y ... Z". */
const pathPoints = (d: string): Array<[number, number]> =>
  [...d.matchAll(/[ML]\s*(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

const num = (el: Element, a: string): number => Number(el.getAttribute(a));

describe("renderFountainSvg: the marks", () => {
  it("one group per jet; the group and every mark in it carry data-label and data-label-safe", () => {
    const { model } = build([car, bus, { label: "Jet d'Eau", value: 12 }]);
    const svg = svgOf(model);
    const groups = svg.querySelectorAll("g.mv-fountain-jet-group");
    expect(groups.length).toBe(3);
    const safe = sanitizeForClassName("Jet d'Eau");
    expect(groups[2].getAttribute("data-label")).toBe("Jet d'Eau");
    expect(groups[2].getAttribute("data-label-safe")).toBe(safe);
    for (const g of Array.from(groups)) {
      for (const mark of Array.from(g.children)) {
        expect(mark.getAttribute("data-label")).toBe(g.getAttribute("data-label"));
        expect(mark.getAttribute("data-label-safe")).toBe(g.getAttribute("data-label-safe"));
      }
    }
  });

  it("the stem is a bar from the baseline that ends at the big dot", () => {
    const { model, scales } = build([car]);
    const svg = svgOf(model);
    const stem = svg.querySelector("rect.mv-fountain-stem")!;
    const big = svg.querySelector("circle.mv-fountain-value")!;
    expect(num(stem, "y")).toBeCloseTo(scales.yScale(30), 6);
    expect(num(stem, "y") + num(stem, "height")).toBeCloseTo(scales.yScale(0), 6);
    expect(num(big, "cy")).toBeCloseTo(scales.yScale(30), 6);
    expect(num(big, "cx")).toBeCloseTo(num(stem, "x") + num(stem, "width") / 2, 6);
    expect(num(big, "r")).toBeCloseTo(6.5, 6);
    expect(big.getAttribute("stroke-width")).toBe("2");
  });

  it("the bell's top is at y(high) and its base at y(low); fill ~13 %, outline ~70 %", () => {
    const { model, scales } = build([car]);
    const bell = svgOf(model).querySelector("path.mv-fountain-jet")!;
    const ys = pathPoints(bell.getAttribute("d")!).map((p) => p[1]);
    expect(Math.min(...ys)).toBeCloseTo(scales.yScale(55), 1);
    expect(Math.max(...ys)).toBeCloseTo(scales.yScale(22), 1);
    expect(Number(bell.getAttribute("fill-opacity"))).toBeCloseTo(0.13, 6);
    expect(Number(bell.getAttribute("stroke-opacity"))).toBeCloseTo(0.7, 6);
    expect(bell.getAttribute("stroke-dasharray")).toBeNull();
  });

  it("every small dot is inside its bell, one per sample, r ~2.9 with a hairline", () => {
    for (const drift of [false, true]) {
      const { model } = build([car, bus], { drift });
      const svg = svgOf(model);
      for (const g of Array.from(svg.querySelectorAll("g.mv-fountain-jet-group"))) {
        const poly = pathPoints(g.querySelector("path.mv-fountain-jet")!.getAttribute("d")!);
        const dots = Array.from(g.querySelectorAll("circle.mv-fountain-dot"));
        expect(dots.length).toBe(20);
        for (const d of dots) {
          // Its disc within half the outline's stroke, or as close as its row allows.
          expect(outsideBy(poly, { x: num(d, "cx"), y: num(d, "cy") })).toBeNull();
          expect(num(d, "r")).toBeCloseTo(2.9, 6);
          expect(Number(d.getAttribute("stroke-width"))).toBeCloseTo(0.7, 6);
        }
      }
    }
  });

  it("drift shifts only the upper part: the base stays centred, the tip leans right", () => {
    const off = pathPoints(
      svgOf(build([car]).model)
        .querySelector("path.mv-fountain-jet")!
        .getAttribute("d")!,
    );
    const on = pathPoints(
      svgOf(build([car], { drift: true }).model)
        .querySelector("path.mv-fountain-jet")!
        .getAttribute("d")!,
    );
    const bottom = Math.max(...off.map((p) => p[1]));
    const top = Math.min(...off.map((p) => p[1]));
    const baseXs = (pts: Array<[number, number]>) =>
      pts.filter((p) => Math.abs(p[1] - bottom) < 0.01).map((p) => p[0]);
    expect(baseXs(on)).toEqual(baseXs(off));
    const tipX = (pts: Array<[number, number]>) => pts.find((p) => Math.abs(p[1] - top) < 0.01)![0];
    expect(tipX(on)).toBeGreaterThan(tipX(off) + 3);
  });

  it("forecast: dashed stem line and outline, lighter fill, hollow big dot, no small dots", () => {
    const { model } = build([car, { ...bus, forecast: true }]);
    const svg = svgOf(model);
    const g = svg.querySelectorAll("g.mv-fountain-jet-group")[1];
    const stem = g.querySelector(".mv-fountain-stem")!;
    expect(stem.tagName).toBe("line");
    expect(stem.getAttribute("stroke-dasharray")).toBeTruthy();
    const bell = g.querySelector("path.mv-fountain-jet")!;
    expect(bell.getAttribute("stroke-dasharray")).toBe("4 3");
    expect(Number(bell.getAttribute("fill-opacity"))).toBeLessThan(0.13);
    expect(g.querySelectorAll("circle.mv-fountain-dot").length).toBe(0);
    const big = g.querySelector("circle.mv-fountain-value")!;
    // Hollow: a ring with nothing painted inside, so it reads as hollow on any page
    // background (never a surface-coloured disc, which is white on a dark page).
    expect(big.getAttribute("fill")).toBe("none");
    expect(big.getAttribute("stroke")).toBe(model.jets[1].color);
    // the actual jet is solid
    expect(svg.querySelector("rect.mv-fountain-stem")).not.toBeNull();
  });

  it("a hollow big dot knocks out the marks under it (stem, bell, trend line), not its ring", () => {
    const data: FountainDataItem[] = [
      { label: "T", value: 22, low: 21, high: 23, date: 1 },
      { label: "T", value: 20, low: 17, high: 24, date: 2, forecast: true },
      { label: "T", value: 21, low: 16, high: 26, date: 3, forecast: true },
    ];
    const { model } = build(data, { xAxisDataType: "number" });
    const svg = svgOf(model);
    const clip = svg.querySelector("clipPath.mv-fountain-knockout")!;
    expect(clip).not.toBeNull();
    const id = clip.getAttribute("id")!;
    const path = clip.querySelector("path")!;
    expect(path.getAttribute("clip-rule")).toBe("evenodd");
    // One hole per hollow big dot: its inside, r - 1 (the 2 px ring is centred on r).
    const holes = [...path.getAttribute("d")!.matchAll(/M(-?[\d.]+),(-?[\d.]+) a([\d.]+),/g)];
    const hollow = model.jets.filter((j) => j.bigDot.hollow).map((j) => j.bigDot);
    expect(holes).toHaveLength(2);
    hollow.forEach((b, k) => {
      const [, mx, my, r] = holes[k].map(Number);
      expect(r).toBeCloseTo(b.r - 1, 2);
      expect(mx + r).toBeCloseTo(b.x, 2);
      expect(my).toBeCloseTo(b.y, 2);
    });
    for (const g of svg.querySelectorAll("g.mv-fountain-jet-group")) {
      expect(g.getAttribute("clip-path")).toBe(`url(#${id})`);
    }
    expect(svg.querySelector("path.mv-fountain-trend")!.getAttribute("clip-path")).toBe(
      `url(#${id})`,
    );
    // Two charts on one page never share a knockout id.
    const other = svgOf(model).querySelector("clipPath.mv-fountain-knockout")!;
    expect(other.getAttribute("id")).not.toBe(id);
    // Without a forecast there is nothing to knock out.
    expect(svgOf(build([car]).model).querySelector("clipPath.mv-fountain-knockout")).toBeNull();
  });

  it("showRange false: no bell and no dots; showSamples false: the bell without dots", () => {
    const noRange = svgOf(build([car], { showRange: false }).model);
    expect(noRange.querySelector("path.mv-fountain-jet")).toBeNull();
    expect(noRange.querySelectorAll("circle.mv-fountain-dot").length).toBe(0);
    expect(noRange.querySelector("circle.mv-fountain-value")).not.toBeNull();
    const noSamples = svgOf(build([car], { showSamples: false }).model);
    expect(noSamples.querySelector("path.mv-fountain-jet")).not.toBeNull();
    expect(noSamples.querySelectorAll("circle.mv-fountain-dot").length).toBe(0);
  });

  it("the lake and the reference lines sit outside the clipped marks group", () => {
    const { model, scales } = build([car, bus], { referenceLines: [allow] });
    const svg = svgOf(model);
    const content = svg.querySelector("g.fountain-chart-content")!;
    const lake = svg.querySelector("rect.mv-fountain-lake")!;
    const ref = svg.querySelector("line.mv-fountain-reference")!;
    expect(content.contains(lake)).toBe(false);
    expect(content.contains(ref)).toBe(false);
    expect(num(lake, "y")).toBeCloseTo(scales.yScale(0), 6);
    expect(num(ref, "y1")).toBeCloseTo(scales.yScale(45), 6);
    expect(ref.getAttribute("stroke-dasharray")).toBeTruthy();
    expect(ref.getAttribute("stroke")).toContain("--michi-vz-attention");
  });

  it("the trend line runs through the big dots, dashed", () => {
    const { model } = build(
      [
        { label: "Flow", value: 50, spread: 8, date: 2001 },
        { label: "Flow", value: 70, spread: 10, date: 2002 },
      ],
      { xAxisDataType: "number" },
    );
    const svg = svgOf(model);
    const trend = svg.querySelector("path.mv-fountain-trend")!;
    expect(trend.getAttribute("stroke-dasharray")).toBeTruthy();
    const pts = pathPoints(trend.getAttribute("d")!);
    const bigs = Array.from(svg.querySelectorAll("circle.mv-fountain-value"));
    pts.forEach(([x, y], i) => {
      expect(x).toBeCloseTo(num(bigs[i], "cx"), 1);
      expect(y).toBeCloseTo(num(bigs[i], "cy"), 1);
    });
  });

  it("dimmed jets fade; the removed looks (mist, droplets, froth, crown) are never drawn", () => {
    const { model } = build([car, bus], { highlightItems: ["Car"] });
    const svg = svgOf(model);
    const groups = svg.querySelectorAll("g.mv-fountain-jet-group");
    expect(groups[0].getAttribute("opacity")).toBe("1");
    expect(Number(groups[1].getAttribute("opacity"))).toBeLessThan(1);
    for (const gone of ["mist", "droplet", "outline", "froth", "crown"]) {
      expect(svg.querySelector(`.mv-fountain-${gone}`)).toBeNull();
    }
    expect(svg.querySelectorAll("path.mv-fountain-jet").length).toBe(2);
  });
});

function textModelOf(
  b: ReturnType<typeof build>,
  o: { guide?: string[]; yTitle?: string; width?: number } = {},
) {
  const fit = fitFountainValueLabels(
    b.model.jets.map((j) => j.valueLabels),
    b.model.slotWidth,
    measure,
  );
  const bottom = fountainBottomLayout({
    axisLabelBaseline: 20,
    valueLines: fit.maxLines,
    lineHeight: fit.lineHeight,
    guideLines: o.guide?.length ?? 0,
  });
  return buildFountainTextModel(b.model, {
    valueFit: fit,
    bottom,
    measure,
    referenceWidth: 90,
    yTitle: o.yTitle ? { text: o.yTitle, x: 14 } : null,
    guideLines: o.guide ?? [],
    width: o.width ?? 700,
  });
}

describe("renderFountainSvgText: the words", () => {
  it("value labels under each x label, centred on the jet, with the data-label hook", () => {
    const b = build([car, bus], { referenceLines: [allow] });
    const text = textModelOf(b);
    const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
    renderFountainSvgText(svg, text);
    const blocks = svg.querySelectorAll("g.mv-fountain-value-label");
    expect(blocks.length).toBe(2);
    expect(blocks[0].getAttribute("data-label")).toBe("Car");
    expect(blocks[0].getAttribute("data-label-safe")).toBe("Car");
    const lines = Array.from(blocks[0].querySelectorAll("text.mv-fountain-value-line"));
    expect(lines.map((l) => l.textContent)).toEqual([
      "usual 30",
      "lowest 22",
      "highest 55",
      "17 of 20",
      "within 45 min",
    ]);
    expect(lines.map((l) => l.getAttribute("data-kind"))).toEqual([
      "usual",
      "low",
      "high",
      "count",
      "countLabel",
    ]);
    for (const l of lines) {
      expect(num(l, "x")).toBeCloseTo(b.model.jets[0].x, 6);
      expect(l.getAttribute("text-anchor")).toBe("middle");
      expect(num(l, "y")).toBeGreaterThan(b.model.plot.bottom);
    }
    expect(lines[0].getAttribute("font-weight")).toBe("bold");
    expect(lines[3].getAttribute("fill")).toContain("--michi-vz-attention");
  });

  it("reference labels at the right end of the line, wrapped, first line bold", () => {
    const b = build([car, bus], { referenceLines: [allow] });
    const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
    renderFountainSvgText(svg, textModelOf(b));
    const label = svg.querySelector("text.mv-fountain-reference-label")!;
    const tspans = Array.from(label.querySelectorAll("tspan"));
    expect(tspans.map((t) => t.textContent).join(" ")).toBe("Time I allow: 45 min");
    expect(tspans.length).toBe(2);
    expect(tspans[0].getAttribute("font-weight")).toBe("bold");
    expect(num(tspans[0], "x")).toBeGreaterThan(b.model.plot.right);
  });

  it("the y-axis title is rotated beside the axis; the reading guide sits under everything", () => {
    const b = build([car]);
    const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
    renderFountainSvgText(
      svg,
      textModelOf(b, { yTitle: "minutes (higher = slower)", guide: ["A guide"] }),
    );
    const title = svg.querySelector("text.mv-fountain-y-title")!;
    expect(title.textContent).toBe("minutes (higher = slower)");
    expect(title.getAttribute("transform")).toMatch(/^rotate\(-90/);
    const guide = svg.querySelector("text.mv-fountain-reading-guide")!;
    expect(guide.textContent).toBe("A guide");
    const lastValue = Math.max(
      ...Array.from(svg.querySelectorAll("text.mv-fountain-value-line")).map((t) => num(t, "y")),
    );
    expect(num(guide.querySelector("tspan")!, "y")).toBeGreaterThan(lastValue);
  });

  it("gateFountainText hides the value labels of jets the reveal has not reached", () => {
    const b = build([car, bus]);
    const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
    renderFountainSvgText(svg, textModelOf(b));
    const blocks = Array.from(svg.querySelectorAll<SVGGElement>("g.mv-fountain-value-label"));
    gateFountainText(svg, b.model.jets[0].x + 1);
    expect(blocks[0].getAttribute("visibility")).toBe("visible");
    expect(blocks[1].getAttribute("visibility")).toBe("hidden");
    gateFountainText(svg, null);
    expect(blocks[1].getAttribute("visibility")).toBe("visible");
  });
});

// ---- canvas: a recording 2D context ----------------------------------------------

interface Call {
  fn: string;
  args: unknown[];
  fillStyle: string;
  strokeStyle: string;
  alpha: number;
  dash: number[];
}

function recordingCanvas() {
  const calls: Call[] = [];
  const state: Record<string, unknown> = {
    fillStyle: "",
    strokeStyle: "",
    globalAlpha: 1,
    lineWidth: 1,
  };
  let dash: number[] = [];
  const ctx = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop in state) return state[prop];
        if (prop === "setLineDash") return (d: number[]) => (dash = [...d]);
        if (prop === "getLineDash") return () => dash;
        return (...args: unknown[]) =>
          calls.push({
            fn: prop,
            args,
            fillStyle: String(state.fillStyle),
            strokeStyle: String(state.strokeStyle),
            alpha: Number(state.globalAlpha),
            dash: [...dash],
          });
      },
      set(_t, prop: string, v) {
        state[prop] = v;
        return true;
      },
    },
  );
  const canvas = document.createElement("canvas");
  (canvas as unknown as { getContext: () => unknown }).getContext = () => ctx;
  return { canvas, calls };
}

const COLORS = { ink: "#222222", surface: "#fefefe", attention: "#cc0000", lake: "#9cc3dd" };

describe("drawFountainCanvas", () => {
  it("paints the lake and reference lines outside the reveal clip, the jets inside it", () => {
    const { model } = build([car, bus], { referenceLines: [allow] });
    const { canvas, calls } = recordingCanvas();
    drawFountainCanvas(canvas, null, model, { width: 700, height: 460, ...COLORS, revealX: 300 });
    const clipAt = calls.findIndex((c) => c.fn === "clip");
    const lakeAt = calls.findIndex((c) => c.fn === "fillRect" && c.fillStyle === COLORS.lake);
    const refAt = calls.findIndex((c) => c.fn === "stroke" && c.strokeStyle === COLORS.attention);
    expect(clipAt).toBeGreaterThan(-1);
    expect(lakeAt).toBeGreaterThan(-1);
    expect(lakeAt).toBeLessThan(clipAt);
    expect(refAt).toBeLessThan(clipAt);
    const rect = calls.find((c) => c.fn === "rect")!;
    expect(rect.args[2]).toBe(300);
    const jetFill = calls.findIndex((c) => c.fn === "fill" && c.fillStyle === model.jets[0].color);
    expect(jetFill).toBeGreaterThan(clipAt);
  });

  it("forecast: dashed outline and stem, hollow big dot (a colour ring, nothing inside)", () => {
    const { model } = build([{ ...car, forecast: true }]);
    const { canvas, calls } = recordingCanvas();
    drawFountainCanvas(canvas, null, model, { width: 700, height: 460, ...COLORS });
    const col = model.jets[0].color;
    const strokes = calls.filter((c) => c.fn === "stroke" && c.strokeStyle === col);
    expect(strokes.some((c) => c.dash.join(",") === "4,3")).toBe(true);
    expect(strokes.some((c) => c.dash.join(",") === "5,4")).toBe(true);
    expect(strokes[strokes.length - 1].dash).toEqual([]);
    // No surface-coloured disc: nothing is filled after the ring's arc.
    const b = model.jets[0].bigDot;
    const ring = calls.findIndex(
      (c) => c.fn === "arc" && c.args[0] === b.x && c.args[1] === b.y && c.args[2] === b.r,
    );
    expect(ring).toBeGreaterThan(-1);
    expect(calls.slice(ring).some((c) => c.fn === "fill")).toBe(false);
    expect(calls.some((c) => c.fn === "fill" && c.fillStyle === COLORS.surface)).toBe(false);
  });

  it("a hollow big dot knocks out what is under it: an even-odd clip with a hole there", () => {
    const { model } = build([car, { ...bus, forecast: true }]);
    const { canvas, calls } = recordingCanvas();
    drawFountainCanvas(canvas, null, model, { width: 700, height: 460, ...COLORS });
    const b = model.jets[1].bigDot;
    const clipAt = calls.findIndex((c) => c.fn === "clip" && c.args[0] === "evenodd");
    expect(clipAt).toBeGreaterThan(-1);
    const hole = calls
      .slice(0, clipAt)
      .find((c) => c.fn === "arc" && c.args[0] === b.x && c.args[1] === b.y);
    expect(hole?.args[2]).toBeCloseTo(b.r - 1, 6);
    // Every jet's marks are painted under that clip, and it is released afterwards.
    const firstJetPaint = calls.findIndex(
      (c) => c.fn === "fill" && c.fillStyle === model.jets[0].color,
    );
    expect(firstJetPaint).toBeGreaterThan(clipAt);
    expect(calls.slice(clipAt).some((c) => c.fn === "restore")).toBe(true);
    // No knockout without a forecast.
    const plain = recordingCanvas();
    drawFountainCanvas(plain.canvas, null, build([car]).model, {
      width: 700,
      height: 460,
      ...COLORS,
    });
    expect(plain.calls.some((c) => c.fn === "clip")).toBe(false);
  });

  it("small dots get a surface hairline; each jet paints its own colour (per-item colour honoured)", () => {
    const data: FountainDataItem[] = [
      { label: "Rain", value: 30, low: 20, high: 40, samples: [20, 30, 40], date: 2001 },
      {
        label: "Rain",
        value: 35,
        low: 25,
        high: 45,
        samples: [25, 35, 45],
        date: 2002,
        color: "#aa00aa",
      },
    ];
    const { model } = build(data, { xAxisDataType: "number" });
    const { canvas, calls } = recordingCanvas();
    drawFountainCanvas(canvas, null, model, { width: 700, height: 460, ...COLORS });
    const fills = new Set(calls.filter((c) => c.fn === "fill").map((c) => c.fillStyle));
    expect(fills.has("#aa00aa")).toBe(true);
    expect(fills.has(model.jets[0].color)).toBe(true);
    expect(model.jets[0].color).not.toBe("#aa00aa");
    const hairlines = calls.filter(
      (c) => c.fn === "stroke" && c.strokeStyle === COLORS.surface && c.dash.length === 0,
    );
    expect(hairlines.length).toBeGreaterThanOrEqual(6);
  });

  it("the stem is a bar with round ends, as the SVG rect (rx = width / 2)", () => {
    const { model } = build([car]);
    const { canvas, calls } = recordingCanvas();
    drawFountainCanvas(canvas, null, model, { width: 700, height: 460, ...COLORS });
    const s = model.jets[0].stem;
    const bar = calls.find((c) => c.fn === "roundRect");
    expect(bar?.args).toEqual([
      s.x - s.width / 2,
      Math.min(s.y0, s.y1),
      s.width,
      Math.abs(s.y0 - s.y1),
      s.width / 2,
    ]);
    const next = calls[calls.indexOf(bar!) + 1];
    expect(next.fn).toBe("fill");
    expect(next.fillStyle).toBe(model.jets[0].color);
  });

  it("no 2D context (jsdom): a no-op", () => {
    const { model } = build([car]);
    expect(() =>
      drawFountainCanvas(document.createElement("canvas"), null, model, {
        width: 700,
        height: 460,
        ...COLORS,
      }),
    ).not.toThrow();
  });
});

// ---- webgpu: the mark batch --------------------------------------------------------

describe("buildFountainWebgpuBatch", () => {
  const colorOf = (j: { color: string }) => j.color;

  it("a forecast stem is dashed (many short quads); an actual stem is one bar", () => {
    const solid = build([{ label: "A", value: 40 }], { showRange: false });
    const dashed = build([{ label: "A", value: 40, forecast: true }], { showRange: false });
    const tris = (b: ReturnType<typeof build>) =>
      buildFountainWebgpuBatch(b.model, colorOf, COLORS).triangles.length / 18;
    // lake (2 triangles) + stem
    expect(tris(solid)).toBe(4);
    expect(tris(dashed)).toBeGreaterThan(8);
  });

  it("a forecast outline is dashed: fewer outline triangles than the solid outline", () => {
    const actual = build([{ label: "A", value: 40, low: 20, high: 60 }]);
    const fc = build([{ label: "A", value: 40, low: 20, high: 60, forecast: true }]);
    const count = (b: ReturnType<typeof build>) =>
      buildFountainWebgpuBatch(b.model, colorOf, COLORS).triangles.length;
    // the solid outline is one quad per segment; dashes skip the gaps
    expect(count(fc)).not.toBe(count(actual));
  });

  it("big dot: a surface ring round a colour disc; hollow for a forecast", () => {
    const b = build([car, { ...bus, forecast: true }], { showSamples: false });
    const batch = buildFountainWebgpuBatch(b.model, colorOf, COLORS);
    const circles: number[][] = [];
    for (let i = 0; i < batch.circles.length; i += 7) circles.push(batch.circles.slice(i, i + 7));
    const surface = markColor(COLORS.surface);
    const carCol = markColor(b.model.jets[0].color);
    const busCol = markColor(b.model.jets[1].color);
    const rgba = (c: number[]) => c.slice(3).map((n) => Math.round(n * 1000));
    const same = (a: number[], bb: readonly number[]) =>
      rgba(a).join() === [...bb].map((n) => Math.round(n * 1000)).join();
    // actual: outer surface ring, inner colour; forecast: no disc at all (a ring of
    // triangles instead, below), so nothing surface-coloured fills it
    expect(circles).toHaveLength(2);
    expect(same(circles[0], surface)).toBe(true);
    expect(same(circles[1], carCol)).toBe(true);
    expect(circles.some((c) => same(c, busCol))).toBe(false);
  });

  it("a hollow big dot is a colour ring; its stem and the trend line stop at the ring", () => {
    const data: FountainDataItem[] = [
      { label: "T", value: 22, low: 21, high: 23, date: 1 },
      { label: "T", value: 20, low: 17, high: 24, date: 2, forecast: true },
      { label: "T", value: 21, low: 16, high: 26, date: 3, forecast: true },
    ];
    const b = build(data, { xAxisDataType: "number", showRange: false });
    const batch = buildFountainWebgpuBatch(b.model, colorOf, COLORS);
    const tris: number[][] = [];
    for (let i = 0; i < batch.triangles.length; i += 18) {
      tris.push(batch.triangles.slice(i, i + 18));
    }
    const col = markColor(b.model.jets[1].color);
    const colourOf = (t: number[]) =>
      t
        .slice(2, 6)
        .map((n) => Math.round(n * 1000))
        .join();
    const want = [...col].map((n) => Math.round(n * 1000)).join();
    for (const j of b.model.jets.filter((jj) => jj.bigDot.hollow)) {
      const d = j.bigDot;
      const verts = (t: number[]) => [0, 6, 12].map((k) => [t[k], t[k + 1]]);
      // Nothing is painted inside the ring (its inner edge is r - 1).
      const within = tris.filter((t) =>
        verts(t).some(([x, y]) => Math.hypot(x - d.x, y - d.y) < d.r - 1 - 0.05),
      );
      expect(within).toEqual([]);
      // The ring itself: colour triangles at about r from the centre, all the way round.
      const ring = tris.filter(
        (t) =>
          colourOf(t) === want &&
          verts(t).every(([x, y]) => Math.abs(Math.hypot(x - d.x, y - d.y) - d.r) <= 1.01),
      );
      expect(ring.length).toBeGreaterThanOrEqual(32);
    }
  });

  it("small dots: one colour disc per sample over a surface hairline disc", () => {
    const b = build([car]);
    const batch = buildFountainWebgpuBatch(b.model, colorOf, COLORS);
    // 20 dots x 2 discs + the big dot's 2 discs
    expect(batch.circles.length / 7).toBe(20 * 2 + 2);
  });
});
