import { describe, it, expect } from "vitest";
import { computeTipLabels } from "../src/lineChart/progressiveDraw";

const colors = (label: string) => (label === "Alpha" ? "#f00" : "#0f0");

// Two series in pixel space; points sorted by x ascending.
const entries = [
  {
    label: "Alpha",
    points: [
      { x: 100, y: 200, d: { value: 10 } },
      { x: 200, y: 100, d: { value: 20 } },
      { x: 300, y: 150, d: { value: 15 } },
    ],
  },
  {
    label: "Beta",
    points: [
      { x: 200, y: 250, d: { value: 5 } },
      { x: 300, y: 220, d: { value: 8 } },
    ],
  },
];

describe("computeTipLabels", () => {
  it("emits one target per series whose first point is revealed", () => {
    const targets = computeTipLabels(entries, colors, 150, {});
    expect(targets.map(t => t.label)).toEqual(["Alpha"]); // Beta starts at 200
  });

  it("places the tip at revealX with y interpolated between surrounding points", () => {
    const targets = computeTipLabels(entries, colors, 150, {});
    expect(targets[0].x).toBe(150);
    expect(targets[0].y).toBeCloseTo(150, 6); // halfway 200 -> 100
  });

  it("clamps to the series' last point once revealX passes it", () => {
    const targets = computeTipLabels(entries, colors, 500, {});
    const alpha = targets.find(t => t.label === "Alpha")!;
    expect(alpha.x).toBe(300);
    expect(alpha.y).toBe(150);
  });

  it("shows name and value by default ('both')", () => {
    const targets = computeTipLabels(entries, colors, 500, {});
    expect(targets.find(t => t.label === "Alpha")!.text).toBe("Alpha 15");
  });

  it("content 'name' and 'value' narrow the text", () => {
    expect(computeTipLabels(entries, colors, 500, { content: "name" })[0].text).toBe("Alpha");
    expect(computeTipLabels(entries, colors, 500, { content: "value" })[0].text).toBe("15");
  });

  it("uses the LAST REVEALED point's value, not an interpolated one", () => {
    const targets = computeTipLabels(entries, colors, 250, { content: "value" });
    expect(targets.find(t => t.label === "Alpha")!.text).toBe("20"); // point at 200
  });

  it("format() overrides the default text", () => {
    const targets = computeTipLabels(entries, colors, 500, {
      format: (v, label) => `${label}: ${v.toFixed(1)}`,
    });
    expect(targets.find(t => t.label === "Beta")!.text).toBe("Beta: 8.0");
  });

  it("carries the series colour and a class-safe label", () => {
    const targets = computeTipLabels(entries, colors, 500, {});
    const alpha = targets.find(t => t.label === "Alpha")!;
    expect(alpha.color).toBe("#f00");
    expect(alpha.safe).toBe("Alpha");
  });

  it("skips series with no points", () => {
    const targets = computeTipLabels(
      [{ label: "Empty", points: [] }],
      () => "#000",
      500,
      {}
    );
    expect(targets).toEqual([]);
  });
});
