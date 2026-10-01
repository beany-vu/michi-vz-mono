// Position a tooltip near the cursor, flipping LEFT when it would overflow the right
// edge (so it doesn't slide under a sibling sidebar or off the screen) and keeping it
// inside the host vertically. Every chart engine places its tooltip through here, so
// the behaviour is the same in every chart and every renderer.
//
// Call it AFTER the tooltip content is set and made visible: it measures the box.
// The box is measured at left 0 first. Measured where it was, an absolutely
// positioned tooltip near the right edge is shrink-to-fit squeezed into the room
// left, reads narrow, "fits", and ends up as a tall unreadable column.
export type TooltipVertical = "cursor" | "above";

export function placeTooltip(
  host: HTMLElement,
  tooltip: HTMLElement,
  ev: MouseEvent,
  offset = 10,
  vertical: TooltipVertical = "cursor",
): void {
  tooltip.style.left = "0px";
  tooltip.style.top = "0px";
  const r = host.getBoundingClientRect();
  const cx = ev.clientX - r.left;
  const cy = ev.clientY - r.top;
  const w = tooltip.offsetWidth;
  const h = tooltip.offsetHeight;

  // Right limit: the host's edge, or the window's when the host runs past it.
  const viewW = typeof document !== "undefined" ? document.documentElement.clientWidth : 0;
  const rightLimit = viewW > 0 ? Math.min(r.width, viewW - r.left) : r.width;
  // Default to the cursor's right; flip left when that overflows.
  let left = cx + offset;
  if (left + w > rightLimit) left = cx - w - offset;
  if (left < 0) left = 0;

  // "cursor": the top sits just above the cursor. "above": the whole box sits above
  // the cursor, dropping below when that would clip the top.
  let top = vertical === "above" ? cy - h - offset : cy - offset;
  if (vertical === "above" && top < 0) top = cy + offset;
  if (top + h > r.height) top = r.height - h;
  if (top < 0) top = 0;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
