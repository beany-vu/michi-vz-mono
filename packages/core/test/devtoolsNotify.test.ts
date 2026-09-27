// The devtools hook must (a) never let a panel bug escape from the app's update(),
// and (b) hear about every render the engine starts on its own - timeline steps,
// the landed tween, line zoom, the bubble async settle, the WebGPU device upgrade
// and plugin use() - so History, Diff and the Profiler see the state on screen.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { enableDevtools, reportDevtoolsHit } from "../src/devtools/hook";
import { mountLineChart } from "../src/engine/lineChart";
import { mountBarBellChart } from "../src/engine/barBellChart";
import { mountBubbleChart } from "../src/engine/bubbleChart";
import { mountScatterChart } from "../src/engine/scatterChart";
import { createManualTicker } from "../src/animation/ticker";
import { drawMarksWebgpu, emptyBatch } from "../src/webgpu/marks";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import type { BarBellDataRow, LineChartProps, ScatterDataPoint } from "../src/types";

interface G {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: unknown;
}
const g = globalThis as unknown as G;

const lineProps: LineChartProps = {
  dataSet: [
    {
      label: "A",
      series: [
        { date: 2020, value: 1, certainty: true },
        { date: 2021, value: 3, certainty: true },
        { date: 2022, value: 2, certainty: true },
      ],
    },
  ],
  width: 400,
  height: 200,
  xAxisDataType: "number",
};

function host(): HTMLDivElement {
  const h = document.createElement("div");
  document.body.appendChild(h);
  return h;
}

/** Enable devtools and count hook notifications. */
function counting(): { count: () => number } {
  const hook = enableDevtools();
  let n = 0;
  hook.subscribe(() => n++);
  return { count: () => n };
}

beforeEach(() => {
  g.__MICHI_VZ_DEVTOOLS__ = undefined;
  g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("devtools hook isolates listener errors", () => {
  it("a throwing subscriber never throws out of chart.update(), and later subscribers still run", () => {
    const hook = enableDevtools();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    hook.subscribe(() => {
      throw new Error("panel bug");
    });
    let later = 0;
    hook.subscribe(() => later++);
    const chart = mountLineChart(host(), lineProps);
    expect(() => chart.update({ ...lineProps, title: "next" })).not.toThrow();
    expect(later).toBeGreaterThan(0);
    expect(error).toHaveBeenCalled();
    expect(String(error.mock.calls[0].join(" "))).toContain("panel bug");
    chart.destroy();
  });

  it("throwing hit and timing listeners are isolated too", () => {
    const hook = enableDevtools();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    hook.subscribeHits(() => {
      throw new Error("hit bug");
    });
    hook.subscribeTimings(() => {
      throw new Error("timing bug");
    });
    const h = host();
    expect(() => reportDevtoolsHit(h, 1, 2, "A")).not.toThrow();
    const chart = mountLineChart(h, lineProps);
    expect(() => chart.update({ ...lineProps, title: "next" })).not.toThrow();
    expect(error.mock.calls.map((c) => c.join(" ")).join("\n")).toContain("hit bug");
    expect(error.mock.calls.map((c) => c.join(" ")).join("\n")).toContain("timing bug");
    chart.destroy();
  });
});

describe("engine-started renders notify the devtools hook", () => {
  const barBellData: BarBellDataRow[] = [
    { period: "2018", date: "Region A", Fruit: 10, Veg: 5 },
    { period: "2019", date: "Region A", Fruit: 14, Veg: 8 },
    { period: "2019", date: "Region B", Fruit: 9, Veg: 12 },
  ];

  it("a timeline step notifies (bar-bell stepForward)", () => {
    const { count } = counting();
    const chart = mountBarBellChart(host(), {
      dataSet: barBellData,
      keys: ["Fruit", "Veg"],
      width: 600,
      height: 300,
      timeline: true,
    });
    const rowsBefore = chart.getContext()!.a11yTable.rows.length;
    const before = count();
    chart.timeline!()!.stepForward();
    expect(count()).toBeGreaterThan(before);
    expect(chart.getContext()!.a11yTable.rows.length).toBeGreaterThan(rowsBefore);
    chart.destroy();
  });

  it("a tween notifies once when it lands, not on every frame", () => {
    const { count } = counting();
    const ticker = createManualTicker();
    const scatter: ScatterDataPoint[] = [
      { label: "Alpha", x: 1, y: 2, d: 5, date: "2018" },
      { label: "Alpha", x: 2, y: 4, d: 6, date: "2019" },
    ];
    const chart = mountScatterChart(
      host(),
      {
        dataSet: scatter,
        width: 600,
        height: 300,
        xAxisDataType: "number",
        timeline: { tweenMs: 400, easing: "linear" },
      },
      { ticker, motion: { prefersReduced: () => false } },
    );
    chart.timeline!()!.stepForward();
    const afterStep = count();
    ticker.tick(100);
    ticker.tick(100);
    expect(count()).toBe(afterStep); // mid-tween frames stay silent
    ticker.tick(300); // lands
    expect(count()).toBe(afterStep + 1);
    chart.destroy();
  });

  it("line zoom notifies", () => {
    const { count } = counting();
    const chart = mountLineChart(host(), { ...lineProps, zoom: true });
    const before = count();
    chart.setZoomDomain!([2020, 2021]);
    expect(count()).toBe(before + 1);
    chart.resetZoom!();
    expect(count()).toBe(before + 2);
    chart.destroy();
  });

  it("the bubble async settle notifies when the layout lands", async () => {
    const { count } = counting();
    const h = host();
    const chart = mountBubbleChart(h, {
      dataSet: [
        { label: "Germany", value: 100 },
        { label: "France", value: 60 },
      ],
      width: 600,
      height: 480,
      layoutMode: "async",
    });
    const before = count();
    await vi.waitFor(() => {
      expect(h.querySelectorAll("circle.bubble").length).toBe(2);
    });
    expect(count()).toBeGreaterThan(before);
    chart.destroy();
  });

  it("plugin use() notifies", () => {
    const { count } = counting();
    const chart = mountLineChart(host(), lineProps);
    const before = count();
    chart.use!({ name: "noop" });
    expect(count()).toBe(before + 1);
    chart.destroy();
  });

  describe("the WebGPU device upgrade (onReady)", () => {
    beforeEach(() => __resetGPUDeviceForTest());
    afterEach(() => {
      delete (navigator as unknown as { gpu?: unknown }).gpu;
      __resetGPUDeviceForTest();
    });

    it("notifies after the engine's onReady re-render", async () => {
      const device = { lost: new Promise(() => {}) };
      Object.defineProperty(navigator, "gpu", {
        value: { requestAdapter: async () => ({ requestDevice: async () => device }) },
        configurable: true,
      });
      const { count } = counting();
      let readyCalls = 0;
      let countAtReady = -1;
      const onReady = (): void => {
        readyCalls++;
        countAtReady = count();
      };
      const drawn = drawMarksWebgpu(document.createElement("canvas"), emptyBatch(), {
        width: 10,
        height: 10,
        onReady,
      });
      expect(drawn).toBe(false);
      await vi.waitFor(() => expect(readyCalls).toBe(1));
      // the notify follows the re-render, so the panel reads the upgraded state
      expect(count()).toBe(countAtReady + 1);
    });
  });
});
