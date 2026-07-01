import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountGapChart } from "../src/engine/gapChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { GapChartProps, GapDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const sample: GapDataItem[] = [
  { label: "Alpha One", value1: 10, value2: 30, difference: -20, date: "2024" },
  { label: "Beta", value1: 50, value2: 20, difference: 30, date: "2024" },
  { label: "Gamma", value1: 5, value2: 5, difference: 0, date: "2024" },
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

function mount(extra: Partial<GapChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountGapChart(host, { dataSet: sample, title: "Demo", width: 600, height: 300, ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountGapChart - webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG .gap-bar marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("rect.gap-bar").length).toBe(0);
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
    // Read the bar pixel coords from an SVG mount (same scales/model as webgpu).
    const svgMount = mount({ renderer: "svg" });
    const bar = Array.from(
      svgMount.host.querySelectorAll<SVGRectElement>("rect.gap-bar")
    ).find((r) => r.getAttribute("data-label") === "Beta")!;
    const x = Number(bar.getAttribute("x")) + Number(bar.getAttribute("width")) / 2;
    const y = Number(bar.getAttribute("y")) + 4; // bar is centred at y+4 (8px tall)
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    let highlighted: GapDataItem | null = null;
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (d) => {
        highlighted = d;
      },
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's pixel coordinates.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
    expect(highlighted).not.toBeNull();
    expect((highlighted as unknown as GapDataItem).label).toBe("Beta");
    chart.destroy();
    host.remove();
  });

  it("produces an identical ChartContext in webgpu and svg mode (renderer aside)", () => {
    setGpu(false); // downgrades to canvas, matching the existing svg/canvas parity test
    const a = mount({ renderer: "svg" });
    const b = mount({ renderer: "webgpu" });
    const ca = a.chart.getContext()!;
    const cb = b.chart.getContext()!;
    expect(ca.renderer).toBe("svg");
    expect(cb.renderer).toBe("canvas");
    const strip = (c: typeof ca) => ({ ...c, renderer: undefined });
    expect(strip(ca)).toEqual(strip(cb));
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });
});
