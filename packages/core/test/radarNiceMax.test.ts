// RadarChart `niceMaxValue` - round the outer ring up to the last "nice" tick of
// [0, data max] (d3-array tickStep), so the outer ring label is a round number
// instead of the raw data max. Only applies when `maxValue` is NOT set; `true`
// uses `rings` as the tick count, a number sets the tick count. Default off keeps
// today's behaviour exactly (outer ring = data max, or 1 when every value is 0).
import { describe, it, expect, afterEach } from "vitest";
import { mountRadarChart } from "../src/engine/radarChart";
import { processRadarData, niceRadarMax } from "../src/radarChart/data";
import * as core from "../src/index";
import type { RadarChartContext, RadarChartProps, RadarDataItem } from "../src/types";

const axes = ["North", "East", "South", "West", "Centre"];
// Data max 73: tickStep(0, 73, 4) = 20 -> the outer ring rounds up to 80.
const series: RadarDataItem[] = [
  { label: "Series A", color: "#1f77b4", values: [42, 73, 55, 38, 61] },
  { label: "Series B", color: "#ff7f0e", values: [58, 44, 67, 52, 35] },
];

function mount(extra: Partial<RadarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadarChart(host, { series, axes, width: 500, height: 500, ...extra });
  return { host, chart };
}

const outerRingLabel = (host: HTMLElement): string | null => {
  const labels = host.querySelectorAll<SVGTextElement>("text.radial-label");
  return labels.length ? labels[labels.length - 1].textContent : null;
};

const ctxMax = (chart: { getContext(): unknown }): number =>
  (chart.getContext() as RadarChartContext).maxValue;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("niceRadarMax (pure)", () => {
  it("rounds up to the last nice tick: ceil(dataMax / tickStep) * tickStep", () => {
    expect(niceRadarMax(73, 4)).toBe(80); // step 20
    expect(niceRadarMax(87, 4)).toBe(100); // step 20
    expect(niceRadarMax(81, 5)).toBe(100); // step 20
    expect(niceRadarMax(45, 4)).toBe(50); // step 10
    expect(niceRadarMax(9, 4)).toBe(10); // step 2
    expect(niceRadarMax(7, 5)).toBe(7); // step 1 - already on a tick
  });

  it("leaves a max that already sits on a tick where it is", () => {
    expect(niceRadarMax(100, 4)).toBe(100);
    expect(niceRadarMax(100, 5)).toBe(100);
    expect(niceRadarMax(80, 4)).toBe(80);
    expect(niceRadarMax(2.5, 4)).toBe(2.5); // step 0.5
    expect(niceRadarMax(0.004, 4)).toBe(0.004); // step 0.001
  });

  it("handles tiny decimals (step below 1)", () => {
    expect(niceRadarMax(0.0037, 4)).toBeCloseTo(0.004, 12);
    expect(niceRadarMax(0.0037, 5)).toBeCloseTo(0.004, 12);
    expect(niceRadarMax(0.37, 4)).toBeCloseTo(0.4, 12);
  });

  it("handles large values", () => {
    expect(niceRadarMax(1234567, 4)).toBe(1400000); // step 200 000
    expect(niceRadarMax(98765432, 5)).toBe(100000000); // step 20 000 000
    expect(niceRadarMax(5e15, 5)).toBe(5e15);
  });

  it("returns a non-positive or non-finite data max unchanged (the caller keeps its own fallback)", () => {
    expect(niceRadarMax(0, 4)).toBe(0);
    expect(niceRadarMax(-12, 4)).toBe(-12);
    expect(niceRadarMax(Number.NaN, 4)).toBeNaN();
    expect(niceRadarMax(Number.POSITIVE_INFINITY, 4)).toBe(Number.POSITIVE_INFINITY);
  });

  it("falls back to the data max when the tick step is not a positive finite number", () => {
    // tickStep(0, 87, 0 | -1) is Infinity, tickStep(0, 87, NaN) is NaN.
    expect(niceRadarMax(87, 0)).toBe(87);
    expect(niceRadarMax(87, -1)).toBe(87);
    expect(niceRadarMax(87, Number.NaN)).toBe(87);
  });

  it("is exported from the package entry", () => {
    expect(core.niceRadarMax).toBe(niceRadarMax);
  });
});

describe("processRadarData niceTickCount (pure)", () => {
  it("keeps today's outer ring (the data max) when no tick count is passed", () => {
    expect(processRadarData(series).maxValue).toBe(73);
    expect(processRadarData(series, [], undefined, undefined).maxValue).toBe(73);
  });

  it("rounds the data max up with the given tick count", () => {
    expect(processRadarData(series, [], undefined, 4).maxValue).toBe(80);
  });

  it("an explicit maxValue always wins", () => {
    expect(processRadarData(series, [], 64, 4).maxValue).toBe(64);
  });

  it("rounds the max of the ENABLED series only", () => {
    // Series A (max 73) disabled -> Series B max 67 -> step 20 -> 80; and with 10
    // ticks (step 5) -> 70.
    expect(processRadarData(series, ["Series A"], undefined, 4).maxValue).toBe(80);
    expect(processRadarData(series, ["Series A"], undefined, 10).maxValue).toBe(70);
  });

  it("all-zero and all-negative data keep the default outer ring of 1", () => {
    const zeros: RadarDataItem[] = [{ label: "Z", values: [0, 0, 0] }];
    const negatives: RadarDataItem[] = [{ label: "N", values: [-3, -8, -1] }];
    expect(processRadarData(zeros, [], undefined, 4).maxValue).toBe(1);
    expect(processRadarData(negatives, [], undefined, 4).maxValue).toBe(1);
    expect(processRadarData([], [], undefined, 4).maxValue).toBe(1);
  });
});

describe("RadarChart niceMaxValue (engine)", () => {
  it("default (unset): the outer ring is the raw data max, byte-for-byte as before", () => {
    const off = mount();
    const explicitFalse = mount({ niceMaxValue: false });
    expect(ctxMax(off.chart)).toBe(73);
    expect(outerRingLabel(off.host)).toBe("73");
    expect(explicitFalse.host.querySelector("svg")!.outerHTML).toBe(
      off.host.querySelector("svg")!.outerHTML,
    );
    expect(JSON.stringify(explicitFalse.chart.getContext())).toBe(
      JSON.stringify(off.chart.getContext()),
    );
  });

  it("true: rounds the outer ring up using `rings` as the tick count", () => {
    const { host, chart } = mount({ niceMaxValue: true });
    expect(ctxMax(chart)).toBe(80);
    expect(outerRingLabel(host)).toBe("80");
    // Ring labels are equal fractions of the nice max (4 rings by default).
    const labels = Array.from(host.querySelectorAll("text.radial-label")).map((t) => t.textContent);
    expect(labels).toEqual(["20", "40", "60", "80"]);
  });

  it("true follows `rings`: 10 rings -> step 10 -> the outer ring is 80 (73 rounds up to 80)", () => {
    const { chart } = mount({ niceMaxValue: true, rings: 10 });
    expect(ctxMax(chart)).toBe(80);
    const eight = mount({
      niceMaxValue: true,
      rings: 8,
      series: [{ label: "S", values: [61, 12, 30] }],
      axes: ["A", "B", "C"],
    });
    // tickStep(0, 61, 8) = 10 -> 70
    expect(ctxMax(eight.chart)).toBe(70);
  });

  it("a number sets the tick count instead of `rings`", () => {
    // tickStep(0, 73, 10) = 10 -> 80; tickStep(0, 73, 2) = 50 -> 100
    expect(ctxMax(mount({ niceMaxValue: 10 }).chart)).toBe(80);
    const two = mount({ niceMaxValue: 2 });
    expect(ctxMax(two.chart)).toBe(100);
    expect(outerRingLabel(two.host)).toBe("100");
  });

  it("an explicit maxValue wins over niceMaxValue", () => {
    const { host, chart } = mount({ niceMaxValue: true, maxValue: 75 });
    expect(ctxMax(chart)).toBe(75);
    expect(outerRingLabel(host)).toBe("75");
  });

  it("all-zero data keeps the default outer ring (1)", () => {
    const { chart } = mount({
      niceMaxValue: true,
      series: [{ label: "Z", values: [0, 0, 0, 0, 0] }],
    });
    expect(ctxMax(chart)).toBe(1);
  });

  it("scales the polygons against the nice max (a 40 value sits at half the radius of 80)", () => {
    const one: RadarDataItem[] = [{ label: "S", values: [40, 73, 10] }];
    const threeAxes = ["A", "B", "C"];
    const { host } = mount({ niceMaxValue: true, series: one, axes: threeAxes });
    const plain = mount({ series: one, axes: threeAxes, maxValue: 80 });
    expect(host.querySelector("polygon.radar-area")!.getAttribute("points")).toBe(
      plain.host.querySelector("polygon.radar-area")!.getAttribute("points"),
    );
  });

  it("re-rounds on update (a new data max gives a new nice ring)", () => {
    const { chart } = mount({ niceMaxValue: true });
    expect(ctxMax(chart)).toBe(80);
    chart.update({
      series: [{ label: "S", values: [130, 30, 64, 88, 12] }],
      axes,
      width: 500,
      height: 500,
      niceMaxValue: true,
    });
    // tickStep(0, 130, 4) = 50 -> 150
    expect(ctxMax(chart)).toBe(150);
  });

  it("canvas reports the same effective max as svg", () => {
    const svg = mount({ niceMaxValue: true });
    const cnv = mount({ niceMaxValue: true, renderer: "canvas" });
    expect(ctxMax(cnv.chart)).toBe(ctxMax(svg.chart));
    expect(outerRingLabel(cnv.host)).toBe("80");
  });
});
