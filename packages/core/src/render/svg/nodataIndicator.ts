// Vanilla default "no data" overlay (plain DOM, styled by core.css `.mv-nodata`).
// Sibling of loadingIndicator.ts. Gives pure vanilla / web-component consumers a
// working no-data message with zero framework code; framework wrappers pass
// suppressDefaultOverlay and render their own isNodataComponent instead.
//
// The host must be position:relative (the engine sets `.michi-vz` to that) so the
// absolutely-positioned overlay covers the chart.
import { htmlEl } from "../../dom";

/** Show/hide a no-data overlay idempotently; returns the current overlay or null. */
export function toggleNodataIndicator(
  host: HTMLElement,
  show: boolean,
  text: string,
  existing: HTMLDivElement | null,
): HTMLDivElement | null {
  if (show) {
    const el = existing ?? htmlEl("div", { class: "mv-nodata" });
    el.setAttribute("role", "status");
    el.textContent = text;
    if (!existing) host.appendChild(el);
    return el;
  }
  existing?.remove();
  return null;
}
