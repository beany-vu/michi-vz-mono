import { describe, it, expect } from "vitest";
import {
  checkFountainData,
  checkFountainOptions,
  checkFountainDomain,
  FOUNTAIN_REMOVED_PROPS,
} from "../src/validate/fountainWarnings";
import { resolveFountainData } from "../src/fountainChart/data";
import type { FountainChartProps, FountainDataItem } from "../src/types";

const check = (dataSet: FountainDataItem[], extra: Partial<FountainChartProps> = {}) =>
  checkFountainData({ dataSet, ...extra });
const types = (w: Array<{ type: string }>) => w.map((x) => x.type);

describe("checkFountainData", () => {
  it("clean data: no warnings", () => {
    expect(
      check(
        [
          { label: "Car", value: 30, low: 22, high: 55, samples: [22, 30, 55] },
          { label: "Train", value: 35, spread: 3 },
          { label: "Bus", samples: [30, 40, 50] },
        ],
        { referenceLines: [{ value: 45, goodSide: "below" }] },
      ),
    ).toEqual([]);
  });

  it("empty-dataset (and nothing else)", () => {
    expect(types(check([]))).toEqual(["empty-dataset"]);
  });

  it("non-finite-value: a jet with no finite value and no samples is skipped", () => {
    const w = check([
      { label: "A", value: NaN },
      { label: "B", value: 2 },
    ]);
    expect(w.map((x) => [x.type, x.label])).toEqual([["non-finite-value", "A"]]);
  });

  it("range-excludes-value, sample-outside-range, inverted-range", () => {
    expect(types(check([{ label: "A", value: 60, low: 20, high: 50 }]))).toEqual([
      "range-excludes-value",
    ]);
    expect(types(check([{ label: "A", value: 30, low: 25, high: 40, samples: [22] }]))).toEqual([
      "sample-outside-range",
    ]);
    expect(types(check([{ label: "A", value: 30, low: 50, high: 20 }]))).toEqual([
      "inverted-range",
    ]);
  });

  it("missing-date and duplicate-date in trend mode", () => {
    const w = check(
      [
        { label: "A", value: 1, date: 2001 },
        { label: "B", value: 2, date: 2001 },
        { label: "C", value: 3 },
      ],
      { xAxisDataType: "number" },
    );
    expect(types(w).sort()).toEqual(["duplicate-date", "missing-date"]);
  });

  it("duplicate-label in snapshot mode only", () => {
    const data: FountainDataItem[] = [
      { label: "A", value: 1, date: 2001 },
      { label: "A", value: 2, date: 2002 },
    ];
    expect(types(check(data))).toEqual(["duplicate-label"]);
    expect(check(data, { xAxisDataType: "number" })).toEqual([]);
  });

  it("warns about disabled items too (it checks the data, not the view)", () => {
    const w = check([{ label: "A", value: NaN }], { disabledItems: ["A"] });
    expect(types(w)).toEqual(["non-finite-value"]);
  });

  it("includes the option and domain checks", () => {
    const w = check([{ label: "A", value: 500, density: 3 }], {
      yAxisDomain: [0, 200],
      showMist: false,
    });
    expect(types(w).sort()).toEqual(["ignored-option", "ignored-option", "out-of-domain"]);
  });
});

describe("checkFountainOptions: ignored-option", () => {
  it("one warning per removed prop that is set, naming it", () => {
    expect([...FOUNTAIN_REMOVED_PROPS]).toEqual([
      "style",
      "frothLayers",
      "bloomExponent",
      "stemFraction",
      "showDroplets",
      "showMist",
    ]);
    const w = checkFountainOptions({
      dataSet: [],
      style: "plume",
      frothLayers: 8,
      bloomExponent: 3,
      stemFraction: 0.1,
      showDroplets: false,
      showMist: true,
    });
    expect(types(w)).toEqual(Array(6).fill("ignored-option"));
    FOUNTAIN_REMOVED_PROPS.forEach((name, i) => expect(w[i].message).toContain(`\`${name}\``));
  });

  it("nothing when the removed props are absent", () => {
    expect(checkFountainOptions({ dataSet: [{ label: "A", value: 1 }] })).toEqual([]);
  });

  it("per-item density and lean: one warning each, naming the items", () => {
    const w = checkFountainOptions({
      dataSet: [
        { label: "A", value: 1, density: 3 },
        { label: "B", value: 1, density: 5, lean: 0.4 },
        { label: "C", value: 1 },
      ],
    });
    expect(types(w)).toEqual(["ignored-option", "ignored-option"]);
    expect(w[0].message).toContain("density");
    expect(w[0].message).toContain('"A", "B"');
    expect(w[1].message).toContain("lean");
    expect(w[1].message).toContain('"B"');
  });
});

describe("checkFountainDomain: out-of-domain", () => {
  const jets = resolveFountainData([
    { label: "In", value: 50, low: 20, high: 80 },
    { label: "Over", value: 500 },
    { label: "Sample", value: 50, samples: [10, 50, 250] },
  ]).jets;

  it("no user domain: nothing to check", () => {
    expect(checkFountainDomain(jets, undefined)).toEqual([]);
  });

  it("names every jet with a value, range end or sample outside the user domain", () => {
    const w = checkFountainDomain(jets, [0, 200]);
    expect(w.map((x) => [x.type, x.label])).toEqual([
      ["out-of-domain", "Over"],
      ["out-of-domain", "Sample"],
    ]);
    expect(w[0].message).toContain("500");
  });

  it("only the value counts when ranges are hidden", () => {
    const w = checkFountainDomain(jets, [0, 200], { showRange: false });
    expect(w.map((x) => x.label)).toEqual(["Over"]);
  });

  it("a reference line outside the user domain is reported (it is not drawn)", () => {
    const w = checkFountainDomain([], [0, 200], { referenceLines: [{ value: 300, label: "Cap" }] });
    expect(w.map((x) => [x.type, x.label])).toEqual([["out-of-domain", "Cap"]]);
  });

  it("accepts a reversed domain", () => {
    expect(checkFountainDomain(jets.slice(0, 1), [100, 0])).toEqual([]);
  });
});
