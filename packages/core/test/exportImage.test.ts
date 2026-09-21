import { describe, it, expect } from "vitest";
import { chartToStyledSvgString, chartToStyledSvgDataUri } from "../src/export/image";
import { mountRangeChart } from "../src/engine/rangeChart";
import type { RangeChartProps, RangeDataItem } from "../src/types";
import { mountGaugeChart } from "../src/engine/gaugeChart";

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

describe("chartToStyledSvgString folds overlay svgs in", () => {
  const props = {
    dataSet: [{ label: "Greece", value: 7.6, color: "#0d5eaf" }],
    min: 3.3,
    max: 16,
    startAngle: -90,
    sweepAngle: 180,
    valueMarker: true as const,
    ticks: [{ value: 7.27, label: "AVG" }],
    width: 300,
    height: 200,
  };

  it("carries the gauge annotations from the canvas-mode overlay into the export", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGaugeChart(host, { ...props, renderer: "canvas" });
    const out = chartToStyledSvgString(host);
    expect(out).toContain('class="mv-gauge-marker"');
    expect(out).toContain(">AVG<");
    // One root only: overlay CHILDREN are folded in, never a nested <svg>.
    expect(out.match(/<svg/g)).toHaveLength(1);
    chart.destroy();
    host.remove();
  });

  it("svg-mode annotations were already inside the exported svg", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountGaugeChart(host, { ...props, renderer: "svg" });
    expect(chartToStyledSvgString(host)).toContain('class="gauge-annotations"');
    chart.destroy();
    host.remove();
  });
});
