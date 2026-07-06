import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountChoroplethMapChart } from "../src/engine/choroplethMapChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { ChoroplethDataItem, ChoroplethMapChartProps, GeoFeatureItem } from "../src/types";

// ChoroplethMap's "webgpu" renderer DELEGATES to the canvas-2D renderer (see
// choroplethMap/renderWebgpu.ts's header comment: arbitrary GeoJSON polygon
// tessellation is disproportionate scope for a PoC GPU path). Unlike every other
// chart's renderWebgpu.ts, there is no async GPU device to wait on and no
// canvas-2D "stopgap while the device loads" phase - it always paints
// synchronously and always returns true. These tests verify the SAME capability
// gate + host wiring contract every other chart's webgpu test file checks
// (downgrade to canvas when navigator.gpu is absent; dedicated <canvas> +
// host hit-test when "webgpu" is requested and gpu is mocked-present).

const geography: GeoFeatureItem[] = [
  {
    id: "A",
    name: "Alpha",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-10, 0],
          [-5, 0],
          [-5, 5],
          [-10, 5],
          [-10, 0],
        ],
      ],
    },
  },
];
const dataSet: ChoroplethDataItem[] = [{ id: "A", label: "Alpha", value: 10 }];

function setGpu(present: boolean): void {
  if (present) {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<ChoroplethMapChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountChoroplethMapChart(host, {
    geography,
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

describe("mountChoroplethMapChart - webgpu renderer (capability gate + delegated canvas paint)", () => {
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

  it("does not render SVG path.region marks in webgpu mode (delegated to canvas)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("path.region").length).toBe(0);
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
    chart.update({ geography, dataSet, title: "Demo", width: 600, height: 300, renderer: "svg" });
    expect(host.querySelector("canvas")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
