// Position a tooltip near the cursor, flipping LEFT when it would overflow the host's
// right edge (so it doesn't slide under a sibling sidebar) and UP when it would
// overflow the bottom. Call this AFTER the tooltip content is set + made visible - it
// measures offsetWidth/offsetHeight to decide the flip.
export function placeTooltip(
  host: HTMLElement,
  tooltip: HTMLElement,
  ev: MouseEvent,
  offset = 10,
): void {
  const r = host.getBoundingClientRect();
  const cx = ev.clientX - r.left;
  const cy = ev.clientY - r.top;
  const w = tooltip.offsetWidth;
  const h = tooltip.offsetHeight;

  // Default to the cursor's right; flip left if that overflows the host's right edge.
  let left = cx + offset;
  if (left + w > r.width) left = cx - w - offset;
  if (left < 0) left = 0;

  // Default to just above the cursor; clamp within the host vertically.
  let top = cy - offset;
  if (top + h > r.height) top = r.height - h;
  if (top < 0) top = 0;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
