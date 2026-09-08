import { describe, it, expect } from "vitest";
import { processSymbolMapData } from "../src/symbolMap/data";
import { buildSymbolMapColors } from "../src/symbolMap/colors";
import { buildSymbolMapRadiusScale } from "../src/symbolMap/scales";
import { buildSymbolMapRenderModel } from "../src/symbolMap/renderModel";
import { geoMercator } from "d3-geo";
import type { SymbolMapDataItem } from "../src/types";

const scale = { domain: [10, 20], range: ["#a", "#b", "#c"] };
const items: SymbolMapDataItem[] = [
  { id: "x", label: "X", lng: 0, lat: 0, value: 5 },
  { id: "y", label: "Y", lng: 1, lat: 1, value: 15, color: "#item" },
  { id: "z", label: "Z", lng: 2, lat: 2 }, // no value
];

describe("no-value items", () => {
  it("are located with hasValue=false and value 0, and stay visible", () => {
    const p = processSymbolMapData(items);
    expect(p.located.map((n) => n.hasValue)).toEqual([true, true, false]);
    expect(p.located[2].value).toBe(0);
    expect(p.visible.length).toBe(3);
  });

  it("carry their offset through", () => {
    const p = processSymbolMapData([{ ...items[0], offset: { dx: 3, dy: -2 } }]);
    expect(p.located[0].offset).toEqual({ dx: 3, dy: -2 });
  });

  it("do not shrink the radius domain", () => {
    const p = processSymbolMapData(items);
    const { radiusOf } = buildSymbolMapRadiusScale(p.located, [2, 20], undefined);
    expect(radiusOf(5)).toBeCloseTo(2); // domain [5,15], not [0,15]
    expect(radiusOf(15)).toBeCloseTo(20);
  });
});

describe("colorScale precedence", () => {
  const p = processSymbolMapData(items);

  it("colorsMapping > colorScale > item color > palette", () => {
    const c = buildSymbolMapColors(p.groupKeys, ["#p1"], { X: "#map" }, false, scale);
    expect(c.getColorFor(p.located[0])).toBe("#map");
    expect(c.getColorFor(p.located[1])).toBe("#b"); // 15 -> second class beats item colour
    const noScale = buildSymbolMapColors(p.groupKeys, ["#p1"], undefined, false);
    expect(noScale.getColorFor(p.located[1])).toBe("#item");
    expect(noScale.getColorFor(p.located[0])).toBe("#p1");
  });

  it("no-value nodes resolve to an empty string (the render model paints noDataColor)", () => {
    const c = buildSymbolMapColors(p.groupKeys, ["#p1"], undefined, false, scale);
    expect(c.getColorFor(p.located[2])).toBe("");
  });

  it("skipColorMappingDispatch makes every node transparent", () => {
    const c = buildSymbolMapColors(p.groupKeys, ["#p1"], undefined, true, scale);
    expect(c.getColorFor(p.located[1])).toBe("transparent");
  });

  it("generatedColorsMapping still lists one colour per label for legends", () => {
    const c = buildSymbolMapColors(p.groupKeys, ["#p1"], undefined, false, scale);
    expect(Object.keys(c.generatedColorsMapping).sort()).toEqual(["X", "Y", "Z"]);
  });
});

describe("render model no-value fill", () => {
  it("paints noDataColor for hasValue=false and flags the mark", () => {
    const p = processSymbolMapData(items);
    const colors = buildSymbolMapColors(p.groupKeys, ["#p1"], undefined, false, scale);
    const laidOut = p.located.map((node) => ({
      point: { node, x: 0, y: 0 },
      radius: 5,
      x: 0,
      y: 0,
    }));
    const model = buildSymbolMapRenderModel(
      laidOut,
      colors,
      () => 5,
      () => 0.5,
      { highlightItems: [], noDataColor: "#nodata" },
      geoMercator(),
    );
    expect(model.symbols.map((m) => m.fill)).toEqual(["#a", "#b", "#nodata"]); // 5 falls in the first class
    expect(model.symbols.map((m) => m.hasValue)).toEqual([true, true, false]);
  });
});
