// Pure-layer tests ported from the legacy michi-vz suite (detectGaps.test.ts +
// lttb.test.ts) — the regression net for the verbatim-moved LineChart logic.
import { describe, it, test, expect } from "vitest";
import { applyGapDetection, parseAxisUnit } from "../src/lineChart/detectGaps";
import { lttb } from "../src/lineChart/lttb";
import { getXScaleDomain, getYScaleDomain, parseXValue } from "../src/lineChart/lineUtils";
import type { DataPoint } from "../src/types";

const pt = (date: number | string, value: number, certainty = true): DataPoint => ({
  date,
  value,
  certainty,
});
const certaintyOf = (s: DataPoint[]) => s.map((d) => d.certainty);
const datesOf = (s: DataPoint[]) => s.map((d) => d.date);

describe("parseAxisUnit", () => {
  it("parses number, annual, and monthly into comparable units", () => {
    expect(parseAxisUnit(2018, "number")).toBe(2018);
    expect(parseAxisUnit("2018", "date_annual")).toBe(2018);
    expect(parseAxisUnit(2018, "date_annual")).toBe(2018);
    expect(parseAxisUnit("2020-03", "date_monthly")).toBe(2020 * 12 + 2);
  });
  it("returns NaN for unparseable input", () => {
    expect(Number.isNaN(parseAxisUnit("abc", "number"))).toBe(true);
    expect(Number.isNaN(parseAxisUnit("nope", "date_monthly"))).toBe(true);
  });
});

describe("applyGapDetection", () => {
  it("marks a skipped annual period as a gap on the closing point", () => {
    const s = [pt(2016, 10), pt(2017, 20), pt(2018, 30), pt(2024, 40)];
    const out = applyGapDetection(s, "date_annual");
    expect(certaintyOf(out)).toEqual([true, true, true, false]);
    expect(datesOf(out)).toEqual([2016, 2017, 2018, 2024]);
  });
  it("leaves a contiguous annual series fully certain", () => {
    const s = [pt(2016, 10), pt(2017, 20), pt(2018, 30)];
    expect(certaintyOf(applyGapDetection(s, "date_annual"))).toEqual([true, true, true]);
  });
  it("detects a monthly gap across a year boundary", () => {
    const s = [pt("2019-11", 1), pt("2019-12", 2), pt("2020-03", 3)];
    expect(certaintyOf(applyGapDetection(s, "date_monthly"))).toEqual([true, true, false]);
  });
  it("uses expectedStep for numeric x", () => {
    const s = [pt(0, 1), pt(1, 2), pt(5, 3)];
    expect(certaintyOf(applyGapDetection(s, "number", 1))).toEqual([true, true, false]);
  });
  it("respects a biennial expectedStep override (delta 2 not a gap)", () => {
    const s = [pt(2016, 1), pt(2018, 2), pt(2020, 3)];
    expect(certaintyOf(applyGapDetection(s, "date_annual", 2))).toEqual([true, true, true]);
  });
  it("ignores a non-positive expectedStep and falls back to the axis default", () => {
    const s = [pt(2016, 10), pt(2017, 20), pt(2024, 30)];
    expect(certaintyOf(applyGapDetection(s, "date_annual", 0))).toEqual([true, true, false]);
  });
  it("normalizes unsorted input by axis x", () => {
    const s = [pt(2018, 30), pt(2016, 10), pt(2017, 20)];
    expect(datesOf(applyGapDetection(s, "date_annual"))).toEqual([2016, 2017, 2018]);
  });
  it("dedupes equal x keeping the last occurrence", () => {
    const s = [pt(2016, 10), pt(2016, 99), pt(2017, 20)];
    const out = applyGapDetection(s, "date_annual");
    expect(datesOf(out)).toEqual([2016, 2017]);
    expect(out[0].value).toBe(99);
  });
  it("drops invalid x and NaN-value points", () => {
    const s = [
      pt(2016, 10),
      pt("bad", 20),
      { date: 2017, value: NaN, certainty: true } as DataPoint,
      pt(2018, 30),
    ];
    expect(datesOf(applyGapDetection(s, "date_annual"))).toEqual([2016, 2018]);
  });
  it("gap detection overrides an explicit certainty:true", () => {
    const s = [pt(2016, 10), pt(2024, 20, true)];
    expect(certaintyOf(applyGapDetection(s, "date_annual"))).toEqual([true, false]);
  });
  it("never flips an explicit certainty:false to certain", () => {
    const s = [pt(2016, 10), pt(2017, 20, false)];
    expect(certaintyOf(applyGapDetection(s, "date_annual"))).toEqual([true, false]);
  });
  it("handles single and empty series", () => {
    expect(applyGapDetection([pt(2016, 10)], "date_annual").length).toBe(1);
    expect(applyGapDetection([], "date_annual")).toEqual([]);
  });
});

const getX = (d: DataPoint): number => d.date as number;
const getY = (d: DataPoint): number => d.value;
const makeSeries = (n: number): DataPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    date: i,
    value: Math.sin(i / 5) * 100 + (i % 7),
    certainty: true,
  }));

describe("lttb", () => {
  test("returns the same array reference when length <= threshold", () => {
    const points = makeSeries(50);
    expect(lttb(points, 100, getX, getY)).toBe(points);
    expect(lttb(points, 50, getX, getY)).toBe(points);
  });
  test("returns the same array reference when threshold < 3", () => {
    const points = makeSeries(50);
    expect(lttb(points, 2, getX, getY)).toBe(points);
    expect(lttb(points, 0, getX, getY)).toBe(points);
  });
  test("downsamples a large series to exactly threshold points", () => {
    expect(lttb(makeSeries(1000), 200, getX, getY).length).toBe(200);
  });
  test("always keeps the first and last point", () => {
    const points = makeSeries(1000);
    const result = lttb(points, 100, getX, getY);
    expect(result[0]).toBe(points[0]);
    expect(result[result.length - 1]).toBe(points[points.length - 1]);
  });
  test("returns only original DataPoint objects (identity preserved)", () => {
    const points = makeSeries(800);
    const originals = new Set(points);
    expect(lttb(points, 120, getX, getY).every((p) => originals.has(p))).toBe(true);
  });
  test("keeps a sharp peak rather than dropping it", () => {
    const points: DataPoint[] = Array.from({ length: 500 }, (_, i) => ({
      date: i,
      value: i === 250 ? 9999 : 0,
      certainty: true,
    }));
    expect(lttb(points, 20, getX, getY).some((p) => p.value === 9999)).toBe(true);
  });
});

describe("scale-domain helpers", () => {
  it("parseXValue maps by axis type", () => {
    expect(parseXValue(5, "number")).toBe(5);
    expect((parseXValue(2020, "date_annual") as Date).getFullYear()).toBe(2020);
  });
  it("getYScaleDomain / getXScaleDomain scan all series, falling back to [0,1]", () => {
    const ds = [
      { label: "A", series: [pt(2016, 5), pt(2017, 20)] },
      { label: "B", series: [pt(2016, -3), pt(2018, 9)] },
    ];
    expect(getYScaleDomain(ds)).toEqual([-3, 20]);
    expect(getXScaleDomain(ds, "number")).toEqual([2016, 2018]);
    expect(getYScaleDomain([])).toEqual([0, 1]);
  });
});
