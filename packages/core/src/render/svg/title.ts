// Imperative port of shared/Title.tsx — renders a centered <text class="title">
// only when there is text (the JSX returned null for empty children). Colour is
// the consumer's contract via core.css `.michi-vz .title` (no fill set here).
import { svgEl } from "../../dom";

export interface TitleOptions {
  text?: string;
  x: number;
  y: number;
  /** Override the class (default "title", styled by core.css). */
  className?: string;
}

export function renderTitle(parent: SVGElement, o: TitleOptions): SVGTextElement | null {
  if (!o.text) return null;
  const t = svgEl("text", {
    class: o.className ?? "title",
    x: o.x,
    y: o.y,
    "text-anchor": "middle",
  });
  t.textContent = o.text;
  parent.appendChild(t);
  return t;
}
