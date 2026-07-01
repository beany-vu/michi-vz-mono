import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { FountainChartProps, FountainDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap — and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused. Real GPU
// pixel output is not testable headless; it is verified in-browser (see scatter).

const dataSet: FountainDataItem[] = [
  { label: "Jet d'Eau", value: 140, spread: 30 },
  { label: "Zurich", value: 90, spread: 10 },
  { label: "Bern", value: 60, spread: 25 },
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

function mount(extra: Partial<FountainChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(host, { dataSet, width: 600, height: 320, ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountFountainChart — webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG jet marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("path.mv-fountain-jet").length).toBe(0);
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

  it("reuses the canvas-mode host hit-test: a mousemove over a jet fires onHighlightItem", () => {
    // Read the jet hit-region from an SVG mount is indirect (paths, not rects), so
    // mount webgpu directly and move over the plot centre where the first jet sits.
    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's pixel coordinates. Aim at the first jet's approximate nozzle x.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 260, bubbles: true }));
    expect(highlighted.length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("falls back to canvas without throwing when gpu is present but update() switches back to svg", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(() => chart.update({ dataSet, width: 600, height: 320, renderer: "svg" })).not.toThrow();
    expect(host.querySelectorAll("path.mv-fountain-jet").length).toBeGreaterThan(0);
    expect(host.querySelector("canvas")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
