import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountPieChart } from "../src/engine/pieChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { PieChartProps, PieDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap — and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused. Real GPU
// pixel output is not testable headless; it is verified in-browser.

const data: PieDataItem[] = [
  { label: "Coffee", value: 100 },
  { label: "Tea", value: 60 },
  { label: "Cocoa", value: 40 },
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

function mount(extra: Partial<PieChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountPieChart(host, { dataSet: data, width: 400, height: 400, ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountPieChart — webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG path.slice marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("path.slice").length).toBe(0);
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

  it("reuses the canvas-mode host hit-test: a mousemove over a slice fires onHighlightItem", () => {
    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    const ctx = chart.getContext()!;
    if (ctx.chartType !== "pie-chart") throw new Error("expected pie-chart context");
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's cx/cy pixel coordinates. width=height=400, default margin 8/36, so
    // the plot centre sits at roughly (200, 222). Placing the point just above centre
    // lands inside the largest ("Coffee") slice, which starts at angle 0 (12 o'clock).
    host.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 200, clientY: 130, bubbles: true })
    );
    expect(highlighted.some((h) => h.includes("Coffee"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("produces identical context between svg and webgpu (renderer aside)", () => {
    setGpu(true);
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "webgpu" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });
});
