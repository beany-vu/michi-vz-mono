import { describe, it, expect } from "vitest";
import { normalizeGeography, processChoroplethMapData } from "../src/choroplethMap/data";
import { buildChoroplethColors } from "../src/choroplethMap/colors";
import { createChoroplethProjection } from "../src/choroplethMap/scales";
import { pointInGeometry } from "../src/choroplethMap/hitTest";
import { checkChoroplethMapData } from "../src/validate/choroplethMapWarnings";
import type { ChoroplethDataItem, GeoFeatureItem } from "../src/types";
import type { GeoProjection } from "d3-geo";

// Identity "projection" for hit-test unit tests - pointInGeometry only ever
// calls it as a plain (point) => point function.
const identity = ((p: [number, number]) => p) as unknown as GeoProjection;

describe("choroplethMap/data.ts - normalizeGeography", () => {
  it("passes a flat GeoFeatureItem[] through unchanged (id/name/geometry)", () => {
    const flat: GeoFeatureItem[] = [{ id: "A", name: "Alpha", geometry: { type: "Point", coordinates: [0, 0] } }];
    expect(normalizeGeography(flat)).toEqual([{ id: "A", name: "Alpha", geometry: flat[0].geometry }]);
  });

  it("reads a FeatureCollection's top-level Feature.id, falling back to properties.id", () => {
    const fc: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "TOP",
          properties: { name: "Has Top Id" },
          geometry: { type: "Point", coordinates: [0, 0] },
        },
        {
          type: "Feature",
          properties: { id: "PROPS", name: "Falls Back" },
          geometry: { type: "Point", coordinates: [1, 1] },
        },
      ],
    };
    const out = normalizeGeography(fc);
    expect(out[0]).toEqual({ id: "TOP", name: "Has Top Id", geometry: fc.features[0].geometry });
    expect(out[1]).toEqual({ id: "PROPS", name: "Falls Back", geometry: fc.features[1].geometry });
  });
});

describe("choroplethMap/data.ts - processChoroplethMapData (join)", () => {
  const features: GeoFeatureItem[] = [
    { id: "A", name: "Alpha", geometry: { type: "Point", coordinates: [0, 0] } },
    { id: "B", name: "Beta", geometry: { type: "Point", coordinates: [1, 1] } },
  ];
  const dataSet: ChoroplethDataItem[] = [
    { id: "A", label: "Alpha", value: 1 },
    { id: "B", label: "Beta", value: 2 },
  ];

  it("joins by id by default", () => {
    const { features: fs, matchFor } = processChoroplethMapData(features, dataSet);
    expect(matchFor(fs[0])?.label).toBe("Alpha");
    expect(matchFor(fs[1])?.label).toBe("Beta");
  });

  it("joins by name when joinBy: 'name'", () => {
    const misIded: ChoroplethDataItem[] = [
      { id: "not-a", label: "Alpha", value: 1 },
      { id: "not-b", label: "Beta", value: 2 },
    ];
    const { features: fs, matchFor } = processChoroplethMapData(features, misIded, { joinBy: "name" });
    expect(matchFor(fs[0])?.value).toBe(1);
    expect(matchFor(fs[1])?.value).toBe(2);
  });

  it("treats a disabled label as unmatched", () => {
    const { features: fs, matchFor } = processChoroplethMapData(features, dataSet, { disabledItems: ["Alpha"] });
    expect(matchFor(fs[0])).toBeUndefined();
    expect(matchFor(fs[1])?.label).toBe("Beta");
  });
});

describe("choroplethMap/colors.ts - buildChoroplethColors precedence", () => {
  const dataSet: ChoroplethDataItem[] = [
    { id: "A", label: "Alpha", value: 10, color: "#explicit" },
    { id: "B", label: "Beta", value: 60 },
  ];

  it("colorsMapping wins over everything", () => {
    const colors = buildChoroplethColors(dataSet, [], { Alpha: "#mapped" }, { domain: [50], range: ["#lo", "#hi"] });
    expect(colors.getColor(dataSet[0])).toBe("#mapped");
  });

  it("colorScale (scaleThreshold) wins over the row's explicit color", () => {
    const colors = buildChoroplethColors(dataSet, [], undefined, { domain: [50], range: ["#lo", "#hi"] });
    expect(colors.getColor(dataSet[0])).toBe("#lo"); // 10 < 50
    expect(colors.getColor(dataSet[1])).toBe("#hi"); // 60 >= 50
  });

  it("falls back to the row's explicit color when no colorScale/colorsMapping", () => {
    const colors = buildChoroplethColors(dataSet);
    expect(colors.getColor(dataSet[0])).toBe("#explicit");
  });

  it("falls back to the palette when no explicit color either", () => {
    // dataSet[0] (Alpha) has an explicit color and consumes palette index 0;
    // dataSet[1] (Beta) has none, so it lands on palette index 1.
    const colors = buildChoroplethColors(dataSet, ["#p0", "#p1"]);
    expect(colors.getColor(dataSet[1])).toBe("#p1");
  });

  it("skipColorMappingDispatch resolves every row to transparent", () => {
    const colors = buildChoroplethColors(dataSet, [], undefined, undefined, true);
    expect(colors.getColor(dataSet[0])).toBe("transparent");
    expect(colors.generatedColorsMapping.Alpha).toBe("transparent");
  });
});

describe("choroplethMap/scales.ts - createChoroplethProjection (legacy MakeProjection parity)", () => {
  it("defaults to legacy rotate/center when projectionConfig is omitted", () => {
    const proj = createChoroplethProjection("geoOrthographic", undefined, 900, 500);
    expect(proj.rotate!()).toEqual([-18, 0, 0]);
    expect(proj.center!()).toEqual([0, 10]);
    // legacy base scale formula: width / 1.7 / PI, unmultiplied when config.scale is omitted
    expect(proj.scale()).toBeCloseTo(900 / 1.7 / Math.PI, 5);
  });

  it("an explicit scale is reduced 0.7x under 600px width and 0.5x under 400px", () => {
    const wide = createChoroplethProjection("geoOrthographic", { scale: 100 }, 900, 500);
    const narrow = createChoroplethProjection("geoOrthographic", { scale: 100 }, 500, 300);
    const narrower = createChoroplethProjection("geoOrthographic", { scale: 100 }, 300, 200);
    expect(wide.scale()).toBe(100);
    expect(narrow.scale()).toBeCloseTo(70, 5);
    expect(narrower.scale()).toBeCloseTo(50, 5);
  });

  it("skips rotate/center/parallels for geoAlbersUsa (fixed composite projection)", () => {
    expect(() => createChoroplethProjection("geoAlbersUsa", { rotate: [10, 0] }, 900, 500)).not.toThrow();
  });

  it("dispatches all 13 named projections without throwing", () => {
    const names = [
      "geoEqualEarth",
      "geoMercator",
      "geoTransverseMercator",
      "geoAlbers",
      "geoAlbersUsa",
      "geoAzimuthalEqualArea",
      "geoAzimuthalEquidistant",
      "geoOrthographic",
      "geoConicConformal",
      "geoConicEqualArea",
      "geoConicEquidistant",
      "geoRobinson",
      "geoGilbert",
    ] as const;
    for (const name of names) {
      expect(() => createChoroplethProjection(name, undefined, 900, 500)).not.toThrow();
    }
  });
});

describe("choroplethMap/hitTest.ts - pointInGeometry", () => {
  const square: GeoJSON.Geometry = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ],
  };
  const donut: GeoJSON.Geometry = {
    type: "Polygon",
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [3, 3],
        [7, 3],
        [7, 7],
        [3, 7],
        [3, 3],
      ],
    ],
  };
  const multi: GeoJSON.Geometry = {
    type: "MultiPolygon",
    coordinates: [
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ],
      [
        [
          [20, 20],
          [22, 20],
          [22, 22],
          [20, 22],
          [20, 20],
        ],
      ],
    ],
  };

  it("is true inside a simple polygon, false outside", () => {
    expect(pointInGeometry(identity, square, 5, 5)).toBe(true);
    expect(pointInGeometry(identity, square, 50, 50)).toBe(false);
  });

  it("is false inside the hole of a donut polygon (even-odd rule)", () => {
    expect(pointInGeometry(identity, donut, 1, 1)).toBe(true); // in the ring, not the hole
    expect(pointInGeometry(identity, donut, 5, 5)).toBe(false); // inside the hole
  });

  it("is true inside EITHER polygon of a MultiPolygon", () => {
    expect(pointInGeometry(identity, multi, 1, 1)).toBe(true);
    expect(pointInGeometry(identity, multi, 21, 21)).toBe(true);
    expect(pointInGeometry(identity, multi, 11, 11)).toBe(false);
  });

  it("is false for a null/undefined geometry", () => {
    expect(pointInGeometry(identity, null, 1, 1)).toBe(false);
  });
});

describe("validate/choroplethMapWarnings.ts - checkChoroplethMapData", () => {
  const features: GeoFeatureItem[] = [
    { id: "A", name: "Alpha", geometry: { type: "Point", coordinates: [0, 0] } },
    { id: "", name: undefined, geometry: { type: "Polygon", coordinates: [] } },
  ];
  const dataSet: ChoroplethDataItem[] = [
    { id: "A", label: "Alpha" },
    { id: "ghost", label: "Ghost" },
  ];

  it("flags an unmatched dataSet id", () => {
    const warnings = checkChoroplethMapData(features, dataSet);
    expect(warnings.some((w) => w.type === "unmatched-dataset-id" && w.label === "Ghost")).toBe(true);
  });

  it("flags a feature missing an id", () => {
    const warnings = checkChoroplethMapData(features, dataSet);
    expect(warnings.some((w) => w.type === "missing-feature-id")).toBe(true);
  });

  it("flags invalid/empty geometry", () => {
    const warnings = checkChoroplethMapData(features, dataSet);
    expect(warnings.some((w) => w.type === "invalid-geometry")).toBe(true);
  });

  it("is clean for a fully-matched, valid dataset", () => {
    const clean: GeoFeatureItem[] = [{ id: "A", name: "Alpha", geometry: { type: "Point", coordinates: [0, 0] } }];
    const cleanData: ChoroplethDataItem[] = [{ id: "A", label: "Alpha" }];
    expect(checkChoroplethMapData(clean, cleanData)).toEqual([]);
  });
});
