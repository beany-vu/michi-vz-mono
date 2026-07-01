import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountRadarChart } from "../src/engine/radarChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { RadarChartProps, RadarDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (setupRadarCanvasHover on the SVG
// overlay) is reused. Real GPU pixel output is not testable headless; it is
// verified in-browser.

const axes = ["Speed", "Power", "Range", "Agility", "Cost"];
const series: RadarDataItem[] = [
  { label: "Model A", color: "#f00", values: [8, 6, 7, 9, 5] },
  { label: "Model B", color: "#00f", values: [5, 9, 6, 4, 8] },
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

function mount(extra: Partial<RadarChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadarChart(host, { series, axes, width: 500, height: 500, ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountRadarChart - webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG polygon.radar-area marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("polygon.radar-area").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("still renders the polar grid (rings/spokes/labels) in webgpu mode", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu", rings: 4 });
    expect(host.querySelectorAll(".mv-radar-grid circle").length).toBe(4);
    expect(host.querySelectorAll(".mv-radar-grid line").length).toBe(5);
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

  it("reuses the canvas-mode forgiving hover: a mousemove near a vertex fires onHighlightItem", () => {
    // Read a pole's pixel coords from an SVG mount (same scales/model as webgpu).
    const svgMount = mount({ renderer: "svg" });
    const poly = Array.from(
      svgMount.host.querySelectorAll<SVGPolygonElement>("polygon.radar-area")
    ).find((p) => p.getAttribute("data-label") === "Model A")!;
    const [x, y] = poly.getAttribute("points")!.trim().split(" ")[0].split(",").map(Number);
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    const svg = host.querySelector("svg")!;
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's vertex pixel coordinates.
    svg.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Model A"))).toBe(true);
    chart.destroy();
    host.remove();
  });
});
