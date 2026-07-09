import { describe, it, expect, afterEach } from "vitest";
import { mountAreaChart } from "../src/engine/areaChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { AreaChartProps, AreaDataRow } from "../src/types";

const series: AreaDataRow[] = [
  { date: 2020, "Fruit Sales": 10, Veg: 5, Dairy: 3 },
  { date: 2021, "Fruit Sales": 12, Veg: 6, Dairy: 4 },
  { date: 2022, "Fruit Sales": 9, Veg: 8, Dairy: 6 },
];
const keys = ["Fruit Sales", "Veg", "Dairy"];

// Default margin left 60/right 50, width 600, xAxisDataType "number" (linear scale):
// 2020@60, 2021@305, 2022@550. Targets: px+8 except the last period (full width).
const WIDTH = 600;
const T0 = 68;
const T1 = 313;
const T2 = WIDTH;

function mount(extra: Partial<AreaChartProps> = {}, ticker?: ManualTicker, motion?: MotionPreference) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountAreaChart(
    host,
    { series, keys, width: WIDTH, height: 300, xAxisDataType: "number", ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("AreaChart timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("AreaChart timeline (cumulative)", () => {
  it("mounts revealed up to the FIRST period, control shows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true }, ticker);
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2020");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual([2020, 2021, 2022]);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps to the next period", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(200);
    const mid = clipWidth(host);
    expect(mid).toBeGreaterThan(T0);
    expect(mid).toBeLessThan(T1);
    ticker.tick(200);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2021");
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
      ticker
    );
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
    ticker.tick(500);
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
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

describe("AreaChart timeline canvas mode", () => {
  it("mounts revealed to the first period and sweeps without throwing (jsdom has no 2d context; redraw no-ops)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { easing: "linear", tweenMs: 400 }, renderer: "canvas" },
      ticker
    );
    // The control still drives via the SVG-side clip bookkeeping even though the
    // visible paint is the canvas layer's revealX redraw.
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

describe("AreaChart timeline webgpu mode", () => {
  afterEach(() => {
    setGpu(false);
    __resetGPUDeviceForTest();
  });

  it("is inert under webgpu: no control/clip, full frame always painted (mirrors progressiveDraw)", () => {
    setGpu(true); // gpu present but device acquisition fails -> canvas-2D stopgap paints,
    // yet the EFFECTIVE renderer stays "webgpu" (resolveRenderer), so the timeline
    // gate (`r.renderer !== "webgpu"`) tears its control down, same as progressiveDraw.
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
