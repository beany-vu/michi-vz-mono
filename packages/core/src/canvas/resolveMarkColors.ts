// Moved verbatim (path-adjusted) from michi-vz
// src/components/hooks/canvas/resolveMarkColors.ts. THE load-bearing piece that
// forces light DOM: it resolves each label's mark colour the way the SVG
// renderer ends up coloured, honouring consumer CSS, by appending a hidden probe
// element that mimics the real SVG mark (same tag/class/data-attributes), reading
// the colour the browser computed for it (consumer CSS included) via
// getComputedStyle, then removing it. Shadow DOM would block the consumer CSS
// from matching the probe — which is why every michi-vz custom element renders
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

// Nested probe for sub-bar charts (ComparableHorizontalBar): the root is
// `<g class="bar" data-label data-label-safe>` and the target is a child
// `<rect class="value-based|value-compared">`, so DESCENDANT consumer CSS like
// `.bar[data-label-safe="X"] .value-based { fill: ... }` resolves on the target.
// Read with colorProp ['fill','stroke'] so a `url(#pattern)` fill falls through
// to the stroke colour. Mirrors the legacy makeSubBarProbe.
export const makeSubBarProbe =
  (subBarClass: "value-based" | "value-compared") =>
  (label: string, labelSafe: string, fallback: string): ColorProbe => {
    const NS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(NS, "g") as SVGGElement;
    g.setAttribute("class", "bar");
    g.setAttribute("data-label", label);
    g.setAttribute("data-label-safe", labelSafe);
    const rect = document.createElementNS(NS, "rect") as SVGRectElement;
    rect.setAttribute("class", subBarClass);
    rect.setAttribute("fill", fallback);
    rect.setAttribute("visibility", "hidden");
    g.appendChild(rect);
    return { root: g, target: rect };
  };
