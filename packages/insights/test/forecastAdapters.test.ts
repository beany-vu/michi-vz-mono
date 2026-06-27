import { describe, it, expect, beforeEach } from "vitest";
import {
  mountAreaChart,
  mountRangeChart,
  mountVerticalStackBarChart,
  mountRibbonChart,
  mountBarBellChart,
} from "@michi-vz/core";
import { forecast } from "../src/forecast";

function host(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}
beforeEach(() => {
  document.body.innerHTML = "";
});

const fc = () => forecast({ method: "linear", horizon: 2 });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctxOf = (c: { getContext(): unknown }) => c.getContext() as any;

describe("forecast adapters (multi-chart prediction)", () => {
  it("range-chart: appends 2 dashed band points", () => {
    const chart = mountRangeChart(
      host(),
      {
        xAxisDataType: "date_annual",
        dataSet: [
          {
            label: "A",
            series: [
              { date: 2018, valueMin: 8, valueMax: 12, valueMedium: 10, certainty: true },
              { date: 2019, valueMin: 9, valueMax: 14, valueMedium: 11, certainty: true },
              { date: 2020, valueMin: 10, valueMax: 16, valueMedium: 13, certainty: true },
            ],
          },
        ],
      },
      { plugins: [fc()] }
    );
    expect(ctxOf(chart).series[0].pointCount).toBe(5);
    chart.destroy();
  });

  it("area-chart: appends 2 forecast rows", () => {
    const chart = mountAreaChart(
      host(),
      {
        xAxisDataType: "date_annual",
        keys: ["A", "B"],
        series: [
          { date: 2018, A: 10, B: 5 },
          { date: 2019, A: 20, B: 8 },
          { date: 2020, A: 30, B: 11 },
        ],
      },
      { plugins: [fc()] }
    );
    expect(ctxOf(chart).stats.rowCount).toBe(5);
    chart.destroy();
  });

  it("vertical-stack-bar: appends 2 forecast dates", () => {
    const chart = mountVerticalStackBarChart(
      host(),
      {
        keys: ["A", "B"],
        dataSet: [
          {
            seriesKey: "W",
            seriesKeyAbbreviation: "",
            series: [
              { date: "2018", A: 10, B: 5 },
              { date: "2019", A: 20, B: 8 },
              { date: "2020", A: 30, B: 11 },
            ],
          },
        ],
      },
      { plugins: [fc()] }
    );
    expect(ctxOf(chart).stats.dateCount).toBe(5);
    chart.destroy();
  });

  it("ribbon-chart: appends 2 forecast dates", () => {
    const chart = mountRibbonChart(
      host(),
      {
        keys: ["A", "B"],
        series: [
          { date: "2018", A: 10, B: 5 },
          { date: "2019", A: 20, B: 8 },
          { date: "2020", A: 30, B: 11 },
        ],
      },
      { plugins: [fc()] }
    );
    expect(ctxOf(chart).stats.dateCount).toBe(5);
    chart.destroy();
  });

  it("bar-bell: appends 2 forecast rows", () => {
    const chart = mountBarBellChart(
      host(),
      {
        keys: ["A", "B"],
        dataSet: [
          { date: "2018", A: 10, B: 5 },
          { date: "2019", A: 20, B: 8 },
          { date: "2020", A: 30, B: 11 },
        ],
      },
      { plugins: [fc()] }
    );
    expect(ctxOf(chart).stats.rowCount).toBe(5);
    chart.destroy();
  });
});
