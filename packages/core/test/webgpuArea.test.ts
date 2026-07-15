import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountAreaChart } from "../src/engine/areaChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { AreaChartProps, AreaDataRow } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const series: AreaDataRow[] = [
  { date: 2020, "Fruit Sales": 10, Veg: 5, Dairy: 3 },
  { date: 2021, "Fruit Sales": 12, Veg: 6, Dairy: 4 },
  { date: 2022, "Fruit Sales": 9, Veg: 8, Dairy: 6 },
];
const keys = ["Fruit Sales", "Veg", "Dairy"];

function setGpu(present: boolean): void {
  if (present) {
    // A truthy gpu with no requestAdapter → isWebGPUAvailable() true, but device
    // acquisition fails gracefully (caught → null), so we hit the canvas fallback.
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<AreaChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountAreaChart(host, {
    series,
    keys,
    width: 600,
    height: 300,
    xAxisDataType: "number",
    ...extra,
  });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountAreaChart - webgpu renderer (capability gate + fallback)", () => {
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

  it("still renders the SVG hover-capture overlay so hit-testing keeps working in webgpu mode", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("rect.tpRef")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("update() can switch renderer from webgpu to svg and back without throwing", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(() => {
      chart.update({
        series,
        keys,
        width: 600,
        height: 300,
        xAxisDataType: "number",
        renderer: "svg",
      });
      chart.update({
        series,
        keys,
        width: 600,
        height: 300,
        xAxisDataType: "number",
        renderer: "webgpu",
      });
    }).not.toThrow();
    expect(host.querySelectorAll("path.area").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});
