import { describe, it, expect } from "vitest";
import { mountFanChart } from "../src/engine/fanChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { FanChartProps, FanDataItem } from "../src/types";

const dataSet: FanDataItem[] = [
  {
    label: "A",
    series: [
      { date: 2018, value: 10, certainty: true },
      { date: 2019, value: 20, certainty: true },
      { date: 2020, value: 30, certainty: true },
      { date: 2021, value: 40, certainty: false },
      { date: 2022, value: 50, certainty: false },
    ],
    bands: [
      {
        level: 0.95,
        series: [
          { date: 2020, valueMin: 30, valueMax: 30, valueMedium: 30 },
          { date: 2021, valueMin: 35, valueMax: 45, valueMedium: 40 },
          { date: 2022, valueMin: 40, valueMax: 60, valueMedium: 50 },
        ],
      },
      {
        level: 0.5,
        series: [
          { date: 2020, valueMin: 30, valueMax: 30, valueMedium: 30 },
          { date: 2021, valueMin: 38, valueMax: 42, valueMedium: 40 },
          { date: 2022, valueMin: 46, valueMax: 54, valueMedium: 50 },
        ],
      },
    ],
  },
];

// Default margin left is 60; chart width below is 600, so a reveal animation
// sweeps the clip rect width from 60 (nothing drawn yet) to 600 (fully drawn).
const WIDTH = 600;
const PLOT_LEFT = 60;

function mount(
  extra: Partial<FanChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFanChart(
    host,
    { dataSet, width: WIDTH, height: 300, xAxisDataType: "number", ...extra },
    { ticker, motion },
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");

const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("FanChart progressiveDraw off by default", () => {
  it("renders no clipPath and full bands/line when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll(".mv-fan-band").length).toBe(2);
    expect(host.querySelectorAll("path.line").length).toBeGreaterThanOrEqual(1);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("FanChart progressiveDraw SVG reveal", () => {
  it("starts with the clip at the plot's left edge and the content group clipped", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    const root = host.querySelector("g.fan-chart-content")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
    // Both bands and the line live inside the single clipped wrapper.
    expect(root.querySelector(".mv-fan-bands")).not.toBeNull();
    expect(root.querySelector(".line-chart-content")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("grows the clip monotonically and reaches full width at durationMs", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker,
    );
    let prev = rectWidth(host);
    for (let i = 0; i < 10; i++) {
      ticker.tick(100);
      const w = rectWidth(host);
      expect(w).toBeGreaterThanOrEqual(prev);
      prev = w;
    }
    expect(rectWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("renders fully revealed under prefers-reduced-motion (no animation frames needed)", () => {
    const ticker = createManualTicker();
    const reduced: MotionPreference = { prefersReduced: () => true };
    const { host, chart } = mount({ progressiveDraw: true }, ticker, reduced);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("replay() resets the clip and re-grows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker,
    );
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.replay!();
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    ticker.tick(500);
    expect(rectWidth(host)).toBeCloseTo(PLOT_LEFT + (WIDTH - PLOT_LEFT) / 2, 6);
    chart.destroy();
    host.remove();
  });
});

describe("FanChart progressiveDraw canvas mode", () => {
  it("mounts and animates without throwing (jsdom has no 2d context; draw no-ops)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true, renderer: "canvas" }, ticker);
    expect(() => {
      for (let i = 0; i < 15; i++) ticker.tick(100);
    }).not.toThrow();
    chart.destroy();
    host.remove();
  });
});
