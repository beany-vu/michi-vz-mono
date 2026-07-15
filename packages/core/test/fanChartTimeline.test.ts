import { describe, it, expect, afterEach } from "vitest";
import { mountFanChart } from "../src/engine/fanChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { FanChartProps, FanDataItem } from "../src/types";

const dataSet: FanDataItem[] = [
  {
    label: "A",
    series: [
      { date: 2018, value: 10, certainty: true },
      { date: 2019, value: 20, certainty: true },
      { date: 2020, value: 30, certainty: true },
      { date: 2021, value: 40, certainty: false },
    ],
    bands: [
      {
        level: 0.95,
        series: [
          { date: 2020, valueMin: 30, valueMax: 30, valueMedium: 30 },
          { date: 2021, valueMin: 35, valueMax: 45, valueMedium: 40 },
        ],
      },
    ],
  },
];

// Default margin left 60/right 50, width 600, xAxisDataType "number" (linear scale)
// over the line domain [2018..2021] (span 3): px = 60, 223.33, 386.67, 550.
// Targets: px+8 except the last period, which reveals to the full width (600).
const WIDTH = 600;
const T0 = 68;
const T1 = 60 + 490 / 3 + 8;
const T3 = WIDTH;

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

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("FanChart timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("FanChart timeline (cumulative)", () => {
  it("mounts revealed up to the FIRST period, control shows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true }, ticker);
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2018");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual([2018, 2019, 2020, 2021]);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps the bands + line to the next period", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    chart.timeline!()!.stepForward();
    ticker.tick(200);
    const mid = clipWidth(host);
    expect(mid).toBeGreaterThan(T0);
    expect(mid).toBeLessThan(T1);
    ticker.tick(200);
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2019");
    chart.destroy();
    host.remove();
  });

  it("the LAST period reveals the full width", () => {
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
      ticker,
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

describe("FanChart timeline canvas mode", () => {
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

describe("FanChart timeline webgpu mode", () => {
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
