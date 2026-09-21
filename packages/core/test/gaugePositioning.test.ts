import { describe, it, expect } from "vitest";
import { processGaugeData, gaugeFraction } from "../src/gaugeChart/data";
import { checkGaugeData } from "../src/validate/gaugeWarnings";

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
