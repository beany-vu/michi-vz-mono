import { describe, it, expect, vi } from "vitest";
import { mountSymbolMapChart } from "../src/engine/symbolMapChart";
import { sanitizeForClassName } from "../src/math/sanitize";
import { SYMBOL_MIN_HIT_RADIUS } from "../src/symbolMap/hitTest";
import type { SymbolMapChartProps, SymbolMapDataItem, GeoFeatureItem } from "../src/types";

const dataSet: SymbolMapDataItem[] = [
  { id: "usa", label: "United States", lng: -95, lat: 37, value: 100 },
  { id: "deu", label: "Germany", lng: 10, lat: 51, value: 60, valueSecond: 30 },
  { id: "vnm", label: "Vietnam", lng: 106, lat: 16, value: 20 },
];

// B3.7: a small/large pair with radiusRange endpoints that map EXACTLY (linear
// scale, domain endpoints -> range endpoints) so the rendered radii are known
// precisely: "Tiny" always renders at r=3 (below SYMBOL_MIN_HIT_RADIUS=8),
// "Huge" always at r=30 (already above it).
const smallLargeDataSet: SymbolMapDataItem[] = [
  { id: "tiny", label: "Tiny", lng: -60, lat: 0, value: 1 },
  { id: "huge", label: "Huge", lng: 60, lat: 0, value: 100 },
];
const smallLargeRadiusRange: [number, number] = [3, 30];

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

  it("B3.7: a small (r=3) mark gets an invisible circle.symbol-hit floored to SYMBOL_MIN_HIT_RADIUS; a large (r=30) mark's is unchanged", () => {
    const { host, chart } = mount({ dataSet: smallLargeDataSet, radiusRange: smallLargeRadiusRange });
    const cells = Array.from(host.querySelectorAll<SVGGElement>("g.symbol-cell"));
    const tinyCell = cells.find((g) => g.querySelector('circle.symbol[data-label="Tiny"]'))!;
    const hugeCell = cells.find((g) => g.querySelector('circle.symbol[data-label="Huge"]'))!;
    expect(tinyCell.querySelector('circle.symbol[data-label="Tiny"]')!.getAttribute("r")).toBe("3");
    expect(hugeCell.querySelector('circle.symbol[data-label="Huge"]')!.getAttribute("r")).toBe("30");
    const tinyHit = tinyCell.querySelector("circle.symbol-hit")!;
    const hugeHit = hugeCell.querySelector("circle.symbol-hit")!;
    expect(Number(tinyHit.getAttribute("r"))).toBe(SYMBOL_MIN_HIT_RADIUS); // 3 floored up to 8
    expect(Number(hugeHit.getAttribute("r"))).toBe(30); // 30 already >= floor, untouched
    expect(tinyHit.getAttribute("fill")).toBe("transparent"); // hit-testable but invisible
    chart.destroy();
    host.remove();
  });

  it("B3.7: a small (r=3) SVG mark's native mouseenter still fires the tooltip formatter (repro/regression)", () => {
    const formatter = vi.fn((d: SymbolMapDataItem) => "tip");
    const { host, chart } = mount({ dataSet: smallLargeDataSet, radiusRange: smallLargeRadiusRange, tooltipFormatter: formatter });
    const tinyCircle = host.querySelector<SVGCircleElement>('circle.symbol[data-label="Tiny"]')!;
    tinyCircle.parentElement!.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    expect(formatter).toHaveBeenCalled();
    expect(formatter.mock.calls[0][0].id).toBe("tiny");
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

  // jsdom's <canvas> has no real 2D context (HTMLCanvasElement.getContext("2d")
  // returns null, so setupCanvas/drawSymbolMapCanvas silently no-op in every
  // other test above) - only the SVG describe block above actually asserted
  // backdrop geography gets drawn. A canvas-only backdrop regression (e.g. the
  // geography loop getting dropped from drawSymbolMapCanvas, or geographyColor/
  // strokeColor not reaching the 2D context) would be invisible to this suite.
  // Fake the 2D context so the real draw routine runs and its calls can be
  // asserted directly - same fill/stroke/beginPath surface d3-geo's geoPath(...,
  // context) needs, per ChoroplethMap's renderCanvas.ts convention.
  it("draws the backdrop geography on <canvas> (fill+stroke per feature, honouring geographyColor/strokeColor)", () => {
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

    const fillStyleHistory: string[] = [];
    const strokeStyleHistory: string[] = [];
    let fillStyleValue = "";
    let strokeStyleValue = "";
    const fakeCtx = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      fillText: vi.fn(),
      get fillStyle() {
        return fillStyleValue;
      },
      set fillStyle(v: string) {
        fillStyleValue = v;
        fillStyleHistory.push(v);
      },
      get strokeStyle() {
        return strokeStyleValue;
      },
      set strokeStyle(v: string) {
        strokeStyleValue = v;
        strokeStyleHistory.push(v);
      },
      lineWidth: 0,
      globalAlpha: 1,
      textAlign: "center",
      textBaseline: "middle",
      font: "",
    } as unknown as CanvasRenderingContext2D;

    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => fakeCtx);

    const { host, chart } = mount({
      renderer: "canvas",
      geography,
      geographyColor: "#abcdef",
      strokeColor: "#123456",
    });

    expect(fakeCtx.beginPath).toHaveBeenCalled();
    expect(fakeCtx.fill).toHaveBeenCalled();
    expect(fakeCtx.stroke).toHaveBeenCalled();
    // The backdrop paints FIRST (before any symbol circle) in
    // drawSymbolMapCanvas, so the first fillStyle/strokeStyle assignment must be
    // the geography colours, not a symbol's own fill.
    expect(fillStyleHistory[0]).toBe("#abcdef");
    expect(strokeStyleHistory[0]).toBe("#123456");

    getContextSpy.mockRestore();
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

  // B3.7 diagnosis: two DISTINCT bugs stacked in the canvas host-level
  // hit-test. (1) ROOT CAUSE: `onHostMove` measured the pointer in HOST/full-
  // svg space (`ev.clientX - svg.getBoundingClientRect().left`) but compared
  // it against `model.symbols[].x/y`, which are PLOT-local (margin-excluded -
  // the SVG renderer draws marks inside a `translate(margin.left,
  // margin.top)` group, and the canvas layer is CSS-positioned at that same
  // offset). That left every mark short by a CONSTANT (margin.left,
  // margin.top) vector, so only marks whose radius exceeded that vector's
  // magnitude could ever be hit - exactly "small circles never tooltip, big
  // ones are fine". jsdom's `getBoundingClientRect()` always returns an
  // all-zero rect, which is why this was invisible to earlier tests. (2)
  // Compounding: no MIN_HIT_RADIUS forgiveness/nearest-match-wins for
  // genuinely small marks even once the coordinate space is correct.
  //
  // These tests zero out `margin` so the settled SVG-mount pixel coords
  // (plot-local, read the same way the ORIGINAL test above did) can be used
  // directly as host-space `clientX/clientY` without a margin correction -
  // that isolates bug (2) (forgiveness/nearest-wins). Bug (1) gets its OWN
  // dedicated regression test below, with a deliberately non-default margin.
  const zeroMargin = { top: 0, right: 0, bottom: 0, left: 0 };

  function tinyAndHugeCoords(margin = zeroMargin) {
    const svgMount = mount({ renderer: "svg", dataSet: smallLargeDataSet, radiusRange: smallLargeRadiusRange, margin });
    const read = (label: string) => {
      const transform = svgMount.host
        .querySelector<SVGCircleElement>(`circle.symbol[data-label="${label}"]`)!
        .parentElement!.getAttribute("transform")!;
      const [x, y] = transform.match(/[\d.-]+/g)!.map(Number);
      return { x, y };
    };
    const tiny = read("Tiny");
    const huge = read("Huge");
    svgMount.chart.destroy();
    svgMount.host.remove();
    return { tiny, huge };
  }

  it("B3.7 repro: pointer at the exact center of a small (r=3) node hits it (canvas)", () => {
    const { tiny } = tinyAndHugeCoords();
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      dataSet: smallLargeDataSet,
      radiusRange: smallLargeRadiusRange,
      margin: zeroMargin,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: tiny.x, clientY: tiny.y, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Tiny"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("B3.7 forgiveness: pointer 6px off the r=3 node's center still hits it (canvas)", () => {
    const { tiny } = tinyAndHugeCoords();
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      dataSet: smallLargeDataSet,
      radiusRange: smallLargeRadiusRange,
      margin: zeroMargin,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: tiny.x + 6, clientY: tiny.y, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Tiny"))).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("B3.7 forgiveness has a limit: pointer 9px off the r=3 node's center misses (canvas)", () => {
    const { tiny } = tinyAndHugeCoords();
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      dataSet: smallLargeDataSet,
      radiusRange: smallLargeRadiusRange,
      margin: zeroMargin,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: tiny.x + 9, clientY: tiny.y, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Tiny"))).toBe(false);
    chart.destroy();
    host.remove();
  });

  it("B3.7 large-bubble behaviour unchanged: pointer inside r=30 hits it, just past r=30 misses (canvas)", () => {
    const { huge } = tinyAndHugeCoords();
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      dataSet: smallLargeDataSet,
      radiusRange: smallLargeRadiusRange,
      margin: zeroMargin,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: huge.x + 20, clientY: huge.y, bubbles: true }));
    expect(highlighted.some((h) => h.includes("Huge"))).toBe(true);
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: huge.x + 31, clientY: huge.y, bubbles: true }));
    expect(highlighted[highlighted.length - 1]).toEqual([]);
    chart.destroy();
    host.remove();
  });

  it("B3.7 root cause fixed: canvas hit-test converts host-space pointer coords to plot-local BEFORE comparing to marks, accounting for a non-zero margin", () => {
    // A margin deliberately different from DEFAULT_MARGIN, so this can't pass
    // by accidental coincidence with the default.
    const margin = { top: 51, right: 7, bottom: 7, left: 23 };
    const { tiny } = tinyAndHugeCoords(margin);
    const highlighted: string[][] = [];
    const { host, chart } = mount({
      renderer: "canvas",
      dataSet: smallLargeDataSet,
      radiusRange: smallLargeRadiusRange,
      margin,
      onHighlightItem: (labels) => highlighted.push(labels),
    });
    // In jsdom, `svg.getBoundingClientRect()` is always the zero rect, so a
    // real browser's host-space `ev.clientX/Y` (which WOULD equal
    // margin.left/top + the plot-local mark position) is simulated by adding
    // the margin directly here.
    host.dispatchEvent(
      new MouseEvent("mousemove", { clientX: tiny.x + margin.left, clientY: tiny.y + margin.top, bubbles: true })
    );
    expect(highlighted.some((h) => h.includes("Tiny"))).toBe(true);
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
