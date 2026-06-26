// Imperative port of shared/Overlay.tsx — appends a transparent capture <rect>
// (class "tpRef") sized to the chart so mouse events (tooltip / x-axis crosshair)
// have a hit surface even where there are no marks. Returns the rect so the
// caller can attach listeners. Append this LAST so it sits above the marks.
import { svgEl } from "../../dom";

export interface OverlayOptions {
  width: number;
  height: number;
  className?: string;
}

export function renderOverlay(parent: SVGElement, o: OverlayOptions): SVGRectElement {
  const rect = svgEl("rect", {
    class: o.className ?? "tpRef",
    width: o.width,
    height: o.height,
    opacity: 0,
  });
  parent.appendChild(rect);
  return rect;
}
