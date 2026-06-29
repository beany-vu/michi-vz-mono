import { describe, it, expect } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import type { LineDataItem } from "../src/types";

const annual = (vals: number[], start = 2016) =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));
const sample: LineDataItem[] = [{ label: "A", color: "#f00", series: annual([10, 20, 15]) }];

const mount = (extra: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, {
    dataSet: sample,
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    ...extra,
  });
  return { host, chart };
};

const yGrid = (h: HTMLElement) => h.querySelectorAll(".mv-y-axis line.mv-grid");
const yLabels = (h: HTMLElement) => h.querySelectorAll(".mv-y-axis .mv-axis-label");
const xGrid = (h: HTMLElement) => h.querySelectorAll(".mv-x-axis line.mv-grid");

describe("LineChart axis config (turn-off + adjust)", () => {
  it("draws y grid lines by default", () => {
    const { host, chart } = mount();
    expect(yGrid(host).length).toBeGreaterThan(3);
    chart.destroy();
    host.remove();
  });

  it("showGridLines=false removes the y grid lines", () => {
    const { host, chart } = mount({ showGridLines: false });
    expect(yGrid(host).length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("yTicks controls density (more ticks → more labels)", () => {
    const { host: hi, chart: ci } = mount({ yTicks: 10 });
    const { host: lo, chart: cl } = mount({ yTicks: 2 });
    expect(yLabels(hi).length).toBeGreaterThan(yLabels(lo).length);
    ci.destroy();
    hi.remove();
    cl.destroy();
    lo.remove();
  });

  it("highlightZeroLine marks the y=0 grid line when 0 is in the domain", () => {
    const { host, chart } = mount({ yAxisDomain: [0, 30] });
    expect(host.querySelector(".mv-y-axis line.mv-zero-line")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("highlightZeroLine=false → no zero-line emphasis", () => {
    const { host, chart } = mount({ yAxisDomain: [0, 30], highlightZeroLine: false });
    expect(host.querySelector(".mv-y-axis line.mv-zero-line")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("vertical (x) grid lines are OFF by default (legacy parity)", () => {
    const { host, chart } = mount();
    expect(xGrid(host).length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("showVerticalGridLines=true draws the vertical grid lines", () => {
    const { host, chart } = mount({ showVerticalGridLines: true });
    expect(xGrid(host).length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("applies fontFamily as the --michi-vz-font-family CSS var (SVG + canvas)", () => {
    const { host, chart } = mount({ fontFamily: "Museo, Arial, sans-serif" });
    expect(host.style.getPropertyValue("--michi-vz-font-family")).toContain("Museo");
    chart.destroy();
    host.remove();
  });
});
