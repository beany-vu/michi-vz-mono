import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (host hit-test, crosshair) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const dataSet: ScatterDataPoint[] = [
  { label: "Point A", x: 1, y: 2, d: 5 },
  { label: "Beta", x: 3, y: 6, d: 10 },
  { label: "Gamma", x: 5, y: 10, d: 2 },
  { label: "Delta", x: 7, y: 14, d: 8 },
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

function mount(extra: Partial<ScatterChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(host, {
    dataSet,
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

describe("mountScatterChart - webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG .scatter-point marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll(".scatter-point").length).toBe(0);
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

  it("reuses the canvas-mode crosshair overlay in webgpu mode", () => {
    setGpu(true);
    const on = mount({ renderer: "webgpu", showCrosshair: true });
    expect(on.host.querySelector(".mv-crosshair")).not.toBeNull();
    on.chart.destroy();
    on.host.remove();
  });

  it("reuses the canvas-mode host hit-test: a mousemove over a point fires onHighlightItem", () => {
    // Read the point pixel coords from an SVG mount (same scales/model as webgpu).
    const svgMount = mount({ renderer: "svg" });
    const dot = Array.from(
      svgMount.host.querySelectorAll<SVGCircleElement>("circle.scatter-point")
    ).find((c) => c.getAttribute("data-label") === "Point A")!;
    const cx = Number(dot.getAttribute("cx"));
    const cy = Number(dot.getAttribute("cy"));
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's cx/cy pixel coordinates.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Point A"))).toBe(true);
    chart.destroy();
    host.remove();
  });
});
