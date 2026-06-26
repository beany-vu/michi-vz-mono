// Pure-layer tests for VerticalStackBar — the hasOwnProperty marker guard (HARD
// RULE), flooring, and key ordering. No jsdom needed.
import { describe, it, expect } from "vitest";
import {
  extractDataKeys,
  resolveEffectiveKeys,
  collectDates,
  computeYDomain,
} from "../src/verticalStackBarChart/data";
import { createStackScales } from "../src/verticalStackBarChart/scales";
import { buildStackColors } from "../src/verticalStackBarChart/colors";
import { prepareStackedData } from "../src/verticalStackBarChart/stack";
import type { VerticalStackBarDataSet } from "../src/types";

function prep(
  dataSet: VerticalStackBarDataSet[],
  opts: { keys?: string[]; missingDataMarker?: { height: number }; minBarHeight?: number } = {}
) {
  const dataKeys = extractDataKeys(dataSet);
  const effectiveKeys = resolveEffectiveKeys(dataKeys, opts.keys);
  const dates = collectDates(dataSet);
  const yDomain = computeYDomain(dataSet, effectiveKeys);
  const scales = createStackScales(dates, yDomain, 600, 400, { top: 20, right: 20, bottom: 40, left: 40 });
  const colors = buildStackColors(effectiveKeys);
  const prepared = prepareStackedData(dataSet, effectiveKeys, scales, colors, {
    keysOrder: "topToBottom",
    minBarWidth: 5,
    minBarHeight: opts.minBarHeight ?? 15,
    minBarHeightZero: 0,
    missingDataMarker: opts.missingDataMarker,
  });
  return { effectiveKeys, prepared };
}

describe("VerticalStackBar key extraction + ordering", () => {
  it("extracts the union of keys excluding date/code", () => {
    expect(
      extractDataKeys([
        { seriesKey: "X", seriesKeyAbbreviation: "X", series: [{ date: "2001", A: "1", code: "x" }] },
        { seriesKey: "Y", seriesKeyAbbreviation: "Y", series: [{ date: "2001", B: "2" }] },
      ])
    ).toEqual(["A", "B"]);
  });
  it("honors explicit keys, appends natural, drops unknown + disabled", () => {
    expect(resolveEffectiveKeys(["C", "B", "A"], ["A", "B", "C"])).toEqual(["A", "B", "C"]);
    expect(resolveEffectiveKeys(["C", "B", "A"], ["A"])).toEqual(["A", "C", "B"]);
    expect(resolveEffectiveKeys(["C", "B", "A"], ["Z", "A"])).toEqual(["A", "C", "B"]); // Z dropped
    expect(resolveEffectiveKeys(["C", "B", "A"])).toEqual(["C", "B", "A"]); // natural order
    expect(resolveEffectiveKeys(["A", "B", "C"], undefined, ["B"])).toEqual(["A", "C"]); // disabled
  });
});

describe("hasOwnProperty marker guard (HARD RULE)", () => {
  // The regression test: two DataSets that each own ONLY their own key. Iterating
  // the global key union over each row must NOT paint a stub for the other
  // DataSet's (absent) key.
  it("emits NO stub for keys absent from the data point (no strip-of-stubs)", () => {
    const dataSet: VerticalStackBarDataSet[] = [
      { seriesKey: "Africa", seriesKeyAbbreviation: "AF", series: [{ date: "2001", Africa: "10" }] },
      { seriesKey: "Asia", seriesKeyAbbreviation: "AS", series: [{ date: "2001", Asia: "20" }] },
    ];
    const { prepared } = prep(dataSet, { missingDataMarker: { height: 2 } });
    expect(prepared.stackedData.Africa.length).toBe(1);
    expect(prepared.stackedData.Asia.length).toBe(1);
    const all = [...prepared.stackedData.Africa, ...prepared.stackedData.Asia];
    expect(all.every((r) => !r.isMissing)).toBe(true);
  });

  it("emits a stub for an EXPLICITLY-present null key (when marker configured)", () => {
    const dataSet: VerticalStackBarDataSet[] = [
      { seriesKey: "Africa", seriesKeyAbbreviation: "AF", series: [{ date: "2001", Africa: null }] },
    ];
    const { prepared } = prep(dataSet, { missingDataMarker: { height: 3 } });
    expect(prepared.stackedData.Africa.length).toBe(1);
    expect(prepared.stackedData.Africa[0].isMissing).toBe(true);
    expect(prepared.stackedData.Africa[0].value).toBe(null);
    expect(prepared.stackedData.Africa[0].height).toBe(3);
  });

  it("emits NO stub when missingDataMarker is omitted (backward compat)", () => {
    const dataSet: VerticalStackBarDataSet[] = [
      { seriesKey: "Africa", seriesKeyAbbreviation: "AF", series: [{ date: "2001", Africa: null }] },
    ];
    const { prepared } = prep(dataSet);
    expect(prepared.stackedData.Africa.length).toBe(0);
  });
});

describe("VerticalStackBar flooring", () => {
  it("floors a sub-pixel non-zero segment to minBarHeight but leaves zero unfloored", () => {
    const dataSet: VerticalStackBarDataSet[] = [
      { seriesKey: "X", seriesKeyAbbreviation: "X", series: [{ date: "2001", a: "0.01", b: "0", c: "100" }] },
    ];
    const { prepared } = prep(dataSet);
    expect(prepared.stackedData.a[0].height).toBe(15); // tiny non-zero -> floored
    expect(prepared.stackedData.b[0].height).toBe(0); // literal zero -> minBarHeightZero (not floored)
    expect(prepared.stackedData.c[0].height).toBeGreaterThan(15); // real height
  });

  it("a missing-value branch does not advance the stack (zero participants stay put)", () => {
    const dataSet: VerticalStackBarDataSet[] = [
      { seriesKey: "X", seriesKeyAbbreviation: "X", series: [{ date: "2001", a: "10", b: null }] },
    ];
    const { prepared } = prep(dataSet, { missingDataMarker: { height: 2 } });
    // `a` is a real bar; `b` is a stub on the zero line (does not stack on top of a)
    expect(prepared.stackedData.a[0].isMissing).toBeUndefined();
    expect(prepared.stackedData.b[0].isMissing).toBe(true);
  });
});
