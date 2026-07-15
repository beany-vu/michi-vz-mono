import { describe, it, expect } from "vitest";
import { mountAreaChart } from "../src/engine/areaChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { AreaChartProps, AreaDataRow } from "../src/types";

const series: AreaDataRow[] = [
  { date: 2020, "Fruit Sales": 10, Veg: 5, Dairy: 3 },
  { date: 2021, "Fruit Sales": 12, Veg: 6, Dairy: 4 },
  { date: 2022, "Fruit Sales": 9, Veg: 8, Dairy: 6 },
];
const keys = ["Fruit Sales", "Veg", "Dairy"];

// Default margin left is 60; chart width below is 600, so a reveal animation
// sweeps the clip rect width from 60 (nothing drawn yet) to 600 (fully drawn).
const WIDTH = 600;
const PLOT_LEFT = 60;

function mount(
  extra: Partial<AreaChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountAreaChart(
    host,
    { series, keys, width: WIDTH, height: 300, xAxisDataType: "number", ...extra },
    { ticker, motion },
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");

const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("AreaChart progressiveDraw off by default", () => {
  it("renders no clipPath and full areas when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("path.area").length).toBe(3);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("AreaChart progressiveDraw SVG reveal", () => {
  it("starts with the clip at the plot's left edge and the content group clipped", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    const root = host.querySelector("g.area-chart-content")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
    const title = host.querySelector(".mv-title, text");
    // axes/title never carry the clip.
    if (title) expect(title.getAttribute("clip-path")).toBeNull();
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

  it("an update() DURING the reveal resumes from the current position (wrapper double-render)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker,
    );
    ticker.tick(400);
    const before = rectWidth(host);
    expect(before).toBeGreaterThan(PLOT_LEFT);
    expect(before).toBeLessThan(WIDTH);
    // Wrappers (Lit updated(), React effects) call update() right after mount.
    chart.update({
      series,
      keys,
      width: WIDTH,
      height: 300,
      xAxisDataType: "number",
      progressiveDraw: { durationMs: 1000, easing: "linear" },
    });
    const resumed = rectWidth(host);
    expect(resumed).toBeCloseTo(before, 3);
    ticker.tick(300);
    expect(rectWidth(host)).toBeGreaterThan(resumed);
    ticker.tick(1000);
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

describe("AreaChart progressiveDraw canvas mode", () => {
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
