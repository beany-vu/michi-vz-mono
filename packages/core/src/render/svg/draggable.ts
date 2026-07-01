// Make an SVG <g> pointer-draggable within its chart. Used for the scatter
// dScaleLegend, which can otherwise sit under the bubbles. The drag offset is owned
// by the caller (a module var that survives re-renders) - the engine re-creates the
// group every render, so the helper applies the caller's stored offset and reports
// back via onMove. Position is applied via inline `style.transform` so it wins over a
// consumer stylesheet rule like `.michi-vz-legend { transform: ... }`.
import { svgEl } from "../../dom";

export interface DraggableOptions {
  /** Current persisted offset (applied immediately). */
  offset: { x: number; y: number };
  /** Persist a new offset (store it in the caller's module var). */
  onMove: (offset: { x: number; y: number }) => void;
  /** Notified on drag start/end so the caller can suppress its own hover hit-test. */
  onDragStateChange?: (dragging: boolean) => void;
}

export function makeSvgGroupDraggable(group: SVGGElement, o: DraggableOptions): void {
  let offset = { ...o.offset };
  const apply = (): void => {
    group.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
  };
  apply();
  group.style.cursor = "grab";

  // A transparent hit-rect over the group's bbox so the whole legend area is grabbable
  // (not just the thin arc strokes / text glyphs). getBBox throws in jsdom → skip.
  let bbox: DOMRect | null = null;
  try {
    bbox = group.getBBox();
  } catch {
    bbox = null;
  }
  if (bbox && bbox.width > 0 && bbox.height > 0) {
    const pad = 8;
    const hit = svgEl("rect", {
      x: bbox.x - pad,
      y: bbox.y - pad,
      width: bbox.width + pad * 2,
      height: bbox.height + pad * 2,
      fill: "transparent",
    });
    group.insertBefore(hit, group.firstChild);
  }

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startOX = 0;
  let startOY = 0;

  const onPointerMove = (ev: PointerEvent): void => {
    if (!dragging) return;
    offset = { x: startOX + (ev.clientX - startX), y: startOY + (ev.clientY - startY) };
    apply();
  };
  const onPointerUp = (): void => {
    if (!dragging) return;
    dragging = false;
    group.style.cursor = "grab";
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    o.onMove(offset);
    o.onDragStateChange?.(false);
  };
  group.addEventListener("pointerdown", (ev: PointerEvent) => {
    dragging = true;
    startX = ev.clientX;
    startY = ev.clientY;
    startOX = offset.x;
    startOY = offset.y;
    group.style.cursor = "grabbing";
    ev.stopPropagation();
    ev.preventDefault();
    o.onDragStateChange?.(true);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  });
}
