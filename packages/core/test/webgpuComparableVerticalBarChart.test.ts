import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountComparableVerticalBarChart } from "../src/engine/comparableVerticalBarChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { ComparableVerticalBarChartProps, ComparableBarDataPoint } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const dataSet: ComparableBarDataPoint[] = [
  { label: "Alpha One", valueBased: 10, valueCompared: 18 },
  { label: "Beta", valueBased: 30, valueCompared: 22 },
  { label: "Gamma", valueBased: 15, valueCompared: 15 },
];

function setGpu(present: boolean): void {
  if (present) {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<ComparableVerticalBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountComparableVerticalBarChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountComparableVerticalBarChart - webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG rect.bar marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("rect.bar").length).toBe(0);
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

  it("reuses the canvas-mode host hit-test: a mousemove over a bar fires onHighlightItem", () => {
    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 200, bubbles: true }));
    expect(highlighted.length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("removes the webgpu canvas when switching back to svg", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas")).not.toBeNull();
    chart.update({ dataSet, title: "Demo", width: 600, height: 300, renderer: "svg" });
    expect(host.querySelector("canvas")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
