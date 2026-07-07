import { describe, it, expect } from "vitest";
import { buildLineContext } from "../src/context/buildLineContext";
import { chartContextToCsv } from "../src/export/csv";
import { defaultXAxisFormatter } from "../src/i18n/formatters";
import type { LineDataItem } from "../src/types";

// One row per series is missing a period on purpose (Beta has no 2021) to prove the
// wide table fills gaps with "-".
const dataSet: LineDataItem[] = [
  { label: "Alpha", color: "#f00", series: [
    { date: 2020, value: 10 }, { date: 2021, value: 12 }, { date: 2022, value: 15 },
  ] },
  { label: "Beta", color: "#00f", series: [
    { date: 2020, value: 5 }, { date: 2022, value: 9 },
  ] },
];

const input = {
  renderer: "svg" as const,
  xAxisDataType: "number" as const,
  xAxisDomain: [2020, 2022] as [number, number],
  yAxisDomain: [0, 20] as [number, number],
  processedDataSet: dataSet,
  colorsMapping: {},
  xFormat: (d: number | string) => String(d),
};

describe("buildLineContext a11yTable (wide per-period)", () => {
  it("has one column per distinct period (formatted) and one row per series", () => {
    const ctx = buildLineContext(input);
    expect(ctx.a11yTable.headers).toEqual(["Series", "2020", "2021", "2022"]);
    expect(ctx.a11yTable.rows).toEqual([
      ["Alpha", 10, 12, 15],
      ["Beta", 5, "-", 9], // gap -> "-"
    ]);
  });

  it("feeds a per-period CSV via chartContextToCsv", () => {
    const csv = chartContextToCsv(buildLineContext(input));
    expect(csv.split("\r\n")[0]).toBe("Series,2020,2021,2022");
    expect(csv).toContain("Beta,5,-,9");
  });

  it("labels date_annual year-integer periods as YEARS, not 1970 (epoch trap)", () => {
    const annual: LineDataItem[] = [
      { label: "A", color: "#000", series: [{ date: 2005, value: 1 }, { date: 2010, value: 2 }] },
    ];
    const ctx = buildLineContext({
      renderer: "svg",
      xAxisDataType: "date_annual",
      xAxisDomain: [0, 1],
      yAxisDomain: [0, 2],
      processedDataSet: annual,
      colorsMapping: {},
      // Same formatter the engine uses for the on-screen axis.
      xFormat: defaultXAxisFormatter("date_annual"),
    });
    expect(ctx.a11yTable.headers).toEqual(["Series", "2005", "2010"]);
  });
});
