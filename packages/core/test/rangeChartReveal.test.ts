import { describe, it, expect } from "vitest";
import { mountRangeChart } from "../src/engine/rangeChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { RangeChartProps, RangeDataItem } from "../src/types";

const band = (mins: number[], maxs: number[], start = 2016): RangeDataItem["series"] =>
  mins.map((valueMin, i) => ({ date: start + i, valueMin, valueMax: maxs[i], certainty: true }));

const dataSet: RangeDataItem[] = [
  { label: "Region A", color: "#f00", series: band([5, 8, 6], [12, 16, 14]) },
  { label: "Region B", color: "#0a0", series: band([2, 3, 4], [6, 7, 9]) },
];

// Default margin left is 60; chart width below is 600, so a reveal animation
// sweeps the clip rect width from 60 (nothing drawn yet) to 600 (fully drawn).
const WIDTH = 600;
const PLOT_LEFT = 60;

function mount(
  extra: Partial<RangeChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRangeChart(
    host,
    { dataSet, width: WIDTH, height: 300, xAxisDataType: "date_annual", ...extra },
    { ticker, motion },
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");

const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("RangeChart progressiveDraw off by default", () => {
  it("renders no clipPath and full bands when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("path.area").length).toBe(2);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("RangeChart progressiveDraw SVG reveal", () => {
  it("starts with the clip at the plot's left edge and the content group clipped", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    const root = host.querySelector("g.range-chart-content")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
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

describe("RangeChart progressiveDraw canvas mode", () => {
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
