import { describe, it, expect } from "vitest";
import { mountGapChart } from "../src/engine/gapChart";
import type { GapDataItem } from "../src/types";

// Chrome wiring is NEW for GapChart: the isLoading/isNodata props existed on the
// type but the engine never called applyChartChrome — an empty dataSet fell
// through to a [0,0] x-domain whose zero-span scale parked a lone tick at the
// pixel-range midpoint (the thd TradeSimulation "centered axis" bug).

const sample: GapDataItem[] = [
  { label: "Alpha", value1: 10, value2: 30, difference: -20, date: "2024" },
  { label: "Beta", value1: 50, value2: 20, difference: 30, date: "2024" },
];

const mount = (extra: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountGapChart(host, {
    dataSet: sample,
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
};

describe("GapChart chrome (data-mv-state + scaffold gating)", () => {
  it("ready: axes drawn, no overlays, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelector(".mv-x-axis")).not.toBeNull();
    expect(host.querySelector(".mv-y-axis")).not.toBeNull();
    expect(host.querySelector(".mv-loading")).toBeNull();
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("nodata (empty dataSet): no axes, .mv-nodata overlay, data-mv-state=nodata", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-x-axis")).toBeNull();
    expect(host.querySelector(".mv-y-axis")).toBeNull();
    expect(host.querySelector(".mv-nodata")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("loading + EMPTY dataSet (first paint): no axes, .mv-loading overlay", () => {
    const { host, chart } = mount({ dataSet: [], isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-x-axis")).toBeNull();
    expect(host.querySelector(".mv-y-axis")).toBeNull();
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("loading + stale data (refetch): axes stay visible", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-x-axis")).not.toBeNull();
    expect(host.querySelector(".mv-y-axis")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay: no vanilla overlay (wrapper renders its own), axes still gated", () => {
    const { host, chart } = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    expect(host.querySelector(".mv-x-axis")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("update from data to empty drops the axes (no stale scaffold lingers)", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-x-axis")).not.toBeNull();
    chart.update({ dataSet: [], width: 600, height: 300 });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-x-axis")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
