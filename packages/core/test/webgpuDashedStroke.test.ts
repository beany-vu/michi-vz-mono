import { describe, it, expect } from "vitest";
import { dashPolyline, pushDashedStroke, markColor } from "../src/webgpu/marks";

// Dashed strokes for the WebGPU mark layer: the forecast outline and stem of the
// fountain (and later line/fan/gap). A dash pattern that carries its phase across
// vertices, so a dashed outline reads the same as SVG stroke-dasharray.

describe("dashPolyline", () => {
  it("splits a straight line into on/off dashes, starting with a dash", () => {
    expect(
      dashPolyline(
        [
          [0, 0],
          [20, 0],
        ],
        5,
        5,
      ),
    ).toEqual([
      [
        [0, 0],
        [5, 0],
      ],
      [
        [10, 0],
        [15, 0],
      ],
    ]);
  });

  it("carries the dash across a corner and truncates the last dash at the end", () => {
    expect(
      dashPolyline(
        [
          [0, 0],
          [4, 0],
          [4, 6],
        ],
        5,
        3,
      ),
    ).toEqual([
      [
        [0, 0],
        [4, 0],
        [4, 1],
      ],
      [
        [4, 4],
        [4, 6],
      ],
    ]);
  });

  it("a non-positive gap draws the polyline solid; degenerate input draws nothing", () => {
    expect(
      dashPolyline(
        [
          [0, 0],
          [10, 0],
        ],
        4,
        0,
      ),
    ).toEqual([
      [
        [0, 0],
        [10, 0],
      ],
    ]);
    expect(dashPolyline([[3, 3]], 4, 2)).toEqual([]);
    expect(dashPolyline([], 4, 2)).toEqual([]);
  });
});

describe("pushDashedStroke", () => {
  it("pushes one quad (two triangles) per dash segment, nothing in the gaps", () => {
    const out: number[] = [];
    pushDashedStroke(
      out,
      [
        [0, 0],
        [20, 0],
      ],
      2,
      markColor("#000"),
      5,
      5,
    );
    // 2 dashes x 2 triangles x 3 vertices x 6 floats
    expect(out.length).toBe(2 * 2 * 3 * 6);
    const xs = out.filter((_, i) => i % 6 === 0);
    expect(xs.every((x) => (x >= 0 && x <= 5) || (x >= 10 && x <= 15))).toBe(true);
  });
});
