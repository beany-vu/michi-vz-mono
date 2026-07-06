import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountSymbolMapChart } from "../src/engine/symbolMapChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { SymbolMapChartProps, SymbolMapDataItem } from "../src/types";

// SymbolMap's "webgpu" renderer DELEGATES to the canvas-2D renderer (see
// symbolMap/renderWebgpu.ts's header comment - same rationale as ChoroplethMap's:
// the OPTIONAL backdrop is arbitrary GeoJSON, so tessellating it correctly on the
// GPU is disproportionate scope). No async device, no canvas-2D "stopgap while
// loading" phase - it always paints synchronously and always returns true. These
// tests verify the SAME capability-gate + host-wiring contract every other
// chart's webgpu test file checks.

const dataSet: SymbolMapDataItem[] = [
  { id: "a", label: "Alpha", lng: 10, lat: 20, value: 10 },
  { id: "b", label: "Beta", lng: -10, lat: -20, value: 90 },
];

function setGpu(present: boolean): void {
  if (present) {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<SymbolMapChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountSymbolMapChart(host, {
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

describe("mountSymbolMapChart - webgpu renderer (capability gate + delegated canvas paint)", () => {
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

  it("downgrades to canvas in getContext() when gpu is absent", () => {
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

  it("does not render SVG circle.symbol marks in webgpu mode (delegated to canvas)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("circle.symbol").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("creates a dedicated <canvas> for the (delegated) webgpu layer", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("reuses the canvas-mode host hit-test: a mousemove fires onHighlightItem", () => {
    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100, bubbles: true }));
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
