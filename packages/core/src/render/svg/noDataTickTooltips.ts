// Hover tooltips for the faded "no data" tick labels an axis marked with
// `.mv-tick-nodata` (see renderXAxisLinear's `noDataValues`). Kept OUT of the pure
// SVG builder so the axis renderer stays DOM-event-free; each engine calls this after
// rendering, passing its own tooltip element + host so `placeTooltip` can flip the
// tooltip near the host edges (same element the data tooltip uses).
import DOMPurify from "dompurify";
import { placeTooltip } from "../placeTooltip";

export function wireNoDataTickTooltips(
  axisG: SVGGElement,
  tooltipEl: HTMLElement,
  host: HTMLElement,
  formatter: ((v: number) => string) | undefined,
  defaultLabel = "Data not available",
  // Notifies the engine while the cursor is over a no-data tick, so its host-level
  // `mousemove` hit-test (canvas mode) can stand down instead of hiding this tooltip.
  onHoverChange?: (hovering: boolean) => void,
): void {
  const nodes = axisG.querySelectorAll<SVGTextElement>(".mv-tick-nodata");
  nodes.forEach((node) => {
    const v = Number(node.getAttribute("data-mv-value"));
    node.addEventListener("mouseenter", (ev) => {
      onHoverChange?.(true);
      tooltipEl.innerHTML = DOMPurify.sanitize(formatter ? formatter(v) : defaultLabel);
      tooltipEl.style.visibility = "visible";
      placeTooltip(host, tooltipEl, ev);
    });
    node.addEventListener("mouseleave", () => {
      onHoverChange?.(false);
      tooltipEl.style.visibility = "hidden";
    });
  });
}
