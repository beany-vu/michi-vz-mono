// Imperative port of shared/LoadingIndicator.tsx (was styled-components). The
// pulsing-overlay animation now lives in core.css under `.michi-vz .mv-loading`
// (keyframes mv-fade-in-out). This builder just creates/removes the overlay div.
//
// The host must be position:relative (the engine sets `.michi-vz` to that) so the
// absolutely-positioned overlay covers the chart.
import { htmlEl } from "../../dom";

export interface LoadingIndicatorOptions {
  className?: string;
}

export function renderLoadingIndicator(
  host: HTMLElement,
  o: LoadingIndicatorOptions = {}
): HTMLDivElement {
  const el = htmlEl("div", { class: o.className ?? "mv-loading" });
  el.setAttribute("aria-hidden", "true");
  host.appendChild(el);
  return el;
}

/** Show/hide a loading overlay idempotently. Returns the current overlay (or null
 * when hidden) so callers can keep a handle without tracking it themselves. */
export function toggleLoadingIndicator(
  host: HTMLElement,
  loading: boolean,
  existing: HTMLDivElement | null
): HTMLDivElement | null {
  if (loading) {
    return existing ?? renderLoadingIndicator(host);
  }
  existing?.remove();
  return null;
}
