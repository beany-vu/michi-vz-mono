// Moved verbatim (path-adjusted) from michi-vz
// src/components/hooks/canvas/resolveMarkColors.ts. THE load-bearing piece that
// forces light DOM: it resolves each label's mark colour the way the SVG
// renderer ends up coloured, honouring consumer CSS, by appending a hidden probe
// element that mimics the real SVG mark (same tag/class/data-attributes), reading
// the colour the browser computed for it (consumer CSS included) via
// getComputedStyle, then removing it. Shadow DOM would block the consumer CSS
// from matching the probe - which is why every michi-vz custom element renders
// into light DOM.

import { sanitizeForClassName } from "../math/sanitize";

export interface ColorProbe {
  root: SVGElement;
  target: SVGElement;
}

export type ColorProp = "fill" | "stroke";

export const resolveMarkColors = (
  svgEl: SVGSVGElement | null,
  labels: string[],
  fallbackFor: (label: string) => string,
  buildProbe: (label: string, labelSafe: string, fallback: string) => ColorProbe,
  colorProp: ColorProp | ColorProp[]
): Map<string, string> => {
  const resolved = new Map<string, string>();

  if (!svgEl || typeof window === "undefined" || !window.getComputedStyle) {
    labels.forEach((label) => resolved.set(label, fallbackFor(label)));
    return resolved;
  }

  const probes = labels.map((label) => {
    const fallback = fallbackFor(label);
    const probe = buildProbe(label, sanitizeForClassName(label), fallback);
    svgEl.appendChild(probe.root);
    return { label, probe, fallback };
  });

  const props: ColorProp[] = Array.isArray(colorProp) ? colorProp : [colorProp];
  probes.forEach(({ label, probe, fallback }) => {
    const style = window.getComputedStyle(probe.target);
    let chosen = fallback;
    for (const prop of props) {
      const computed = style[prop];
      if (computed && computed !== "none" && computed !== "" && !computed.startsWith("url(")) {
        chosen = computed;
        break;
      }
    }
    resolved.set(label, chosen);
  });

  probes.forEach(({ probe }) => svgEl.removeChild(probe.root));
  return resolved;
};

export const makeSimpleProbe =
  (tag: string, className: string, colorProp: "fill" | "stroke") =>
  (label: string, labelSafe: string, fallback: string): ColorProbe => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag) as SVGElement;
    node.setAttribute("class", className);
    node.setAttribute("data-label", label);
    node.setAttribute("data-label-safe", labelSafe);
    node.setAttribute(colorProp, fallback);
    node.setAttribute("visibility", "hidden");
    return { root: node, target: node };
  };

// Probe for marks whose consumer CSS may target EITHER of two colour
// properties (e.g. RadarChart: a plain consumer recolours via `fill`, MonitorV2
// recolours via `stroke`). Each candidate property is seeded with the sentinel
// "none" rather than the real per-item fallback colour. Seeding a REAL fallback
// colour on a property that resolveMarkColors checks BEFORE the one the
// consumer actually styled would make that earlier property "win" every time
// (its computed value is always non-none, since it's a specified presentation
// attribute) and the genuinely-styled property would never be reached. "none"
// is transparent to the existing not-overridden check (`computed !== "none"`),
// so a property with no matching CSS rule correctly reads back as "not found"
// and the caller falls through to the true fallback only when NEITHER
// candidate property was styled by any consumer rule.
export const makeMultiPropProbe =
  (tag: string, className: string, props: ColorProp[]) =>
  (label: string, labelSafe: string, _fallback: string): ColorProbe => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag) as SVGElement;
    node.setAttribute("class", className);
    node.setAttribute("data-label", label);
    node.setAttribute("data-label-safe", labelSafe);
    for (const prop of props) node.setAttribute(prop, "none");
    node.setAttribute("visibility", "hidden");
    return { root: node, target: node };
  };

// Probe for sub-bar charts (ComparableHorizontalBar). Mirrors the REAL SVG
// markup emitted by renderComparableSvg EXACTLY: a single flat
// `<rect class="bar value-based|value-compared" data-label data-label-safe>`
// - both classes and data-label-safe live on the SAME element, there is no
// wrapping `<g class="bar">` ancestor. A previous version of this probe used a
// nested `<g class="bar" data-label-safe><rect class="value-based"></g>`
// shape; that broke a plain consumer rule like `.bar { fill: ... }`, because
// the rule matched the outer `g` (which has the "bar" class) while
// resolveMarkColors reads getComputedStyle on the INNER rect - and the rect's
// own `fill` presentation attribute (the fallback colour) counts as a
// specified value, so it wins over inheriting the ancestor's CSS-set fill
// (a specified value on an element always beats inheriting from an ancestor,
// no matter how low its priority). Reading with colorProp ['fill','stroke']
// still lets a `url(#pattern)` fill fall through to the stroke colour.
export const makeSubBarProbe =
  (subBarClass: "value-based" | "value-compared") =>
  (label: string, labelSafe: string, fallback: string): ColorProbe => {
    const NS = "http://www.w3.org/2000/svg";
    const rect = document.createElementNS(NS, "rect") as SVGRectElement;
    rect.setAttribute("class", `bar ${subBarClass}`);
    rect.setAttribute("data-label", label);
    rect.setAttribute("data-label-safe", labelSafe);
    rect.setAttribute("fill", fallback);
    rect.setAttribute("visibility", "hidden");
    return { root: rect, target: rect };
  };
