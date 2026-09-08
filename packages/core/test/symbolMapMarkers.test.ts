import { describe, it, expect } from "vitest";
import { buildSymbolMapMarkers, DEFAULT_MARKER_PATH } from "../src/symbolMap/markers";
import { renderSymbolMapSvg } from "../src/symbolMap/renderSvg";
import { drawSymbolMapCanvas } from "../src/symbolMap/renderCanvas";
import { hexagonPath } from "../src/symbolMap/shape";
import { geoMercator } from "d3-geo";
import type { SymbolMapMark } from "../src/symbolMap/renderModel";

const project = (lng: number, lat: number): [number, number] | null =>
  lat > 89 ? null : [lng * 2, lat * 2];

describe("buildSymbolMapMarkers", () => {
  it("anchors the default 24x24 pin tip-down at the projected point", () => {
    const [m] = buildSymbolMapMarkers([{ lng: 10, lat: 5 }], project);
    expect([m.x, m.y]).toEqual([20, 10]);
    expect(m.scale).toBe(1);
    expect(m.tx).toBe(8);
    expect(m.ty).toBe(-14);
    expect(m.path).toBe(DEFAULT_MARKER_PATH);
    expect(m.color).toBe("#333");
    expect(m.size).toBe(24);
  });

  it("scales a custom path box to size", () => {
    const [m] = buildSymbolMapMarkers(
      [{ lng: 0, lat: 0, size: 48, path: "M0 0h384v512H0z", pathSize: [384, 512], color: "#c00" }],
      project,
    );
    expect(m.scale).toBeCloseTo(48 / 512);
    expect(m.tx).toBeCloseTo(-18);
    expect(m.ty).toBe(-48);
    expect(m.color).toBe("#c00");
  });

  it("drops markers the projection cannot place and defaults ids/labels", () => {
    expect(buildSymbolMapMarkers([{ lng: 0, lat: 90 }], project)).toEqual([]);
    const [m] = buildSymbolMapMarkers([{ lng: 1, lat: 1 }], project);
    expect(m.id).toBe("marker-0");
    expect(m.label).toBe("");
    expect(buildSymbolMapMarkers(undefined, project)).toEqual([]);
  });
});

const baseOpts = {
  enableTransitions: false,
  showLabels: false,
  geographyColor: "#eee",
  strokeColor: "#ddd",
  strokeWidth: 1,
  shape: "circle" as const,
  orientation: "flat" as const,
};
const noop = { onEnter() {}, onLeave() {}, onClick() {} };

const mark = (over: Partial<SymbolMapMark> = {}): SymbolMapMark => ({
  id: "a",
  label: "A",
  lng: 0,
  lat: 0,
  colorKey: "A",
  dataLabelSafe: "A",
  x: 10,
  y: 10,
  radius: 8,
  radiusSecond: null,
  fill: "#123456",
  opacity: 1,
  opacitySecond: null,
  value: 1,
  valueSecond: null,
  hasValue: true,
  dimmed: false,
  ...over,
});

describe("svg markers + hexagon marks", () => {
  it("renders g.symbol-map-markers > path.symbol-map-marker last, pointer-events none", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const markers = buildSymbolMapMarkers([{ lng: 1, lat: 1, label: "Home" }], project);
    renderSymbolMapSvg(
      svg,
      { backdrop: [], symbols: [mark()], markers, projection: geoMercator() },
      baseOpts,
      noop,
    );
    const g = svg.querySelector("g.symbol-map-content > g:last-child")!;
    expect(g.getAttribute("class")).toBe("symbol-map-markers");
    const p = g.querySelector("path.symbol-map-marker")!;
    expect(p.getAttribute("data-label")).toBe("Home");
    expect(p.getAttribute("transform")).toBe("translate(-10, -22) scale(1)");
    expect(p.getAttribute("fill")).toBe("#333");
    expect((p as SVGPathElement).style.pointerEvents).toBe("none");
  });

  it("shape hexagon draws path.symbol with the colour contract and the hexagon d", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    renderSymbolMapSvg(
      svg,
      {
        backdrop: [],
        symbols: [mark({ radiusSecond: 4 })],
        markers: [],
        projection: geoMercator(),
      },
      { ...baseOpts, shape: "hexagon" },
      noop,
    );
    const p = svg.querySelector("path.symbol")!;
    expect(p.getAttribute("data-label-safe")).toBe("A");
    expect(p.getAttribute("fill")).toBe("#123456");
    expect(p.getAttribute("d")).toBe(hexagonPath(8, "flat"));
    expect(svg.querySelector("path.symbol-second")!.getAttribute("d")).toBe(hexagonPath(4, "flat"));
    expect(svg.querySelectorAll("circle.symbol").length).toBe(0);
    // the forgiving hit target stays a circle
    expect(svg.querySelector("circle.symbol-hit")).not.toBeNull();
  });

  it("canvas renderer draws hexagons and markers without throwing (jsdom stub ctx)", () => {
    const canvas = document.createElement("canvas");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const markers = buildSymbolMapMarkers([{ lng: 1, lat: 1 }], project);
    expect(() =>
      drawSymbolMapCanvas(
        canvas,
        svg,
        { backdrop: [], symbols: [mark()], markers, projection: geoMercator() },
        {
          width: 100,
          height: 100,
          showLabels: false,
          geographyColor: "#eee",
          strokeColor: "#ddd",
          strokeWidth: 1,
          shape: "hexagon",
          orientation: "pointy",
        },
      ),
    ).not.toThrow();
  });
});
