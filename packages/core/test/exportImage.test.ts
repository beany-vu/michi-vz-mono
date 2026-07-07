import { describe, it, expect } from "vitest";
import { chartToStyledSvgString, chartToStyledSvgDataUri } from "../src/export/image";
import { mountRangeChart } from "../src/engine/rangeChart";
import type { RangeChartProps, RangeDataItem } from "../src/types";

// NOTE: chartToPngDataUrl is NOT unit-tested here - jsdom lacks a real Image loader and
// canvas.toDataURL rasterizer, so the PNG path is verified live (Playwright) in the
// consumer. These tests cover the deterministic SVG-string serialization, which is the
// actual adoptedStyleSheets bug fix.

const dataSet: RangeDataItem[] = [
  {
    label: "Region A",
    color: "#f00",
    series: [
      { date: 2016, valueMin: 5, valueMax: 12, certainty: true },
      { date: 2017, valueMin: 8, valueMax: 16, certainty: true },
    ],
  },
];

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountRangeChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
  } as RangeChartProps);
  return { host, chart };
}

describe("chartToStyledSvgString", () => {
  it("inlines CORE_CSS so adopted-stylesheet rules survive serialization", () => {
    const { host, chart } = mount();
    const svg = chartToStyledSvgString(host);
    // CORE_CSS is inlined as a <style> in the SVG (the whole point - these rules live
    // in document.adoptedStyleSheets and are otherwise invisible to XMLSerializer).
    expect(svg).toContain("<style");
    expect(svg).toContain(".mv-grid");
    expect(svg).toContain(".mv-axis-label");
    chart.destroy();
    host.remove();
  });

  it("makes the <svg> root the .michi-vz ancestor and a standalone document", () => {
    const { host, chart } = mount();
    const svg = chartToStyledSvgString(host);
    // Root must carry .michi-vz (CORE_CSS uses descendant selectors) + the chart-type class.
    expect(svg).toMatch(/<svg[^>]*class="[^"]*michi-vz[^"]*"/);
    expect(svg).toContain("michi-vz-range-chart");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    // Carries the actual marks (range bands render path.area).
    expect(svg).toContain("data-label-safe");
    chart.destroy();
    host.remove();
  });

  it("returns '' when the host has no <svg> yet", () => {
    const empty = document.createElement("div");
    expect(chartToStyledSvgString(empty)).toBe("");
    expect(chartToStyledSvgDataUri(empty)).toBe("");
  });
});

describe("chartToStyledSvgDataUri", () => {
  it("wraps the styled SVG in an image/svg+xml data URI", () => {
    const { host, chart } = mount();
    const uri = chartToStyledSvgDataUri(host);
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(uri)).toContain(".mv-grid");
    chart.destroy();
    host.remove();
  });
});
