import { describe, it, expect } from "vitest";
import {
  fountainYDomain,
  buildFountainScales,
  fountainTrendSlot,
  fountainPeriodTicks,
} from "../src/fountainChart/scales";
import { resolveFountainData } from "../src/fountainChart/data";
import type { FountainDataItem, Margin } from "../src/types";

// A NON-default margin, so nothing may lean on the engine's default.
const MARGIN: Margin = { top: 30, right: 110, bottom: 90, left: 75 };
const W = 700;
const H = 400;
const PLOT_W = W - MARGIN.left - MARGIN.right; // 515

describe("fountainYDomain", () => {
  it("includes 0, every value, low and high, with 10% headroom", () => {
    const r = resolveFountainData([
      { label: "A", value: 30, low: 22, high: 55 },
      { label: "B", value: 40, samples: [32, 65] },
    ]);
    expect(fountainYDomain(r.jets)).toEqual([0, 71.5]);
  });

  it("includes the reference lines", () => {
    const r = resolveFountainData([{ label: "A", value: 30, low: 22, high: 55 }]);
    expect(fountainYDomain(r.jets, { referenceLines: [{ value: 100 }] })).toEqual([0, 110]);
  });

  it("goes below 0 for negative data (headroom on that side too)", () => {
    const r = resolveFountainData([{ label: "Loss", value: -20, low: -40, high: -5 }]);
    expect(fountainYDomain(r.jets)).toEqual([-44, 0]);
  });

  it("showRange false: the domain follows the values only", () => {
    const r = resolveFountainData([{ label: "A", value: 30, low: 22, high: 55 }]);
    expect(fountainYDomain(r.jets, { showRange: false })).toEqual([0, 33]);
  });

  it("a user yAxisDomain is used as given", () => {
    const r = resolveFountainData([{ label: "A", value: 500 }]);
    expect(fountainYDomain(r.jets, { yAxisDomain: [50, 200] })).toEqual([50, 200]);
  });

  it("no data gives [0, 1]", () => {
    expect(fountainYDomain([])).toEqual([0, 1]);
  });
});

describe("buildFountainScales: y", () => {
  it("maps the domain onto the plot, niced for the auto domain only", () => {
    const auto = buildFountainScales({
      mode: "snapshot",
      temporalType: null,
      labels: ["A"],
      periods: [],
      yDomain: [0, 71.5],
      yAxisDomainGiven: false,
      width: W,
      height: H,
      margin: MARGIN,
    });
    expect(auto.yScale.domain()).toEqual([0, 80]);
    expect(auto.yScale(0)).toBe(H - MARGIN.bottom);
    expect(auto.yScale(80)).toBe(MARGIN.top);
    expect(auto.plot).toEqual({ left: 75, right: 590, top: 30, bottom: 310 });

    const given = buildFountainScales({
      mode: "snapshot",
      temporalType: null,
      labels: ["A"],
      periods: [],
      yDomain: [0, 71.5],
      yAxisDomainGiven: true,
      width: W,
      height: H,
      margin: MARGIN,
    });
    expect(given.yScale.domain()).toEqual([0, 71.5]);
  });
});

describe("buildFountainScales: snapshot columns", () => {
  it("one column per label, tiling the plot: centres at left + (i + 0.5) * step", () => {
    const s = buildFountainScales({
      mode: "snapshot",
      temporalType: null,
      labels: ["Car", "Train", "Bus", "E-bike"],
      periods: [],
      yDomain: [0, 80],
      width: W,
      height: H,
      margin: MARGIN,
    });
    const step = PLOT_W / 4;
    expect(s.slotWidth).toBeCloseTo(step, 10);
    ["Car", "Train", "Bus", "E-bike"].forEach((label, i) => {
      expect(s.xOf({ label, x: null })).toBeCloseTo(MARGIN.left + (i + 0.5) * step, 10);
    });
  });
});

describe("fountainTrendSlot: the x range is inset by half a slot on each side", () => {
  it("even periods: slot = plot width / period count", () => {
    expect(fountainTrendSlot([2001, 2002, 2003, 2004], 400)).toBeCloseTo(100, 10);
  });

  it("uneven periods: sized from the smallest gap", () => {
    // gaps 1, 1, 48 (span 50): s = W * g / (D + g) = 510 * 1 / 51
    expect(fountainTrendSlot([2000, 2001, 2002, 2050], 510)).toBeCloseTo(10, 10);
  });

  it("one period: the whole plot", () => {
    expect(fountainTrendSlot([2020], 300)).toBe(300);
    expect(fountainTrendSlot([], 300)).toBe(300);
  });
});

describe("buildFountainScales: trend", () => {
  const data: FountainDataItem[] = [
    { label: "Flow", value: 50, date: 2001 },
    { label: "Flow", value: 70, date: 2002 },
    { label: "Flow", value: 95, date: 2003 },
  ];

  it("first and last jets sit half a slot inside the plot, evenly spaced", () => {
    const r = resolveFountainData(data, { xAxisDataType: "number" });
    const s = buildFountainScales({
      mode: r.mode,
      temporalType: r.temporalType,
      labels: r.labels,
      periods: r.periods,
      yDomain: [0, 100],
      width: W,
      height: H,
      margin: MARGIN,
    });
    const slot = PLOT_W / 3;
    expect(s.slotWidth).toBeCloseTo(slot, 10);
    const xs = r.jets.map((j) => s.xOf(j));
    expect(xs[0]).toBeCloseTo(MARGIN.left + slot / 2, 10);
    expect(xs[1]).toBeCloseTo(MARGIN.left + 1.5 * slot, 10);
    expect(xs[2]).toBeCloseTo(W - MARGIN.right - slot / 2, 10);
  });

  it("date axes position by epoch ms the same way", () => {
    const r = resolveFountainData(data, { xAxisDataType: "date_annual" });
    const s = buildFountainScales({
      mode: r.mode,
      temporalType: r.temporalType,
      labels: r.labels,
      periods: r.periods,
      yDomain: [0, 100],
      width: W,
      height: H,
      margin: MARGIN,
    });
    const xs = r.jets.map((j) => s.xOf(j));
    expect(xs[0] - MARGIN.left).toBeCloseTo(s.slotWidth / 2, 6);
    expect(W - MARGIN.right - xs[2]).toBeCloseTo(s.slotWidth / 2, 6);
  });

  it("a single period is centred", () => {
    const r = resolveFountainData([data[0]], { xAxisDataType: "number" });
    const s = buildFountainScales({
      mode: r.mode,
      temporalType: r.temporalType,
      labels: r.labels,
      periods: r.periods,
      yDomain: [0, 100],
      width: W,
      height: H,
      margin: MARGIN,
    });
    expect(s.xOf(r.jets[0])).toBeCloseTo(MARGIN.left + PLOT_W / 2, 10);
  });
});

describe("fountainPeriodTicks", () => {
  it("one tick per period, first and last included, through the shared line helper", () => {
    const r = resolveFountainData(
      [
        { label: "A", value: 1, date: 2023 },
        { label: "A", value: 2, date: 2021 },
        { label: "A", value: 3, date: 2022 },
        { label: "B", value: 4, date: 2021 },
      ],
      { xAxisDataType: "date_annual" },
    );
    const ticks = fountainPeriodTicks(r.periods, "date_annual");
    expect(ticks.map((t) => (t as Date).valueOf())).toEqual([
      Date.UTC(2021, 0, 1),
      Date.UTC(2022, 0, 1),
      Date.UTC(2023, 0, 1),
    ]);
    const n = resolveFountainData(
      [
        { label: "A", value: 1, date: 2023 },
        { label: "A", value: 2, date: 2021 },
        { label: "A", value: 3, date: 2022 },
      ],
      { xAxisDataType: "number" },
    );
    expect(fountainPeriodTicks(n.periods, "number")).toEqual([2021, 2022, 2023]);
  });

  it("date_monthly with epoch-ms dates keeps one tick per period (from the parsed periods)", () => {
    const months = [0, 1, 2].map((m) => Date.UTC(2021, m, 1));
    const r = resolveFountainData(
      months.map((date, i) => ({ label: "A", value: i + 1, date })),
      { xAxisDataType: "date_monthly" },
    );
    expect(r.jets).toHaveLength(3);
    const ticks = fountainPeriodTicks(r.periods, "date_monthly");
    expect(ticks.every((t) => t instanceof Date)).toBe(true);
    expect(ticks.map((t) => t.valueOf())).toEqual(months);
  });

  it("mixed date forms for one axis give one tick per parsed period", () => {
    const r = resolveFountainData(
      [
        { label: "A", value: 1, date: "2021-01" },
        { label: "A", value: 2, date: Date.UTC(2021, 1, 1) },
        { label: "A", value: 3, date: "2021-03-01" },
      ],
      { xAxisDataType: "date_monthly" },
    );
    expect(fountainPeriodTicks(r.periods, "date_monthly").map((t) => t.valueOf())).toEqual([
      Date.UTC(2021, 0, 1),
      Date.UTC(2021, 1, 1),
      Date.UTC(2021, 2, 1),
    ]);
  });
});
