// Minimal DOM helpers so the imperative renderers stay compact without pulling
// in d3-selection (keeps the core bundle small + tree-shakeable).
const SVG_NS = "http://www.w3.org/2000/svg";

type Attrs = Record<string, string | number | boolean | undefined | null>;

function applyAttrs(node: Element, attrs: Attrs): void {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    node.setAttribute(k, String(v));
  }
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {}
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
  applyAttrs(node, attrs);
  return node;
}

export function htmlEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {}
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  return node;
}

export function clear(node: Node): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}
