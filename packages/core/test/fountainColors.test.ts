import { describe, it, expect } from "vitest";
import { buildFountainColors } from "../src/fountainChart/colors";
import { DEFAULT_COLORS } from "../src/theme/colors";
import type { FountainDataItem } from "../src/types";

const P = ["#111111", "#222222", "#333333", "#444444"];

describe("buildFountainColors", () => {
  it("gives palette slots in the first-seen label order of the dataSet", () => {
    const c = buildFountainColors(
      [
        { label: "B", value: 1 },
        { label: "A", value: 1 },
        { label: "B", value: 2 },
        { label: "C", value: 3 },
      ],
      P,
    );
    expect(c.generatedColorsMapping).toEqual({ B: P[0], A: P[1], C: P[2] });
    expect(c.getColor("C")).toBe(P[2]);
  });

  it("falls back to the default palette", () => {
    const c = buildFountainColors([{ label: "A", value: 1 }]);
    expect(c.getColor("A")).toBe(DEFAULT_COLORS[0]);
  });

  it("per jet: colorsMapping[label] ?? item.color ?? the label's colour", () => {
    const data: FountainDataItem[] = [
      { label: "Water", value: 1, date: 2022 },
      { label: "Water", value: 2, date: 2023 },
      { label: "Water", value: 3, date: 2024, color: "gold" },
      { label: "Mapped", value: 4, color: "pink" },
    ];
    // Palette slots start after the mapped labels (the house convention).
    const c = buildFountainColors(data, P, { Mapped: "navy" });
    expect(data.map((d) => c.colorOf(d))).toEqual([P[1], P[1], "gold", "navy"]);
    expect(c.generatedColorsMapping).toEqual({ Mapped: "navy", Water: P[1] });
  });

  it("a label whose first item carries a colour uses it as the label colour", () => {
    const data: FountainDataItem[] = [
      { label: "A", value: 1, color: "red" },
      { label: "A", value: 2 },
      { label: "B", value: 3 },
    ];
    const c = buildFountainColors(data, P);
    expect(c.colorOf(data[1])).toBe("red");
    expect(c.generatedColorsMapping).toEqual({ A: "red", B: P[0] });
  });

  it("the same dataSet always gives the same colours (the caller passes it unfiltered)", () => {
    const data: FountainDataItem[] = [
      { label: "A", value: 1 },
      { label: "B", value: 1 },
      { label: "C", value: 1 },
    ];
    const once = buildFountainColors(data, P).generatedColorsMapping;
    const twice = buildFountainColors([...data], P).generatedColorsMapping;
    expect(twice).toEqual(once);
    expect(once.C).toBe(P[2]);
  });

  it("skipColorMappingDispatch: unmapped labels are transparent, mapped and per-item colours stay", () => {
    const data: FountainDataItem[] = [
      { label: "A", value: 1 },
      { label: "B", value: 1, color: "red" },
      { label: "C", value: 1 },
    ];
    const c = buildFountainColors(data, P, { C: "blue" }, true);
    expect(data.map((d) => c.colorOf(d))).toEqual(["transparent", "red", "blue"]);
  });
});
