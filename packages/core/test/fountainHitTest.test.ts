import { describe, it, expect } from "vitest";
import { hitTestFountain } from "../src/fountainChart/hitTest";
import { buildFountainRenderModel } from "../src/fountainChart/renderModel";
import { resolveFountainData } from "../src/fountainChart/data";
import { buildFountainColors } from "../src/fountainChart/colors";
import { buildFountainScales, fountainYDomain } from "../src/fountainChart/scales";
import { resolveFountainWords, fountainValueFormatter } from "../src/fountainChart/labels";
import type { FountainDataItem, FountainXAxisType, Margin } from "../src/types";

// A NON-default margin: columns must come from the model's plot, not a constant.
const MARGIN: Margin = { top: 35, right: 130, bottom: 95, left: 90 };
const W = 790;
const H = 430;
const LEFT = MARGIN.left;
const RIGHT = W - MARGIN.right; // 660
const TOP = MARGIN.top;
const BOTTOM = H - MARGIN.bottom; // 335

function model(data: FountainDataItem[], xAxisDataType?: FountainXAxisType) {
  const resolved = resolveFountainData(data, { xAxisDataType });
  const scales = buildFountainScales({
    mode: resolved.mode,
    temporalType: resolved.temporalType,
    labels: resolved.labels,
    periods: resolved.periods,
    yDomain: fountainYDomain(resolved.jets),
    width: W,
    height: H,
    margin: MARGIN,
  });
  return buildFountainRenderModel(resolved, scales, buildFountainColors(data), {
    format: fountainValueFormatter(undefined, "en-US"),
    words: resolveFountainWords({}),
  });
}

const label = (j: { label: string } | null) => (j ? j.label : null);

describe("hitTestFountain: snapshot columns (x centre +/- step / 2)", () => {
  const data: FountainDataItem[] = [
    { label: "A", value: 10, low: 5, high: 20 },
    { label: "B", value: 80 },
    { label: "C", value: 0 },
    { label: "D", value: 40, samples: [30, 50] },
  ];
  const m = model(data);
  const step = (RIGHT - LEFT) / 4; // 142.5
  const midY = (TOP + BOTTOM) / 2;

  it("each column, edge to edge, names its jet, even away from the marks", () => {
    ["A", "B", "C", "D"].forEach((name, i) => {
      expect(label(hitTestFountain(m, LEFT + i * step + 1, midY))).toBe(name);
      expect(label(hitTestFountain(m, LEFT + (i + 1) * step - 1, midY))).toBe(name);
      expect(label(hitTestFountain(m, LEFT + (i + 0.5) * step, TOP + 1))).toBe(name);
    });
  });

  it("a 1 px sweep across the plot reaches every jet, in order", () => {
    const seen: string[] = [];
    for (let x = LEFT; x <= RIGHT; x++) {
      const hit = label(hitTestFountain(m, x, midY));
      if (hit && seen[seen.length - 1] !== hit) seen.push(hit);
    }
    expect(seen).toEqual(["A", "B", "C", "D"]);
  });

  it("a zero value is still hoverable (its column)", () => {
    expect(label(hitTestFountain(m, LEFT + 2.5 * step, BOTTOM - 1))).toBe("C");
  });

  it("outside the plot (margins) is null", () => {
    expect(hitTestFountain(m, LEFT - 5, midY)).toBeNull();
    expect(hitTestFountain(m, RIGHT + 5, midY)).toBeNull();
    expect(hitTestFountain(m, LEFT + 10, TOP - 20)).toBeNull();
    expect(hitTestFountain(m, LEFT + 10, BOTTOM + 20)).toBeNull();
  });
});

describe("hitTestFountain: trend columns (midpoint to midpoint, clamped)", () => {
  // Uneven periods: 2000, 2001, 2004.
  const data: FountainDataItem[] = [
    { label: "S", value: 10, date: 2000 },
    { label: "S", value: 20, date: 2001 },
    { label: "S", value: 30, date: 2004 },
  ];
  const m = model(data, "number");
  const xs = m.jets.map((j) => j.x);
  const midY = (TOP + BOTTOM) / 2;

  it("switches jets exactly at the midpoints", () => {
    const m01 = (xs[0] + xs[1]) / 2;
    const m12 = (xs[1] + xs[2]) / 2;
    expect(hitTestFountain(m, m01 - 0.5, midY)!.date).toBe(2000);
    expect(hitTestFountain(m, m01 + 0.5, midY)!.date).toBe(2001);
    expect(hitTestFountain(m, m12 - 0.5, midY)!.date).toBe(2001);
    expect(hitTestFountain(m, m12 + 0.5, midY)!.date).toBe(2004);
  });

  it("the first and last columns run to the plot edges", () => {
    expect(hitTestFountain(m, LEFT + 0.5, midY)!.date).toBe(2000);
    expect(hitTestFountain(m, RIGHT - 0.5, midY)!.date).toBe(2004);
    expect(hitTestFountain(m, RIGHT + 1, midY)).toBeNull();
  });

  it("respects revealX: an unrevealed jet is not hit", () => {
    const x2004 = xs[2];
    const reveal = m.periods.find((p) => p.date === 2001)!.revealPx;
    expect(hitTestFountain(m, x2004, midY, reveal)).toBeNull();
    expect(hitTestFountain(m, xs[1], midY, reveal)!.date).toBe(2001);
    expect(hitTestFountain(m, x2004, midY, x2004)!.date).toBe(2004);
  });

  it("jets sharing a date: pointer y picks the one whose marks it is over", () => {
    const shared = model(
      [
        { label: "Low", value: 10, low: 5, high: 15, date: 2000 },
        { label: "High", value: 90, low: 80, high: 100, date: 2000 },
        { label: "Low", value: 12, date: 2001 },
      ],
      "number",
    );
    const at = shared.jets.filter((j) => j.date === 2000);
    const high = at.find((j) => j.label === "High")!;
    expect(label(hitTestFountain(shared, high.x, high.bigDot.y))).toBe("High");
    const low = at.find((j) => j.label === "Low")!;
    expect(label(hitTestFountain(shared, low.x, low.bell!.top))).toBe("Low");
  });
});

describe("hitTestFountain: empty", () => {
  it("returns null for a model without jets", () => {
    expect(hitTestFountain(model([]), 200, 200)).toBeNull();
  });
});
