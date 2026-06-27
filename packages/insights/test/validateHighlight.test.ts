import { describe, it, expect, beforeEach } from "vitest";
import { mountLineChart, type LineChartProps } from "@michi-vz/core";
import { invalidPoints, validate } from "../src/validate";

function host(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}
beforeEach(() => {
  document.body.innerHTML = "";
});

// 2019 duplicated, then 2017 goes backwards → two invalid points (both finite).
const badProps: LineChartProps = {
  xAxisDataType: "date_annual",
  dataSet: [
    {
      label: "Raw",
      series: [
        { date: 2018, value: 10, certainty: true },
        { date: 2019, value: 20, certainty: true },
        { date: 2019, value: 15, certainty: true },
        { date: 2017, value: 8, certainty: true },
        { date: 2021, value: 30, certainty: true },
      ],
    },
  ],
};

describe("validate highlight (invalid-data markers)", () => {
  it("invalidPoints flags duplicate + non-monotonic + non-finite", () => {
    const pts = invalidPoints(badProps.dataSet[0].series);
    const kinds = pts.map((p) => p.kind);
    expect(kinds).toContain("duplicate-date");
    expect(kinds).toContain("non-monotonic");
  });

  it("the validate() plugin draws red markers on the invalid points", () => {
    const h = host();
    const chart = mountLineChart(h, badProps, { plugins: [validate()] });
    // two invalid finite points → two red annotation markers
    expect(h.querySelectorAll(".mv-annotation-point").length).toBe(2);
    chart.destroy();
  });

  it("highlight:false draws no markers", () => {
    const h = host();
    const chart = mountLineChart(h, badProps, { plugins: [validate({ highlight: false })] });
    expect(h.querySelector(".mv-annotation-point")).toBeNull();
    chart.destroy();
  });
});
