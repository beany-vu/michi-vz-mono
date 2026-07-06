import { describe, it, expect } from "vitest";
import { processSymbolMapData, isValidCoordinate } from "../src/symbolMap/data";
import { buildSymbolMapColors } from "../src/symbolMap/colors";
import { projectSymbolMapPoints, buildSymbolMapRadiusScale } from "../src/symbolMap/scales";
import { layoutSymbolMap } from "../src/symbolMap/layout";
import { buildSymbolMapRenderModel, buildSymbolMapBackdrop } from "../src/symbolMap/renderModel";
import { buildSymbolMapContext } from "../src/context/buildSymbolMapContext";
import { checkSymbolMapData } from "../src/validate/symbolMapWarnings";
import { normalizeGeography } from "../src/choroplethMap/data";
import { createTunedProjection } from "../src/geo/projections";
import type { SymbolMapDataItem, GeoFeatureItem } from "../src/types";

describe("symbolMap/data - processSymbolMapData", () => {
  it("isValidCoordinate rejects out-of-range and non-finite lng/lat", () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(-180, -90)).toBe(true);
    expect(isValidCoordinate(180, 90)).toBe(true);
    expect(isValidCoordinate(181, 0)).toBe(false);
    expect(isValidCoordinate(0, -91)).toBe(false);
    expect(isValidCoordinate(NaN, 0)).toBe(false);
    expect(isValidCoordinate(undefined, 0)).toBe(false);
  });

  it("drops items with missing/invalid lng/lat from `located`, counting them as invalid", () => {
    const dataSet: SymbolMapDataItem[] = [
      { id: "a", label: "A", lng: 10, lat: 20, value: 5 },
      { id: "b", label: "B", lng: NaN, lat: 20, value: 5 },
      { id: "c", label: "C", lng: 400, lat: 20, value: 5 },
    ];
    const p = processSymbolMapData(dataSet);
    expect(p.located.map((n) => n.id)).toEqual(["a"]);
    expect(p.invalidCount).toBe(2);
  });

  it("clamps negative value/valueSecond to 0", () => {
    const dataSet: SymbolMapDataItem[] = [{ id: "a", label: "A", lng: 0, lat: 0, value: -5, valueSecond: -1 }];
    const p = processSymbolMapData(dataSet);
    expect(p.located[0].value).toBe(0);
    expect(p.located[0].valueSecond).toBe(0);
  });

  it("radiusVisibleMin filters on the RAW value (before scaling): value must be > min", () => {
    const dataSet: SymbolMapDataItem[] = [
      { id: "a", label: "A", lng: 0, lat: 0, value: 10 },
      { id: "b", label: "B", lng: 1, lat: 1, value: 5 },
      { id: "c", label: "C", lng: 2, lat: 2, value: 5.0001 },
    ];
    const p = processSymbolMapData(dataSet, { radiusVisibleMin: 5 });
    expect(p.visible.map((n) => n.id)).toEqual(["a", "c"]);
    expect(p.located.length).toBe(3); // domain-building population unaffected
  });

  it("radiusVisibleMin also requires valueSecond >= min when present", () => {
    const dataSet: SymbolMapDataItem[] = [
      { id: "a", label: "A", lng: 0, lat: 0, value: 10, valueSecond: 4 }, // valueSecond below min
      { id: "b", label: "B", lng: 1, lat: 1, value: 10, valueSecond: 5 }, // valueSecond == min, passes
    ];
    const p = processSymbolMapData(dataSet, { radiusVisibleMin: 5 });
    expect(p.visible.map((n) => n.id)).toEqual(["b"]);
  });

  it("disabledItems excludes by label from both located and invalidCount", () => {
    const dataSet: SymbolMapDataItem[] = [
      { id: "a", label: "A", lng: 0, lat: 0, value: 1 },
      { id: "b", label: "B", lng: NaN, lat: 0, value: 1 },
    ];
    const p = processSymbolMapData(dataSet, { disabledItems: ["B"] });
    expect(p.located.map((n) => n.id)).toEqual(["a"]);
    expect(p.invalidCount).toBe(0);
  });

  it("groupKeys/groupColors are derived from the VISIBLE population only", () => {
    const dataSet: SymbolMapDataItem[] = [
      { id: "a", label: "A", lng: 0, lat: 0, value: 1, color: "#111" },
      { id: "b", label: "B", lng: 1, lat: 1, value: 100 },
    ];
    const p = processSymbolMapData(dataSet, { radiusVisibleMin: 50 });
    expect(p.groupKeys).toEqual(["B"]);
    expect(p.groupColors).toEqual({});
  });
});

describe("symbolMap/colors - buildSymbolMapColors", () => {
  it("assigns from the palette in encounter order", () => {
    const colors = buildSymbolMapColors(["A", "B"], ["#111", "#222"]);
    expect(colors.getColor("A")).toBe("#111");
    expect(colors.getColor("B")).toBe("#222");
  });

  it("colorsMapping wins over the palette", () => {
    const colors = buildSymbolMapColors(["A"], ["#111"], { A: "#ff00ff" });
    expect(colors.getColor("A")).toBe("#ff00ff");
  });

  it("skipColorMappingDispatch resolves everything to transparent", () => {
    const colors = buildSymbolMapColors(["A"], ["#111"], undefined, true);
    expect(colors.getColor("A")).toBe("transparent");
    expect(colors.generatedColorsMapping.A).toBe("transparent");
  });
});

describe("symbolMap/scales - projectSymbolMapPoints (dot-only mode)", () => {
  it("rescales the projected extent to fill [0,width]x[0,height]", () => {
    const nodes = processSymbolMapData([
      { id: "a", label: "A", lng: -100, lat: 0, value: 1 },
      { id: "b", label: "B", lng: 100, lat: 0, value: 1 },
    ]).located;
    const { points } = projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    const xs = points.map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(0, 5);
    expect(Math.max(...xs)).toBeCloseTo(400, 5);
  });

  it("collapses identical coordinates to the SAME point (pre-layout) - de-overlap is the force sim's job", () => {
    const nodes = processSymbolMapData([
      { id: "a", label: "A", lng: 10, lat: 20, value: 1 },
      { id: "b", label: "B", lng: 10, lat: 20, value: 1 },
    ]).located;
    const { points } = projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    expect(points[0].x).toBeCloseTo(points[1].x, 10);
    expect(points[0].y).toBeCloseTo(points[1].y, 10);
  });

  it("does not throw and returns points for a single item (degenerate extent)", () => {
    const nodes = processSymbolMapData([{ id: "a", label: "A", lng: 10, lat: 20, value: 1 }]).located;
    const { points } = projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    expect(points.length).toBe(1);
    expect(Number.isFinite(points[0].x)).toBe(true);
    expect(Number.isFinite(points[0].y)).toBe(true);
  });

  it("returns an empty array for an empty node list", () => {
    const { points } = projectSymbolMapPoints([], "geoMercator", false, undefined, 400, 300);
    expect(points).toEqual([]);
  });
});

describe("symbolMap/scales - projectSymbolMapPoints (backdrop mode)", () => {
  it("uses the SAME tuned projection formula as ChoroplethMapChart", () => {
    const nodes = processSymbolMapData([{ id: "a", label: "A", lng: 10, lat: 20, value: 1 }]).located;
    const { points, projection } = projectSymbolMapPoints(nodes, "geoMercator", true, undefined, 400, 300);
    const expected = createTunedProjection("geoMercator", undefined, 400, 300, { rotate: [-18, 0], center: [0, 10] });
    const expectedP = expected([10, 20])!;
    expect(points[0].x).toBeCloseTo(expectedP[0], 5);
    expect(points[0].y).toBeCloseTo(expectedP[1], 5);
    expect(projection).toBeDefined();
  });
});

describe("symbolMap/scales - buildSymbolMapRadiusScale", () => {
  it("scales value to radiusRange over the domain of ALL located items (value + valueSecond)", () => {
    const located = processSymbolMapData([
      { id: "a", label: "A", lng: 0, lat: 0, value: 0 },
      { id: "b", label: "B", lng: 0, lat: 0, value: 50, valueSecond: 100 },
    ]).located;
    const { radiusOf } = buildSymbolMapRadiusScale(located, [3, 70], undefined);
    expect(radiusOf(0)).toBeCloseTo(3, 5);
    expect(radiusOf(100)).toBeCloseTo(70, 5);
    expect(radiusOf(50)).toBeCloseTo(36.5, 1);
  });

  it("raises the domain floor to radiusVisibleMin when max > 100 and min < radiusVisibleMin (legacy quirk)", () => {
    const located = processSymbolMapData([
      { id: "a", label: "A", lng: 0, lat: 0, value: 1 },
      { id: "b", label: "B", lng: 0, lat: 0, value: 200 },
    ]).located;
    const { radiusOf } = buildSymbolMapRadiusScale(located, [3, 70], 20);
    // domain floor raised to 20, so value=1 (below the floor) extrapolates BELOW radiusRange[0]
    expect(radiusOf(20)).toBeCloseTo(3, 5);
    expect(radiusOf(200)).toBeCloseTo(70, 5);
  });

  it("does not raise the domain floor when max <= 100", () => {
    const located = processSymbolMapData([
      { id: "a", label: "A", lng: 0, lat: 0, value: 1 },
      { id: "b", label: "B", lng: 0, lat: 0, value: 50 },
    ]).located;
    const { radiusOf } = buildSymbolMapRadiusScale(located, [3, 70], 20);
    expect(radiusOf(1)).toBeCloseTo(3, 5);
  });

  // Pins the CHOSEN (deliberately non-legacy-parity) domain formula against the
  // reviewer's numeric counter-example. `value` extent is [60,70], `valueSecond`
  // extent is [20,30]. Legacy Chart.js computed
  // `[min(primaryMin, secondaryMax), max(primaryMin, secondaryMax)]` =
  // `[min(60,30), max(60,30)]` = [30,60] - a defective formula that silently
  // drops 70 (the primary max) and 20 (the secondary min) from the domain. This
  // chart uses the TRUE combined extent instead: [20,70]. See scales.ts's
  // buildSymbolMapRadiusScale JSDoc and the symbol-map-chart changeset for the
  // disclosure of this divergence.
  it("uses the TRUE combined value/valueSecond extent, NOT legacy's defective min(primaryMin,secondaryMax)/max(...) formula", () => {
    const located = processSymbolMapData([
      { id: "a", label: "A", lng: 0, lat: 0, value: 60, valueSecond: 30 },
      { id: "b", label: "B", lng: 0, lat: 0, value: 70, valueSecond: 20 },
    ]).located;
    const { radiusOf } = buildSymbolMapRadiusScale(located, [3, 70], undefined);
    // Our domain: [20, 70] (the true min/max across value+valueSecond).
    expect(radiusOf(20)).toBeCloseTo(3, 5);
    expect(radiusOf(70)).toBeCloseTo(70, 5);
    // Legacy's domain would have been [30, 60] - under THAT domain, 20 would
    // extrapolate below radiusRange[0] and 70 would extrapolate above
    // radiusRange[1]. Confirm our scale does NOT clamp/collapse to those
    // legacy bounds: 60 and 30 land strictly INSIDE our [20,70] domain, not at
    // its edges.
    const rAt60 = radiusOf(60);
    const rAt30 = radiusOf(30);
    expect(rAt60).toBeGreaterThan(3);
    expect(rAt60).toBeLessThan(70);
    expect(rAt30).toBeGreaterThan(3);
    expect(rAt30).toBeLessThan(70);
  });
});

describe("symbolMap/layout - layoutSymbolMap (deterministic de-overlap)", () => {
  it("returns the same layout for the same inputs across two independent runs", () => {
    const nodes = processSymbolMapData([
      { id: "a", label: "A", lng: 10, lat: 20, value: 10 },
      { id: "b", label: "B", lng: 10, lat: 20, value: 10 },
      { id: "c", label: "C", lng: 12, lat: 22, value: 30 },
    ]).located;
    const project = () => projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    const { radiusOf } = buildSymbolMapRadiusScale(nodes, [3, 70], undefined);

    const run1 = layoutSymbolMap(project().points, (p) => radiusOf(p.node.value));
    const run2 = layoutSymbolMap(project().points, (p) => radiusOf(p.node.value));

    expect(run1.map((n) => ({ id: n.point.node.id, x: n.x, y: n.y }))).toEqual(
      run2.map((n) => ({ id: n.point.node.id, x: n.x, y: n.y }))
    );
  });

  it("de-overlaps two identical-coordinate points: they end up at different positions, non-overlapping", () => {
    const nodes = processSymbolMapData([
      { id: "a", label: "A", lng: 10, lat: 20, value: 20 },
      { id: "b", label: "B", lng: 10, lat: 20, value: 20 },
    ]).located;
    const { points } = projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    const { radiusOf } = buildSymbolMapRadiusScale(nodes, [3, 70], undefined);
    const laidOut = layoutSymbolMap(points, (p) => radiusOf(p.node.value));

    expect(laidOut.length).toBe(2);
    const [a, b] = laidOut;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeGreaterThan(a.radius + b.radius - 1); // allow the +2 collide padding to round down slightly
    expect(dist).toBeGreaterThan(0.5);
  });

  it("returns an empty array for no points", () => {
    expect(layoutSymbolMap([], () => 5)).toEqual([]);
  });
});

describe("symbolMap/renderModel", () => {
  it("builds concentric-ring opacity: opacitySecond = opacity - 0.3, clamped to >= 0", () => {
    const nodes = processSymbolMapData([{ id: "a", label: "A", lng: 0, lat: 0, value: 10, valueSecond: 5 }]).located;
    const { points, projection } = projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    const { radiusOf, opacityOf } = buildSymbolMapRadiusScale(nodes, [3, 70], undefined);
    const laidOut = layoutSymbolMap(points, (p) => radiusOf(p.node.value));
    const colors = buildSymbolMapColors(["A"], ["#123456"]);
    const model = buildSymbolMapRenderModel(laidOut, colors, radiusOf, opacityOf, { highlightItems: [] }, projection);
    const mark = model.symbols[0];
    expect(mark.radiusSecond).not.toBeNull();
    expect(mark.opacitySecond).toBeCloseTo(Math.max(0, mark.opacity - 0.3), 10);
    expect(mark.opacitySecond).toBeGreaterThanOrEqual(0);
  });

  it("dims marks not in highlightItems", () => {
    const nodes = processSymbolMapData([
      { id: "a", label: "A", lng: 0, lat: 0, value: 10 },
      { id: "b", label: "B", lng: 1, lat: 1, value: 10 },
    ]).located;
    const { points, projection } = projectSymbolMapPoints(nodes, "geoMercator", false, undefined, 400, 300);
    const { radiusOf, opacityOf } = buildSymbolMapRadiusScale(nodes, [3, 70], undefined);
    const laidOut = layoutSymbolMap(points, (p) => radiusOf(p.node.value));
    const colors = buildSymbolMapColors(["A", "B"], ["#123456", "#654321"]);
    const model = buildSymbolMapRenderModel(
      laidOut,
      colors,
      radiusOf,
      opacityOf,
      { highlightItems: ["A"] },
      projection
    );
    const a = model.symbols.find((s) => s.label === "A")!;
    const b = model.symbols.find((s) => s.label === "B")!;
    expect(a.dimmed).toBe(false);
    expect(b.dimmed).toBe(true);
  });

  it("buildSymbolMapBackdrop produces one mark per normalized feature with a path `d`", () => {
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
    const projection = createTunedProjection("geoMercator", undefined, 400, 300, { rotate: [-18, 0], center: [0, 10] });
    const backdrop = buildSymbolMapBackdrop(normalizeGeography(geography), projection);
    expect(backdrop.length).toBe(1);
    expect(backdrop[0].id).toBe("A");
    expect(typeof backdrop[0].d).toBe("string");
  });
});

describe("context/buildSymbolMapContext", () => {
  it("reports located/visible/hidden/invalid counts and a natural-language summary", () => {
    const ctx = buildSymbolMapContext({
      title: "Demo",
      renderer: "svg",
      projection: "geoMercator",
      locatedCount: 5,
      invalidCount: 1,
      symbols: [
        {
          id: "a",
          label: "A",
          lng: 0,
          lat: 0,
          colorKey: "A",
          dataLabelSafe: "A",
          x: 0,
          y: 0,
          radius: 10,
          radiusSecond: null,
          fill: "#111",
          opacity: 0.5,
          opacitySecond: null,
          value: 100,
          valueSecond: null,
          dimmed: false,
        },
      ],
      colorsMapping: { A: "#111" },
    });
    expect(ctx.chartType).toBe("symbol-map-chart");
    expect(ctx.stats.locatedCount).toBe(5);
    expect(ctx.stats.visibleCount).toBe(1);
    expect(ctx.stats.hiddenCount).toBe(4);
    expect(ctx.stats.invalidCount).toBe(1);
    expect(ctx.summary).toContain("Symbol map");
    expect(ctx.summary).toContain("hidden below radiusVisibleMin");
    expect(ctx.summary).toContain("dropped for invalid coordinates");
    expect(ctx.a11yTable.headers).toEqual(["Label", "Value", "Value (second)"]);
  });
});

describe("validate/symbolMapWarnings - checkSymbolMapData", () => {
  it("flags an empty dataset", () => {
    expect(checkSymbolMapData([])).toEqual([
      { type: "empty-dataset", message: "SymbolMap chart received an empty dataSet." },
    ]);
  });

  it("flags invalid coordinates, negative values, and duplicate ids", () => {
    const dataSet: SymbolMapDataItem[] = [
      { id: "a", label: "A", lng: 999, lat: 0, value: 1 },
      { id: "a", label: "A2", lng: 0, lat: 0, value: -5 },
    ];
    const warnings = checkSymbolMapData(dataSet);
    expect(warnings.some((w) => w.type === "invalid-geometry")).toBe(true);
    expect(warnings.some((w) => w.type === "non-finite-value" && w.message.includes("negative"))).toBe(true);
    expect(warnings.some((w) => w.type === "duplicate-label")).toBe(true);
  });
});
