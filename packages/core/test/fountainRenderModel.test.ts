import { describe, it, expect } from "vitest";
import {
  buildFountainRenderModel,
  type BuildFountainModelOptions,
} from "../src/fountainChart/renderModel";
import { resolveFountainData } from "../src/fountainChart/data";
import { buildFountainColors } from "../src/fountainChart/colors";
import { buildFountainScales, fountainYDomain } from "../src/fountainChart/scales";
import { resolveFountainWords, fountainValueFormatter } from "../src/fountainChart/labels";
import { bellOutline, fountainHalfWidth } from "../src/fountainChart/geometry";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { FountainChartProps, FountainDataItem, Margin } from "../src/types";
import { outsideBy } from "./fountainOutline";

const MARGIN: Margin = { top: 40, right: 120, bottom: 100, left: 70 };
const P = ["#111111", "#222222", "#333333", "#444444"];

type Opts = Partial<FountainChartProps> & { model?: Partial<BuildFountainModelOptions> };

function build(data: FountainDataItem[], o: Opts = {}) {
  const resolved = resolveFountainData(data, {
    xAxisDataType: o.xAxisDataType,
    disabledItems: o.disabledItems,
  });
  const colors = buildFountainColors(data, o.colors ?? P, o.colorsMapping);
  const scales = buildFountainScales({
    mode: resolved.mode,
    temporalType: resolved.temporalType,
    labels: resolved.labels,
    periods: resolved.periods,
    yDomain: fountainYDomain(resolved.jets, {
      referenceLines: o.referenceLines,
      showRange: o.showRange,
      yAxisDomain: o.yAxisDomain,
    }),
    yAxisDomainGiven: !!o.yAxisDomain,
    width: o.width ?? 800,
    height: o.height ?? 460,
    margin: MARGIN,
  });
  const model = buildFountainRenderModel(resolved, scales, colors, {
    showRange: o.showRange,
    showSamples: o.showSamples,
    showValueLabels: o.showValueLabels,
    drift: o.drift,
    showTrendLine: o.showTrendLine,
    highlightItems: o.highlightItems,
    referenceLines: o.referenceLines,
    readingGuide: o.readingGuide,
    format: fountainValueFormatter(o.yAxisFormat, "en-US"),
    words: resolveFountainWords(o),
    ...o.model,
  });
  return { resolved, scales, model };
}

const car: FountainDataItem = {
  label: "Car",
  value: 30,
  low: 22,
  high: 55,
  samples: [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48],
};
const train: FountainDataItem = {
  label: "Train",
  value: 35,
  low: 32,
  high: 42,
  samples: [34, 35, 33, 36, 42, 35, 34, 37, 35, 32, 36, 34, 38, 35, 33, 40, 36, 34, 37, 35],
};
const commute = [car, train];
const allow = {
  value: 45,
  label: "Time I allow",
  goodSide: "below" as const,
  countLabel: "within 45 min",
};

describe("render model: the marks", () => {
  it("stem: a bar from the baseline (0, the lake) to the big dot, at the jet's x", () => {
    const { model, scales } = build(commute);
    const j = model.jets[0];
    expect(model.baselineY).toBe(scales.yScale(0));
    expect(model.lake.y).toBe(model.baselineY);
    expect(model.lake.x0).toBe(MARGIN.left);
    expect(model.lake.x1).toBe(800 - MARGIN.right);
    expect(j.stem.x).toBe(j.x);
    expect(j.stem.y0).toBe(model.baselineY);
    expect(j.stem.y1).toBe(scales.yScale(30));
    expect(j.stem.y1).toBe(j.bigDot.y);
    expect(j.stem.width).toBeGreaterThan(0);
    expect(j.stem.dashed).toBe(false);
  });

  it("bell: its top is exactly y(high) and its base exactly y(low)", () => {
    const { model, scales } = build(commute);
    for (const [i, d] of commute.entries()) {
      const bell = model.jets[i].bell!;
      const ys = bell.points.map((p) => p[1]);
      expect(Math.min(...ys)).toBe(scales.yScale(d.high!));
      expect(Math.max(...ys)).toBe(scales.yScale(d.low!));
      expect(bell.top).toBe(scales.yScale(d.high!));
      expect(bell.bottom).toBe(scales.yScale(d.low!));
      expect(bell.dashed).toBe(false);
    }
  });

  it("bell half-width: grows with the sample count, capped by the slot", () => {
    const { model, scales } = build(commute);
    expect(model.jets[0].bell!.half).toBeCloseTo(fountainHalfWidth(20, scales.slotWidth), 10);
    const narrow = build(
      Array.from({ length: 12 }, (_, i) => ({ ...car, label: `C${i}` })),
      { width: 400 },
    );
    const j = narrow.model.jets[0];
    expect(j.bell!.half).toBeCloseTo(0.32 * narrow.scales.slotWidth, 10);
  });

  it("small dots: one per sample, each at its exact y, inside the bell", () => {
    for (const drift of [false, true]) {
      const { model, scales } = build(commute, { drift });
      for (const [i, d] of commute.entries()) {
        const j = model.jets[i];
        expect(j.dots).toHaveLength(d.samples!.length);
        expect(j.samples).toEqual([...d.samples!].sort((a, b) => a - b));
        const bell = {
          cx: j.x,
          yTop: j.bell!.top,
          yBottom: j.bell!.bottom,
          half: j.bell!.half,
          drift,
        };
        const pts = bellOutline(bell);
        for (const dot of j.dots) {
          expect(dot.y).toBe(scales.yScale(dot.value));
          // Its disc within half the outline's stroke, or as close as its row allows.
          expect(outsideBy(pts, dot)).toBeNull();
          expect(dot.r).toBeGreaterThan(0);
        }
      }
    }
  });

  it("big dot: at the value on the stem, solid", () => {
    const { model, scales } = build(commute);
    const b = model.jets[1].bigDot;
    expect(b.x).toBe(model.jets[1].x);
    expect(b.y).toBe(scales.yScale(35));
    expect(b.r).toBeGreaterThan(model.jets[1].dots[0].r);
    expect(b.hollow).toBe(false);
  });

  it("forecast: dashed stem and outline, hollow big dot, no small dots", () => {
    const { model } = build([{ ...car, forecast: true }]);
    const j = model.jets[0];
    expect(j.forecast).toBe(true);
    expect(j.stem.dashed).toBe(true);
    expect(j.bell!.dashed).toBe(true);
    expect(j.bigDot.hollow).toBe(true);
    expect(j.dots).toEqual([]);
    expect(j.bell!.half).toBe(fountainHalfWidth(0, 1000));
  });

  it("value only: stem and big dot, no bell", () => {
    const { model } = build([{ label: "A", value: 12 }]);
    expect(model.jets[0].bell).toBeNull();
    expect(model.jets[0].dots).toEqual([]);
  });

  it("negative values: the stem runs down from the baseline, the bell stays narrow at high", () => {
    const { model, scales } = build([
      { label: "Loss", value: -20, low: -35, high: -5, samples: [-35, -20, -5] },
    ]);
    const j = model.jets[0];
    expect(j.stem.y0).toBe(scales.yScale(0));
    expect(j.stem.y1).toBeGreaterThan(j.stem.y0);
    expect(j.bell!.top).toBe(scales.yScale(-5));
    const tip = j.bell!.points.find((p) => p[1] === j.bell!.top)!;
    expect(tip[0]).toBeCloseTo(j.x, 10);
  });
});

describe("render model: switches", () => {
  it("showRange false: stem and big dot only", () => {
    const { model } = build(commute, { showRange: false });
    for (const j of model.jets) {
      expect(j.bell).toBeNull();
      expect(j.dots).toEqual([]);
      expect(j.valueLabels.map((l) => l.kind)).toEqual(["usual"]);
    }
  });

  it("showSamples false: the fountain without small dots (and no wider for them)", () => {
    const { model, scales } = build(commute, { showSamples: false });
    expect(model.jets[0].dots).toEqual([]);
    expect(model.jets[0].bell!.half).toBe(fountainHalfWidth(0, scales.slotWidth));
  });

  it("drift leans the tip right and pushes the painted right edge out", () => {
    const off = build(commute).model.jets[0];
    const on = build(commute, { drift: true }).model.jets[0];
    const tipX = (j: typeof on) => j.bell!.points.find((p) => p[1] === j.bell!.top)![0];
    expect(tipX(off)).toBeCloseTo(off.x, 10);
    expect(tipX(on)).toBeGreaterThan(on.x);
    expect(on.painted.x1).toBeGreaterThan(off.painted.x1);
  });

  it("value labels on by default, [] when off", () => {
    const { model } = build(commute, { referenceLines: [allow], endLabels: ["best", "worst"] });
    expect(model.jets[0].valueLabels.map((l) => l.text)).toEqual([
      "usual 30",
      "best 22",
      "worst 55",
      "17 of 20",
      "within 45 min",
    ]);
    expect(build(commute, { showValueLabels: false }).model.jets[0].valueLabels).toEqual([]);
  });

  it('value labels add "only N <sampleWord>" under 10 samples', () => {
    const { model } = build([{ label: "Guess", value: 40, samples: [33, 37, 40, 45, 52] }], {
      sampleWord: "days",
    });
    expect(model.jets[0].valueLabels.map((l) => l.text)).toContain("only 5 days");
  });

  it("highlightItems dims the others", () => {
    const { model } = build(commute, { highlightItems: ["Train"] });
    expect(model.jets.map((j) => j.dimmed)).toEqual([true, false]);
  });

  it("reading guide: null by default, the default line for true", () => {
    expect(build(commute).model.readingGuide).toBeNull();
    expect(build(commute, { readingGuide: true }).model.readingGuide).toContain("Small dot");
  });

  it("reading guide: names only the marks drawn, after the y-domain clip", () => {
    // Every sample and both ranges are over 20: no small dot, no fountain.
    const clipped = build(commute, { readingGuide: true, yAxisDomain: [0, 20] }).model;
    expect(clipped.jets.map((j) => [j.bell, j.dots.length])).toEqual([
      [null, 0],
      [null, 0],
    ]);
    expect(clipped.readingGuide).toBe("Big dot = the usual one");
    // Up to 30: the Car's fountain and its lower small dots still show.
    const some = build(commute, { readingGuide: true, yAxisDomain: [0, 30] }).model;
    expect(some.jets[0].dots.length).toBeGreaterThan(0);
    expect(some.readingGuide).toContain("Small dot");
    expect(some.readingGuide).toContain("Tall fountain");
  });
});

describe("render model: reference lines and counts", () => {
  it("each line at y(value) across the plot with its label; counts per jet", () => {
    const { model, scales } = build(commute, { referenceLines: [allow, { value: 10 }] });
    expect(model.referenceLines).toEqual([
      {
        value: 45,
        y: scales.yScale(45),
        label: "Time I allow",
        x0: MARGIN.left,
        x1: 800 - MARGIN.right,
        goodSide: "below",
        countLabel: "within 45 min",
      },
      {
        value: 10,
        y: scales.yScale(10),
        label: undefined,
        x0: MARGIN.left,
        x1: 800 - MARGIN.right,
      },
    ]);
    expect(model.jets.map((j) => j.referenceCounts.map((c) => `${c.count}/${c.total}`))).toEqual([
      ["17/20"],
      ["20/20"],
    ]);
  });

  it("a line outside a user yAxisDomain is left out (it would lie at the edge)", () => {
    const { model } = build(commute, { referenceLines: [{ value: 500 }], yAxisDomain: [0, 100] });
    expect(model.referenceLines).toEqual([]);
  });
});

describe("render model: clamping to a user yAxisDomain", () => {
  it("clamps the stem, big dot and bell to the plot; drops dots outside it", () => {
    const { model, scales } = build(
      [{ label: "Over", value: 250, low: 20, high: 300, samples: [20, 90, 150, 250, 300] }],
      { yAxisDomain: [0, 200] },
    );
    const j = model.jets[0];
    expect(j.bigDot.y).toBe(scales.plot.top);
    expect(j.stem.y1).toBe(scales.plot.top);
    expect(j.bell!.top).toBe(scales.plot.top);
    expect(j.dots.map((d) => d.value)).toEqual([20, 90, 150]);
  });
});

describe("render model: a user yAxisDomain without 0", () => {
  it("stems and the lake sit on the plot bottom when 0 is below the domain", () => {
    const { model, scales } = build(commute, { yAxisDomain: [20, 60] });
    expect(model.baselineY).toBe(scales.plot.bottom);
    expect(model.lake.y).toBe(scales.plot.bottom);
    for (const j of model.jets) expect(j.stem.y0).toBe(scales.plot.bottom);
  });
});

describe("render model: colours (audit fountain #9)", () => {
  const abc: FountainDataItem[] = [
    { label: "A", value: 1 },
    { label: "B", value: 2 },
    { label: "C", value: 3 },
  ];

  it("disabling a jet never recolours the others", () => {
    const all = build(abc).model.jets;
    const without = build(abc, { disabledItems: ["B"] }).model.jets;
    expect(without.map((j) => j.label)).toEqual(["A", "C"]);
    expect(without.map((j) => j.color)).toEqual([all[0].color, all[2].color]);
    expect(without[1].color).toBe(P[2]);
  });

  it("per-item colour is honoured and colorsMapping wins over it", () => {
    const data: FountainDataItem[] = [
      { label: "Water", value: 1, color: "gold" },
      { label: "Air", value: 2, color: "pink" },
    ];
    const { model } = build(data, { colorsMapping: { Air: "navy" } });
    expect(model.jets.map((j) => j.color)).toEqual(["gold", "navy"]);
  });

  it("carries the data-label hook", () => {
    const { model } = build([{ label: "Jet d'Eau", value: 1 }]);
    expect(model.jets[0].safe).toBe(sanitizeForClassName("Jet d'Eau"));
  });
});

describe("render model: trend", () => {
  const trend: FountainDataItem[] = [
    { label: "Flow", value: 95, low: 80, high: 110, date: 2003 },
    { label: "Flow", value: 50, low: 40, high: 60, date: 2001 },
    { label: "Flow", value: 70, low: 60, high: 85, date: 2002, forecast: true },
  ];

  it("trend line through the big dots, left to right; on by default in trend mode", () => {
    const { model } = build(trend, { xAxisDataType: "number" });
    const expected = [...model.jets]
      .sort((a, b) => a.x - b.x)
      .map((j) => ({ x: j.bigDot.x, y: j.bigDot.y }));
    expect(model.trendLine).toEqual(expected);
    expect(
      build(trend, { xAxisDataType: "number", showTrendLine: false }).model.trendLine,
    ).toBeNull();
  });

  it("several series: no trend line by default (one line would zig-zag between them)", () => {
    const two: FountainDataItem[] = [
      ...trend,
      { label: "Rain", value: 20, low: 10, high: 30, date: 2001 },
      { label: "Rain", value: 25, low: 15, high: 35, date: 2002 },
    ];
    expect(build(two, { xAxisDataType: "number" }).model.trendLine).toBeNull();
    expect(
      build(two, { xAxisDataType: "number", showTrendLine: true }).model.trendLine,
    ).toHaveLength(5);
  });

  it("snapshot: no trend line unless asked for", () => {
    expect(build(commute).model.trendLine).toBeNull();
    expect(build(commute, { showTrendLine: true }).model.trendLine).toHaveLength(2);
  });

  it("periods carry the painted right edge of their jets (the timeline's revealPx)", () => {
    const { model } = build(trend, { xAxisDataType: "number" });
    expect(model.periods.map((p) => p.date)).toEqual([2001, 2002, 2003]);
    for (const p of model.periods) {
      const at = model.jets.filter((j) => j.x === p.x);
      expect(p.revealPx).toBe(Math.max(...at.map((j) => j.painted.x1)));
      expect(p.revealPx).toBeGreaterThan(p.x);
    }
    expect(build(commute).model.periods).toEqual([]);
  });

  it("slots tile the plot; the painted box covers every mark", () => {
    const { model } = build(commute, { drift: true });
    for (const j of model.jets) {
      expect(j.slot.x1 - j.slot.x0).toBeCloseTo(model.slotWidth, 10);
      const xs = [...j.bell!.points.map((p) => p[0]), ...j.dots.map((d) => d.x + d.r)];
      expect(j.painted.x1).toBeGreaterThanOrEqual(Math.max(...xs) - 1e-9);
      expect(j.painted.y0).toBeLessThanOrEqual(j.bell!.top);
      expect(j.painted.y1).toBeGreaterThanOrEqual(j.stem.y0);
    }
  });
});
