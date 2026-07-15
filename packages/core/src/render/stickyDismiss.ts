// Shared dismissal wiring for click-to-pin ("sticky") tooltips - legacy parity.
// The legacy components registered a document-level handleClickOutside so a
// pinned tooltip unpins when the user clicks anywhere outside the chart and the
// tooltip; the engine ports dropped that (only verticalStackBarChart kept it),
// leaving a pinned tooltip stuck on screen with hover disabled. Every engine now
// wires this helper instead of its own bare tooltip click listener.
//
// The returned dispose fn MUST be called from destroy(): consumers remount
// charts constantly (key-remount pattern), and the document listener - plus the
// old anonymous tooltip listener - otherwise accumulates per mount.
export function wireStickyDismiss(
  host: HTMLElement,
  tooltip: HTMLElement,
  opts: {
    /** Read the engine's mount-scope sticky flag. */
    isSticky: () => boolean;
    /** Engine-specific unpin: clear the sticky flag (+ any highlight state). */
    unpin: () => void;
  },
): () => void {
  const dismiss = (): void => {
    opts.unpin();
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  };
  const onTooltipClick = (): void => {
    dismiss();
  };
  const onDocClick = (ev: MouseEvent): void => {
    if (!opts.isSticky()) return;
    const t = ev.target as Node;
    // Clicks inside the host toggle the pin via the engine's own host click
    // handler; clicks on the tooltip are handled by onTooltipClick.
    if (host.contains(t) || tooltip.contains(t)) return;
    dismiss();
  };
  tooltip.addEventListener("click", onTooltipClick);
  if (typeof document !== "undefined") document.addEventListener("click", onDocClick);
  return () => {
    tooltip.removeEventListener("click", onTooltipClick);
    if (typeof document !== "undefined") document.removeEventListener("click", onDocClick);
  };
}
