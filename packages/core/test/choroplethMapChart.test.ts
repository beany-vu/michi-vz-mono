import { describe, it, expect, vi } from "vitest";
import { mountChoroplethMapChart } from "../src/engine/choroplethMapChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import type { ChoroplethDataItem, ChoroplethMapChartProps, GeoFeatureItem } from "../src/types";

// Small hand-curated geography: two plain squares (A, B), one square-with-hole
// (C, unmatched by design - exercises noDataColor + the donut geometry), and one
// MultiPolygon (D, two disjoint squares under one id).
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
  {
    id: "B",
    name: "Beta",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [10, 0],
          [15, 0],
          [15, 5],
          [10, 5],
          [10, 0],
        ],
      ],
    },
  },
  {
    id: "C",
    name: "Gamma",
    geometry: {
      type: "Polygon",
      coordinates: [
        // exterior ring
        [
          [30, 0],
          [50, 0],
          [50, 20],
          [30, 20],
          [30, 0],
        ],
        // hole
        [
          [35, 5],
          [45, 5],
          [45, 15],
          [35, 15],
          [35, 5],
        ],
      ],
    },
  },
  {
    id: "D",
    name: "Delta",
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [60, 0],
            [65, 0],
            [65, 5],
            [60, 5],
            [60, 0],
          ],
        ],
        [
          [
            [70, 0],
            [75, 0],
            [75, 5],
            [70, 5],
            [70, 0],
          ],
        ],
      ],
    },
  },
];

const dataSet: ChoroplethDataItem[] = [
  { id: "A", label: "Alpha", value: 10 },
  { id: "B", label: "Beta", value: 60 },
  { id: "D", label: "Delta", value: 90 },
];

function mount(extra: Partial<ChoroplethMapChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountChoroplethMapChart(host, {
    geography,
    dataSet,
    title: "Demo",
    width: 600,
    height: 400,
    ...extra,
  });
  return { host, chart };
}

describe("mountChoroplethMapChart (jsdom, svg renderer)", () => {
  it("renders one path.region per geography feature with the colour-contract attributes", () => {
    const { host, chart } = mount();
    const paths = host.querySelectorAll<SVGPathElement>("path.region");
    expect(paths.length).toBe(4);
    const safes = Array.from(paths).map((p) => p.getAttribute("data-label-safe"));
    expect(safes).toContain(sanitizeForClassName("A"));
    expect(safes).toContain(sanitizeForClassName("D"));
    chart.destroy();
    host.remove();
  });

  it("fills unmatched features (no dataSet row) with noDataColor", () => {
    const { host, chart } = mount({ noDataColor: "#abcdef" });
    const gamma = host.querySelector<SVGPathElement>('path.region[data-label="C"]')!;
    expect(gamma.getAttribute("fill")).toBe("#abcdef");
    chart.destroy();
    host.remove();
  });

  it("joins by id by default", () => {
    const { host, chart } = mount();
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!;
    // matched -> not the no-data fallback colour
    expect(alpha.getAttribute("fill")).not.toBe("#d2d7dd");
    chart.destroy();
    host.remove();
  });

  it("joins by name when joinBy: 'name' (legacy MapChoropleth default parity)", () => {
    const byName: ChoroplethDataItem[] = [
      { id: "zzz-not-a-real-id", label: "Alpha", value: 5 },
      { id: "zzz-not-a-real-id-2", label: "Beta", value: 5 },
    ];
    const { host, chart } = mount({ dataSet: byName, joinBy: "name", noDataColor: "#000000" });
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!;
    expect(alpha.getAttribute("fill")).not.toBe("#000000");
    chart.destroy();
    host.remove();
  });

  it("colorsMapping wins over colorScale (Data Availability categorical use case)", () => {
    const { host, chart } = mount({
      colorScale: { domain: [50], range: ["#111111", "#222222"] },
      colorsMapping: { Alpha: "#ff00ff" },
    });
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!;
    expect(alpha.getAttribute("fill")).toBe("#ff00ff");
    chart.destroy();
    host.remove();
  });

  it("colorScale assigns via scaleThreshold, including values outside the domain", () => {
    const { host, chart } = mount({
      colorScale: { domain: [50], range: ["#111111", "#222222"] },
    });
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!; // value 10 < 50
    const beta = host.querySelector<SVGPathElement>('path.region[data-label="B"]')!; // value 60 > 50
    expect(alpha.getAttribute("fill")).toBe("#111111");
    expect(beta.getAttribute("fill")).toBe("#222222");
    chart.destroy();
    host.remove();
  });

  it("disabledItems excludes a row from the join (its feature renders noDataColor)", () => {
    const { host, chart } = mount({ disabledItems: ["Alpha"], noDataColor: "#999999" });
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!;
    expect(alpha.getAttribute("fill")).toBe("#999999");
    chart.destroy();
    host.remove();
  });

  it("dims non-highlighted regions when highlightItems is set", () => {
    const { host, chart } = mount({ highlightItems: ["Alpha"] });
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!;
    const beta = host.querySelector<SVGPathElement>('path.region[data-label="B"]')!;
    expect(alpha.style.opacity).toBe("1");
    expect(beta.style.opacity).toBe("0.3");
    chart.destroy();
    host.remove();
  });

  it("uses the fallback {id, name} tooltip shape for unmatched features", () => {
    const formatter = vi.fn((d: ChoroplethDataItem | { id: string; name?: string }) => "tip");
    const { host, chart } = mount({ tooltipFormatter: formatter });
    const gamma = host.querySelector<SVGPathElement>('path.region[data-label="C"]')!;
    gamma.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(formatter).toHaveBeenCalledWith({ id: "C", name: "Gamma" });
    chart.destroy();
    host.remove();
  });

  it("passes the full ChoroplethDataItem to the tooltip formatter for matched features", () => {
    const formatter = vi.fn((d: ChoroplethDataItem | { id: string; name?: string }) => "tip");
    const { host, chart } = mount({ tooltipFormatter: formatter });
    const alpha = host.querySelector<SVGPathElement>('path.region[data-label="A"]')!;
    alpha.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(formatter).toHaveBeenCalledWith(dataSet[0]);
    chart.destroy();
    host.remove();
  });

  it("exposes a choropleth-map-chart context with matched/unmatched stats + a11yTable", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    expect(ctx.chartType).toBe("choropleth-map-chart");
    if (ctx.chartType === "choropleth-map-chart") {
      expect(ctx.stats.featureCount).toBe(4);
      expect(ctx.stats.matchedCount).toBe(3);
      expect(ctx.stats.unmatchedCount).toBe(1);
      expect(ctx.stats.min).toEqual({ id: "A", label: "Alpha", value: 10 });
      expect(ctx.stats.max).toEqual({ id: "D", label: "Delta", value: 90 });
      expect(ctx.regions.length).toBe(4);
      expect(ctx.a11yTable.headers).toEqual(["Region", "Value", "Matched"]);
      expect(ctx.a11yTable.rows.length).toBe(4);
    }
    chart.destroy();
    host.remove();
  });

  it("defaults to the geoRobinson projection", () => {
    const { host, chart } = mount();
    const ctx = chart.getContext()!;
    if (ctx.chartType === "choropleth-map-chart") {
      expect(ctx.projection).toBe("geoRobinson");
    }
    chart.destroy();
    host.remove();
  });

  it("emits onDataWarning for a dataSet id that matches no feature", () => {
    const onDataWarning = vi.fn();
    const { host, chart } = mount({
      dataSet: [...dataSet, { id: "not-a-feature", label: "Ghost", value: 1 }],
      onDataWarning,
    });
    expect(onDataWarning).toHaveBeenCalled();
    const warnings = onDataWarning.mock.calls[0][0];
    expect(warnings.some((w: { type: string }) => w.type === "unmatched-dataset-id")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("mountChoroplethMapChart (jsdom, canvas renderer)", () => {
  it("paints to a <canvas> and renders no path.region marks", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(host.querySelector("canvas")).not.toBeNull();
    expect(host.querySelectorAll("path.region").length).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("reports renderer: 'canvas' in getContext()", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    const ctx = chart.getContext()!;
    expect(ctx.renderer).toBe("canvas");
    chart.destroy();
    host.remove();
  });

  it("host-level point-in-geometry hit-test fires onHighlightItem over a region", () => {
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // Any in-bounds move triggers at least an empty-array clear; assert the
    // handler is reachable and never throws (exact pixel hit-testing against the
    // legacy width/1.7/PI projection formula is covered by the dedicated
    // choroplethMap/hitTest.ts unit tests).
    expect(() =>
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 50, bubbles: true })),
    ).not.toThrow();
    expect(highlighted.length).toBeGreaterThan(0);
    chart.destroy();
    host.remove();
  });

  // B3.8: same coordinate-space bug class as SymbolMapChart's B3.7 (mono
  // f2cc94d) - `onHostMove` measured the pointer in HOST/full-svg space
  // (`ev.clientX - svg.getBoundingClientRect().left`) but compared it against
  // the projection built from margin-EXCLUDED innerWidth/innerHeight plot
  // space, with no (margin.left, margin.top) subtraction. That left every
  // polygon short by a CONSTANT margin vector, so hover/hit-testing was
  // offset by the margin on canvas/webgpu. A DEFAULT (or zero) margin can't
  // expose this in jsdom, since `getBoundingClientRect()` always returns an
  // all-zero rect there too - a non-default margin is required to distinguish
  // "no correction" from "correct plot-local coords" when both svgRect.left
  // and svgRect.top are 0. Unlike B3.7's circles, polygons are area targets:
  // no MIN_HIT_RADIUS-style forgiveness is added here, purely the
  // coordinate-space correction.
  it("B3.8 root cause fixed: canvas hit-test converts host-space pointer coords to plot-local BEFORE point-in-polygon, accounting for a non-zero margin", () => {
    // Deliberately different from DEFAULT_MARGIN ({top:40,right:10,bottom:10,left:10})
    // so this can't pass by accidental coincidence with the default.
    const margin = { top: 51, right: 7, bottom: 7, left: 23 };

    // Read region A's settled plot-local pixel centroid from an SVG mount with
    // the SAME margin (and therefore the same projection/innerWidth/innerHeight).
    // Only the FIRST subpath (up to the first "Z") is region A's actual small
    // square ring - geoRobinson's rotate/center combo makes d3-geo append a
    // second, much larger frame-outline subpath to the SAME `d` string (a
    // pre-existing d3-geo-projection quirk, orthogonal to this bug), which
    // would badly skew a naive whole-string centroid.
    const svgMount = mount({ renderer: "svg", margin });
    const d = svgMount.host
      .querySelector<SVGPathElement>('path.region[data-label="A"]')!
      .getAttribute("d")!;
    const firstRing = d.match(/^M[^Z]*Z/)![0];
    const nums = firstRing.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < nums.length; i += 2) {
      xs.push(nums[i]);
      ys.push(nums[i + 1]);
    }
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    svgMount.chart.destroy();
    svgMount.host.remove();

    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      margin,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // In jsdom, `svg.getBoundingClientRect()` is always the zero rect, so a
    // real browser's host-space `ev.clientX/Y` (which WOULD equal
    // margin.left/top + the plot-local centroid) is simulated by adding the
    // margin directly here.
    host.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: cx + margin.left,
        clientY: cy + margin.top,
        bubbles: true,
      }),
    );
    expect(highlighted.some((h) => h.includes("Alpha"))).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("mountChoroplethMapChart - chrome quad", () => {
  it("isLoading sets data-mv-state=loading and shows the default overlay", () => {
    const { host, chart } = mount({ isLoading: true });
    expect(host.getAttribute("data-mv-state")).toBe("loading");
    chart.destroy();
    host.remove();
  });

  it("isNodata (empty dataSet default) sets data-mv-state=nodata and skips region marks", () => {
    const { host, chart } = mount({ dataSet: [] });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelectorAll("path.region").length).toBe(0);
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
    const { host, chart } = mount({ dataSet: [], suppressDefaultOverlay: true });
    expect(host.querySelector(".mv-nodata")).toBeNull();
    chart.destroy();
    host.remove();
  });
});

describe("mountChoroplethMapChart - svg vs canvas parity", () => {
  it("resolves the same fill colours in both renderers", () => {
    const svgMount = mount({ renderer: "svg" });
    const canvasMount = mount({ renderer: "canvas" });
    const svgCtx = svgMount.chart.getContext()!;
    const canvasCtx = canvasMount.chart.getContext()!;
    expect(svgCtx.colorsMapping).toEqual(canvasCtx.colorsMapping);
    svgMount.chart.destroy();
    svgMount.host.remove();
    canvasMount.chart.destroy();
    canvasMount.host.remove();
  });
});

describe("mountChoroplethMapChart - update/destroy", () => {
  it("update() re-renders with new props", () => {
    const { host, chart } = mount();
    chart.update({ geography, dataSet, title: "Updated", width: 600, height: 400 });
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
});
