import { describe, it, expect } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import type { ScatterDataPoint } from "../src/types";

// Chrome wiring is NEW for ScatterChart (same dead-prop class of bug as GapChart):
// isLoading/isNodata existed on the type but the engine never set data-mv-state
// nor gated its axes, so an empty dataSet rendered a degenerate axis scaffold.

const sample: ScatterDataPoint[] = [
  { x: 10, y: 20, label: "Alpha" },
  { x: 30, y: 40, label: "Beta" },
];

const mount = (extra: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(host, {
    dataSet: sample,
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
};

describe("ScatterChart chrome (data-mv-state + scaffold gating)", () => {
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
});
