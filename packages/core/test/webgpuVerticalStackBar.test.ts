import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountVerticalStackBarChart } from "../src/engine/verticalStackBarChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { VerticalStackBarChartProps, VerticalStackBarDataSet } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap — and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const sample: VerticalStackBarDataSet[] = [
  {
    seriesKey: "Africa",
    seriesKeyAbbreviation: "AF",
    series: [
      { date: "2001", Africa: "10" },
      { date: "2002", Africa: "12" },
    ],
  },
  {
    seriesKey: "Non-LDC",
    seriesKeyAbbreviation: "NL",
    series: [
      { date: "2001", "Non-LDC": "20" },
      { date: "2002", "Non-LDC": "18" },
    ],
  },
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

function mount(extra: Partial<VerticalStackBarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountVerticalStackBarChart(host, {
    dataSet: sample,
    title: "Demo",
    width: 600,
    height: 360,
    ...extra,
  });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountVerticalStackBarChart — webgpu renderer (capability gate + fallback)", () => {
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
    // Read a bar's pixel coords from an SVG mount (same scales/model as webgpu).
    const svgMount = mount({ renderer: "svg" });
    const bar = svgMount.host.querySelector<SVGRectElement>("rect.bar")!;
    const x = Number(bar.getAttribute("x")) + Number(bar.getAttribute("width")) / 2;
    const y = Number(bar.getAttribute("y")) + Number(bar.getAttribute("height")) / 2;
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's pixel coordinates.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
    expect(highlighted.length).toBeGreaterThan(0);
    expect(highlighted[highlighted.length - 1].length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("falls back to canvas cleanly when switching from webgpu to svg", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelector("canvas")).not.toBeNull();
    chart.update({ dataSet: sample, title: "Demo", width: 600, height: 360, renderer: "svg" });
    expect(host.querySelector("canvas")).toBeNull();
    expect(host.querySelectorAll("rect.bar").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });
});
