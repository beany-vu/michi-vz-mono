import { describe, it, expect } from "vitest";
import type { DataPoint, LineChartProps } from "@michi-vz/core";
import { validateSeries, validate } from "../src/validate";

describe("validateSeries (data-quality checks)", () => {
  it("flags an empty series and nothing else", () => {
    const warnings = validateSeries([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("empty-dataset");
  });

  it("flags a non-finite value (NaN / Infinity)", () => {
    const series: DataPoint[] = [
      { date: 2018, value: 10, certainty: true },
      { date: 2019, value: NaN, certainty: true },
      { date: 2020, value: Infinity, certainty: true },
    ];
    const warnings = validateSeries(series);
    const nonFinite = warnings.filter((w) => w.type === "non-finite-value");
    expect(nonFinite).toHaveLength(2);
    expect(nonFinite[0].message).toContain("index 1");
    expect(nonFinite[1].message).toContain("index 2");
  });

  it("flags a duplicate date exactly once per repeated key", () => {
    const series: DataPoint[] = [
      { date: 2018, value: 10, certainty: true },
      { date: 2019, value: 20, certainty: true },
      { date: 2019, value: 25, certainty: true },
      { date: 2019, value: 30, certainty: true },
    ];
    const dups = validateSeries(series).filter((w) => w.type === "duplicate-date");
    expect(dups).toHaveLength(1);
    expect(dups[0].message).toContain("2019");
  });

  it("flags a backwards (non-monotonic) numeric date", () => {
    const series: DataPoint[] = [
      { date: 2018, value: 10, certainty: true },
      { date: 2020, value: 20, certainty: true },
      { date: 2019, value: 30, certainty: true },
    ];
    const nonMono = validateSeries(series).filter((w) => w.type === "non-monotonic-date");
    expect(nonMono).toHaveLength(1);
    expect(nonMono[0].message).toContain("2019");
    expect(nonMono[0].message).toContain("2020");
  });

  it("stays quiet for ordered numeric dates", () => {
    const series: DataPoint[] = [
      { date: 2018, value: 10, certainty: true },
      { date: 2019, value: 20, certainty: true },
      { date: 2020, value: 30, certainty: true },
    ];
    expect(validateSeries(series)).toHaveLength(0);
  });

  it("does not check monotonicity for non-numeric (categorical) dates", () => {
    const series: DataPoint[] = [
      { date: "Mar", value: 10, certainty: true },
      { date: "Jan", value: 20, certainty: true },
      { date: "Feb", value: 30, certainty: true },
    ];
    const warnings = validateSeries(series);
    // backwards alphabetical order is NOT a non-monotonic-date warning (no numeric order)
    expect(warnings.filter((w) => w.type === "non-monotonic-date")).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it("treats numeric strings as numeric dates for ordering", () => {
    const series: DataPoint[] = [
      { date: "2018", value: 10, certainty: true },
      { date: "2017", value: 20, certainty: true },
    ];
    const nonMono = validateSeries(series).filter((w) => w.type === "non-monotonic-date");
    expect(nonMono).toHaveLength(1);
  });

  it("reports all three classes of issue in one mixed series", () => {
    const series: DataPoint[] = [
      { date: 2018, value: 10, certainty: true },
      { date: 2019, value: NaN, certainty: true }, // non-finite-value
      { date: 2019, value: 30, certainty: true }, // duplicate-date
      { date: 2017, value: 40, certainty: true }, // non-monotonic-date (2017 < 2019)
    ];
    const types = validateSeries(series).map((w) => w.type);
    expect(types).toContain("non-finite-value");
    expect(types).toContain("duplicate-date");
    expect(types).toContain("non-monotonic-date");
  });
});

describe("validate() plugin", () => {
  it("flatMaps validateSeries over every dataSet series and prefixes the label", () => {
    const props: LineChartProps = {
      dataSet: [
        {
          label: "Good",
          series: [
            { date: 2018, value: 1, certainty: true },
            { date: 2019, value: 2, certainty: true },
          ],
        },
        {
          label: "Bad",
          series: [
            { date: 2018, value: NaN, certainty: true },
            { date: 2017, value: 5, certainty: true },
          ],
        },
      ],
    };

    const plugin = validate();
    const warnings = plugin.validate!(props, {
      chartType: "line-chart",
      getProps: () => props,
      getContext: () => null,
      setProps: () => {},
    });

    // only the "Bad" series produces warnings
    expect(warnings.every((w) => w.label === "Bad")).toBe(true);
    expect(warnings.every((w) => w.message.startsWith("Bad: "))).toBe(true);

    const types = warnings.map((w) => w.type);
    expect(types).toContain("non-finite-value");
    expect(types).toContain("non-monotonic-date");
  });

  it("returns an empty array when every series is clean", () => {
    const props: LineChartProps = {
      dataSet: [
        {
          label: "Clean",
          series: [
            { date: 2018, value: 1, certainty: true },
            { date: 2019, value: 2, certainty: true },
          ],
        },
      ],
    };
    const plugin = validate();
    const warnings = plugin.validate!(props, {
      chartType: "line-chart",
      getProps: () => props,
      getContext: () => null,
      setProps: () => {},
    });
    expect(warnings).toHaveLength(0);
  });
});
