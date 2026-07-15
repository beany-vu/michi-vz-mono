import { describe, it, expect } from "vitest";
import { resolveEffectiveProps } from "../src/state/effectiveProps";

describe("resolveEffectiveProps", () => {
  it("merges colorsMapping with prop winning per-label", () => {
    const out = resolveEffectiveProps(
      { colorsMapping: { A: "#prop" } },
      { colorsMapping: { A: "#state", B: "#state" } },
    );
    expect(out.colorsMapping).toEqual({ A: "#prop", B: "#state" });
  });

  it("fills highlight/disabled/fontFamily/singlePointLine from state only when prop is absent", () => {
    const out = resolveEffectiveProps(
      { highlightItems: ["P"] },
      { highlightItems: ["S"], disabledItems: ["D"], fontFamily: "Museo", singlePointLine: true },
    );
    expect(out.highlightItems).toEqual(["P"]); // prop wins
    expect(out.disabledItems).toEqual(["D"]); // filled from state
    expect(out.fontFamily).toBe("Museo");
    expect(out.singlePointLine).toBe(true);
  });

  it("returns props unchanged when state is null", () => {
    const props = { colorsMapping: { A: "#1" }, highlightItems: ["X"] };
    expect(resolveEffectiveProps(props, null)).toBe(props);
  });

  it("does not clobber an explicit empty-array prop with state", () => {
    const out = resolveEffectiveProps({ disabledItems: [] }, { disabledItems: ["D"] });
    expect(out.disabledItems).toEqual([]); // prop provided (empty) wins
  });
});
