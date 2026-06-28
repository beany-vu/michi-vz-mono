import { describe, it, expect } from "vitest";
import { readableTextColor } from "../src/math/contrast";

describe("readableTextColor", () => {
  it("picks white on dark fills, dark on light fills", () => {
    expect(readableTextColor("#005aba")).toBe("#ffffff"); // dark blue -> white
    expect(readableTextColor("#1a1a1a")).toBe("#ffffff");
    expect(readableTextColor("#f0a500")).toBe("#1a1a1a"); // gold -> dark
    expect(readableTextColor("#ef8a6a")).toBe("#1a1a1a"); // coral -> dark
    expect(readableTextColor("#ffffff")).toBe("#1a1a1a");
  });

  it("parses rgb()/rgba() (what the canvas colour probe returns)", () => {
    expect(readableTextColor("rgb(0, 90, 186)")).toBe("#ffffff");
    expect(readableTextColor("rgba(240, 165, 0, 1)")).toBe("#1a1a1a");
  });

  it("falls back to the light colour for unparseable input", () => {
    expect(readableTextColor("transparent")).toBe("#ffffff");
    expect(readableTextColor("not-a-color")).toBe("#ffffff");
  });

  it("honours custom dark/light overrides", () => {
    expect(readableTextColor("#ffffff", "#222", "#eee")).toBe("#222");
    expect(readableTextColor("#000000", "#222", "#eee")).toBe("#eee");
  });
});
