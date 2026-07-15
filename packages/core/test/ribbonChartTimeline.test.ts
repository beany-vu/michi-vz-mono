import { describe, it, expect, afterEach } from "vitest";
import { scaleBand } from "d3-scale";
import { mountRibbonChart } from "../src/engine/ribbonChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { RibbonChartProps, RibbonDataRow } from "../src/types";

const series: RibbonDataRow[] = [
  { date: "2001", "Fruit Sales": 10, Veg: 5 },
  { date: "2002", "Fruit Sales": 14, Veg: 8 },
  { date: "2003", "Fruit Sales": 9, Veg: 12 },
];
const keys = ["Fruit Sales", "Veg"];

// Default margin left 60/right 50, width 600, 3 date categories on a band scale
// (padding 0.1). Each period's target is the band's RIGHT edge (+8px headroom),
// except the last period, which reveals to the full width (600).
const WIDTH = 600;
const bandX = scaleBand<string>().domain(["2001", "2002", "2003"]).range([60, 550]).padding(0.1);
const T0 = bandX("2001")! + bandX.bandwidth() + 8;
const T1 = bandX("2002")! + bandX.bandwidth() + 8;
const T2 = WIDTH;

function mount(
  extra: Partial<RibbonChartProps> = {},
  ticker?: ManualTicker,
  motion?: MotionPreference,
) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRibbonChart(
    host,
    { series, keys, width: WIDTH, height: 300, ...extra },
    { ticker, motion },
  );
  return { host, chart };
}

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("RibbonChart timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("RibbonChart timeline (cumulative)", () => {
  it("mounts revealed up to the FIRST period, control shows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true }, ticker);
    expect(clipWidth(host)).toBeCloseTo(T0, 6);
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2001");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2001", "2002", "2003"]);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps the columns/ribbons to the next period", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(200);
    const mid = clipWidth(host);
    expect(mid).toBeGreaterThan(T0);
    expect(mid).toBeLessThan(T1);
    ticker.tick(200);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2002");
    chart.destroy();
    host.remove();
  });

  it("the LAST period reveals the full width", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.seek(2);
    ticker.tick(400);
    expect(clipWidth(host)).toBe(T2);
    chart.destroy();
    host.remove();
  });

  it("interpolate: false jump-cuts", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { interpolate: false } }, ticker);
    chart.timeline!()!.stepForward();
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    chart.destroy();
    host.remove();
  });

  it("timeline wins over progressiveDraw when both are set", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: true, progressiveDraw: { durationMs: 1000, easing: "linear" } },
      ticker,
    );
    expect(clipWidth(host)).toBeCloseTo(T0, 6);
    ticker.tick(500);
    expect(clipWidth(host)).toBeCloseTo(T0, 6);
    chart.destroy();
    host.remove();
  });

  it("destroy() mid-sweep is safe", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(100);
    chart.destroy();
    host.remove();
    expect(() => ticker.tick(2000)).not.toThrow();
  });
});

describe("RibbonChart timeline canvas mode", () => {
  it("mounts and sweeps without throwing (jsdom has no 2d context; redraw no-ops)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { easing: "linear", tweenMs: 400 }, renderer: "canvas" },
      ticker,
    );
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(() => {
      chart.timeline!()!.stepForward();
      for (let i = 0; i < 10; i++) ticker.tick(100);
    }).not.toThrow();
    chart.destroy();
    host.remove();
  });
});

function setGpu(present: boolean): void {
  if (present) {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

describe("RibbonChart timeline webgpu mode", () => {
  afterEach(() => {
    setGpu(false);
    __resetGPUDeviceForTest();
  });

  it("is inert under webgpu: no control/clip, full frame always painted (mirrors progressiveDraw)", () => {
    setGpu(true);
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true, renderer: "webgpu" }, ticker);
    expect(chart.getContext()!.renderer).toBe("webgpu");
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline!()).toBeNull();
    expect(() => ticker.tick(1000)).not.toThrow();
    chart.destroy();
    host.remove();
  });
});
