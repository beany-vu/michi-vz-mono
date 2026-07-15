import { describe, it, expect } from "vitest";
import { isPredicted, provenanceCounts } from "../src/math/provenance";
import { buildLineContext } from "../src/context/buildLineContext";
import { buildFanContext } from "../src/context/buildFanContext";
import { buildAreaContext } from "../src/context/buildAreaContext";
import type { AreaDataRow, DataPoint, FanDataItem, LineDataItem } from "../src/types";

describe("provenance helpers", () => {
  it("isPredicted prefers explicit `predicted` over `certainty`", () => {
    expect(isPredicted({ date: 1, predicted: true, certainty: true })).toBe(true);
    expect(isPredicted({ date: 1, predicted: false, certainty: false })).toBe(false);
  });

  it("isPredicted falls back to certainty === false", () => {
    expect(isPredicted({ date: 1, certainty: false })).toBe(true);
    expect(isPredicted({ date: 1, certainty: true })).toBe(false);
    expect(isPredicted({ date: 1 })).toBe(false); // neither -> actual
  });

  it("provenanceCounts splits actual/predicted and finds the forecast boundary", () => {
    const pts = [
      { date: 2019, certainty: true },
      { date: 2020, certainty: true },
      { date: 2021, predicted: true },
      { date: 2022, predicted: true },
    ];
    expect(provenanceCounts(pts)).toEqual({
      actualCount: 2,
      predictedCount: 2,
      forecastStart: 2021,
    });
  });

  it("reports null forecastStart when nothing is predicted", () => {
    expect(provenanceCounts([{ date: 1, certainty: true }])).toEqual({
      actualCount: 1,
      predictedCount: 0,
      forecastStart: null,
    });
  });
});

describe("LineChartContext provenance", () => {
  const series = (pts: DataPoint[]): LineDataItem => ({ label: "Rev", series: pts });

  it("surfaces actualCount/predictedCount/forecastStart per series", () => {
    const ctx = buildLineContext({
      renderer: "svg",
      xAxisDataType: "date_annual",
      xAxisDomain: [2019, 2022],
      yAxisDomain: [0, 100],
      processedDataSet: [
        series([
          { date: 2019, value: 10, certainty: true },
          { date: 2020, value: 20, certainty: true },
          { date: 2021, value: 30, predicted: true, certainty: true },
          { date: 2022, value: 40, predicted: true, certainty: true },
        ]),
      ],
      colorsMapping: {},
    });
    const s = ctx.series[0];
    expect(s.actualCount).toBe(2);
    expect(s.predictedCount).toBe(2);
    expect(s.forecastStart).toBe(2021);
  });
});

describe("AreaChartContext provenance (row-level)", () => {
  it("counts actual vs predicted rows and the forecast boundary", () => {
    const rows: AreaDataRow[] = [
      { date: 2020, a: 10, b: 5 },
      { date: 2021, a: 12, b: 6 },
      { date: 2022, a: 14, b: 7, predicted: true },
      { date: 2023, a: 16, b: 8, predicted: true },
    ];
    const ctx = buildAreaContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [2020, 2023],
      yAxisDomain: [0, 30],
      series: rows,
      activeKeys: ["a", "b"],
      colorsMapping: {},
    });
    expect(ctx.stats.actualRows).toBe(2);
    expect(ctx.stats.predictedRows).toBe(2);
    expect(ctx.stats.forecastStart).toBe(2022);
    expect(ctx.summary).toContain("2 forecast rows from 2022");
  });

  it("reports no forecast when every row is observed", () => {
    const ctx = buildAreaContext({
      renderer: "svg",
      xAxisDataType: "number",
      xAxisDomain: [2020, 2021],
      yAxisDomain: [0, 30],
      series: [
        { date: 2020, a: 10 },
        { date: 2021, a: 12 },
      ],
      activeKeys: ["a"],
      colorsMapping: {},
    });
    expect(ctx.stats.predictedRows).toBe(0);
    expect(ctx.stats.forecastStart).toBeNull();
  });
});

describe("FanChartContext provenance", () => {
  it("history/forecast counts honor explicit `predicted` and expose forecastStart", () => {
    const item: FanDataItem = {
      label: "GDP",
      series: [
        { date: 2020, value: 100, certainty: true },
        { date: 2021, value: 110, certainty: true },
        { date: 2022, value: 120, certainty: true, predicted: true },
      ],
      bands: [],
    };
    const ctx = buildFanContext({
      renderer: "svg",
      xAxisDataType: "date_annual",
      xAxisDomain: [2020, 2022],
      yAxisDomain: [0, 200],
      dataSet: [item],
      colorsMapping: {},
    });
    const s = ctx.series[0];
    expect(s.historyCount).toBe(2);
    expect(s.forecastCount).toBe(1);
    expect(s.forecastStart).toBe(2022);
  });
});
