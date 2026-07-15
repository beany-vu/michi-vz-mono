import { describe, it, expect } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import type { LineChartProps, LineDataItem } from "../src/types";

const annual = (
  vals: number[],
  start = 2016,
): { date: number; value: number; certainty: boolean }[] =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));

const sample: LineDataItem[] = [
  { label: "Alpha", color: "#ff0000", series: annual([10, 20, 15, 30]) },
  { label: "Beta", color: "#00ff00", series: annual([5, 8, 12, 6]) },
];

// Default margin left is 60; chart width below is 600, so a reveal animation
// sweeps the clip rect width from 60 (nothing drawn yet) to 600 (fully drawn).
const WIDTH = 600;
const PLOT_LEFT = 60;

function mount(
  extra: Partial<LineChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(
    host,
    {
      dataSet: sample,
      width: WIDTH,
      height: 300,
      xAxisDataType: "date_annual",
      ...extra,
    },
    { ticker, motion },
  );
  return { host, chart };
}

const clipRect = (host: HTMLElement): SVGRectElement | null =>
  host.querySelector<SVGRectElement>("clipPath rect");

const rectWidth = (host: HTMLElement): number => Number(clipRect(host)!.getAttribute("width"));

describe("progressiveDraw off by default", () => {
  it("renders no clipPath and full lines when the prop is unset", () => {
    const { host, chart } = mount();
    expect(clipRect(host)).toBeNull();
    expect(host.querySelectorAll("path.line").length).toBeGreaterThanOrEqual(2);
    expect(chart.replay).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("progressiveDraw SVG reveal", () => {
  it("starts with the clip at the plot's left edge and the content group clipped", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    const root = host.querySelector("g.line-chart-content")!;
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

  it("is halfway across the plot at half the duration with linear easing", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker,
    );
    ticker.tick(500);
    expect(rectWidth(host)).toBeCloseTo(PLOT_LEFT + (WIDTH - PLOT_LEFT) / 2, 6);
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

  it("does not re-animate on update(): re-renders fully revealed", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker,
    );
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.update({
      dataSet: sample,
      width: WIDTH,
      height: 300,
      xAxisDataType: "date_annual",
      progressiveDraw: { durationMs: 1000, easing: "linear" },
    });
    expect(rectWidth(host)).toBe(WIDTH);
    ticker.tick(100);
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
      dataSet: sample,
      width: WIDTH,
      height: 300,
      xAxisDataType: "date_annual",
      progressiveDraw: { durationMs: 1000, easing: "linear" },
    });
    const resumed = rectWidth(host);
    expect(resumed).toBeCloseTo(before, 3); // not full, not reset
    ticker.tick(300);
    expect(rectWidth(host)).toBeGreaterThan(resumed);
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("autoplay: false renders fully revealed until replay() is called", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear", autoplay: false } },
      ticker,
    );
    expect(rectWidth(host)).toBe(WIDTH);
    chart.replay!();
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });

  it("replay() re-runs the reveal after it finished", () => {
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

  it("destroy() mid-animation cancels cleanly (a later tick does not throw)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    ticker.tick(100);
    chart.destroy();
    host.remove();
    expect(() => ticker.tick(2000)).not.toThrow();
  });
});

describe("progressiveDraw tip labels (SVG)", () => {
  it("renders one tip label per series, following the reveal and settling at the line end", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear", tipLabel: true } },
      ticker,
    );
    const tips = () => Array.from(host.querySelectorAll<SVGTextElement>("text.mv-progressive-tip"));
    expect(tips().length).toBe(2);
    const xOf = (t: SVGTextElement) =>
      Number(/translate\(([-\d.]+)/.exec(t.getAttribute("transform") ?? "")?.[1]);
    const before = xOf(tips()[0]);
    ticker.tick(500);
    const mid = xOf(tips()[0]);
    expect(mid).toBeGreaterThan(before);
    ticker.tick(500);
    // Settled: labels show the series name and the final value.
    const texts = tips().map((t) => t.textContent);
    expect(texts).toContain("Alpha 30");
    expect(texts).toContain("Beta 6");
    chart.destroy();
    host.remove();
  });

  it("keeps tip labels outside the reveal clip (they are never clipped away)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear", tipLabel: true } },
      ticker,
    );
    const tip = host.querySelector("text.mv-progressive-tip")!;
    // Walk up: no ancestor of the tip label carries the clip-path.
    let node: Element | null = tip;
    while (node) {
      expect(node.getAttribute?.("clip-path") ?? null).toBeNull();
      node = node.parentElement;
    }
    chart.destroy();
    host.remove();
  });

  it("content 'name' renders only the series name", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, tipLabel: { content: "name" } } },
      ticker,
    );
    ticker.tick(1000);
    const texts = Array.from(host.querySelectorAll("text.mv-progressive-tip")).map(
      (t) => t.textContent,
    );
    expect(texts).toContain("Alpha");
    expect(texts).toContain("Beta");
    chart.destroy();
    host.remove();
  });

  it("no tip labels render when tipLabel is off", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ progressiveDraw: true }, ticker);
    expect(host.querySelectorAll("text.mv-progressive-tip").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});

describe("progressiveDraw hover gating (canvas mode)", () => {
  function mountAt(extra: Partial<LineChartProps>) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const ticker = createManualTicker();
    const chart = mountLineChart(
      host,
      { dataSet: sample, width: WIDTH, height: 300, xAxisDataType: "date_annual", ...extra },
      { ticker },
    );
    return { host, chart, ticker };
  }

  it("does not show a tooltip for points beyond the reveal position while animating", () => {
    const { host, chart, ticker } = mountAt({
      progressiveDraw: { durationMs: 1000, easing: "linear" },
      renderer: "canvas",
      sharedTooltip: true,
    });
    ticker.tick(100); // revealX = 60 + 0.1*540 = 114 -> only the 2016 column (x=60) revealed
    // Hover near the LAST year's column (far beyond revealX).
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 550, clientY: 150, bubbles: true }));
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    expect(tooltip.style.visibility).toBe("hidden");
    chart.destroy();
    host.remove();
  });

  it("shows the tooltip for revealed columns while animating", () => {
    const { host, chart, ticker } = mountAt({
      progressiveDraw: { durationMs: 1000, easing: "linear" },
      renderer: "canvas",
      sharedTooltip: true,
    });
    ticker.tick(500); // revealX = 330: 2016 (60) and 2017 (~206.7) revealed
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 150, bubbles: true }));
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    expect(tooltip.style.visibility).toBe("visible");
    chart.destroy();
    host.remove();
  });

  it("hovers normally once the animation completes", () => {
    const { host, chart, ticker } = mountAt({
      progressiveDraw: { durationMs: 1000, easing: "linear" },
      renderer: "canvas",
      sharedTooltip: true,
    });
    ticker.tick(1000);
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 540, clientY: 150, bubbles: true }));
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    expect(tooltip.style.visibility).toBe("visible");
    chart.destroy();
    host.remove();
  });
});

describe("progressiveDraw replayOnUpdate", () => {
  it("re-animates on update() when replayOnUpdate is true", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { progressiveDraw: { durationMs: 1000, easing: "linear", replayOnUpdate: true } },
      ticker,
    );
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.update({
      dataSet: sample,
      width: WIDTH,
      height: 300,
      xAxisDataType: "date_annual",
      progressiveDraw: { durationMs: 1000, easing: "linear", replayOnUpdate: true },
    });
    expect(rectWidth(host)).toBe(PLOT_LEFT);
    ticker.tick(1000);
    expect(rectWidth(host)).toBe(WIDTH);
    chart.destroy();
    host.remove();
  });
});

describe("progressiveDraw canvas mode", () => {
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
