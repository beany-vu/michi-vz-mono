// Diverging stacks: positive values stack up from 0 and negative values stack
// down from 0 (d3's stackOffsetDiverging, Highcharts' default for stacked
// columns). Before this, a negative segment was clamped to height 0 and the
// y-domain used each column's NET total, so mixed-sign data drew wrongly.
import { describe, it, expect } from "vitest";
import { computeYDomain, collectDates } from "../src/verticalStackBarChart/data";
import {
  createHorizontalStackScales,
  createStackScales,
} from "../src/verticalStackBarChart/scales";
import { buildStackColors } from "../src/verticalStackBarChart/colors";
import {
  prepareStackedData,
  prepareStackedDataHorizontal,
} from "../src/verticalStackBarChart/stack";
import type { VerticalStackBarDataSet } from "../src/types";

const keys = ["a", "b", "c"];
const dataSet: VerticalStackBarDataSet[] = [
  { seriesKey: "S", series: [{ date: "2024", a: 10, b: -4, c: 5 }] },
];
const margin = { top: 20, right: 20, bottom: 40, left: 40 };
const opts = {
  keysOrder: "bottomToTop" as const,
  minBarWidth: 5,
  minBarHeight: 0,
  minBarHeightZero: 0,
};

describe("computeYDomain (diverging)", () => {
  it("spans the sum of negatives to the sum of positives, not the net total", () => {
    expect(computeYDomain(dataSet, keys)).toEqual([-4, 15]);
  });

  it("all-positive data is unchanged", () => {
    const pos: VerticalStackBarDataSet[] = [
      { seriesKey: "S", series: [{ date: "2024", a: 3, b: 4 }] },
    ];
    expect(computeYDomain(pos, ["a", "b"])).toEqual([0, 7]);
  });
});

describe("prepareStackedData (vertical, diverging)", () => {
  const dates = collectDates(dataSet);
  const scales = createStackScales(dates, computeYDomain(dataSet, keys), 600, 400, margin);
  const { stackedData } = prepareStackedData(dataSet, keys, scales, buildStackColors(keys), opts);
  const y = scales.yScale;
  const rect = (k: string) => stackedData[k][0];

  it("stacks positives upward from 0 in key order, skipping the negative", () => {
    // bottomToTop: a sits on 0, c sits on a (b is negative, so it does not lift c)
    expect(rect("a").y).toBeCloseTo(y(10));
    expect(rect("a").y + rect("a").height).toBeCloseTo(y(0));
    expect(rect("c").y).toBeCloseTo(y(15));
    expect(rect("c").y + rect("c").height).toBeCloseTo(y(10));
  });

  it("draws the negative downward from 0 with its real height", () => {
    expect(rect("b").y).toBeCloseTo(y(0));
    expect(rect("b").height).toBeCloseTo(y(-4) - y(0));
    expect(rect("b").height).toBeGreaterThan(0);
    expect(rect("b").value).toBe(-4);
  });

  it("stacks several negatives downward one below the other", () => {
    const ds: VerticalStackBarDataSet[] = [
      { seriesKey: "S", series: [{ date: "2024", a: -2, b: -3 }] },
    ];
    const k = ["a", "b"];
    const s = createStackScales(collectDates(ds), computeYDomain(ds, k), 600, 400, margin);
    const { stackedData: sd } = prepareStackedData(ds, k, s, buildStackColors(k), opts);
    expect(sd.a[0].y).toBeCloseTo(s.yScale(0));
    expect(sd.a[0].y + sd.a[0].height).toBeCloseTo(s.yScale(-2));
    expect(sd.b[0].y).toBeCloseTo(s.yScale(-2));
    expect(sd.b[0].y + sd.b[0].height).toBeCloseTo(s.yScale(-5));
  });
});

describe("prepareStackedDataHorizontal (diverging)", () => {
  const dates = collectDates(dataSet);
  const scales = createHorizontalStackScales(
    dates,
    computeYDomain(dataSet, keys),
    600,
    400,
    margin,
  );
  // horizontal: keysOrder "topToBottom" puts keys[0] nearest the axis
  const { stackedData } = prepareStackedDataHorizontal(
    dataSet,
    keys,
    scales,
    buildStackColors(keys),
    {
      ...opts,
      keysOrder: "topToBottom",
    },
  );
  const x = scales.xScale;
  const rect = (k: string) => stackedData[k][0];

  it("positives grow right from 0, the negative grows left from 0", () => {
    expect(rect("a").x).toBeCloseTo(x(0));
    expect(rect("a").x + rect("a").width).toBeCloseTo(x(10));
    expect(rect("c").x).toBeCloseTo(x(10));
    expect(rect("c").x + rect("c").width).toBeCloseTo(x(15));
    expect(rect("b").x).toBeCloseTo(x(-4));
    expect(rect("b").x + rect("b").width).toBeCloseTo(x(0));
  });
});
