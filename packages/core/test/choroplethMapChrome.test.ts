import { describe, it, expect } from "vitest";
import { mountChoroplethMapChart } from "../src/engine/choroplethMapChart";
import type { ChoroplethDataItem, GeoFeatureItem } from "../src/types";

// Explicit isLoading/isNodata/noDataLabel/suppressDefaultOverlay quad coverage,
// mirroring verticalStackBarChrome.test.ts's pattern - choroplethMapChart.test.ts
// already covers isLoading/isNodata/noDataLabel/suppressDefaultOverlay inline, but
// the brief's checklist calls out this dedicated file explicitly for a first-class
// chart, same as B2.1's ComparableVerticalBarChart.

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

const mount = (extra: Record<string, unknown> = {}) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountChoroplethMapChart(host, {
    geography,
    dataSet,
    width: 600,
    height: 300,
    ...extra,
  });
  return { host, chart };
};

describe("ChoroplethMapChart chrome + legendData", () => {
  it("exposes legendData with dataLabelSafe on the context (colour-contract payload)", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext();
    expect(Array.isArray(ctx?.legendData)).toBe(true);
    expect(ctx?.legendData?.length).toBeGreaterThan(0);
    expect(ctx?.legendData?.[0]).toHaveProperty("dataLabelSafe");
    chart.destroy();
    host.remove();
  });

  it("ready: regions drawn, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelectorAll("path.region").length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  it("loading: data-mv-state=loading, default .mv-loading overlay", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("nodata (empty dataSet): no region marks, data-mv-state=nodata, .mv-nodata overlay", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("path.region").length).toBe(0);
    expect(host.querySelector(".mv-nodata")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("nodata with a custom noDataLabel", () => {
    const { host, chart } = mount({ dataSet: [], noDataLabel: "Nothing to map" });
    expect(host.textContent).toContain("Nothing to map");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay: no built-in overlay even while loading/nodata", () => {
    const loading = mount({ isLoading: true, suppressDefaultOverlay: true });
    expect(loading.host.querySelector(".mv-loading")).toBeNull();
    loading.chart.destroy();
    loading.host.remove();

    const nodata = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(nodata.host.querySelector(".mv-nodata")).toBeNull();
    nodata.chart.destroy();
    nodata.host.remove();
  });
});
