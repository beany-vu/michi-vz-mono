import { describe, it, expect } from "vitest";
import { processGaugeData, gaugeFraction } from "../src/gaugeChart/data";
import { checkGaugeData } from "../src/validate/gaugeWarnings";
import { sweepBoundingBox, fitSweep } from "../src/gaugeChart/geometry";

describe("processGaugeData with min", () => {
  it("maps (value - min) / (max - min) onto the sweep", () => {
    const p = processGaugeData([{ label: "Greece", value: 7836.69 }], {
      min: 5377.05,
      max: 16757.58,
    });
    expect(p.min).toBe(5377.05);
    expect(p.max).toBe(16757.58);
    expect(p.rings[0].value).toBeCloseTo(7836.69, 5);
    expect(p.rings[0].fraction).toBeCloseTo(0.2161, 3);
  });

  it("clamps into [min, max] and keeps null as no data", () => {
    const p = processGaugeData(
      [
        { label: "lo", value: 1 },
        { label: "hi", value: 99 },
        { label: "none", value: null },
      ],
      { min: 10, max: 20 },
    );
    expect(p.rings.map((r) => r.value)).toEqual([10, 20, null]);
    expect(p.rings.map((r) => r.fraction)).toEqual([0, 1, null]);
  });

  it("falls back to 0..max when max <= min", () => {
    const p = processGaugeData([{ label: "A", value: 50 }], { min: 100, max: 100 });
    expect(p.min).toBe(0);
    expect(p.max).toBe(100);
    expect(p.rings[0].fraction).toBe(0.5);
  });

  it("defaults min to 0, so existing consumers are unchanged", () => {
    const p = processGaugeData([{ label: "A", value: 25 }], { max: 100 });
    expect(p.min).toBe(0);
    expect(p.rings[0].fraction).toBe(0.25);
  });

  it("gaugeFraction clamps to [0, 1]", () => {
    expect(gaugeFraction(-5, 0, 10)).toBe(0);
    expect(gaugeFraction(15, 0, 10)).toBe(1);
    expect(gaugeFraction(2.5, 0, 10)).toBe(0.25);
  });
});

describe("checkGaugeData with min", () => {
  it("warns when max <= min and names the fallback", () => {
    const w = checkGaugeData([{ label: "A", value: 50 }], 100, 150);
    expect(w.some((x) => /not below max/.test(x.message) && /0\.\.100/.test(x.message))).toBe(true);
  });

  it("names the [min, max] domain in the clamp warning", () => {
    const w = checkGaugeData([{ label: "A", value: 5 }], 20, 10);
    expect(w).toHaveLength(1);
    expect(w[0].type).toBe("non-finite-value");
    expect(w[0].message).toMatch(/outside \[10, 20\]/);
  });

  it("does not warn for a value inside [min, max]", () => {
    expect(checkGaugeData([{ label: "A", value: 15 }], 20, 10)).toHaveLength(0);
  });
});

describe("sweepBoundingBox (unit radius, degrees clockwise from 12 o'clock)", () => {
  it("full ring is the unit square, as is any sweep <= 0", () => {
    expect(sweepBoundingBox(0, 360)).toEqual({ minX: -1, minY: -1, maxX: 1, maxY: 1 });
    expect(sweepBoundingBox(45, 360)).toEqual({ minX: -1, minY: -1, maxX: 1, maxY: 1 });
    expect(sweepBoundingBox(0, 0)).toEqual({ minX: -1, minY: -1, maxX: 1, maxY: 1 });
  });

  it("half gauge -90/180 spans the top half", () => {
    const b = sweepBoundingBox(-90, 180);
    expect(b.minX).toBeCloseTo(-1, 9);
    expect(b.maxX).toBeCloseTo(1, 9);
    expect(b.minY).toBeCloseTo(-1, 9);
    expect(b.maxY).toBeCloseTo(0, 9);
  });

  it("three quarters -135/270 reaches the left, top and right sides and stops at the lower corners", () => {
    const b = sweepBoundingBox(-135, 270);
    expect(b.minX).toBeCloseTo(-1, 9);
    expect(b.maxX).toBeCloseTo(1, 9);
    expect(b.minY).toBeCloseTo(-1, 9);
    expect(b.maxY).toBeCloseTo(Math.SQRT1_2, 9);
  });

  it("quarter 0/90 is the top-right quadrant", () => {
    const b = sweepBoundingBox(0, 90);
    expect(b).toEqual({ minX: 0, minY: -1, maxX: 1, maxY: 0 });
  });
});

describe("fitSweep", () => {
  const half = sweepBoundingBox(-90, 180);

  it("fills a 360x210 plot with the half gauge: radius 180, ring centre on the baseline, readout anchor at the box middle", () => {
    const f = fitSweep({ plotLeft: 0, plotTop: 0, plotW: 360, plotH: 210, reserve: 0, box: half });
    expect(f.outerRadius).toBeCloseTo(180, 9);
    expect(f.cx).toBeCloseTo(180, 9);
    expect(f.cy).toBeCloseTo(195, 9);
    expect(f.anchorX).toBeCloseTo(180, 9);
    expect(f.anchorY).toBeCloseTo(105, 9);
  });

  it("keeps a 36px reserve on every side for annotations", () => {
    const f = fitSweep({ plotLeft: 0, plotTop: 0, plotW: 360, plotH: 210, reserve: 36, box: half });
    expect(f.outerRadius).toBeCloseTo(138, 9);
    expect(f.cx).toBeCloseTo(180, 9);
    expect(f.cy).toBeCloseTo(174, 9);
    expect(f.anchorY).toBeCloseTo(105, 9);
  });

  it("an explicit outerRadius wins; only the placement is fitted", () => {
    const f = fitSweep({
      plotLeft: 0,
      plotTop: 0,
      plotW: 360,
      plotH: 210,
      reserve: 0,
      box: half,
      outerRadius: 100,
    });
    expect(f.outerRadius).toBe(100);
    expect(f.cx).toBeCloseTo(180, 9);
    expect(f.cy).toBeCloseTo(155, 9);
    expect(f.anchorY).toBeCloseTo(105, 9);
  });

  it("is today's centring for a full ring", () => {
    const f = fitSweep({
      plotLeft: 0,
      plotTop: 0,
      plotW: 200,
      plotH: 200,
      reserve: 0,
      box: sweepBoundingBox(0, 360),
    });
    expect(f).toEqual({ cx: 100, cy: 100, outerRadius: 100, anchorX: 100, anchorY: 100 });
  });

  it("honours the plot origin (margins)", () => {
    const f = fitSweep({
      plotLeft: 10,
      plotTop: 20,
      plotW: 360,
      plotH: 210,
      reserve: 0,
      box: half,
    });
    expect(f.cx).toBeCloseTo(190, 9);
    expect(f.cy).toBeCloseTo(215, 9);
  });
});
