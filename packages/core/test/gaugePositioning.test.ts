import { describe, it, expect } from "vitest";
import { processGaugeData, gaugeFraction } from "../src/gaugeChart/data";
import { checkGaugeData } from "../src/validate/gaugeWarnings";
import { sweepBoundingBox, fitSweep } from "../src/gaugeChart/geometry";
import { buildGaugeAnnotations } from "../src/gaugeChart/annotations";
import { checkGaugeAnnotations } from "../src/validate/gaugeWarnings";

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

// The mockup's numbers: a 360x210 box, centre (180,168), outer edge 129, one ring
// whose centreline is 124 (thickness 10), scale 3.3..16.0, value 7.6.
const mockup = {
  cx: 180,
  cy: 168,
  outerRadius: 129,
  startAngle: (-90 * Math.PI) / 180,
  sweepAngle: Math.PI,
  min: 3.3,
  max: 16,
  rings: [
    {
      index: 0,
      radius: 124,
      fraction: (7.6 - 3.3) / (16 - 3.3),
      stroke: "#0d5eaf",
      colorKey: "Greece",
      dataLabelSafe: "Greece",
    },
  ],
  valueFormatter: (v: number) => `${v}`,
};

describe("buildGaugeAnnotations", () => {
  it("puts the marker on the ring centreline at the value angle, with a 20px radial tick", () => {
    const a = buildGaugeAnnotations({ ...mockup, valueMarker: true });
    expect(a.markers).toHaveLength(1);
    const m = a.markers[0];
    expect(m.x).toBeCloseTo(119.78, 1);
    expect(m.y).toBeCloseTo(59.61, 1);
    expect(m.radius).toBe(8);
    expect(m.fill).toBe("#0d5eaf");
    expect(m.stroke).toBe("#fff");
    expect(m.strokeWidth).toBe(2.5);
    expect(m.dataLabel).toBe("Greece");
    expect(m.tick).not.toBeNull();
    // Tick runs from radius 114 to 134 along the same angle.
    const len = Math.hypot(m.tick!.x2 - m.tick!.x1, m.tick!.y2 - m.tick!.y1);
    expect(len).toBeCloseTo(20, 6);
    expect(m.tick!.color).toBe("#1a1a1a");
    expect(m.tick!.width).toBe(1.5);
  });

  it("honours marker overrides and tick: false", () => {
    const a = buildGaugeAnnotations({
      ...mockup,
      valueMarker: { radius: 5, fill: "#fff", stroke: "#000", strokeWidth: 1, tick: false },
    });
    expect(a.markers[0]).toMatchObject({ radius: 5, fill: "#fff", stroke: "#000", strokeWidth: 1 });
    expect(a.markers[0].tick).toBeNull();
  });

  it("skips markers for null rings and when valueMarker is off", () => {
    expect(
      buildGaugeAnnotations({
        ...mockup,
        rings: [{ ...mockup.rings[0], fraction: null }],
        valueMarker: true,
      }).markers,
    ).toHaveLength(0);
    expect(buildGaugeAnnotations({ ...mockup }).markers).toHaveLength(0);
  });

  it("draws a tick just outside the outer edge (+2..+9) with its label at +26", () => {
    const a = buildGaugeAnnotations({ ...mockup, ticks: [{ value: 7.27, label: "AVG" }] });
    expect(a.ticks).toHaveLength(1);
    const t = a.ticks[0];
    expect(t.x1).toBeCloseTo(107.25, 1);
    expect(t.y1).toBeCloseTo(59.05, 1);
    expect(Math.hypot(t.x2 - 180, t.y2 - 168)).toBeCloseTo(138, 6);
    expect(Math.hypot(t.labelX - 180, t.labelY - 168)).toBeCloseTo(155, 6);
    expect(t.label).toBe("AVG");
    expect(t.valueLabel).toBe("7.27"); // valueFormatter fallback
    expect(t.color).toBe("#9ea3ae");
  });

  it("uses the consumer valueLabel when given, suppresses it when empty, clamps out-of-range ticks", () => {
    const a = buildGaugeAnnotations({
      ...mockup,
      ticks: [
        { value: 7.27, valueLabel: "7.3 k" },
        { value: 7.27, valueLabel: "" },
        { value: 99, label: "HI" },
      ],
    });
    expect(a.ticks[0].valueLabel).toBe("7.3 k");
    expect(a.ticks[1].valueLabel).toBeUndefined();
    // Clamped to max: sits at the end of the sweep (angle +90 deg => x = cx + r).
    expect(a.ticks[2].x1).toBeCloseTo(180 + 131, 6);
    expect(a.ticks[2].valueLabel).toBe("16");
  });

  it("hangs end labels 20px past the ends along the continued tangent (straight down on a half gauge)", () => {
    const a = buildGaugeAnnotations({
      ...mockup,
      endLabels: { min: { label: "MIN" }, max: { label: "MAX", valueLabel: "16.0" } },
    });
    expect(a.endLabels).toHaveLength(2);
    const [lo, hi] = a.endLabels;
    expect(lo.end).toBe("min");
    expect(lo.x).toBeCloseTo(56, 6);
    expect(lo.y).toBeCloseTo(188, 6);
    expect(lo.label).toBe("MIN");
    expect(lo.valueLabel).toBe("3.3");
    expect(hi.end).toBe("max");
    expect(hi.x).toBeCloseTo(304, 6);
    expect(hi.y).toBeCloseTo(188, 6);
    expect(hi.valueLabel).toBe("16.0");
  });

  it("endLabels: true draws values only, and a full ring draws no end labels", () => {
    const a = buildGaugeAnnotations({ ...mockup, endLabels: true });
    expect(a.endLabels.map((e) => e.label)).toEqual([undefined, undefined]);
    expect(a.endLabels.map((e) => e.valueLabel)).toEqual(["3.3", "16"]);
    const full = buildGaugeAnnotations({ ...mockup, sweepAngle: Math.PI * 2, endLabels: true });
    expect(full.endLabels).toHaveLength(0);
  });

  it("ticks and end labels use the OUTER ring; markers are per ring", () => {
    const inner = {
      ...mockup.rings[0],
      index: 1,
      radius: 104,
      fraction: 0.5,
      colorKey: "B",
      dataLabelSafe: "B",
    };
    const a = buildGaugeAnnotations({
      ...mockup,
      rings: [mockup.rings[0], inner],
      valueMarker: true,
      ticks: [{ value: 10 }],
      endLabels: true,
    });
    expect(a.markers).toHaveLength(2);
    expect(a.ticks).toHaveLength(1);
    expect(Math.hypot(a.ticks[0].x1 - 180, a.ticks[0].y1 - 168)).toBeCloseTo(131, 6);
    expect(a.endLabels).toHaveLength(2);
    // End labels sit on the OUTER centreline (124), not the inner one.
    expect(a.endLabels[0].x).toBeCloseTo(56, 6);
  });
});

describe("checkGaugeAnnotations", () => {
  it("warns per out-of-range tick and for endLabels on a full ring", () => {
    const w = checkGaugeAnnotations({
      ticks: [{ value: 1, label: "LOW" }, { value: 5 }, { value: 99 }],
      endLabels: true,
      min: 3.3,
      max: 16,
      sweepAngleDeg: 360,
    });
    expect(w.map((x) => x.type)).toEqual([
      "non-finite-value",
      "non-finite-value",
      "layout-overflow",
    ]);
    expect(w[0].label).toBe("LOW");
    expect(w[0].message).toMatch(/outside \[3.3, 16\]/);
    expect(w[2].message).toMatch(/full 360/);
  });

  it("is silent for in-range ticks on a partial sweep", () => {
    expect(
      checkGaugeAnnotations({
        ticks: [{ value: 5 }],
        endLabels: true,
        min: 3.3,
        max: 16,
        sweepAngleDeg: 180,
      }),
    ).toHaveLength(0);
  });
});
