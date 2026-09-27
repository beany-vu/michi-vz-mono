import { describe, it, expect } from "vitest";
import { resolveFountainData, fountainMedian, isFountainForecast } from "../src/fountainChart/data";
import type { FountainDataItem } from "../src/types";

const resolve = (data: FountainDataItem[], opts: Parameters<typeof resolveFountainData>[1] = {}) =>
  resolveFountainData(data, opts);
const types = (r: ReturnType<typeof resolve>) => r.warnings.map((w) => w.type);

describe("fountainMedian", () => {
  it("odd count: the middle value; even count: the mean of the two middles", () => {
    expect(fountainMedian([5, 1, 3])).toBe(3);
    expect(fountainMedian([4, 1, 3, 2])).toBe(2.5);
    expect(fountainMedian([7])).toBe(7);
  });
});

describe("resolveFountainData: range precedence (low/high > spread > samples)", () => {
  it("explicit low/high win over spread and samples", () => {
    const r = resolve([{ label: "A", value: 30, low: 20, high: 50, spread: 2, samples: [25, 35] }]);
    const j = r.jets[0];
    expect([j.low, j.high]).toEqual([20, 50]);
    expect(j.rangeSource).toBe("low-high");
    expect(r.warnings).toEqual([]);
  });

  it("spread gives an even range around the value when low/high are absent", () => {
    const j = resolve([{ label: "A", value: 30, spread: 5, samples: [28, 31] }]).jets[0];
    expect([j.low, j.high]).toEqual([25, 35]);
    expect(j.rangeSource).toBe("spread");
  });

  it("samples give [min, max] when there is no explicit range", () => {
    const j = resolve([{ label: "A", value: 30, samples: [31, 22, 55, 29] }]).jets[0];
    expect([j.low, j.high]).toEqual([22, 55]);
    expect(j.rangeSource).toBe("samples");
    expect(j.samples).toEqual([22, 29, 31, 55]);
  });

  it("value only: no range, no fountain", () => {
    const j = resolve([{ label: "A", value: 30 }]).jets[0];
    expect(j.low).toBeNull();
    expect(j.high).toBeNull();
    expect(j.rangeSource).toBeNull();
  });

  it("one explicit end: the other comes from spread, then samples, then the value", () => {
    const fromSamples = resolve([{ label: "A", value: 30, high: 55, samples: [22, 30, 40] }]);
    expect([fromSamples.jets[0].low, fromSamples.jets[0].high]).toEqual([22, 55]);
    expect(fromSamples.warnings).toEqual([]);
    const fromSpread = resolve([{ label: "A", value: 30, low: 10, spread: 5 }]).jets[0];
    expect([fromSpread.low, fromSpread.high]).toEqual([10, 35]);
    const fromValue = resolve([{ label: "A", value: 30, low: 10 }]).jets[0];
    expect([fromValue.low, fromValue.high]).toEqual([10, 30]);
  });
});

describe("resolveFountainData: value", () => {
  it("falls back to the median of the samples when value is missing (no warning)", () => {
    const r = resolve([
      { label: "A", samples: [10, 30, 20] },
      { label: "B", value: null as unknown as number, samples: [1, 2, 3, 4] },
    ]);
    expect(r.jets.map((j) => j.value)).toEqual([20, 2.5]);
    expect(r.jets.every((j) => j.valueFromSamples)).toBe(true);
    expect(r.warnings).toEqual([]);
  });

  it("a non-finite value with samples uses the median and warns", () => {
    const r = resolve([{ label: "A", value: NaN, samples: [1, 2, 3] }]);
    expect(r.jets[0].value).toBe(2);
    expect(types(r)).toEqual(["non-finite-value"]);
  });

  it("a missing or non-finite value with no samples skips the jet and warns", () => {
    const r = resolve([
      { label: "Null", value: null as unknown as number, low: 1, high: 2 },
      { label: "Undef" },
      { label: "NaN", value: NaN },
      { label: "Inf", value: Infinity },
      { label: "Ok", value: 5 },
    ]);
    expect(r.jets.map((j) => j.label)).toEqual(["Ok"]);
    expect(r.warnings.filter((w) => w.type === "non-finite-value").map((w) => w.label)).toEqual([
      "Null",
      "Undef",
      "NaN",
      "Inf",
    ]);
  });

  it("drops non-finite samples with one warning per item", () => {
    const r = resolve([
      { label: "A", value: 3, samples: [1, NaN, 2, null as unknown as number, Infinity, 5] },
    ]);
    expect(r.jets[0].samples).toEqual([1, 2, 5]);
    expect(types(r)).toEqual(["non-finite-value"]);
  });

  it("negative values are allowed, ranges included", () => {
    const j = resolve([{ label: "Loss", value: -20, low: -35, high: -5, samples: [-30, -20] }])
      .jets[0];
    expect(j.value).toBe(-20);
    expect([j.low, j.high]).toEqual([-35, -5]);
  });
});

describe("resolveFountainData: ranges that disagree with the data", () => {
  it("a sample outside the explicit range extends it and warns", () => {
    const r = resolve([{ label: "A", value: 30, low: 25, high: 40, samples: [22, 30, 48] }]);
    expect([r.jets[0].low, r.jets[0].high]).toEqual([22, 48]);
    expect(types(r)).toEqual(["sample-outside-range"]);
    expect(r.warnings[0].label).toBe("A");
  });

  it("a sample outside a spread range extends it too", () => {
    const r = resolve([{ label: "A", value: 30, spread: 5, samples: [20, 30] }]);
    expect([r.jets[0].low, r.jets[0].high]).toEqual([20, 35]);
    expect(types(r)).toEqual(["sample-outside-range"]);
  });

  it("a range that excludes the value is extended to include it and warns", () => {
    const r = resolve([{ label: "A", value: 60, low: 20, high: 50 }]);
    expect([r.jets[0].low, r.jets[0].high]).toEqual([20, 60]);
    expect(types(r)).toEqual(["range-excludes-value"]);
  });

  it("low above high is swapped; a negative spread is read as its size", () => {
    const r = resolve([
      { label: "Swapped", value: 30, low: 50, high: 20 },
      { label: "NegSpread", value: 30, spread: -8 },
    ]);
    expect([r.jets[0].low, r.jets[0].high]).toEqual([20, 50]);
    expect([r.jets[1].low, r.jets[1].high]).toEqual([22, 38]);
    expect(r.warnings.map((w) => [w.type, w.label])).toEqual([
      ["inverted-range", "Swapped"],
      ["inverted-range", "NegSpread"],
    ]);
  });
});

describe("resolveFountainData: forecast", () => {
  it("forecast, then the deprecated predicted, then certainty === false", () => {
    expect(isFountainForecast({ label: "a", forecast: true })).toBe(true);
    expect(isFountainForecast({ label: "a", predicted: true })).toBe(true);
    expect(isFountainForecast({ label: "a", certainty: false })).toBe(true);
    expect(isFountainForecast({ label: "a", certainty: true })).toBe(false);
    expect(isFountainForecast({ label: "a", forecast: false, predicted: true })).toBe(false);
    expect(isFountainForecast({ label: "a", predicted: false, certainty: false })).toBe(false);
    expect(isFountainForecast({ label: "a" })).toBe(false);
  });

  it("resolved jets carry the forecast flag", () => {
    const r = resolve([
      { label: "Now", value: 1 },
      { label: "Next", value: 2, predicted: true },
    ]);
    expect(r.jets.map((j) => j.forecast)).toEqual([false, true]);
  });
});

describe("resolveFountainData: disabled items and labels", () => {
  it("disabled jets leave the drawn set but keep their label slot", () => {
    const r = resolve(
      [
        { label: "A", value: 1 },
        { label: "B", value: 2 },
        { label: "C", value: 3 },
        { label: "A", value: 4 },
      ],
      { disabledItems: ["B"] },
    );
    expect(r.jets.map((j) => j.label)).toEqual(["A", "C", "A"]);
    expect(r.labels).toEqual(["A", "C"]);
    expect(r.allLabels).toEqual(["A", "B", "C"]);
    expect(r.all.find((j) => j.label === "B")!.disabled).toBe(true);
  });

  it("an empty or missing dataSet resolves to nothing without throwing", () => {
    expect(resolve([]).jets).toEqual([]);
    expect(resolve(undefined as unknown as FountainDataItem[]).jets).toEqual([]);
  });

  it("carries the source item and its index", () => {
    const data: FountainDataItem[] = [
      { label: "skip", value: NaN },
      { label: "A", value: 1, code: "AA" },
    ];
    const j = resolve(data).jets[0];
    expect(j.item).toBe(data[1]);
    expect(j.index).toBe(1);
    expect(j.code).toBe("AA");
  });
});

describe("resolveFountainData: snapshot vs trend", () => {
  const trend: FountainDataItem[] = [
    { label: "Flow", value: 95, date: 2003 },
    { label: "Flow", value: 50, date: 2001 },
    { label: "Flow", value: 70, date: 2002 },
  ];

  it("band (or omitted) is snapshot; the date is ignored", () => {
    const r = resolve(trend);
    expect(r.mode).toBe("snapshot");
    expect(r.jets.every((j) => j.x === null)).toBe(true);
  });

  it("a temporal axis is trend: parsed x, periods sorted, x domain", () => {
    const r = resolve(trend, { xAxisDataType: "number" });
    expect(r.mode).toBe("trend");
    expect(r.temporalType).toBe("number");
    expect(r.jets.map((j) => j.x)).toEqual([2003, 2001, 2002]);
    expect(r.periods.map((p) => p.x)).toEqual([2001, 2002, 2003]);
    expect(r.xDomain).toEqual([2001, 2003]);
  });

  it("date_annual parses years to epoch ms", () => {
    const r = resolve(trend, { xAxisDataType: "date_annual" });
    expect(r.periods[0].x).toBe(Date.UTC(2001, 0, 1));
  });

  it("trend mode skips an item without a usable date and warns (it does not flip to snapshot)", () => {
    const r = resolve(
      [...trend, { label: "Flow", value: 10 }, { label: "Flow", value: 11, date: "not a date" }],
      { xAxisDataType: "date_monthly" },
    );
    expect(r.mode).toBe("trend");
    expect(r.jets).toHaveLength(3);
    expect(types(r).filter((t) => t === "missing-date")).toHaveLength(2);
  });

  it("warns once per date shared by two jets in trend mode", () => {
    const r = resolve(
      [
        { label: "A", value: 1, date: 2001 },
        { label: "B", value: 2, date: 2001 },
        { label: "C", value: 3, date: 2001 },
        { label: "A", value: 4, date: 2002 },
      ],
      { xAxisDataType: "number" },
    );
    expect(types(r)).toEqual(["duplicate-date"]);
    expect(r.warnings[0].message).toContain("2001");
    expect(r.periods.map((p) => p.x)).toEqual([2001, 2002]);
  });
});
