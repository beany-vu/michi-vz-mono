// Band-axis tick placement: the overlap primitives, calendar-aware month stepping, and
// the rotated-thinning rung of the mode ladder.
//
// The regression these guard: a 37-month YYYYMM domain used to be thinned by the base-10
// "nice number" ladder, which is meaningless over a base-12 month field. Targets landed
// either side of every year boundary and snapped onto ADJACENT bands, so the chart drew
// "12-2021" on top of "01-2022" three times over.
import { describe, test, expect } from "vitest";
import {
  chooseAxisMode,
  detectMonthDomain,
  enforceNoOverlap,
  labelsCollide,
  sampleBandTicks,
} from "../src/render/svg/chooseAxisMode";

// Predictable measurer: each character is 7px wide, matching chooseAxisMode.test.ts.
const measure = (label: string) => label.length * 7;
const formatter = (d: string) => `${d.slice(4)}-${d.slice(0, 4)}`; // 202105 -> "05-2021"

/** 05-2021 … 05-2024, the reported ATO Transportation Cost range. */
const MONTHS_37 = (() => {
  const out: string[] = [];
  for (let y = 2021; y <= 2024; y++) {
    for (let m = 1; m <= 12; m++) {
      const value = `${y}${String(m).padStart(2, "0")}`;
      if (value >= "202105" && value <= "202405") out.push(value);
    }
  }
  return out;
})();

const indicesOf = (domain: string[], ticks: string[]) => ticks.map((t) => domain.indexOf(t));

describe("labelsCollide", () => {
  const base = { bandWidth: 20, padding: 8, lineHeight: 16 } as const;

  test("horizontal uses each label's own width, not a global maximum", () => {
    const wide = { index: 0, width: 100 };
    const narrow = { index: 3, width: 10 };
    // 3 bands = 60px apart; the pair needs (100+10)/2 + 8 = 63px.
    expect(labelsCollide(wide, narrow, { ...base, mode: "horizontal" })).toBe(true);
    // Two narrow labels at the same distance need only 18px and clear easily.
    expect(labelsCollide({ index: 0, width: 10 }, narrow, { ...base, mode: "horizontal" })).toBe(
      false,
    );
  });

  test("rotated ignores width and uses the perpendicular gap", () => {
    const a = { index: 0, width: 500 };
    const b = { index: 2, width: 500 };
    // 2 bands = 40px; 40·cos45 ≈ 28px of clearance, well over a 16px line-height, so two
    // very long labels still clear each other once tilted.
    expect(labelsCollide(a, b, { ...base, mode: "rotated" })).toBe(false);
    expect(labelsCollide(a, { ...b, index: 1 }, { ...base, mode: "rotated" })).toBe(true);
  });
});

describe("enforceNoOverlap", () => {
  const o = { bandWidth: 20, padding: 8, lineHeight: 16, mode: "rotated" as const };

  test("keeps BOTH endpoints and drops only interior ticks", () => {
    const slots = [0, 1, 2, 3, 10].map((index) => ({ index, width: 40 }));
    const kept = enforceNoOverlap(slots, o).map((s) => s.index);

    expect(kept[0]).toBe(0);
    expect(kept[kept.length - 1]).toBe(10);
    expect(kept).not.toContain(1); // one band from the first tick
  });

  test("an interior tick that would crowd the LAST endpoint loses, not the endpoint", () => {
    const slots = [0, 5, 9, 10].map((index) => ({ index, width: 40 }));
    const kept = enforceNoOverlap(slots, o).map((s) => s.index);

    expect(kept).toContain(10);
    expect(kept).not.toContain(9);
  });

  test("a two-tick set is returned untouched - orientation beats perfection", () => {
    const slots = [
      { index: 0, width: 40 },
      { index: 1, width: 40 },
    ];
    expect(enforceNoOverlap(slots, o)).toEqual(slots);
  });
});

describe("detectMonthDomain", () => {
  test("accepts a YYYYMM domain and returns year*12 + (month-1)", () => {
    expect(detectMonthDomain(["202101", "202102", "202201"])).toEqual([
      2021 * 12,
      2021 * 12 + 1,
      2022 * 12,
    ]);
  });

  test("rejects anything that is not strictly increasing YYYYMM", () => {
    expect(detectMonthDomain(["2021", "2022"])).toBeNull(); // 4-digit years
    expect(detectMonthDomain(["202113", "202114"])).toBeNull(); // month out of range
    expect(detectMonthDomain(["202102", "202101"])).toBeNull(); // descending
    expect(detectMonthDomain(["202101", "01-2021"])).toBeNull(); // mixed
    expect(detectMonthDomain(["202101"])).toBeNull(); // too short to matter
  });
});

describe("month tick stepping", () => {
  test("ticks land on calendar anchors, tightening as room shrinks", () => {
    // Room for many ticks -> monthly; less room -> quarterly (Jan/Apr/Jul/Oct);
    // less again -> annual (January).
    const quarterly = sampleBandTicks(MONTHS_37, 16.2, 22.6, 15);
    const annual = sampleBandTicks(MONTHS_37, 16.2, 22.6, 6);

    const interiorMonth = (ticks: string[]) => ticks.slice(1, -1).map((t) => Number(t.slice(4)));
    expect(interiorMonth(quarterly).every((m) => [1, 4, 7, 10].includes(m))).toBe(true);
    expect(interiorMonth(annual).every((m) => m === 1)).toBe(true);
    expect(annual.length).toBeLessThan(quarterly.length);
  });

  test("both endpoints survive even though neither is a calendar anchor", () => {
    // The range starts and ends in May, which no step anchors on.
    const ticks = sampleBandTicks(MONTHS_37, 16.2, 22.6, 15);
    expect(ticks[0]).toBe("202105");
    expect(ticks[ticks.length - 1]).toBe("202405");
  });
});

describe("chooseAxisMode on the reported 37-month axis", () => {
  const reported = () =>
    chooseAxisMode({
      domain: MONTHS_37,
      formatter,
      bandWidth: 16.2,
      measure,
      padding: 24, // TransportationCost passes xAxisLabelPadding={24}
      maxTicks: 15,
    });

  test("rotates instead of thinning flat", () => {
    expect(reported().mode).toBe("rotated");
  });

  test("never selects adjacent bands - the actual overlap bug", () => {
    const indices = indicesOf(MONTHS_37, reported().tickValues);
    const gaps = indices.slice(1).map((v, i) => v - indices[i]);

    expect(Math.min(...gaps)).toBeGreaterThan(1);
    // No pair is closer than the perpendicular clearance a tilted label needs.
    expect(Math.min(...gaps) * 16.2 * Math.SQRT1_2).toBeGreaterThanOrEqual(16);
  });

  test("keeps the first and last month", () => {
    const ticks = reported().tickValues;
    expect(ticks[0]).toBe("202105");
    expect(ticks[ticks.length - 1]).toBe("202405");
  });

  test("shows more labels than flat thinning could", () => {
    const flat = chooseAxisMode({
      domain: MONTHS_37,
      formatter,
      bandWidth: 16.2,
      measure,
      padding: 24,
      maxTicks: 15,
      forceMode: "horizontal",
    });

    expect(flat.mode).toBe("fallback");
    expect(reported().tickValues.length).toBeGreaterThan(flat.tickValues.length);
  });
});
