import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { DataWarning, FountainChartProps, FountainDataItem } from "../src/types";

// WebGPU is never really available in jsdom (no GPUCanvasContext, no adapter), so
// these tests verify the CAPABILITY GATE and the FALLBACK path: with navigator.gpu
// absent the engine downgrades to canvas; with it mocked-present the engine enters
// the webgpu branch, fails to get a device, and paints the canvas-2D stopgap. The
// hover is the one host-level hit-test every renderer shares. The GPU mark batch
// itself is tested in fountainRenderers.test.ts; real pixels are checked in a browser.

const dataSet: FountainDataItem[] = [
  { label: "Jet d'Eau", value: 140, low: 110, high: 170, samples: [110, 130, 140, 150, 170] },
  { label: "Zurich", value: 90, spread: 10 },
  { label: "Bern", value: 60, spread: 25 },
];

function setGpu(present: boolean): void {
  if (present) {
    // A truthy gpu with no requestAdapter: isWebGPUAvailable() is true, but device
    // acquisition fails gracefully (caught, null), so we hit the canvas fallback.
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

function mount(extra: Partial<FountainChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(host, { dataSet, width: 600, height: 360, ...extra });
  return { host, chart };
}

beforeEach(() => __resetGPUDeviceForTest());
afterEach(() => {
  setGpu(false);
  __resetGPUDeviceForTest();
});

describe("mountFountainChart - webgpu renderer (capability gate + fallback)", () => {
  it("does not throw when mounted with renderer=webgpu (gpu absent or mocked-present)", () => {
    for (const present of [false, true]) {
      setGpu(present);
      expect(() => {
        const { host, chart } = mount({ renderer: "webgpu" });
        chart.destroy();
        host.remove();
      }).not.toThrow();
    }
  });

  it("getContext().renderer says what painted: canvas when gpu is absent", () => {
    setGpu(false);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(chart.getContext()!.renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("getContext().renderer says canvas while the GPU device is not ready (the stopgap painted)", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(chart.getContext()!.renderer).toBe("canvas");
    // both layers exist: the webgpu canvas (waiting) and the 2D stopgap
    expect(host.querySelector("canvas.fountainChart-webgpu-canvas")).not.toBeNull();
    expect(host.querySelector("canvas.fountain-chart-canvas")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("paints no SVG marks in webgpu mode; the words stay SVG", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(host.querySelectorAll("path.mv-fountain-jet").length).toBe(0);
    expect(host.querySelectorAll("g.mv-fountain-jet-group").length).toBe(0);
    expect(host.querySelectorAll("g.mv-fountain-value-label").length).toBe(3);
    chart.destroy();
    host.remove();
  });

  it("hover uses the shared host hit-test: the same jet as svg at the same pointer", () => {
    const svgMount = mount();
    const dots = Array.from(svgMount.host.querySelectorAll("circle.mv-fountain-value")).map(
      (c) => ({ label: c.getAttribute("data-label"), x: Number(c.getAttribute("cx")) }),
    );
    svgMount.chart.destroy();
    svgMount.host.remove();

    setGpu(true);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    for (const d of dots) {
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: d.x, clientY: 200 }));
    }
    expect(highlighted).toEqual(dots.map((d) => [d.label]));
    chart.destroy();
    host.remove();
  });

  it("progressiveDraw is ignored on the GPU layer, with a warning", () => {
    setGpu(true);
    let warned: DataWarning[] = [];
    const { host, chart } = mount({
      renderer: "webgpu",
      progressiveDraw: true,
      onDataWarning: (w) => (warned = w),
    });
    expect(host.querySelector("clipPath")).toBeNull();
    expect(
      warned.some((w) => w.type === "ignored-option" && w.message.includes("`progressiveDraw`")),
    ).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("switching back to svg drops both canvas layers and draws SVG marks", () => {
    setGpu(true);
    const { host, chart } = mount({ renderer: "webgpu" });
    expect(() => chart.update({ dataSet, width: 600, height: 360, renderer: "svg" })).not.toThrow();
    expect(host.querySelectorAll("path.mv-fountain-jet").length).toBe(3);
    expect(host.querySelector("canvas")).toBeNull();
    expect(chart.getContext()!.renderer).toBe("svg");
    chart.destroy();
    host.remove();
  });
});
