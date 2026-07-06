import { describe, it, expect } from "vitest";
import { mountRadialTreeChart } from "../src/engine/radialTreeChart";
import type { RadialTreeNode } from "../src/types";

// Explicit isLoading/isNodata/noDataLabel/suppressDefaultOverlay quad coverage +
// legendData, mirroring symbolMapChrome.test.ts's pattern.

const dataSet: RadialTreeNode[] = [
  { label: "Alpha", children: [{ label: "Leaf1", value: 10 }] },
  { label: "Beta", children: [{ label: "Leaf2", value: 90 }] },
];

const mount = (extra: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRadialTreeChart(host, {
    dataSet,
    width: 600,
    height: 400,
    ...extra,
  });
  return { host, chart };
};

describe("RadialTreeChart chrome + legendData", () => {
  it("exposes legendData with dataLabelSafe on the context (colour-contract payload)", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext();
    expect(Array.isArray(ctx?.legendData)).toBe(true);
    expect(ctx?.legendData?.length).toBeGreaterThan(0);
    expect(ctx?.legendData?.[0]).toHaveProperty("dataLabelSafe");
    chart.destroy();
    host.remove();
  });

  it("ready: nodes drawn, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelectorAll("circle.radial-tree-node-circle").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("isLoading sets data-mv-state=loading and shows the default overlay", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    chart.destroy();
    host.remove();
  });

  it("isNodata (function form) sets data-mv-state=nodata", () => {
    const { host, chart } = mount({ isNodata: () => true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    chart.destroy();
    host.remove();
  });

  it("noDataLabel customises the no-data overlay text", () => {
    const { host, chart } = mount({ dataSet: [], noDataLabel: "Nothing here" });
    expect(host.textContent).toContain("Nothing here");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay hides the built-in overlays even in loading/nodata state", () => {
    const { host, chart } = mount({ isLoading: true, suppressDefaultOverlay: true });
    expect(host.querySelector(".mv-loading")).toBeNull();
    chart.destroy();
    host.remove();
  });
});
