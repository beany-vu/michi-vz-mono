import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountRangeChart } from "../src/engine/rangeChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { RangeChartProps, RangeDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const band = (mins: number[], maxs: number[], start = 2016): RangeDataItem["series"] =>
  mins.map((valueMin, i) => ({ date: start + i, valueMin, valueMax: maxs[i], certainty: true }));

const dataSet: RangeDataItem[] = [
  { label: "Region A", color: "#f00", series: band([5, 8, 6], [12, 16, 14]) },
  { label: "Region B", color: "#0a0", series: band([2, 3, 4], [6, 7, 9]) },
];

function setGpu(present: boolean): void {
  if (present) {
    // A truthy gpu with no requestAdapter → isWebGPUAvailable() true, but device
    // acquisition fails gracefully (caught → null), so we hit the canvas fallback.
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<RangeChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRangeChart(host, {
    dataSet,
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    ...extra,
  });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountRangeChart - webgpu renderer (capability gate + fallback)", () => {
  it("does not throw when mounted with renderer=webgpu (gpu absent)", () => {
    setGpu(false);
    expect(() => {
      const { host, chart } = mount({ renderer: "webgpu" });
      chart.destroy();
      host.remove();
    }).not.toThrow();
  });

  it("does not throw when mounted with renderer=webgpu (gpu mocked-present)", () => {
    setGpu(true);
    expect(() => {
      const { host, chart } = mount({ renderer: "webgpu" });
      chart.destroy();
      host.remove();
    }).not.toThrow();
  });

  it("reports the EFFECTIVE renderer in getContext(): downgrades to canvas when gpu is absent", () => {
    setGpu(false);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(chart.getContext()!.renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("keeps renderer=webgpu in getContext() when gpu is present", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(chart.getContext()!.renderer).toBe("webgpu");
    chart.destroy();
    host.remove();
  });

  it("does not render SVG path.area marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("path.area").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("creates a dedicated <canvas> for the webgpu layer", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("falls back to a 2D canvas-2D stopgap when the GPU device cannot be acquired", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas.range-chart-canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("update()/destroy() work in webgpu mode without throwing", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(() => chart.update({ dataSet: dataSet.slice(0, 1), width: 600, height: 300, renderer: "webgpu" })).not.toThrow();
    expect(() => chart.destroy()).not.toThrow();
    expect(host.querySelectorAll("svg").length).toBe(0);
    host.remove();
  });
});
