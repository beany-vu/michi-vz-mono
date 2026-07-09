import { describe, it, expect, afterEach } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { MotionPreference } from "../src/animation/reducedMotion";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { FountainChartProps, FountainDataItem } from "../src/types";

const WIDTH = 600;
const HEIGHT = 320;

const snapshot: FountainDataItem[] = [
  { label: "Jet d'Eau", value: 140, spread: 30 },
  { label: "Zurich", value: 90, spread: 10 },
  { label: "Bern", value: 60, spread: 25 },
];

const trend: FountainDataItem[] = [
  { label: "Flow", value: 50, spread: 8, date: 2001 },
  { label: "Flow", value: 70, spread: 10, date: 2002 },
  { label: "Flow", value: 95, spread: 14, date: 2003 },
];

// Default margin left 60/right 40, width 600, xAxisDataType "number" (linear
// scale, .nice()): domain [2001,2003] stays nice -> 2001@60, 2002@310, 2003@560.
// Targets: px+8 except the last period, which reveals to the full width (600).
const T0 = 68;
const T1 = 318;
const T2 = WIDTH;

function mount(data: FountainDataItem[], extra: Partial<FountainChartProps> = {}, ticker?: ManualTicker, motion?: MotionPreference) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(
    host,
    { dataSet: data, title: "Demo", width: WIDTH, height: HEIGHT, ...extra },
    { ticker, motion }
  );
  return { host, chart };
}

const clipWidth = (host: HTMLElement): number => {
  const rects = host.querySelectorAll("clipPath rect");
  expect(rects.length).toBeGreaterThan(0);
  return Number(rects[rects.length - 1]!.getAttribute("width"));
};

describe("FountainChart timeline off by default", () => {
  it("renders no control, no clip, no timeline()", () => {
    const { host, chart } = mount(trend, { xAxisDataType: "number" });
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    chart.destroy();
    host.remove();
  });
});

describe("FountainChart timeline (cumulative, trend mode)", () => {
  it("mounts revealed up to the FIRST period, control shows it", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(trend, { xAxisDataType: "number", timeline: true }, ticker);
    expect(clipWidth(host)).toBeCloseTo(T0, 3);
    expect(host.querySelector(".mv-timeline")).not.toBeNull();
    expect(host.querySelector(".mv-timeline-period")!.textContent).toBe("2001");
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual([2001, 2002, 2003]);
    chart.destroy();
    host.remove();
  });

  it("stepForward() sweeps the jets to the next period", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 } },
      ticker
    );
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
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 } },
      ticker
    );
    chart.timeline!()!.seek(2);
    ticker.tick(400);
    expect(clipWidth(host)).toBe(T2);
    chart.destroy();
    host.remove();
  });

  it("interpolate: false jump-cuts", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { interpolate: false } },
      ticker
    );
    chart.timeline!()!.stepForward();
    expect(clipWidth(host)).toBeCloseTo(T1, 0);
    chart.destroy();
    host.remove();
  });

  it("timeline wins over progressiveDraw when both are set", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      {
        xAxisDataType: "number",
        timeline: true,
        progressiveDraw: { durationMs: 1000, easing: "linear" },
      },
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
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 } },
      ticker
    );
    chart.timeline!()!.stepForward();
    ticker.tick(100);
    chart.destroy();
    host.remove();
    expect(() => ticker.tick(2000)).not.toThrow();
  });
});

describe("FountainChart timeline (snapshot mode is categorical: no control)", () => {
  it("renders no control/clip even with timeline set (categorical x has no periods)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(snapshot, { timeline: true }, ticker);
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    const tl = chart.timeline!();
    expect(tl).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("FountainChart timeline canvas mode (trend)", () => {
  it("mounts and sweeps without throwing (jsdom has no 2d context; redraw no-ops)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: { easing: "linear", tweenMs: 400 }, renderer: "canvas" },
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

describe("FountainChart timeline webgpu mode (trend)", () => {
  afterEach(() => {
    setGpu(false);
    __resetGPUDeviceForTest();
  });

  it("is inert under webgpu: no control/clip, full frame always painted (mirrors progressiveDraw)", () => {
    setGpu(true);
    const ticker = createManualTicker();
    const { host, chart } = mount(
      trend,
      { xAxisDataType: "number", timeline: true, renderer: "webgpu" },
      ticker
    );
    expect(chart.getContext()!.renderer).toBe("webgpu");
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(host.querySelector("clipPath")).toBeNull();
    expect(chart.timeline!()).toBeNull();
    expect(() => ticker.tick(1000)).not.toThrow();
    chart.destroy();
    host.remove();
  });
});
