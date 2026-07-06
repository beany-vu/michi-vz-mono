// Regression coverage for canvas colour-contract bugs the playground gate
// caught (in real Chromium) but the jsdom vitest suite did not, plus a
// code-review finding on the FIRST fix attempt for one of them:
//
// 1. RadarChart's canvas probe checked `["stroke","fill"]` while always
//    seeding an explicit `stroke` attribute with the real fallback colour.
//    That attribute is a "specified" value on the SAME element being probed,
//    so it always won the "not none/empty" check before `fill` was ever
//    inspected - a plain `.radar-area { fill: ... }` consumer (no stroke rule)
//    was never able to override the resolved colour.
// 2. ComparableHorizontalBar's sub-bar canvas probe (makeSubBarProbe) needs
//    to satisfy TWO real, independently-shipped thd MonitorV2 consumer CSS
//    contracts simultaneously:
//      a) a DESCENDANT selector keyed on an ancestor `.bar[data-label...]`
//         class, styling a descendant `.value-based`/`.value-compared`
//         element - see thd frontend/src/sites/ato/pages/MonitorV2/Result/
//         MacMap/TariffStructure/ByPattern.jsx:76 and
//         .../TradeMap/TradeGrowthPotential.jsx:181-182 (this is the exact
//         production CSS, quoted verbatim below).
//      b) a SAME-ELEMENT / compound selector (a plain `.bar { fill }`, or
//         `.bar.value-based { fill }`, or an attribute selector applied
//         directly to the sub-bar).
//    A first fix attempt flattened the probe to a single element (satisfies
//    only form b - broke every real thd consumer, form a, silently, since
//    thd pins this package and would have shipped it without any local
//    signal). The corrected probe is a `<g class="bar" data-label
//    data-label-safe>` ancestor wrapping a `<rect class="bar
//    value-based|value-compared" data-label data-label-safe>` descendant,
//    read from the RECT - the compound classes on the rect satisfy form b
//    directly, and the ancestor g's matching class + attributes satisfy
//    form a's descendant combinator.
//
// NOTE on jsdom fidelity: jsdom's getComputedStyle does not model the SVG
// presentation-attribute cascade the way real browsers do (a presentation
// attribute's value is not reflected into computed style at all when no CSS
// rule targets that element/property), so a jsdom test cannot reproduce bug 1's
// exact failure mode - the makeMultiPropProbe "structural shape" assertion
// pins the fix directly. Separately, jsdom's cascade ALSO does not correctly
// rank selector SPECIFICITY when multiple conflicting rules target the same
// element in one stylesheet (verified empirically: a lower-specificity same-
// element rule can incorrectly beat a higher-specificity descendant rule) -
// so each CSS-contract test below installs exactly ONE rule at a time via
// `withStyle`/`afterEach`, never a same-element and a descendant rule
// together. The playwright playground check (`playground/index.html`, "CMP
// DESCENDANT CANVAS colour contract") is the authoritative browser-level
// assertion for the combined/competing-rules case and is the one that must
// stay green for this contract.
import { describe, it, expect, afterEach } from "vitest";
import {
  resolveMarkColors,
  makeSubBarProbe,
  makeMultiPropProbe,
} from "../src/canvas/resolveMarkColors";

function withStyle(css: string): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

function mountHost() {
  const host = document.createElement("div");
  host.id = "host";
  document.body.appendChild(host);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
  host.appendChild(svg);
  return { host, svg };
}

describe("makeSubBarProbe (ComparableHorizontalBar) - dual-form probe shape", () => {
  it("wraps a compound-class rect in a matching-class ancestor: root !== target", () => {
    const probe = makeSubBarProbe("value-based")("Alpha One", "Alpha_One", "#123456");
    expect(probe.root).not.toBe(probe.target);
    expect(probe.root.tagName.toLowerCase()).toBe("g");
    expect(probe.target.tagName.toLowerCase()).toBe("rect");
  });

  it("the ancestor carries the matching `bar` class + both label attributes (descendant-selector contract)", () => {
    const probe = makeSubBarProbe("value-based")("Alpha One", "Alpha_One", "#123456");
    expect(probe.root.getAttribute("class")).toBe("bar");
    expect(probe.root.getAttribute("data-label")).toBe("Alpha One");
    expect(probe.root.getAttribute("data-label-safe")).toBe("Alpha_One");
  });

  it("the target rect carries BOTH `bar` and the sub-bar class + both label attributes (same-element/compound contract)", () => {
    const based = makeSubBarProbe("value-based")("Alpha One", "Alpha_One", "#123456");
    expect(based.target.getAttribute("class")).toBe("bar value-based");
    expect(based.target.classList.contains("bar")).toBe(true);
    expect(based.target.classList.contains("value-based")).toBe(true);
    expect(based.target.getAttribute("data-label-safe")).toBe("Alpha_One");

    const compared = makeSubBarProbe("value-compared")("Beta", "Beta", "#abcdef");
    expect(compared.target.getAttribute("class")).toBe("bar value-compared");
  });
});

describe("makeMultiPropProbe (RadarChart) - candidate properties are seeded with the neutral sentinel", () => {
  it('seeds every candidate colour property with "none", not the real fallback colour', () => {
    const probe = makeMultiPropProbe(
      "polygon",
      "radar-area",
      ["stroke", "fill"]
    )("Model A", "Model_A", "#2ca02c");
    expect(probe.root).toBe(probe.target);
    expect(probe.target.getAttribute("stroke")).toBe("none");
    expect(probe.target.getAttribute("fill")).toBe("none");
  });
});

describe("resolveMarkColors - ComparableHorizontalBar sub-bar CSS contract", () => {
  let style: HTMLStyleElement | undefined;
  afterEach(() => {
    style?.remove();
    style = undefined;
    document.getElementById("host")?.remove();
  });

  it("thd ByPattern.jsx's exact descendant rule: `.bar[data-label=\"X\"] .value-compared { fill }`", () => {
    // Quoted verbatim (colour substituted) from thd frontend/src/sites/ato/pages/
    // MonitorV2/Result/MacMap/TariffStructure/ByPattern.jsx:76.
    style = withStyle('.bar[data-label="Alpha One"] .value-compared { fill: rgb(220, 20, 140); }');
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Alpha One"],
      () => "#111111",
      makeSubBarProbe("value-compared"),
      ["fill", "stroke"]
    );

    expect(resolved.get("Alpha One")).toBe("rgb(220, 20, 140)");
  });

  it('thd TradeGrowthPotential.jsx\'s exact descendant rules: `.bar[data-label-safe="K"] .value-based { fill: url(...); stroke }` + `.value-compared { fill }`', () => {
    // Quoted verbatim (colour/pattern substituted) from thd frontend/src/sites/
    // ato/pages/MonitorV2/Result/TradeMap/TradeGrowthPotential.jsx:181-182. The
    // value-based rule's `fill` is a `url(#pattern-…)` reference (a hatch
    // pattern via patternsMapping) that canvas 2d can't resolve, so
    // resolveMarkColors must fall through to that same rule's `stroke`.
    style = withStyle(
      '.bar[data-label-safe="K"] .value-based { fill: url(#pattern-K); stroke: rgb(10, 200, 10); }\n' +
        '.bar[data-label-safe="K"] .value-compared { fill: rgb(220, 20, 140); }'
    );
    const { svg } = mountHost();

    const based = resolveMarkColors(svg, ["K"], () => "#111111", makeSubBarProbe("value-based"), [
      "fill",
      "stroke",
    ]);
    expect(based.get("K")).toBe("rgb(10, 200, 10)");

    const compared = resolveMarkColors(svg, ["K"], () => "#111111", makeSubBarProbe("value-compared"), [
      "fill",
      "stroke",
    ]);
    expect(compared.get("K")).toBe("rgb(220, 20, 140)");
  });

  it("a plain same-element `.bar { fill: ... }` consumer rule still overrides the sub-bar colour", () => {
    style = withStyle(".bar { fill: rgb(120, 40, 200); }");
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Alpha One"],
      () => "#111111",
      makeSubBarProbe("value-based"),
      ["fill", "stroke"]
    );

    expect(resolved.get("Alpha One")).toBe("rgb(120, 40, 200)");
  });

  it("a compound `.bar.value-based { fill: ... }` consumer rule overrides the sub-bar colour", () => {
    style = withStyle(".bar.value-based { fill: rgb(9, 9, 9); }");
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Gamma"],
      () => "#111111",
      makeSubBarProbe("value-based"),
      ["fill", "stroke"]
    );

    expect(resolved.get("Gamma")).toBe("rgb(9, 9, 9)");
  });

  it("an attribute-on-target rule (no ancestor requirement) overrides the sub-bar colour", () => {
    style = withStyle('.value-based[data-label-safe="Delta"] { fill: rgb(11, 22, 33); }');
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Delta"],
      () => "#111111",
      makeSubBarProbe("value-based"),
      ["fill", "stroke"]
    );

    expect(resolved.get("Delta")).toBe("rgb(11, 22, 33)");
  });

  it("with NO consumer CSS at all, falls back to the resolved data colour", () => {
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Alpha One"],
      () => "#111111",
      makeSubBarProbe("value-based"),
      ["fill", "stroke"]
    );

    expect(resolved.get("Alpha One")).toBe("#111111");
  });
});

describe("resolveMarkColors - RadarChart fill/stroke CSS contract", () => {
  let style: HTMLStyleElement | undefined;
  afterEach(() => {
    style?.remove();
    style = undefined;
    document.getElementById("host")?.remove();
  });

  it("a fill-only consumer rule (`.radar-area { fill: ... }`) overrides the resolved colour", () => {
    style = withStyle(".radar-area { fill: rgb(20, 170, 90); }");
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Model A"],
      () => "#111111",
      makeMultiPropProbe("polygon", "radar-area", ["stroke", "fill"]),
      ["stroke", "fill"]
    );

    expect(resolved.get("Model A")).toBe("rgb(20, 170, 90)");
  });

  it("a stroke-only consumer rule (MonitorV2's real contract, `.radar-area { stroke: ... }`) overrides the resolved colour", () => {
    style = withStyle(".radar-area { stroke: rgb(9, 9, 200); }");
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Model A"],
      () => "#111111",
      makeMultiPropProbe("polygon", "radar-area", ["stroke", "fill"]),
      ["stroke", "fill"]
    );

    expect(resolved.get("Model A")).toBe("rgb(9, 9, 200)");
  });

  it("with NO consumer CSS at all, falls back to the resolved data colour", () => {
    const { svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Model A"],
      () => "#111111",
      makeMultiPropProbe("polygon", "radar-area", ["stroke", "fill"]),
      ["stroke", "fill"]
    );

    expect(resolved.get("Model A")).toBe("#111111");
  });
});
