import { describe, it, expect, afterEach } from "vitest";
import { mountRangeChart } from "../src/engine/rangeChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { RangeChartProps, RangeDataItem } from "../src/types";

const band = (mins: number[], maxs: number[], start = 2016): RangeDataItem["series"] =>
  mins.map((valueMin, i) => ({ date: start + i, valueMin, valueMax: maxs[i], certainty: true }));

const dataSet: RangeDataItem[] = [
  { label: "Region A", color: "#f00", series: band([5, 8, 6, 7], [12, 16, 14, 15]) },
  { label: "Region B", color: "#0a0", series: band([2, 3, 4, 5], [6, 7, 9, 10]) },
];

// Default margin left 60/right 50, width 600, xAxisDataType "date_annual" (time scale),
// 4 years: 2016@60, 2017@223.33, 2018@386.67, 2019@550. Targets: px+8 except the
// last period, which reveals to the full width (600).
const WIDTH = 600;
const T0 = 68;
const T1 = 60 + 490 / 3 + 8;
const T3 = WIDTH;

function mount(extra: Partial<RangeChartProps> = {}, ticker?: ManualTicker, motion?: MotionPreference) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRangeChart(
    host,
    { dataSet, width: WIDTH, height: 300, xAxisDataType: "date_annual", ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("RangeChart timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("RangeChart timeline (cumulative)", () => {
  it("mounts revealed up to the FIRST year, control shows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true }, ticker);
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2016");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual([2016, 2017, 2018, 2019]);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps the bands to the next year", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(200);
    const mid = clipWidth(host);
    expect(mid).toBeGreaterThan(T0);
    expect(mid).toBeLessThan(T1);
    ticker.tick(200);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2017");
    chart.destroy();
    host.remove();
  });

  it("the LAST year reveals the full width", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.seek(3);
    ticker.tick(400);
    expect(clipWidth(host)).toBe(T3);
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

describe("RangeChart timeline canvas mode", () => {
  it("mounts and sweeps without throwing (jsdom has no 2d context; redraw no-ops)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      { timeline: { easing: "linear", tweenMs: 400 }, renderer: "canvas" },
      ticker
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

describe("RangeChart timeline webgpu mode", () => {
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
