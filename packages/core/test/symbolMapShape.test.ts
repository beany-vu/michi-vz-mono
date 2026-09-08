import { describe, it, expect } from "vitest";
import { hexagonVertices, hexagonPath } from "../src/symbolMap/shape";

describe("hexagon shape", () => {
  it("flat orientation puts the first vertex on +x", () => {
    const v = hexagonVertices(10, "flat");
    expect(v.length).toBe(6);
    expect(v[0][0]).toBeCloseTo(10);
    expect(v[0][1]).toBeCloseTo(0);
    expect(v[1][0]).toBeCloseTo(5);
    expect(v[1][1]).toBeCloseTo(8.66, 2);
  });

  it("pointy orientation puts the first vertex at 30 degrees", () => {
    const v = hexagonVertices(10, "pointy");
    expect(v[0][0]).toBeCloseTo(8.66, 2);
    expect(v[0][1]).toBeCloseTo(5);
  });

  it("path is closed, 3-decimal rounded, and starts with M", () => {
    const d = hexagonPath(11);
    expect(d.startsWith("M11,0")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect((d.match(/L/g) ?? []).length).toBe(5);
    expect(d).not.toMatch(/\d\.\d{4}/);
  });
});
