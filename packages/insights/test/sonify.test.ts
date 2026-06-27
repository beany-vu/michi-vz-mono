import { describe, it, expect } from "vitest";
import { valuesToTones, sonify } from "../src/sonify";

describe("sonify", () => {
  it("maps min/max values to min/max frequency over time", () => {
    const tones = valuesToTones([0, 5, 10], { duration: 3, minFreq: 200, maxFreq: 800 });
    expect(tones).toHaveLength(3);
    expect(tones[0].freq).toBeCloseTo(200, 6);
    expect(tones[1].freq).toBeCloseTo(500, 6);
    expect(tones[2].freq).toBeCloseTo(800, 6);
    expect(tones[0].time).toBe(0);
    expect(tones[1].time).toBeCloseTo(1, 6);
    expect(tones[2].time).toBeCloseTo(2, 6);
  });

  it("returns [] for empty or all-non-finite input", () => {
    expect(valuesToTones([])).toEqual([]);
    expect(valuesToTones([NaN, Infinity])).toEqual([]);
  });

  it("sonify is a graceful no-op without AudioContext (jsdom)", async () => {
    await expect(sonify([1, 2, 3])).resolves.toBeUndefined();
  });
});
