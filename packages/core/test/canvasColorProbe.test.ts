// Regression coverage for two canvas colour-contract bugs the playground gate
// caught (in real Chromium) but the jsdom vitest suite did not:
//
// 1. ComparableHorizontalBar's sub-bar canvas probe (makeSubBarProbe) used to
//    be a NESTED `<g class="bar" data-label-safe><rect class="value-based">`,
//    while the real SVG renderer (renderComparableSvg) always emits a FLAT
//    `<rect class="bar value-based" data-label-safe>` (both classes + the
//    attribute on the SAME element). A plain consumer rule like
//    `.bar { fill: ... }` matched the probe's outer `g`, not the inner `rect`
//    that resolveMarkColors reads getComputedStyle on - so the CSS override
//    never reached the resolved colour.
// 2. RadarChart's canvas probe checked `["stroke","fill"]` while always
//    seeding an explicit `stroke` attribute with the real fallback colour.
//    That attribute is a "specified" value on the SAME element being probed,
//    so it always won the "not none/empty" check before `fill` was ever
//    inspected - a plain `.radar-area { fill: ... }` consumer (no stroke rule)
//    was never able to override the resolved colour.
//
// NOTE on jsdom fidelity: jsdom's getComputedStyle does not model the SVG
// presentation-attribute cascade the way real browsers do (it does not
// reflect a presentation attribute's value into computed style at all when no
// CSS rule targets that element/property). That means a jsdom test cannot
// reproduce the OLD bugs' exact failure mode - the "structural shape" assertions
// below pin the probe's DOM shape directly (which *is* what regressed), and the
// resolveMarkColors integration assertions pin the currently-correct, intended
// CSS-override contract so a future change to the check/order logic is still
// caught.
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

describe("makeSubBarProbe (ComparableHorizontalBar) - probe shape mirrors the real SVG markup", () => {
  it("is a FLAT element: root === target, both classes + data-label-safe on the SAME node", () => {
    const probe = makeSubBarProbe("value-based")("Alpha One", "Alpha_One", "#123456");
    expect(probe.root).toBe(probe.target);
    expect(probe.target.tagName.toLowerCase()).toBe("rect");
    expect(probe.target.getAttribute("class")).toBe("bar value-based");
    expect(probe.target.classList.contains("bar")).toBe(true);
    expect(probe.target.classList.contains("value-based")).toBe(true);
    expect(probe.target.getAttribute("data-label-safe")).toBe("Alpha_One");
  });

  it("value-compared sub-bar carries both classes too", () => {
    const probe = makeSubBarProbe("value-compared")("Beta", "Beta", "#abcdef");
    expect(probe.target.classList.contains("bar")).toBe(true);
    expect(probe.target.classList.contains("value-compared")).toBe(true);
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
  });

  it("a plain `.bar { fill: ... }` consumer rule overrides the sub-bar colour", () => {
    style = withStyle("#host .bar { fill: rgb(120, 40, 200); }");
    const host = document.createElement("div");
    host.id = "host";
    document.body.appendChild(host);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    host.appendChild(svg);

    const resolved = resolveMarkColors(
      svg,
      ["Alpha One"],
      () => "#111111",
      makeSubBarProbe("value-based"),
      ["fill", "stroke"]
    );

    expect(resolved.get("Alpha One")).toBe("rgb(120, 40, 200)");
    host.remove();
  });
});

describe("resolveMarkColors - RadarChart fill/stroke CSS contract", () => {
  let style: HTMLStyleElement | undefined;
  afterEach(() => {
    style?.remove();
    style = undefined;
  });

  function mountHost() {
    const host = document.createElement("div");
    host.id = "host";
    document.body.appendChild(host);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    host.appendChild(svg);
    return { host, svg };
  }

  it("a fill-only consumer rule (`.radar-area { fill: ... }`) overrides the resolved colour", () => {
    style = withStyle("#host .radar-area { fill: rgb(20, 170, 90); }");
    const { host, svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Model A"],
      () => "#111111",
      makeMultiPropProbe("polygon", "radar-area", ["stroke", "fill"]),
      ["stroke", "fill"]
    );

    expect(resolved.get("Model A")).toBe("rgb(20, 170, 90)");
    host.remove();
  });

  it("with NO consumer CSS at all, falls back to the resolved data colour", () => {
    const { host, svg } = mountHost();

    const resolved = resolveMarkColors(
      svg,
      ["Model A"],
      () => "#111111",
      makeMultiPropProbe("polygon", "radar-area", ["stroke", "fill"]),
      ["stroke", "fill"]
    );

    expect(resolved.get("Model A")).toBe("#111111");
    host.remove();
  });
});
