import { describe, it, expect } from "vitest";
import {
  resolveIsNodata,
  evaluateDataState,
  isEmptyDataSet,
  shouldSkipScaffold,
} from "../src/state/dataState";
import { mountLineChart } from "../src/engine/lineChart";
import type { LineDataItem } from "../src/types";

describe("resolveIsNodata (mirrors legacy useDisplayIsNodata)", () => {
  it("honors a boolean override", () => {
    expect(resolveIsNodata(true, [1, 2])).toBe(true);
    expect(resolveIsNodata(false, [])).toBe(false);
  });
  it("honors a predicate", () => {
    expect(resolveIsNodata((d) => (d?.length ?? 0) < 2, [1])).toBe(true);
    expect(resolveIsNodata((d) => (d?.length ?? 0) < 2, [1, 2])).toBe(false);
  });
  it("defaults to empty-array / all-empty-series", () => {
    expect(resolveIsNodata(undefined, [])).toBe(true);
    expect(resolveIsNodata(undefined, [{ series: [] }, { series: [] }])).toBe(true);
    expect(resolveIsNodata(undefined, [{ series: [1] }])).toBe(false);
    expect(resolveIsNodata(undefined, [{ x: 1 }])).toBe(false); // flat non-empty
  });
});

describe("evaluateDataState", () => {
  it("loading wins over nodata", () => {
    expect(evaluateDataState({ isLoading: true, dataSet: [] })).toBe("loading");
  });
  it("nodata when empty, ready otherwise", () => {
    expect(evaluateDataState({ dataSet: [] })).toBe("nodata");
    expect(evaluateDataState({ dataSet: [{ series: [1] }] })).toBe("ready");
  });
});

describe("isEmptyDataSet", () => {
  it("matches resolveIsNodata's default emptiness heuristic", () => {
    expect(isEmptyDataSet([])).toBe(true);
    expect(isEmptyDataSet([{ series: [] }, { series: [] }])).toBe(true);
    expect(isEmptyDataSet([{ series: [1] }])).toBe(false);
    expect(isEmptyDataSet([{ x: 1 }])).toBe(false);
    expect(isEmptyDataSet(null)).toBe(false);
    expect(isEmptyDataSet(undefined)).toBe(false);
  });
});

describe("shouldSkipScaffold", () => {
  it("nodata always skips", () => {
    expect(shouldSkipScaffold("nodata", [])).toBe(true);
    expect(shouldSkipScaffold("nodata", [{ x: 1 }])).toBe(true);
  });
  it("loading skips only when there is nothing to draw (first paint)", () => {
    expect(shouldSkipScaffold("loading", [])).toBe(true);
    expect(shouldSkipScaffold("loading", [{ series: [] }])).toBe(true);
  });
  it("loading with stale data on screen keeps the scaffolding (refetch)", () => {
    expect(shouldSkipScaffold("loading", [{ series: [1] }])).toBe(false);
    expect(shouldSkipScaffold("loading", [{ x: 1 }])).toBe(false);
  });
  it("ready never skips", () => {
    expect(shouldSkipScaffold("ready", [])).toBe(false);
    expect(shouldSkipScaffold("ready", [{ x: 1 }])).toBe(false);
  });
});

describe("LineChart data-state (jsdom)", () => {
  const annual = (vals: number[], start = 2016) =>
    vals.map((value, i) => ({ date: start + i, value, certainty: true }));
  const sample: LineDataItem[] = [{ label: "A", color: "#f00", series: annual([1, 2, 3]) }];
  const mount = (extra: Record<string, unknown> = {}) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, {
      dataSet: sample,
      width: 400,
      height: 200,
      xAxisDataType: "date_annual",
      ...extra,
    });
    return { host, chart };
  };

  it("ready: marks drawn, no overlays, data-mv-state=ready", () => {
    const { host, chart } = mount();
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelectorAll("path.line").length).toBeGreaterThanOrEqual(1);
    expect(host.querySelector(".mv-loading")).toBeNull();
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("loading: default .mv-loading overlay, data-mv-state=loading", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-loading")).not.toBeNull();
    chart.destroy();
    host.remove();
  });

  it("loading + EMPTY dataSet (first paint): axes hidden, only the loading overlay", () => {
    const { host, chart } = mount({ isLoading: true, dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-x-axis")).toBeNull();
    expect(host.querySelector(".mv-y-axis")).toBeNull();
    expect(host.querySelectorAll("path.line").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("loading + stale data (refetch): axes and marks stay visible", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    expect(host.querySelector(".mv-x-axis")).not.toBeNull();
    expect(host.querySelectorAll("path.line").length).toBeGreaterThanOrEqual(1);
    chart.destroy();
    host.remove();
  });

  it("nodata (isNodata=true): .mv-nodata overlay, no marks, data-mv-state=nodata", () => {
    const { host, chart } = mount({ isNodata: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")?.textContent).toContain("No data");
    expect(host.querySelectorAll("path.line").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay: no vanilla overlay even when nodata (wrapper renders its own)", () => {
    const { host, chart } = mount({ isNodata: true, suppressDefaultOverlay: true });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    expect(host.querySelectorAll("path.line").length).toBe(0);
    chart.destroy();
    host.remove();
  });
});
