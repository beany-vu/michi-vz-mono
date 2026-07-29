import { describe, it, expect } from "vitest";
import { buildLineContext } from "../src/context/buildLineContext";
import { buildComparableBarContext } from "../src/context/buildComparableBarContext";
import { buildComparableVerticalBarContext } from "../src/context/buildComparableVerticalBarContext";
import { buildGapContext } from "../src/context/buildContext";
import { processComparableBarData } from "../src/comparableBar/data";
import { contextSignature } from "../src/context/signature";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import type { ComparableBarDataPoint, LineDataItem, VerticalStackBarDataSet } from "../src/types";

// renderedRankedIds is the uniform "what's on screen right now" contract
// (BaseChartContext): codes of the series actually drawn, in rendered order,
// consumed by e.g. thd MonitorV2's Top/Bottom chip sync (TopXResultSync).

describe("buildLineContext renderedRankedIds", () => {
  const dataSet: LineDataItem[] = [
    {
      label: "Ethiopia",
      color: "#f00",
      series: [{ date: 2020, value: 10, code: "231" }],
    },
    {
      label: "Kenya",
      color: "#0f0",
      series: [{ date: 2020, value: 8, code: "404" }],
    },
    {
      label: "No Code",
      color: "#00f",
      series: [{ date: 2020, value: 5 }],
    },
  ];

  it("emits codes in rendered order, omitting codeless series (no holes)", () => {
    const ctx = buildLineContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [2020, 2020],
      yAxisDomain: [0, 20],
      processedDataSet: dataSet,
      colorsMapping: {},
    });
    expect(ctx.renderedRankedIds).toEqual(["231", "404"]);
  });
});

describe("mountVerticalStackBarChart renderedRankedIds (jsdom)", () => {
  // Numeric codes pin the codeOf() widening: thd goods sector codes are
  // numbers, and the old string-only guard silently dropped them.
  const sample: VerticalStackBarDataSet[] = [
    {
      seriesKey: "Food",
      series: [
        { date: "2001", Food: "10", code: 16 },
        { date: "2002", Food: "12", code: 16 },
      ],
    },
    {
      seriesKey: "Minerals",
      series: [
        { date: "2001", Minerals: "20", code: 27 },
        { date: "2002", Minerals: "18", code: 27 },
      ],
    },
  ];

  function mount(extra = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountVerticalStackBarChart(host, {
      dataSet: sample,
      width: 600,
      height: 360,
      ...extra,
    });
    return { host, chart };
  }

  it("emits String()-coerced numeric codes for every rendered key", () => {
    const { host, chart } = mount();
    expect(chart.getContext()!.renderedRankedIds).toEqual(["16", "27"]);
    chart.destroy();
    host.remove();
  });

  it("narrows to the ranked set when a Top-N filter is active", () => {
    // Minerals has the larger grand total (38 vs 22) -> top-1 desc keeps it.
    const { host, chart } = mount({
      filter: { limit: 1, date: "", criteria: "total", sortingDir: "desc" },
    });
    expect(chart.getContext()!.renderedRankedIds).toEqual(["27"]);
    chart.destroy();
    host.remove();
  });

  it("excludes disabled keys (they are not drawn)", () => {
    const { host, chart } = mount({ disabledItems: ["Food"] });
    expect(chart.getContext()!.renderedRankedIds).toEqual(["27"]);
    chart.destroy();
    host.remove();
  });
});

describe("buildComparableBarContext renderedRankedIds", () => {
  const dataSet: ComparableBarDataPoint[] = [
    { label: "All", valueBased: 50, valueCompared: 60, code: 0 },
    { label: "Beta", valueBased: 30, valueCompared: 22, code: "B" },
    { label: "Gamma", valueBased: 15, valueCompared: 40, code: "G" },
  ];

  it("emits ranked/sliced codes after processComparableBarData, keeping numeric 0", () => {
    const { points } = processComparableBarData(dataSet, {
      filter: { limit: 2, date: "", criteria: "valueCompared", sortingDir: "desc" },
    });
    const ctx = buildComparableBarContext({
      renderer: "svg",
      xAxisDomain: [0, 100],
      points,
      colorsMapping: {},
    });
    // valueCompared desc: All (60), Gamma (40); numeric 0 code must survive.
    expect(ctx.renderedRankedIds).toEqual(["0", "G"]);
    expect(ctx.series.map((s) => s.code)).toEqual([0, "G"]);
  });
});

describe("buildComparableVerticalBarContext renderedRankedIds", () => {
  it("emits codes in point order", () => {
    const ctx = buildComparableVerticalBarContext({
      renderer: "svg",
      yAxisDomain: [0, 100],
      points: [
        { label: "A", valueBased: 1, valueCompared: 2, code: "a" },
        { label: "B", valueBased: 3, valueCompared: 4, code: 7 },
      ],
      colorsMapping: {},
    });
    expect(ctx.renderedRankedIds).toEqual(["a", "7"]);
  });
});

describe("buildGapContext renderedRankedIds", () => {
  it("emits codes alongside the legacy renderedData map", () => {
    const ctx = buildGapContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [0, 10],
      processedDataSet: [
        { label: "A", code: "a1", value1: 1, value2: 3 },
        { label: "B", value1: 2, value2: 5 },
      ],
      colorsMapping: {},
    });
    expect(ctx.renderedRankedIds).toEqual(["a1"]);
    expect(Object.keys(ctx.renderedData)).toEqual(["A", "B"]);
  });
});

describe("contextSignature", () => {
  it("changes when only renderedRankedIds differs (keeps onChartDataProcessed firing)", () => {
    const base = {
      chartType: "line-chart",
      renderer: "svg" as const,
      colorsMapping: {},
      summary: "s",
      a11yTable: { headers: [], rows: [] },
    };
    const a = contextSignature({ ...base, renderedRankedIds: ["1", "2"] });
    const b = contextSignature({ ...base, renderedRankedIds: ["1"] });
    expect(a).not.toBe(b);
  });
});
