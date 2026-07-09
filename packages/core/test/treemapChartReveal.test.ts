import { describe, it, expect } from "vitest";
import { mountTreemapChart } from "../src/engine/treemapChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { TreemapChartProps, TreemapNode } from "../src/types";

const WIDTH = 600;
const HEIGHT = 400;

const flat: TreemapNode[] = [
  { label: "Coffee", value: 100, partial: 72 },
  { label: "Tea", value: 60, partial: 30 },
  { label: "Cocoa", value: 40, partial: 10 },
];

function mount(extra: Partial<TreemapChartProps> = {}, ticker?: ManualTicker, motion?: MotionPreference) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountTreemapChart(
    host,
    { dataSet: flat, showSplit: false, title: "Demo", width: WIDTH, height: HEIGHT, ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");
const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("TreemapChart progressiveDraw off by default", () => {
  it("renders no clipPath and full tiles when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("rect.tile").length).toBe(3);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("TreemapChart progressiveDraw SVG reveal", () => {
  it("clips the marks group only (not the title)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    const root = host.querySelector("g.treemap-chart-content")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
    const title = host.querySelector("text.title");
    expect(title?.getAttribute("clip-path") ?? null).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("grows the clip monotonically from 0 to the chart width at durationMs", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker
    );
    expect(rectWidth(host)).toBe(0);
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

  it("renders fully revealed under prefers-reduced-motion", () => {
    const ticker = createManualTicker();
    const reduced: MotionPreference = { prefersReduced: () => true };
    const { host, chart } = mount({ progressiveDraw: true }, ticker, reduced);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("replay() resets to 0 and re-grows", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker
    );
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.replay!();
    expect(rectWidth(host)).toBe(0);
    ticker.tick(500);
    expect(rectWidth(host)).toBeCloseTo(WIDTH / 2, 6);
    chart.destroy();
    host.remove();
  });

  it("destroy() mid-animation cancels cleanly (a later tick does not throw)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    ticker.tick(100);
    chart.destroy();
    host.remove();
    expect(() => ticker.tick(2000)).not.toThrow();
  });
});

describe("TreemapChart progressiveDraw canvas mode", () => {
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
