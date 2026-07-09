import { describe, it, expect } from "vitest";
import { mountRadialTreeChart } from "../src/engine/radialTreeChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { RadialTreeChartProps, RadialTreeNode } from "../src/types";

const WIDTH = 600;
const HEIGHT = 400;

const dataSet: RadialTreeNode[] = [
  {
    label: "Sectors",
    children: [
      { label: "Coffee", value: 10 },
      { label: "Tea", value: 30 },
    ],
  },
  {
    label: "Regions",
    children: [
      { label: "Africa", value: 5 },
      { label: "Asia", value: 55 },
    ],
  },
];

function mount(extra: Partial<RadialTreeChartProps> = {}, ticker?: ManualTicker, motion?: MotionPreference) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadialTreeChart(
    host,
    { dataSet, title: "Demo", width: WIDTH, height: HEIGHT, ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");
const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("RadialTreeChart progressiveDraw off by default", () => {
  it("renders no clipPath and full dendrogram when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("circle.radial-tree-node-circle").length).toBe(6);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("RadialTreeChart progressiveDraw SVG reveal", () => {
  it("clips a marks wrapper (not the translated `plot` group itself, so negative-x nodes stay revealable) and never the title", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    const root = host.querySelector("g.radial-tree-marks")!;
    expect(root.getAttribute("clip-path")).toMatch(/^url\(#/);
    // The clip wrapper itself carries no transform - its local frame is the SVG's
    // absolute pixel space, so the clip rect covers the WHOLE dendrogram (including
    // nodes with a negative local x, left of the polar centre) once fully revealed.
    expect(root.getAttribute("transform")).toBeNull();
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

describe("RadialTreeChart progressiveDraw canvas mode", () => {
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
