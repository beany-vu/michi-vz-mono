import { describe, it, expect, vi } from "vitest";
import { mountSymbolMapChart } from "../src/engine/symbolMapChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { SymbolMapChartProps, SymbolMapDataItem, GeoFeatureItem } from "../src/types";

const dataSet: SymbolMapDataItem[] = [
  { id: "usa", label: "United States", lng: -95, lat: 37, value: 100 },
  { id: "deu", label: "Germany", lng: 10, lat: 51, value: 60, valueSecond: 30 },
  { id: "vnm", label: "Vietnam", lng: 106, lat: 16, value: 20 },
];

function mount(extra: Partial<SymbolMapChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountSymbolMapChart(host, {
    dataSet,
    title: "Demo",
    width: 600,
    height: 400,
    ...extra,
  });
  return { host, chart };
}

describe("mountSymbolMapChart (jsdom, svg renderer)", () => {
  it("renders one circle.symbol per visible item with the colour-contract attributes", () => {
    const { host, chart } = mount();
    const circles = host.querySelectorAll<SVGCircleElement>("circle.symbol");
    expect(circles.length).toBe(3);
    const safes = Array.from(circles).map((c) => c.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("United States"));
    chart.destroy();
    host.remove();
  });

  it("draws a concentric circle.symbol-second for an item with valueSecond", () => {
    const { host, chart } = mount();
    const seconds = host.querySelectorAll("circle.symbol-second");
    expect(seconds.length).toBe(1);
    chart.destroy();
    host.remove();
  });

  it("does not draw circle.symbol-second for items without valueSecond", () => {
    const { host, chart } = mount({ dataSet: [dataSet[0], dataSet[2]] });
    expect(host.querySelectorAll("circle.symbol-second").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("draws no backdrop geography by default (dot-only look, legacy parity)", () => {
    const { host, chart } = mount();
    expect(host.querySelectorAll("path.geography").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("draws a muted backdrop path.geography per feature when `geography` is supplied", () => {
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
    const { host, chart } = mount({ geography, geographyColor: "#abcdef" });
    const path = host.querySelector<SVGPathElement>("path.geography");
    expect(path).not.toBeNull();
    expect(path!.getAttribute("fill")).toBe("#abcdef");
    chart.destroy();
    host.remove();
  });

  it("radiusVisibleMin hides items below the threshold (raw value, not scaled radius)", () => {
    const { host, chart } = mount({ radiusVisibleMin: 50 });
    expect(host.querySelectorAll("circle.symbol").length).toBe(1); // only value=100 passes
    chart.destroy();
    host.remove();
  });

  it("dims non-highlighted symbols when highlightItems is set", () => {
    const { host, chart } = mount({ highlightItems: ["Germany"] });
    const cells = Array.from(host.querySelectorAll<SVGGElement>("g.symbol-cell"));
    const germanyCell = cells.find((g) => g.querySelector('circle[data-label="Germany"]'));
    const otherCell = cells.find((g) => g.querySelector('circle[data-label="United States"]'));
    expect(germanyCell!.style.opacity).toBe("1");
    expect(otherCell!.style.opacity).toBe("0.3");
    chart.destroy();
    host.remove();
  });

  it("passes the full SymbolMapDataItem shape to the tooltip formatter", () => {
    const formatter = vi.fn((d: SymbolMapDataItem) => "tip");
    const { host, chart } = mount({ tooltipFormatter: formatter });
    const usCircle = host.querySelector<SVGCircleElement>('circle[data-label="United States"]')!;
    usCircle.parentElement!.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(formatter).toHaveBeenCalled();
    const arg = formatter.mock.calls[0][0];
    expect(arg.id).toBe("usa");
    expect(arg.value).toBe(100);
    chart.destroy();
    host.remove();
  });

  it("exposes a symbol-map-chart context with stats + a11yTable", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("symbol-map-chart");
    if (ctx.chartType === "symbol-map-chart") {
      expect(ctx.stats.locatedCount).toBe(3);
      expect(ctx.stats.visibleCount).toBe(3);
      expect(ctx.stats.hiddenCount).toBe(0);
      expect(ctx.stats.invalidCount).toBe(0);
      expect(ctx.symbols.length).toBe(3);
      expect(ctx.a11yTable.rows.length).toBe(3);
    }
    chart.destroy();
    host.remove();
  });

  it("defaults to the geoMercator projection", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    if (ctx.chartType === "symbol-map-chart") {
      expect(ctx.projection).toBe("geoMercator");
    }
    chart.destroy();
    host.remove();
  });

  it("emits onDataWarning for an item with invalid coordinates", () => {
    const onDataWarning = vi.fn();
    const { host, chart } = mount({
      dataSet: [...dataSet, { id: "bad", label: "Bad", lng: NaN, lat: 0, value: 1 }],
      onDataWarning,
    });
    expect(onDataWarning).toHaveBeenCalled();
    const warnings = onDataWarning.mock.calls[0][0];
    expect(warnings.some((w: { type: string }) => w.type === "invalid-geometry")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("mountSymbolMapChart (jsdom, canvas renderer)", () => {
  it("paints to a <canvas> and renders no circle.symbol marks", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(host.querySelector("canvas")).not.toBeNull();
    expect(host.querySelectorAll("circle.symbol").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("reports renderer: 'canvas' in getContext()", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(chart.getContext()!.renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("host-level point-in-circle hit-test fires onHighlightItem", () => {
    // Read a symbol's pixel coords from an SVG mount (same layout/model as canvas).
    const svgMount = mount({ renderer: "svg" });
    const cx = Number(svgMount.host.querySelector("circle.symbol")!.parentElement!.getAttribute("transform")!.match(/[\d.-]+/g)![0]);
    const cy = Number(svgMount.host.querySelector("circle.symbol")!.parentElement!.getAttribute("transform")!.match(/[\d.-]+/g)![1]);
    svgMount.chart.destroy();
    svgMount.host.remove();

    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true }));
    expect(highlighted.some((h) => h.length > 0)).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("mountSymbolMapChart - chrome quad", () => {
  it("isLoading sets data-mv-state=loading", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    chart.destroy();
    host.remove();
  });

  it("isNodata (empty dataSet default) sets data-mv-state=nodata and skips marks", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("circle.symbol").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("noDataLabel customises the no-data overlay text", () => {
    const { host, chart } = mount({ dataSet: [], noDataLabel: "Nothing here" });
    expect(host.textContent).toContain("Nothing here");
    chart.destroy();
    host.remove();
  });

  it("suppressDefaultOverlay hides the built-in overlays even in nodata state", () => {
    const { host, chart } = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("mountSymbolMapChart - svg vs canvas parity", () => {
  it("resolves the same colorsMapping in both renderers", () => {
    const svgMount = mount({ renderer: "svg" });
    const canvasMount = mount({ renderer: "canvas" });
    expect(svgMount.chart.getContext()!.colorsMapping).toEqual(canvasMount.chart.getContext()!.colorsMapping);
    svgMount.chart.destroy();
    svgMount.host.remove();
    canvasMount.chart.destroy();
    canvasMount.host.remove();
  });
});

describe("mountSymbolMapChart - update/destroy", () => {
  it("update() re-renders with new props", () => {
    const { host, chart } = mount();
    chart.update({ dataSet, title: "Updated", width: 600, height: 400 });
    expect(host.querySelector("text.title")?.textContent).toBe("Updated");
    chart.destroy();
    host.remove();
  });

  it("destroy() removes all chart DOM and the michi-vz classes", () => {
    const { host, chart } = mount();
    chart.destroy();
    expect(host.classList.contains("michi-vz")).toBe(false);
    expect(host.children.length).toBe(0);
  });

  it("two independent mounts of the same props settle to the IDENTICAL layout (deterministic context parity)", () => {
    const a = mount();
    const b = mount();
    const ctxA = a.chart.getContext()!;
    const ctxB = b.chart.getContext()!;
    expect(ctxA).toEqual(ctxB);
    a.chart.destroy();
    a.host.remove();
    b.chart.destroy();
    b.host.remove();
  });
});
