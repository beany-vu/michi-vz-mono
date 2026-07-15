import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountSankeyChart } from "../src/engine/sankeyChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { SankeyChartProps, SankeyNodeItem, SankeyLinkItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap - and
// crucially the canvas-mode INTERACTION layer (host hit-test) is reused.
// Real GPU pixel output is not testable headless; it is verified in-browser.

const nodes: SankeyNodeItem[] = [{ id: "France" }, { id: "Germany" }, { id: "EU" }, { id: "Asia" }];
const links: SankeyLinkItem[] = [
  { source: "France", target: "EU", value: 40 },
  { source: "France", target: "Asia", value: 20 },
  { source: "Germany", target: "EU", value: 30 },
  { source: "Germany", target: "Asia", value: 10 },
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

function mount(extra: Partial<SankeyChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountSankeyChart(host, {
    nodes,
    links,
    width: 600,
    height: 400,
    title: "Trade",
    ...extra,
  });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountSankeyChart - webgpu renderer (capability gate + fallback)", () => {
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

  it("does not render SVG rect.node/path.link marks in webgpu mode (painted to the GPU/canvas layer)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("rect.node").length).toBe(0);
    expect(host.querySelectorAll("path.link").length).toBe(0);
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

  it("reuses the canvas-mode host hit-test: a mousemove over a node fires onHighlightItem", () => {
    // Read a node's rect coords from an SVG mount (same layout/model as webgpu).
    const svgMount = mount({ renderer: "svg" });
    const rect = svgMount.host.querySelector<SVGRectElement>('rect.node[data-label="France"]')!;
    const x = Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) / 2;
    const y = Number(rect.getAttribute("y")) + Number(rect.getAttribute("height")) / 2;
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // jsdom getBoundingClientRect() is all-zero, so clientX/clientY map straight to
    // the model's node rect pixel coordinates.
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
    expect(highlighted.some((h) => h.includes("France"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("produces identical context in svg and webgpu (renderer aside)", () => {
    setGpu(false); // webgpu downgrades to canvas here; context shape must still match svg
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
