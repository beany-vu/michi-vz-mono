import { describe, it, expect } from "vitest";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import type { VerticalStackBarDataSet } from "../src/types";

const dataSet: VerticalStackBarDataSet[] = [
  {
    seriesKey: "trade",
    seriesKeyAbbreviation: "T",
    series: [
      { date: "2020", air: 10, sea: 5 },
      { date: "2021", air: 12, sea: 6 },
    ],
  },
];

const mount = (extra: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountVerticalStackBarChart(host, {
    dataSet,
    keys: ["air", "sea"],
    width: 600,
    height: 300,
    skipColorMappingDispatch: true,
    ...extra,
  });
  return { host, chart };
};

describe("VerticalStackBar chrome + legendData", () => {
  it("exposes legendData with dataLabelSafe on the context (colour-contract payload)", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext();
    expect(Array.isArray(ctx?.legendData)).toBe(true);
    expect(ctx?.legendData?.length).toBeGreaterThan(0);
    expect(ctx?.legendData?.[0]).toHaveProperty("dataLabelSafe");
    chart.destroy();
    host.remove();
  });

  it("ready: bars drawn, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelectorAll("rect.bar").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("nodata (empty dataSet): no bars, data-mv-state=nodata, .mv-nodata overlay", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("rect.bar").length).toBe(0);
    expect(host.querySelector(".mv-nodata")).not.toBeNull();
    chart.destroy();
    host.remove();
  });
});
