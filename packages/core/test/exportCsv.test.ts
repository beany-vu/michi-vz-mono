import { describe, it, expect } from "vitest";
import { chartContextToCsv } from "../src/export/csv";
import { mountRangeChart } from "../src/engine/rangeChart";
import type { ChartContext, RangeChartProps, RangeDataItem } from "../src/types";

// chartContextToCsv only reads ctx.a11yTable, so a minimal synthetic context is enough
// to exercise the serializer precisely; a real mounted chart covers the integration.
function ctx(headers: string[], rows: Array<Array<string | number>>): ChartContext {
  return { a11yTable: { headers, rows } } as unknown as ChartContext;
}

describe("chartContextToCsv", () => {
  it("emits a header row + one line per data row", () => {
    const csv = chartContextToCsv(ctx(["Label", "Value"], [["A", 1], ["B", 2]]));
    expect(csv).toBe("Label,Value\r\nA,1\r\nB,2");
  });

  it("preserves numbers including 0 (not blanked)", () => {
    const csv = chartContextToCsv(ctx(["Label", "Value"], [["Zero", 0]]));
    expect(csv).toBe("Label,Value\r\nZero,0");
  });

  it("quotes fields containing the delimiter, quotes or newlines (RFC 4180)", () => {
    const csv = chartContextToCsv(
      ctx(["Name", "Note"], [["Doe, John", 'He said "hi"'], ["multi\nline", "ok"]])
    );
    expect(csv).toBe(
      'Name,Note\r\n"Doe, John","He said ""hi"""\r\n"multi\nline",ok'
    );
  });

  it("returns '' for null/undefined context or a context without an a11yTable", () => {
    expect(chartContextToCsv(null)).toBe("");
    expect(chartContextToCsv(undefined)).toBe("");
    expect(chartContextToCsv({} as unknown as ChartContext)).toBe("");
  });

  it("honours a custom delimiter and the optional BOM", () => {
    const csv = chartContextToCsv(ctx(["A", "B"], [["1", "2"]]), { delimiter: ";", bom: true });
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe("A;B\r\n1;2");
  });

  it("serializes a real mounted chart's a11yTable end-to-end", () => {
    const dataSet: RangeDataItem[] = [
      {
        label: "Region A",
        color: "#f00",
        series: [
          { date: 2016, valueMin: 5, valueMax: 12, certainty: true },
          { date: 2017, valueMin: 8, valueMax: 16, certainty: true },
        ],
      },
    ];
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountRangeChart(host, {
      dataSet,
      title: "Demo",
      width: 600,
      height: 300,
      xAxisDataType: "date_annual",
    } as RangeChartProps);

    const csv = chartContextToCsv(chart.getContext());
    const lines = csv.split("\r\n");
    // Header + one row per band (RangeChart a11y mirror = one row per band).
    expect(lines[0].length).toBeGreaterThan(0);
    expect(lines.length).toBe(1 + dataSet.length);
    expect(lines[1]).toContain("Region A");

    chart.destroy();
    host.remove();
  });
});
