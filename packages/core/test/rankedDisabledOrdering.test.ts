import { describe, it, expect } from "vitest";
import { processLineChartData } from "../src/lineChart/data";
import { buildLineContext } from "../src/context/buildLineContext";
import { processComparableBarData } from "../src/comparableBar/data";
import { buildComparableBarContext } from "../src/context/buildComparableBarContext";
import { processComparableVerticalBarData } from "../src/comparableVerticalBar/data";
import { buildComparableVerticalBarContext } from "../src/context/buildComparableVerticalBarContext";
import { processGapChartData } from "../src/gapChart/data";
import { mountLineChart } from "../src/engine/lineChart";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import type {
  ComparableBarDataPoint,
  GapDataItem,
  LineDataItem,
  VerticalStackBarDataSet,
} from "../src/types";

// Hiding a series via disabledItems while a Top-N `filter` is active is a
// VIEW-level hide: the ranked slice is computed on the FULL set FIRST, then
// disabledItems are removed from what gets DRAWN. Consequences pinned here:
//   1. NO BACKFILL — hiding one of the top N draws N-1 series; the (N+1)-th
//      ranked item never slides into the freed slot (the pre-fix behavior,
//      which re-ranked the remaining pool: thd MonitorV2's "Top N reapplies
//      to the remaining categories" bug).
//   2. renderedRankedIds is the ranked slice PRE-disabledItems — stable ranked
//      positions while hiding, so a consumer that mirrors the rendered set
//      into its selection (thd TopXResultSync) doesn't drop the hidden item.
//   3. Without a filter, semantics are unchanged (disabled removed, ids = drawn).
// GapChart has always sliced before hiding; this aligns line + comparable h/v.

const lineSeries = (label: string, code: string, value: number): LineDataItem => ({
  label,
  color: "#000",
  series: [{ date: 2020, value, code }],
});

const LINE_POOL: LineDataItem[] = [
  lineSeries("A", "1", 50),
  lineSeries("B", "2", 40),
  lineSeries("C", "3", 30),
  lineSeries("D", "4", 20),
  lineSeries("E", "5", 10),
];

const LINE_FILTER = { limit: 2, criteria: "value", date: 2020, sortingDir: "desc" as const };

describe("line: ranked slice before disabledItems", () => {
  it("hiding one of the top N draws N-1 series — no backfill", () => {
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["A"],
      filter: LINE_FILTER,
      xAxisDataType: "number",
    });
    // Top 2 = [A, B]; hiding A leaves ONLY B — C must not slide in.
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["B"]);
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["A", "B"]);
  });

  it("renderedRankedIds stays the pre-hide ranked slice", () => {
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["A"],
      filter: LINE_FILTER,
      xAxisDataType: "number",
    });
    const ctx = buildLineContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: out.xAxisDomain,
      yAxisDomain: out.yAxisDomain,
      processedDataSet: out.processedDataSet,
      rankedDataSet: out.rankedDataSet,
      colorsMapping: {},
      disabledItems: ["A"],
    });
    expect(ctx.renderedRankedIds).toEqual(["1", "2"]);
    // The drawn/visible set still excludes the hidden series.
    expect(ctx.visibleItems).toEqual(["B"]);
  });

  it("no filter: unchanged semantics (disabled removed, no rankedDataSet)", () => {
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["A"],
      xAxisDataType: "number",
    });
    expect(out.rankedDataSet).toBeUndefined();
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["B", "C", "D", "E"]);
  });
});

const barPoint = (label: string, code: string, value: number): ComparableBarDataPoint => ({
  label,
  code,
  valueBased: value,
  valueCompared: value + 1,
});

const BAR_POOL: ComparableBarDataPoint[] = [
  barPoint("A", "1", 50),
  barPoint("B", "2", 40),
  barPoint("C", "3", 30),
  barPoint("D", "4", 20),
];

const BAR_FILTER = { limit: 2, criteria: "valueBased" as const, sortingDir: "desc" as const };

describe("comparable horizontal: ranked slice before disabledItems", () => {
  it("hiding one of the top N draws N-1 bars — no backfill", () => {
    const out = processComparableBarData(BAR_POOL, {
      disabledItems: ["A"],
      filter: BAR_FILTER,
    });
    expect(out.points.map((d) => d.label)).toEqual(["B"]);
    expect(out.rankedPoints?.map((d) => d.label)).toEqual(["A", "B"]);
  });

  it("renderedRankedIds stays the pre-hide ranked slice; legend keeps the hidden pill", () => {
    const out = processComparableBarData(BAR_POOL, {
      disabledItems: ["A"],
      filter: BAR_FILTER,
    });
    const ctx = buildComparableBarContext({
      renderer: "svg",
      xAxisDomain: out.xAxisDomain,
      points: out.points,
      rankedPoints: out.rankedPoints,
      colorsMapping: {},
      disabledItems: ["A"],
      legendLabels: ["A", "B"],
    });
    expect(ctx.renderedRankedIds).toEqual(["1", "2"]);
    expect(ctx.legendData?.find((l) => l.label === "A")?.disabled).toBe(true);
  });

  it("no filter: unchanged semantics", () => {
    const out = processComparableBarData(BAR_POOL, { disabledItems: ["A"] });
    expect(out.rankedPoints).toBeUndefined();
    expect(out.points.map((d) => d.label)).toEqual(["B", "C", "D"]);
  });
});

describe("comparable vertical: ranked slice before disabledItems", () => {
  it("hiding one of the top N draws N-1 columns — no backfill", () => {
    const out = processComparableVerticalBarData(BAR_POOL, {
      disabledItems: ["A"],
      filter: BAR_FILTER,
    });
    expect(out.points.map((d) => d.label)).toEqual(["B"]);
    expect(out.rankedPoints?.map((d) => d.label)).toEqual(["A", "B"]);
  });

  it("renderedRankedIds stays the pre-hide ranked slice", () => {
    const out = processComparableVerticalBarData(BAR_POOL, {
      disabledItems: ["A"],
      filter: BAR_FILTER,
    });
    const ctx = buildComparableVerticalBarContext({
      renderer: "svg",
      yAxisDomain: out.yAxisDomain,
      points: out.points,
      rankedPoints: out.rankedPoints,
      colorsMapping: {},
      disabledItems: ["A"],
    });
    expect(ctx.renderedRankedIds).toEqual(["1", "2"]);
  });
});

describe("line: edge cases of the view-level hide", () => {
  it("Bottom-N (asc) hides without backfill too — direction-agnostic", () => {
    // Bottom 2 = [E(10), D(20)]; hiding E draws only D — C(30) must not slide in.
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["E"],
      filter: { ...LINE_FILTER, sortingDir: "asc" },
      xAxisDataType: "number",
    });
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["E", "D"]);
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["D"]);
  });

  it("hiding MULTIPLE ranked series draws the remainder — never refills any slot", () => {
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["A", "C"],
      filter: { ...LINE_FILTER, limit: 3 },
      xAxisDataType: "number",
    });
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["A", "B", "C"]);
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["B"]);
  });

  it("hiding a series OUTSIDE the ranked slice changes nothing drawn", () => {
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["E"],
      filter: LINE_FILTER,
      xAxisDataType: "number",
    });
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["A", "B"]);
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["A", "B"]);
  });

  it("a larger limit re-slices the FULL pool — the hidden series keeps its slot", () => {
    const out = processLineChartData(LINE_POOL, {
      disabledItems: ["A"],
      filter: { ...LINE_FILTER, limit: 3 },
      xAxisDataType: "number",
    });
    // A stays inside the top-3 slice (hidden), so the drawn set is [B, C] —
    // NOT [B, C, D] (which would mean the slice ran on the pool minus A).
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["A", "B", "C"]);
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["B", "C"]);
  });
});

describe("comparable horizontal: edge cases of the view-level hide", () => {
  it("Bottom-N (asc) hides without backfill", () => {
    // Bottom 2 by valueBased = [D(20), C(30)]; hiding D draws only C.
    const out = processComparableBarData(BAR_POOL, {
      disabledItems: ["D"],
      filter: { ...BAR_FILTER, sortingDir: "asc" },
    });
    expect(out.rankedPoints?.map((d) => d.label)).toEqual(["D", "C"]);
    expect(out.points.map((d) => d.label)).toEqual(["C"]);
  });

  it("hiding a bar OUTSIDE the ranked slice changes nothing drawn", () => {
    const out = processComparableBarData(BAR_POOL, {
      disabledItems: ["D"],
      filter: BAR_FILTER,
    });
    expect(out.points.map((d) => d.label)).toEqual(["A", "B"]);
  });
});

describe("gap: regression pin — slice-then-hide was ALWAYS gap's order", () => {
  const GAP_POOL: GapDataItem[] = [
    { label: "A", code: "1", value1: 50, value2: 10 },
    { label: "B", code: "2", value1: 40, value2: 10 },
    { label: "C", code: "3", value1: 30, value2: 10 },
  ];

  it("hiding one of the top N draws N-1 rows — no backfill", () => {
    const out = processGapChartData(
      GAP_POOL,
      { limit: 2, date: "", criteria: "value1", sortingDir: "desc" },
      ["A"],
    );
    expect(out.processedDataSet.map((d) => d.label)).toEqual(["B"]);
  });
});

describe("line ENGINE (jsdom): legend + renderedRankedIds while ranked with a hidden series", () => {
  const engineData: LineDataItem[] = [
    { label: "A", color: "#111", series: [{ date: 2020, value: 50, code: "1" }] },
    { label: "B", color: "#222", series: [{ date: 2020, value: 40, code: "2" }] },
    { label: "C", color: "#333", series: [{ date: 2020, value: 30, code: "3" }] },
  ];

  function mount(extra = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, {
      dataSet: engineData,
      width: 600,
      height: 360,
      xAxisDataType: "number",
      ...extra,
    });
    return { host, chart };
  }

  it("keeps the hidden ranked series in legendData (flagged) and in renderedRankedIds", () => {
    const { host, chart } = mount({
      filter: { limit: 2, date: 2020, criteria: "value", sortingDir: "desc" },
      disabledItems: ["A"],
    });
    const ctx = chart.getContext()!;
    // Ranked slice = [A, B]; A hidden: ids stay the pre-hide slice...
    expect(ctx.renderedRankedIds).toEqual(["1", "2"]);
    // ...the pill for A stays (flagged disabled) — the way back...
    const legendA = ctx.legendData?.find((l) => l.label === "A");
    expect(legendA?.disabled).toBe(true);
    expect(ctx.legendData?.map((l) => l.label)).toEqual(["A", "B"]);
    // ...and only B is actually visible/drawn.
    expect(ctx.visibleItems).toEqual(["B"]);
    chart.destroy();
    host.remove();
  });
});

describe("VSB ENGINE (jsdom): regression pin — group slice runs before key hiding", () => {
  const stackData: VerticalStackBarDataSet[] = [
    {
      seriesKey: "Food",
      series: [{ date: "2001", Food: "10", code: 16 }],
    },
    {
      seriesKey: "Minerals",
      series: [{ date: "2001", Minerals: "20", code: 27 }],
    },
  ];

  it("hiding the only ranked key draws nothing — the runner-up group must NOT backfill", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountVerticalStackBarChart(host, {
      dataSet: stackData,
      width: 600,
      height: 360,
      // Top-1 by grand total keeps Minerals (20 > 10)...
      filter: { limit: 1, date: "", criteria: "total", sortingDir: "desc" },
      // ...and hiding Minerals must leave the chart EMPTY, not swap Food in.
      disabledItems: ["Minerals"],
    });
    expect(chart.getContext()!.renderedRankedIds).toEqual([]);
    chart.destroy();
    host.remove();
  });
});
