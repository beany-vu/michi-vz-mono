// Ported verbatim from legacy michi-vz (shared/xaxisBand/chooseAxisMode.test.ts),
// adapted to vitest + the mono import path. Pins the horizontal/rotated/fallback
// decision so the mono band axis matches the old behaviour.
import { describe, test, expect } from "vitest";
import { chooseAxisMode } from "../src/render/svg/chooseAxisMode";

describe("chooseAxisMode", () => {
  // Predictable measurer: each character is 7px wide.
  const measure = (label: string) => label.length * 7;

  test("returns horizontal when widest label + padding fits a single band", () => {
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023"],
      formatter: (d) => String(d),
      bandWidth: 80,
      measure,
      padding: 8,
    });

    expect(result.mode).toBe("horizontal");
    expect(result.tickValues).toEqual(["01-2023", "02-2023", "03-2023"]);
  });

  test("returns rotated when horizontal overflows but -45° fits", () => {
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023"],
      formatter: (d) => String(d),
      bandWidth: 50,
      measure,
      padding: 8,
    });

    expect(result.mode).toBe("rotated");
    expect(result.tickValues).toEqual(["01-2023", "02-2023", "03-2023"]);
  });

  test("returns fallback with evenly-spaced sample when even rotation overflows", () => {
    const result = chooseAxisMode({
      domain: ["pos-12-01-2023", "pos-12-02-2023", "pos-12-03-2023", "pos-12-04-2023", "pos-12-05-2023"],
      formatter: (d) => String(d),
      bandWidth: 20,
      measure,
      padding: 8,
      maxTicks: 15,
    });

    expect(result.mode).toBe("fallback");
    expect(result.tickValues).toEqual(["pos-12-01-2023", "pos-12-05-2023"]);
  });

  test("fallback samples evenly when more than 2 ticks fit", () => {
    // 12 long labels at a 20px band: below the rotated-clearance threshold
    // (20·cos45 ≈ 14px < 16px line-height), so it thins rather than rotates, and
    // the band is wide enough to fit 3 evenly-spaced ticks (endpoints + midpoint).
    const domain = Array.from({ length: 12 }, (_, i) => `2023-long-month-${String(i).padStart(2, "0")}`);
    const result = chooseAxisMode({
      domain,
      formatter: (d) => String(d),
      bandWidth: 20,
      measure,
      padding: 8,
      maxTicks: 15,
    });

    expect(result.mode).toBe("fallback");
    expect(result.tickValues).toEqual([domain[0], domain[6], domain[11]]);
  });

  test("rotates a few long labels at wide bands instead of thinning them", () => {
    // Region-name axis: ~8 long category labels on a wide (~55px) band. Horizontal
    // can't fit a 40-char name, but rotating -45° gives a perpendicular gap of
    // 55·cos45 ≈ 39px between neighbours (>> a text line-height), so every label
    // stays legible and NONE are dropped. Guards the fix for the reported symptom
    // where long region labels were forced into horizontal-thinned overlap.
    const domain = [
      "Middle Africa",
      "Caribbean",
      "Oceania (exc. Australia and New Zealand)",
      "Central Asia",
      "Eastern Asia",
      "Western Asia",
      "Northern America",
      "Europe",
    ];
    const result = chooseAxisMode({
      domain,
      formatter: (d) => String(d),
      bandWidth: 55,
      measure,
      padding: 8,
    });

    expect(result.mode).toBe("rotated");
    expect(result.tickValues).toEqual(domain); // all kept, none thinned
  });

  test("empty domain returns horizontal with no ticks", () => {
    const result = chooseAxisMode({ domain: [], formatter: (d) => String(d), bandWidth: 80, measure });
    expect(result.mode).toBe("horizontal");
    expect(result.tickValues).toEqual([]);
  });

  test("single item always fits horizontally regardless of band width", () => {
    const result = chooseAxisMode({
      domain: ["only-one-very-long-label"],
      formatter: (d) => String(d),
      bandWidth: 5,
      measure,
    });
    expect(result.mode).toBe("horizontal");
    expect(result.tickValues).toEqual(["only-one-very-long-label"]);
  });

  test("numeric domain thins to ROUND values (Nordic default), not index-sampled oddities", () => {
    // Dense year axis 2000..2149. Legacy index sampling produced 2089/2119; the
    // Nordic default snaps interior ticks to round multiples of a nice step.
    const domain = Array.from({ length: 150 }, (_, i) => String(2000 + i));
    const result = chooseAxisMode({
      domain,
      formatter: (d) => String(d),
      bandWidth: 5,
      measure,
      padding: 8,
      maxTicks: 15,
    });

    expect(result.mode).toBe("fallback");
    const vals = result.tickValues.map(Number);
    expect(vals[0]).toBe(2000); // endpoints kept for orientation
    expect(vals[vals.length - 1]).toBe(2149);
    const interior = vals.slice(1, -1);
    expect(interior.length).toBeGreaterThan(0);
    // No 2089/2119: every interior tick is a round multiple of the nice step.
    expect(interior.every((v) => v % 20 === 0)).toBe(true);
  });

  test("forceMode='horizontal' skips rotation and falls back to current sampling", () => {
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023", "04-2023", "05-2023"],
      formatter: (d) => String(d),
      bandWidth: 50,
      measure,
      padding: 8,
      forceMode: "horizontal",
    });
    expect(result.mode).toBe("fallback");
    expect(result.tickValues).toEqual(["01-2023", "03-2023", "05-2023"]);
  });
});
