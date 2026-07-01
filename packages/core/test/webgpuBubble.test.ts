import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountBubbleChart } from "../src/engine/bubbleChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { BubbleChartProps, BubbleDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const data: BubbleDataItem[] = [
  { label: "Germany", value: 100, partial: 72 },
  { label: "France", value: 60, partial: 30 },
  { label: "Spain", value: 40, partial: 10 },
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

function mount(extra: Partial<BubbleChartProps> & { dataSet: BubbleDataItem[] }) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountBubbleChart(host, { width: 600, height: 480, title: "Demo", ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountBubbleChart - webgpu renderer (capability gate + fallback)", () => {
  it("does not throw when mounted with renderer=webgpu (gpu absent)", () => {
    setGpu(false);
    expect(() => {
      const { host, chart } = mount({ dataSet: data, renderer: "webgpu" });
      chart.destroy();
      host.remove();
    }).not.toThrow();
  });

  it("does not throw when mounted with renderer=webgpu (gpu mocked-present)", () => {
    setGpu(true);
    expect(() => {
      const { host, chart } = mount({ dataSet: data, renderer: "webgpu" });
      chart.destroy();
      host.remove();
    }).not.toThrow();
  });

  it("reports the EFFECTIVE renderer in getContext(): downgrades to canvas when gpu is absent", () => {
    setGpu(false);
    const { host, chart } = mount({ dataSet: data, renderer: "webgpu" });
    expect(chart.getContext()!.renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("keeps renderer=webgpu in getContext() when gpu is present", () => {
    setGpu(true);
    const { host, chart } = mount({ dataSet: data, renderer: "webgpu" });
    expect(chart.getContext()!.renderer).toBe("webgpu");
    chart.destroy();
    host.remove();
  });

  it("does not render SVG circle.bubble marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ dataSet: data, renderer: "webgpu" });
    expect(host.querySelectorAll("circle.bubble").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("creates a dedicated <canvas> for the webgpu layer", () => {
    setGpu(true);
    const { host, chart } = mount({ dataSet: data, renderer: "webgpu" });
    expect(host.querySelector("canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("reuses the canvas-mode host hit-test: a mousemove over a bubble fires onHighlightItem", () => {
    // Read a bubble's pixel coords from an SVG mount (same layout/model as webgpu).
    const svgMount = mount({ dataSet: data, renderer: "svg", showSplit: false });
    const dot = svgMount.host.querySelector<SVGCircleElement>("circle.bubble")!;
    const cx = Number(dot.getAttribute("cx"));
    const cy = Number(dot.getAttribute("cy"));
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      dataSet: data,
      renderer: "webgpu",
      showSplit: false,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's x/y pixel coordinates.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true }));
    expect(highlighted.some((h) => h.length > 0)).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("produces identical context to canvas mode (renderer aside)", () => {
    setGpu(false);
    const a = mount({ dataSet: data, renderer: "canvas" });
    const b = mount({ dataSet: data, renderer: "webgpu" });
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
