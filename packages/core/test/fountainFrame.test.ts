import { describe, it, expect } from "vitest";
import { planFountainFrame, type FountainFrameInput } from "../src/fountainChart/frame";
import { resolveFountainData } from "../src/fountainChart/data";
import { fountainYDomain } from "../src/fountainChart/scales";
import { resolveFountainWords } from "../src/fountainChart/labels";
import type { FountainChartProps, FountainDataItem, Margin } from "../src/types";

// The frame decides the room the words need before the final scales are built.
// A deterministic measure: 7 px per character at 12 px.
const measure = (s: string) => s.length * 7;
const MARGIN: Margin = { top: 40, right: 40, bottom: 50, left: 60 };

function plan(data: FountainDataItem[], o: Partial<FountainChartProps> = {}) {
  const resolved = resolveFountainData(data, { xAxisDataType: o.xAxisDataType });
  const input: FountainFrameInput = {
    resolved,
    yDomain: fountainYDomain(resolved.jets, { referenceLines: o.referenceLines }),
    yAxisDomainGiven: false,
    width: o.width ?? 700,
    height: o.height ?? 460,
    margin: o.margin ?? MARGIN,
    ticks: 5,
    words: resolveFountainWords(o),
    format: (n) => String(n),
    yFormat: (v) => String(v),
    xAxisFormat: o.xAxisFormat,
    referenceLines: o.referenceLines,
    showRange: o.showRange ?? true,
    showValueLabels: o.showValueLabels ?? true,
    yAxisTitle: o.yAxisTitle,
    readingGuide: o.readingGuide,
    measure,
  };
  return planFountainFrame(input);
}

const jet = (label: string, extra: Partial<FountainDataItem> = {}): FountainDataItem => ({
  label,
  value: 30,
  low: 20,
  high: 45,
  samples: [20, 25, 30, 35, 45],
  ...extra,
});

describe("planFountainFrame: margins", () => {
  it("keeps the user's margins when nothing needs more room", () => {
    const f = plan([jet("A"), jet("B")], { showValueLabels: false });
    expect(f.margin).toEqual(MARGIN);
    expect(f.scales.plot).toEqual({ left: 60, right: 660, top: 40, bottom: 410 });
  });

  it("right: room for the widest reference label, wrapped", () => {
    const f = plan([jet("A")], {
      showValueLabels: false,
      referenceLines: [{ value: 40, label: "Time I allow: 45 min" }],
    });
    expect(f.margin.right).toBeGreaterThan(MARGIN.right);
    expect(f.margin.right).toBeLessThanOrEqual(f.referenceWidth + 10 + 1);
  });

  it("left: room for the y title beside the widest tick label", () => {
    const f = plan([jet("A", { value: 30000, low: 20000, high: 45000, samples: [] })], {
      showValueLabels: false,
      yAxisTitle: "€ a month",
    });
    // ticks up to "50000": 5 characters = 35 px, + 30 for the title
    expect(f.margin.left).toBe(65);
    expect(f.yTitleX).toBe(65 - 35 - 19);
  });

  it("bottom: room for every value label line and the guide", () => {
    const withLabels = plan([jet("A"), jet("B")], { readingGuide: true });
    expect(withLabels.valueFit!.maxLines).toBe(4); // usual, low, high, only 5
    expect(withLabels.margin.bottom).toBe(withLabels.bottom.bottom);
    expect(withLabels.guideLines.length).toBeGreaterThan(0);
    expect(withLabels.bottom.guideTop!).toBeGreaterThan(withLabels.bottom.valueLabelTop);
  });
});

describe("planFountainFrame: x labels", () => {
  it("one line each while they fit", () => {
    const f = plan([jet("Car"), jet("Bus")]);
    expect(f.xAxis?.kind).toBe("band");
    if (f.xAxis?.kind === "band") {
      expect(f.xAxis.mode).toBe("horizontal");
      expect(f.xAxis.label("Car")).toBe("Car");
    }
    expect(f.axisNotes).toEqual([]);
  });

  it("wrap to lines (axis notes) before tilting; the value labels start below them", () => {
    const labels = ["Weekday lunch", "Weekday dinner", "Friday night", "Saturday night"];
    const f = plan(
      labels.map((l) => jet(l)),
      { width: 420 },
    );
    if (f.xAxis?.kind !== "band") throw new Error("band axis expected");
    expect(f.xAxis.mode).toBe("horizontal");
    expect(labels.map((l) => f.xAxis!.label(l))).toEqual([
      "Weekday",
      "Weekday",
      "Friday",
      "Saturday",
    ]);
    expect(f.axisNotes.map((n) => n.text)).toEqual(["lunch", "dinner", "night", "night"]);
    // one line (14 px) under the x label's baseline (20 px below the plot); the value
    // labels start a line below that
    expect(f.axisNotes[0].y - f.scales.plot.bottom).toBe(20 + 14);
    expect(f.bottom.valueLabelTop).toBe(20 + 14 + 15);
    expect(f.valueFit).not.toBeNull();
  });

  it("the forecast word goes on the label's line when it fits, else on a line of its own", () => {
    const wide = plan([jet("Fri", { forecast: true }), jet("Sat")]);
    if (wide.xAxis?.kind !== "band") throw new Error("band axis expected");
    expect(wide.xAxis.label("Fri")).toBe("Fri (forecast)");
    const narrow = plan(
      ["Today", "Fri", "Sat", "Sun", "Mon", "Tue"].map((l, i) => jet(l, { forecast: i > 0 })),
      { width: 600 },
    );
    if (narrow.xAxis?.kind !== "band") throw new Error("band axis expected");
    expect(narrow.xAxis.label("Fri")).toBe("Fri");
    expect(narrow.axisNotes.map((n) => n.text)).toEqual(Array(5).fill("(forecast)"));
  });

  it("once one forecast word needs a line of its own, every forecast label puts it there", () => {
    // 118 px columns: "Fri (forecast)" (98 px) fits on one line, "Saturday (forecast)"
    // (133 px) does not; the forecast labels still read alike.
    const f = plan(
      ["Today", "Fri", "Saturday", "Sun", "Mon", "Tue"].map((l, i) => jet(l, { forecast: i > 0 })),
      { width: 808 },
    );
    if (f.xAxis?.kind !== "band") throw new Error("band axis expected");
    expect(f.xAxis.mode).toBe("horizontal");
    expect(["Today", "Fri", "Saturday"].map((l) => f.xAxis!.label(l))).toEqual([
      "Today",
      "Fri",
      "Saturday",
    ]);
    expect(f.axisNotes.map((n) => n.text)).toEqual(Array(5).fill("(forecast)"));
    expect(f.valueFit).not.toBeNull();
  });

  it("labels too long even wrapped tilt the axis, and the value labels are left out (warned)", () => {
    const f = plan(
      Array.from({ length: 12 }, (_, i) => jet(`Extraordinarily${i}`)),
      { width: 700 },
    );
    if (f.xAxis?.kind !== "band") throw new Error("band axis expected");
    expect(f.xAxis.mode).not.toBe("horizontal");
    expect(f.valueFit).toBeNull();
    expect(f.warnings.some((w) => /x labels do not fit/.test(w.message))).toBe(true);
  });

  it("trend: labels too long even wrapped tilt, and the bottom margin holds the tilted label", () => {
    // Five years on a 340 px chart: 48 px columns, where "(forecast)" (70 px) fits
    // neither on one line nor wrapped, so the linear axis tilts its labels -45 deg
    // from 18 px under the plot (renderXAxisLinear autoRotate).
    const data: FountainDataItem[] = [2018, 2019, 2020, 2021, 2022].map((date, i) => ({
      label: "Flow",
      value: 50 + i * 15,
      spread: 10,
      date,
      forecast: date === 2022,
    }));
    const f = plan(data, { xAxisDataType: "number", width: 340, height: 460 });
    if (f.xAxis?.kind !== "linear") throw new Error("linear axis expected");
    const widest = measure("2022 (forecast)");
    expect(f.margin.bottom).toBeGreaterThanOrEqual(Math.ceil(18 + widest * Math.SQRT1_2 + 8));
    expect(f.valueFit).toBeNull();
    expect(f.warnings.some((w) => /x labels do not fit/.test(w.message))).toBe(true);
  });

  it("trend: a number axis keeps the raw year; a forecast period is marked", () => {
    const f = plan(
      [
        { label: "Flow", value: 50, spread: 8, date: 2001 },
        { label: "Flow", value: 70, spread: 10, date: 2002, forecast: true },
      ],
      { xAxisDataType: "number" },
    );
    if (f.xAxis?.kind !== "linear") throw new Error("linear axis expected");
    expect(f.xAxis.label(2001)).toBe("2001");
    expect(f.xAxis.label(2002)).toBe("2002 (forecast)");
  });
});

describe("planFountainFrame: what gives way", () => {
  it("a chart too short for the value labels leaves them out (warned)", () => {
    const f = plan([jet("A"), jet("B")], {
      height: 170,
      referenceLines: [{ value: 40, goodSide: "below" }],
    });
    expect(f.valueFit).toBeNull();
    expect(f.warnings.some((w) => /too short/.test(w.message))).toBe(true);
  });

  it("jets sharing a column get no value labels (warned)", () => {
    const f = plan([jet("A"), jet("A", { value: 35 }), jet("B")]);
    expect(f.valueFit!.blocks[0]).toEqual([]);
    expect(f.valueFit!.blocks[1]).toEqual([]);
    expect(f.valueFit!.blocks[2].length).toBeGreaterThan(0);
    expect(f.warnings.some((w) => /share a column/.test(w.message))).toBe(true);
  });

  it("columns under 24 px are a crowding warning", () => {
    const f = plan(
      Array.from({ length: 40 }, (_, i) => jet(`${i}`)),
      { width: 600, showValueLabels: false },
    );
    expect(f.scales.slotWidth).toBeLessThan(24);
    expect(f.warnings.some((w) => /24 px/.test(w.message))).toBe(true);
  });
});
