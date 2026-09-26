// sequentialScheme(name, count): the ColorBrewer single-hue sequential schemes, with
// the exact k = 3..9 colour lists d3-scale-chromatic ships (schemeBlues[k] etc.), so a
// consumer can build a choropleth `colorScale.range` without depending on d3.
// The expected colours are PINNED here (not read from d3-scale-chromatic) so this
// test has no dependency on it.
import { describe, it, expect } from "vitest";
import {
  sequentialScheme,
  SEQUENTIAL_SCHEME_NAMES,
  type SequentialSchemeName,
} from "../src/theme/schemes";
import * as core from "../src/index";

// The complete table in d3-scale-chromatic's own source encoding (src/sequential-single
// /<Name>.js): one string per k = 3..9, six hex digits per colour.
const PINNED: Record<SequentialSchemeName, string[]> = {
  blues: [
    "deebf79ecae13182bd",
    "eff3ffbdd7e76baed62171b5",
    "eff3ffbdd7e76baed63182bd08519c",
    "eff3ffc6dbef9ecae16baed63182bd08519c",
    "eff3ffc6dbef9ecae16baed64292c62171b5084594",
    "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
    "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b",
  ],
  greens: [
    "e5f5e0a1d99b31a354",
    "edf8e9bae4b374c476238b45",
    "edf8e9bae4b374c47631a354006d2c",
    "edf8e9c7e9c0a1d99b74c47631a354006d2c",
    "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
    "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
    "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b",
  ],
  greys: [
    "f0f0f0bdbdbd636363",
    "f7f7f7cccccc969696525252",
    "f7f7f7cccccc969696636363252525",
    "f7f7f7d9d9d9bdbdbd969696636363252525",
    "f7f7f7d9d9d9bdbdbd969696737373525252252525",
    "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
    "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000",
  ],
  oranges: [
    "fee6cefdae6be6550d",
    "feeddefdbe85fd8d3cd94701",
    "feeddefdbe85fd8d3ce6550da63603",
    "feeddefdd0a2fdae6bfd8d3ce6550da63603",
    "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
    "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
    "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704",
  ],
  purples: [
    "efedf5bcbddc756bb1",
    "f2f0f7cbc9e29e9ac86a51a3",
    "f2f0f7cbc9e29e9ac8756bb154278f",
    "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
    "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
    "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
    "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d",
  ],
  reds: [
    "fee0d2fc9272de2d26",
    "fee5d9fcae91fb6a4acb181d",
    "fee5d9fcae91fb6a4ade2d26a50f15",
    "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
    "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
    "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
    "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d",
  ],
};

const decode = (s: string): string[] => (s.match(/.{6}/g) ?? []).map((c) => `#${c}`);

describe("sequentialScheme", () => {
  it("lists the six single-hue scheme names", () => {
    expect([...SEQUENTIAL_SCHEME_NAMES]).toEqual([
      "blues",
      "greens",
      "greys",
      "oranges",
      "purples",
      "reds",
    ]);
  });

  it("purples 3, 5 and 9 are d3's schemePurples[3], [5] and [9]", () => {
    expect(sequentialScheme("purples", 3)).toEqual(["#efedf5", "#bcbddc", "#756bb1"]);
    expect(sequentialScheme("purples", 5)).toEqual([
      "#f2f0f7",
      "#cbc9e2",
      "#9e9ac8",
      "#756bb1",
      "#54278f",
    ]);
    expect(sequentialScheme("purples", 9)).toEqual([
      "#fcfbfd",
      "#efedf5",
      "#dadaeb",
      "#bcbddc",
      "#9e9ac8",
      "#807dba",
      "#6a51a3",
      "#54278f",
      "#3f007d",
    ]);
  });

  it("every name x every k = 3..9 matches the pinned ColorBrewer table", () => {
    for (const name of SEQUENTIAL_SCHEME_NAMES) {
      for (let k = 3; k <= 9; k++) {
        const got = sequentialScheme(name, k);
        expect(got, `${name} ${k}`).toEqual(decode(PINNED[name][k - 3]));
        expect(got).toHaveLength(k);
        for (const c of got) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it("runs light to dark (first colour is the lightest)", () => {
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
    };
    for (const name of SEQUENTIAL_SCHEME_NAMES) {
      const list = sequentialScheme(name, 9);
      for (let i = 1; i < list.length; i++) expect(lum(list[i])).toBeLessThan(lum(list[i - 1]));
    }
  });

  it("clamps count to 3..9", () => {
    expect(sequentialScheme("blues", 2)).toEqual(sequentialScheme("blues", 3));
    expect(sequentialScheme("blues", 0)).toEqual(sequentialScheme("blues", 3));
    expect(sequentialScheme("blues", -4)).toEqual(sequentialScheme("blues", 3));
    expect(sequentialScheme("reds", 10)).toEqual(sequentialScheme("reds", 9));
    expect(sequentialScheme("reds", 42)).toEqual(sequentialScheme("reds", 9));
    expect(sequentialScheme("reds", Number.POSITIVE_INFINITY)).toEqual(sequentialScheme("reds", 9));
    expect(sequentialScheme("reds", Number.NEGATIVE_INFINITY)).toEqual(sequentialScheme("reds", 3));
  });

  it("rounds a non-integer count", () => {
    expect(sequentialScheme("greens", 4.4)).toHaveLength(4);
    expect(sequentialScheme("greens", 4.5)).toHaveLength(5);
    expect(sequentialScheme("greens", 6.7)).toEqual(sequentialScheme("greens", 7));
    expect(sequentialScheme("greens", 2.6)).toHaveLength(3);
    expect(sequentialScheme("greens", 9.4)).toHaveLength(9);
  });

  it("returns a fresh array on every call (callers may mutate it)", () => {
    const a = sequentialScheme("oranges", 5);
    const b = sequentialScheme("oranges", 5);
    expect(a).not.toBe(b);
    a.reverse();
    a.push("#000000");
    expect(sequentialScheme("oranges", 5)).toEqual(decode(PINNED.oranges[2]));
  });

  it("throws a clear error for an unknown name", () => {
    const call = (name: string) => () =>
      sequentialScheme(name as unknown as SequentialSchemeName, 5);
    expect(call("viridis")).toThrow(/unknown sequential scheme "viridis"/i);
    expect(call("viridis")).toThrow(/blues, greens, greys, oranges, purples, reds/);
    // Case matters (the d3 export is schemePurples, the name here is "purples").
    expect(call("Purples")).toThrow(/unknown sequential scheme/i);
    // Prototype keys are not schemes.
    expect(call("constructor")).toThrow(/unknown sequential scheme/i);
    expect(call("__proto__")).toThrow(/unknown sequential scheme/i);
  });

  it("throws for a count that is not a number", () => {
    expect(() => sequentialScheme("blues", Number.NaN)).toThrow(RangeError);
    expect(() => sequentialScheme("blues", "5" as unknown as number)).toThrow(RangeError);
  });

  it("SEQUENTIAL_SCHEME_NAMES cannot be mutated at runtime", () => {
    expect(Object.isFrozen(SEQUENTIAL_SCHEME_NAMES)).toBe(true);
  });

  it("is exported from the package entry", () => {
    expect(core.sequentialScheme).toBe(sequentialScheme);
    expect(core.SEQUENTIAL_SCHEME_NAMES).toBe(SEQUENTIAL_SCHEME_NAMES);
  });
});
