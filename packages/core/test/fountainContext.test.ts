import { describe, it, expect } from "vitest";
import {
  buildFountainContext,
  type BuildFountainContextInput,
} from "../src/context/buildFountainContext";
import { resolveFountainData } from "../src/fountainChart/data";
import { buildFountainColors } from "../src/fountainChart/colors";
import { resolveFountainWords } from "../src/fountainChart/labels";
import type {
  FountainChartContext,
  FountainDataItem,
  FountainReferenceLine,
  FountainXAxisType,
} from "../src/types";

const allow: FountainReferenceLine = {
  value: 45,
  label: "Time I allow",
  goodSide: "below",
  countLabel: "within 45 min",
};
const car: FountainDataItem = {
  label: "Car",
  code: "CAR",
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

function ctx(
  data: FountainDataItem[],
  o: {
    xAxisDataType?: FountainXAxisType;
    disabledItems?: string[];
    referenceLines?: FountainReferenceLine[];
    endLabels?: [string, string];
    title?: string;
    extra?: Partial<BuildFountainContextInput>;
  } = {},
): FountainChartContext {
  const r = resolveFountainData(data, {
    xAxisDataType: o.xAxisDataType,
    disabledItems: o.disabledItems,
  });
  const colors = buildFountainColors(data, ["#111111", "#222222", "#333333"]);
  return buildFountainContext({
    title: o.title,
    renderer: "svg",
    mode: r.mode,
    xAxisType: r.mode === "trend" ? r.temporalType! : "band",
    jets: r.jets,
    allLabels: r.allLabels,
    labels: r.labels,
    disabledItems: o.disabledItems,
    xDomain: r.xDomain,
    yAxisDomain: [0, 80],
    colorsMapping: colors.generatedColorsMapping,
    colorOf: colors.colorOf,
    referenceLines: o.referenceLines,
    words: resolveFountainWords({ endLabels: o.endLabels }),
    ...o.extra,
  });
}

describe("FountainJetContext", () => {
  it("value, low, high, range, rangeRatio, sampleCount, referenceCounts", () => {
    const j = ctx([car], { referenceLines: [allow] }).jets[0];
    expect(j).toMatchObject({
      label: "Car",
      code: "CAR",
      color: "#111111",
      value: 30,
      low: 22,
      high: 55,
      range: 33,
      rangeRatio: 1.1,
      sampleCount: 20,
      referenceCounts: [
        { value: 45, goodSide: "below", count: 17, total: 20, countLabel: "within 45 min" },
      ],
      predicted: false,
      xPosition: null,
    });
  });

  it("deprecated aliases: spread = half the range, spreadRatio, upperBound = high, lean null", () => {
    const j = ctx([car]).jets[0];
    expect(j.spread).toBe(16.5);
    expect(j.spreadRatio).toBe(0.55);
    expect(j.upperBound).toBe(55);
    expect(j.lean).toBeNull();
  });

  it("no range: nulls, spread 0, upperBound = value", () => {
    const j = ctx([{ label: "A", value: 7 }]).jets[0];
    expect([j.low, j.high, j.range, j.rangeRatio]).toEqual([null, null, null, null]);
    expect(j.spread).toBe(0);
    expect(j.spreadRatio).toBe(0);
    expect(j.upperBound).toBe(7);
    expect(j.sampleCount).toBe(0);
  });

  it("rangeRatio is null for a value of 0, and uses |value| for negatives", () => {
    const [zero, neg] = ctx([
      { label: "Zero", value: 0, low: -5, high: 5 },
      { label: "Neg", value: -20, low: -30, high: -10 },
    ]).jets;
    expect(zero.rangeRatio).toBeNull();
    expect(zero.spreadRatio).toBe(0);
    expect(neg.rangeRatio).toBe(1);
  });

  it("forecast jets: predicted, no reference counts; trend xPosition is the raw date", () => {
    const j = ctx([{ ...car, forecast: true, date: 2024 }], {
      xAxisDataType: "number",
      referenceLines: [allow],
    }).jets[0];
    expect(j.predicted).toBe(true);
    expect(j.referenceCounts).toEqual([]);
    expect(j.xPosition).toBe(2024);
  });

  it("per-item colour is reported per jet", () => {
    const j = ctx([{ label: "A", value: 1, color: "gold" }]).jets[0];
    expect(j.color).toBe("gold");
  });
});

describe("stats", () => {
  it("tallest, widestRange, frothiest (deprecated), valueRange, predictedCount", () => {
    const c = ctx([car, bus, { label: "Train", value: 35, low: 32, high: 42, forecast: true }]);
    expect(c.stats.jetCount).toBe(3);
    expect(c.stats.tallest).toEqual({ label: "Bus", value: 40 });
    expect(c.stats.widestRange).toEqual({ label: "Car", range: 33 });
    expect(c.stats.frothiest).toEqual({ label: "Car", spreadRatio: 0.55 });
    expect(c.stats.valueRange).toEqual([30, 40]);
    expect(c.stats.predictedCount).toBe(1);
    expect(c.stats.trendSlope).toBeNull();
  });

  it("no ranges at all: widestRange and frothiest are null", () => {
    const c = ctx([{ label: "A", value: 1 }]);
    expect(c.stats.widestRange).toBeNull();
    expect(c.stats.frothiest).toBeNull();
  });

  it("trend slope is fitted over x (not the input order) for one series", () => {
    const c = ctx(
      [
        { label: "S", value: 30, date: 2004 },
        { label: "S", value: 10, date: 2000 },
        { label: "S", value: 20, date: 2002 },
      ],
      { xAxisDataType: "number" },
    );
    expect(c.stats.trendSlope).toBe(5);
    const annual = ctx(
      [
        { label: "S", value: 30, date: 2004 },
        { label: "S", value: 10, date: 2000 },
      ],
      { xAxisDataType: "date_annual" },
    );
    expect(annual.stats.trendSlope).toBe(5);
  });

  it("trend slope is null when several series share the chart", () => {
    const c = ctx(
      [
        { label: "A", value: 1, date: 2000 },
        { label: "B", value: 9, date: 2001 },
      ],
      { xAxisDataType: "number" },
    );
    expect(c.stats.trendSlope).toBeNull();
  });
});

describe("summary (plain words)", () => {
  it("snapshot: the highest usual value and the widest range", () => {
    const s = ctx([car, bus], { title: "Commute" }).summary;
    expect(s).toBe(
      'Fountain chart "Commute" with 2 jets. Highest usual value: Bus at 40. Widest range: Car, from 22 to 55.',
    );
  });

  it("one jet: usual, range and how many measurements", () => {
    expect(ctx([car]).summary).toBe(
      "Fountain chart for Car: usual 30, from 22 to 55, 20 measurements.",
    );
  });

  it("one jet: the measurements are named with the chart's sampleWord", () => {
    const words = resolveFountainWords({ sampleWord: "days" });
    expect(ctx([car], { extra: { words } }).summary).toBe(
      "Fountain chart for Car: usual 30, from 22 to 55, 20 days.",
    );
  });

  it("trend: direction over the periods and the peak's period", () => {
    const s = ctx(
      [
        { label: "Flow", value: 50, low: 40, high: 60, date: 2001 },
        { label: "Flow", value: 95, low: 80, high: 110, date: 2003 },
        { label: "Flow", value: 70, low: 60, high: 85, date: 2002 },
      ],
      { xAxisDataType: "number", extra: { formatPeriod: (j) => `year ${j.date}` } },
    ).summary;
    expect(s).toBe(
      "Fountain chart over 3 periods: rising. Peak 95 (Flow, year 2003). Widest range: Flow (year 2003), from 80 to 110.",
    );
  });

  it("no jets", () => {
    expect(ctx([]).summary).toBe("Fountain chart with no jets.");
  });
});

describe("a11yTable", () => {
  it("snapshot: Label, Usual, the end words, Samples and one column per counted line", () => {
    const c = ctx([car, { label: "Taxi", value: 25 }], {
      referenceLines: [allow, { value: 60 }],
      endLabels: ["best", "worst"],
    });
    expect(c.a11yTable.headers).toEqual([
      "Label",
      "Usual",
      "best",
      "worst",
      "Samples",
      "within 45 min",
    ]);
    expect(c.a11yTable.rows).toEqual([
      ["Car", 30, 22, 55, 20, "17 of 20"],
      ["Taxi", 25, "", "", 0, ""],
    ]);
  });

  it("trend: a Period column first, rows ordered by x, forecast marked in the label", () => {
    const c = ctx(
      [
        { label: "Flow", value: 95, date: 2003, forecast: true },
        { label: "Flow", value: 50, date: 2001 },
      ],
      { xAxisDataType: "number" },
    );
    expect(c.a11yTable.headers.slice(0, 3)).toEqual(["Period", "Label", "Usual"]);
    expect(c.a11yTable.rows.map((r) => r.slice(0, 3))).toEqual([
      ["2001", "Flow", 50],
      ["2003", "Flow (forecast)", 95],
    ]);
  });
});

describe("legendData and axes", () => {
  it("snapshot: every label keeps its slot; disabled ones are flagged", () => {
    const c = ctx(
      [
        { label: "A", value: 1 },
        { label: "B", value: 2 },
        { label: "C", value: 3 },
      ],
      { disabledItems: ["B"] },
    );
    expect(c.legendData!.map((l) => [l.label, l.disabled, l.color])).toEqual([
      ["A", false, "#111111"],
      ["B", true, "#222222"],
      ["C", false, "#333333"],
    ]);
    expect(c.jets.map((j) => j.label)).toEqual(["A", "C"]);
    expect(c.xAxis).toEqual({ type: "band", domain: ["A", "C"] });
  });

  it("trend: a legend only when there is more than one series", () => {
    const one = ctx(
      [
        { label: "S", value: 1, date: 2000 },
        { label: "S", value: 2, date: 2001 },
      ],
      { xAxisDataType: "number" },
    );
    expect(one.legendData).toBeUndefined();
    expect(one.xAxis).toEqual({ type: "number", domain: [2000, 2001] });
    const two = ctx(
      [
        { label: "A", value: 1, date: 2000 },
        { label: "B", value: 2, date: 2001 },
      ],
      { xAxisDataType: "number" },
    );
    expect(two.legendData!.map((l) => l.label)).toEqual(["A", "B"]);
  });

  it("yAxis.domain is what the axis shows (passed in, niced)", () => {
    expect(ctx([car]).yAxis.domain).toEqual([0, 80]);
  });
});
