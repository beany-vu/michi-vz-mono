import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountFanChart } from "../src/engine/fanChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { FanChartContext, FanChartProps } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const props: FanChartProps = {
  title: "Revenue",
  xAxisDataType: "number",
  dataSet: [
    {
      label: "A",
      series: [
        { date: 2018, value: 10, certainty: true },
        { date: 2019, value: 20, certainty: true },
        { date: 2020, value: 30, certainty: true },
        { date: 2021, value: 40, certainty: false },
        { date: 2022, value: 50, certainty: false },
      ],
      bands: [
        {
          level: 0.95,
          series: [
            { date: 2020, valueMin: 30, valueMax: 30, valueMedium: 30 },
            { date: 2021, valueMin: 35, valueMax: 45, valueMedium: 40 },
            { date: 2022, valueMin: 40, valueMax: 60, valueMedium: 50 },
          ],
        },
      ],
    },
  ],
};

function setGpu(present: boolean): void {
  if (present) {
    // A truthy gpu with no requestAdapter → isWebGPUAvailable() true, but device
    // acquisition fails gracefully (caught → null), so we hit the canvas fallback.
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<FanChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFanChart(host, { ...props, ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountFanChart - webgpu renderer (capability gate + fallback)", () => {
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
    expect((chart.getContext() as FanChartContext).renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("keeps renderer=webgpu in getContext() when gpu is present", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect((chart.getContext() as FanChartContext).renderer).toBe("webgpu");
    chart.destroy();
    host.remove();
  });

  it("does not render SVG .mv-fan-band marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll(".mv-fan-band").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("creates a dedicated <canvas> for the webgpu layer", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas.fanChart-webgpu-canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("paints the canvas-2D stopgap (fan-chart-canvas) alongside the webgpu canvas when the device is not ready", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas.fan-chart-canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("reuses the canvas-mode host hit-test in webgpu mode: mousemove near the line fires onHighlightItem", () => {
    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      width: 1000,
      height: 500,
      yAxisDomain: [0, 60],
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // number x in [2018,2022] -> range [60,950]; date 2018 -> x=60; value 10 in
    // y-domain [0,60] -> range [450,50]; value 10 -> y = 450 - 400*(10/60) ≈ 383.3.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 383, bubbles: true }));
    expect(highlighted.some((h) => h.includes("A"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("removes the webgpu canvas when switching back to svg", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas.fanChart-webgpu-canvas")).not.toBeNull();
    chart.update({ ...props, renderer: "svg" });
    expect(host.querySelector("canvas.fanChart-webgpu-canvas")).toBeNull();
    expect(host.querySelectorAll(".mv-fan-band").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });
});
