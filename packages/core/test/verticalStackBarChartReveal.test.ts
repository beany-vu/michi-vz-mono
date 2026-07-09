import { describe, it, expect } from "vitest";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { VerticalStackBarChartProps, VerticalStackBarDataSet } from "../src/types";

const sample: VerticalStackBarDataSet[] = [
  { seriesKey: "Africa", seriesKeyAbbreviation: "AF", series: [
    { date: "2001", Africa: "10" }, { date: "2002", Africa: "12" }] },
  { seriesKey: "Non-LDC", seriesKeyAbbreviation: "NL", series: [
    { date: "2001", "Non-LDC": "20" }, { date: "2002", "Non-LDC": "18" }] },
];

// Default margin left is 60; chart width below is 600, so a reveal animation
// sweeps the clip rect width from 60 (nothing drawn yet) to 600 (fully drawn).
const WIDTH = 600;
const PLOT_LEFT = 60;

function mount(
  extra: Partial<VerticalStackBarChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountVerticalStackBarChart(
    host,
    { dataSet: sample, width: WIDTH, height: 360, ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");

const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("VerticalStackBarChart progressiveDraw off by default", () => {
  it("renders no clipPath and full bars when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("rect.bar").length).toBe(4);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("VerticalStackBarChart progressiveDraw SVG reveal", () => {
  it("starts with the clip at the plot's left edge and the content group clipped", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    const root = host.querySelector("g.stack-chart-content")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
    chart.destroy();
    host.remove();
  });

  it("grows the clip monotonically and reaches full width at durationMs", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: { durationMs: 1000, easing: "linear" } }, ticker);
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
    const { host, chart } = mount({ progressiveDraw: { durationMs: 1000, easing: "linear" } }, ticker);
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

describe("VerticalStackBarChart progressiveDraw canvas mode", () => {
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

describe("VerticalStackBarChart progressiveDraw + no-data state", () => {
  it("skips the reveal gracefully when the chart is in the no-data state", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true, isNodata: true }, ticker);
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("rect.bar").length).toBe(0);
    expect(() => ticker.tick(500)).not.toThrow();
    chart.destroy();
    host.remove();
  });
});
