import { describe, it, expect } from "vitest";
import { cssColorToPremultiplied } from "../src/webgpu/color";

const close = (a: number, b: number) => Math.abs(a - b) < 1e-3;
const rgbaClose = (got: number[], want: number[]) => got.every((v, i) => close(v, want[i]));

describe("cssColorToPremultiplied", () => {
  it("maps transparent/none/empty to a zero (skip) colour", () => {
    expect(cssColorToPremultiplied("transparent")).toEqual([0, 0, 0, 0]);
    expect(cssColorToPremultiplied("none")).toEqual([0, 0, 0, 0]);
    expect(cssColorToPremultiplied("")).toEqual([0, 0, 0, 0]);
    expect(cssColorToPremultiplied(null)).toEqual([0, 0, 0, 0]);
  });

  it("parses opaque hex", () => {
    expect(rgbaClose(cssColorToPremultiplied("#ff0000"), [1, 0, 0, 1])).toBe(true);
    expect(rgbaClose(cssColorToPremultiplied("#0f0"), [0, 1, 0, 1])).toBe(true);
  });

  it("premultiplies 8-digit hex alpha", () => {
    // #00ff0080 → alpha 128/255 ≈ 0.502, green premultiplied by alpha.
    const a = 128 / 255;
    expect(rgbaClose(cssColorToPremultiplied("#00ff0080"), [0, a, 0, a])).toBe(true);
  });

  it("parses rgb() (getComputedStyle form)", () => {
    expect(rgbaClose(cssColorToPremultiplied("rgb(0, 128, 0)"), [0, 128 / 255, 0, 1])).toBe(true);
  });

  it("premultiplies rgba() alpha", () => {
    // rgba(255,0,0,0.5) → premultiplied red = 1*0.5 = 0.5.
    expect(rgbaClose(cssColorToPremultiplied("rgba(255, 0, 0, 0.5)"), [0.5, 0, 0, 0.5])).toBe(true);
  });
});
