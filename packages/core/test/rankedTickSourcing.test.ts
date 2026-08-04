import { describe, it, expect } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import { processLineChartData } from "../src/lineChart/data";
import type { LineChartProps, LineDataItem } from "../src/types";

// Ranking anchor + axis ticks vs a Top/Bottom-ranked pool (thd MonitorV2
// services Bottom-N regression, 2026-08-04). Two contracts pinned here:
//   1. A series with NO finite value at the filter anchor date is "missing at
//      the anchor" and ranks LAST in BOTH directions. The old -Infinity
//      sentinel sorted last under desc but FIRST under asc, so Bottom-N filled
//      its slots with the series that had no data at the anchor year.
//   2. The date-axis candidate ticks (periodTicks) come from processedDataSet —
//      the same ranked/sliced/disabled-filtered set the x-domain uses — never
//      from the raw props.dataSet. A ranked-out pool series holding a later
//      period than any drawn series must not paint a tick past the drawn lines
//      (the unclamped date scale would project it beyond the plot edge).

const mk = (label: string, points: Array<[number, number | null]>): LineDataItem => ({
  label,
  color: "#000",
  series: points.map(([date, value]) => ({
    date,
    value: value as unknown as number,
    certainty: true,
  })),
});

const years = (label: string, from: number, to: number, value: number): LineDataItem =>
  mk(
    label,
    Array.from({ length: to - from + 1 }, (_, i) => [from + i, value]),
  );

describe("processLineChartData filter: missing-at-anchor ranks last in BOTH directions", () => {
  // A/B carry real 2024 values; C/D end at 2023; E has a null 2024 placeholder.
  const pool: LineDataItem[] = [
    years("A", 2018, 2024, 40),
    years("B", 2018, 2024, 10),
    years("C", 2018, 2023, 5),
    years("D", 2018, 2023, 2),
    mk("E", [
      [2023, 1],
      [2024, null],
    ]),
  ];

  it("Bottom-N (asc) picks the lowest REAL values, never the no-data-at-anchor series", () => {
    const out = processLineChartData(pool, {
      filter: { limit: 2, criteria: "value", date: 2024, sortingDir: "asc" },
      xAxisDataType: "date_annual",
    });
    // Pre-fix this was ["C", "D"] (missing -> -Infinity sorted FIRST under asc).
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["B", "A"]);
  });

  it("Top-N (desc) keeps its historical behavior: missing sorts last", () => {
    const out = processLineChartData(pool, {
      filter: { limit: 2, criteria: "value", date: 2024, sortingDir: "desc" },
      xAxisDataType: "date_annual",
    });
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["A", "B"]);
  });

  it("a non-finite value AT the anchor (null placeholder row) counts as missing", () => {
    const out = processLineChartData(pool, {
      filter: { limit: 3, criteria: "value", date: 2024, sortingDir: "asc" },
      xAxisDataType: "date_annual",
    });
    // E has a 2024 row, but its value is null — it must not outrank C/D either;
    // missing series fill trailing slots in stable input order.
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["B", "A", "C"]);
  });

  it("all-missing pool keeps stable input order (comparator stays consistent)", () => {
    const out = processLineChartData([pool[2], pool[3]], {
      filter: { limit: 2, criteria: "value", date: 2024, sortingDir: "asc" },
      xAxisDataType: "date_annual",
    });
    expect(out.rankedDataSet?.map((d) => d.label)).toEqual(["C", "D"]);
  });
});

// ---- engine (jsdom): axis ticks must not outrun the drawn/ranked series ----

const yearLabel = (d: number | Date) => String(new Date(d as number).getUTCFullYear());

const axisTexts = (host: HTMLElement) =>
  Array.from(host.querySelectorAll(".mv-x-axis text.mv-axis-label")).map((l) => l.textContent);

function mount(extra: Partial<LineChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, {
    dataSet: [],
    width: 900,
    height: 300,
    xAxisDataType: "date_annual",
    xAxisFormat: yearLabel,
    ...extra,
  });
  return { host, chart };
}

describe("mountLineChart: periodTicks come from the ranked/drawn set, not the raw pool", () => {
  // Top-2 anchored at 2023: A/B (high values, data ENDS 2023) win; C (low value,
  // the only series reaching 2024) is ranked out. The domain ends at 2023 — a
  // 2024 tick from C would render past every drawn line.
  const pool: LineDataItem[] = [
    years("A", 2020, 2023, 50),
    years("B", 2020, 2023, 40),
    years("C", 2020, 2024, 1),
  ];

  it("with a filter, a ranked-out series' later year paints NO tick", () => {
    const { host, chart } = mount({
      dataSet: pool,
      filter: { limit: 2, criteria: "value", date: 2023, sortingDir: "desc" },
    });
    const labels = axisTexts(host);
    expect(labels[labels.length - 1]).toBe("2023");
    expect(labels).not.toContain("2024");
    chart.destroy();
    host.remove();
  });

  it("without a filter, the same pool keeps its true last year (2024)", () => {
    const { host, chart } = mount({ dataSet: pool });
    const labels = axisTexts(host);
    expect(labels[labels.length - 1]).toBe("2024");
    chart.destroy();
    host.remove();
  });

  it("hiding the only series reaching the last year (disabledItems) drops its tick too", () => {
    const { host, chart } = mount({ dataSet: pool, disabledItems: ["C"] });
    const labels = axisTexts(host);
    expect(labels[labels.length - 1]).toBe("2023");
    expect(labels).not.toContain("2024");
    chart.destroy();
    host.remove();
  });

  it("fillPeriodTicks: a period covered ONLY by a ranked-out series is a faded no-data tick", () => {
    // Drawn Top-2 (A/B) skip 2022; ranked-out C covers it. "Present" must be
    // judged on the drawn set, so 2022 renders as .mv-tick-nodata.
    const gappy = (label: string, value: number): LineDataItem =>
      mk(label, [
        [2020, value],
        [2021, value],
        [2023, value],
      ]);
    const { host, chart } = mount({
      dataSet: [gappy("A", 50), gappy("B", 40), years("C", 2020, 2023, 1)],
      filter: { limit: 2, criteria: "value", date: 2023, sortingDir: "desc" },
      fillPeriodTicks: true,
    });
    const faded = Array.from(host.querySelectorAll("text.mv-tick-nodata")).map(
      (l) => l.textContent,
    );
    expect(faded).toContain("2022");
    chart.destroy();
    host.remove();
  });
});
