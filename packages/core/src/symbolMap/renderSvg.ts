// Imperative SVG renderer for SymbolMap. The optional backdrop draws first (one
// <path class="geography">, muted, non-interactive - purely decorative context,
// unlike ChoroplethMap's data-bearing regions), then one <g class="symbol-cell">
// per settled symbol: an outer <circle class="symbol"> sized by `value`, an
// optional inner <circle class="symbol-second"> sized by `valueSecond` (ported
// from legacy ForceNode.js's two-circle layering - the second circle is drawn ON
// TOP of the first, so when it's the SMALLER of the two it reads as a dimmer
// core inside a lighter outer ring, and when LARGER it fully covers the first),
// and a fitted label when the symbol is large enough.
import { svgEl } from "../dom";
import { readableTextColor } from "../math/contrast";
import { symbolEffectiveHitRadius } from "./hitTest";
import type { SymbolMapMark, SymbolMapRenderModel } from "./renderModel";

export interface SymbolMapSvgOptions {
  enableTransitions: boolean;
  showLabels: boolean;
  geographyColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface SymbolMapInteractions {
  onEnter: (mark: SymbolMapMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (mark: SymbolMapMark, ev: MouseEvent) => void;
}

function fitText(text: string, r: number, charPx = 6.2): string {
  const max = Math.floor((r * 2 - 6) / charPx);
  if (max <= 0) return "";
  if (text.length <= max) return text;
  if (max <= 1) return "";
  return text.slice(0, max - 1) + "…";
}

export function renderSymbolMapSvg(
  parent: SVGElement,
  model: SymbolMapRenderModel,
  o: SymbolMapSvgOptions,
  ia: SymbolMapInteractions,
): void {
  const root = svgEl("g", { class: "symbol-map-content" });
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";

  if (model.backdrop.length > 0) {
    const backdropG = svgEl("g", { class: "symbol-map-geography" });
    for (const b of model.backdrop) {
      if (!b.d) continue;
      backdropG.appendChild(
        svgEl("path", {
          class: "geography",
          "data-label": b.id,
          d: b.d,
          fill: o.geographyColor,
          stroke: o.strokeColor,
          "stroke-width": o.strokeWidth,
        }),
      );
    }
    root.appendChild(backdropG);
  }

  // Append order (B3.7): the ONLY reason order matters here is native SVG hit-
  // testing on overlapping INVISIBLE hit targets below - painted circles never
  // overlap (the force layout de-overlaps them by design), so this never
  // changes what's visible. Larger marks are appended first and smaller ones
  // last (so they sit on top), meaning a tiny dot's forgiving hit padding
  // wins over an adjacent big bubble's real geometry in the rare case they
  // overlap, instead of the big bubble silently swallowing the tiny dot's
  // extra hit area.
  const appendOrder = [...model.symbols].sort((a, b) => {
    const ra = a.radiusSecond != null ? Math.max(a.radius, a.radiusSecond) : a.radius;
    const rb = b.radiusSecond != null ? Math.max(b.radius, b.radiusSecond) : b.radius;
    return rb - ra;
  });

  for (const m of appendOrder) {
    const g = svgEl("g", { class: "symbol-cell", transform: `translate(${m.x}, ${m.y})` });
    g.style.opacity = m.dimmed ? "0.3" : "1";
    g.style.transition = transition;

    g.appendChild(
      svgEl("circle", {
        class: "symbol",
        "data-label": m.colorKey,
        "data-label-safe": m.dataLabelSafe,
        r: m.radius,
        fill: m.fill,
        opacity: m.opacity,
      }),
    );

    if (m.radiusSecond != null) {
      g.appendChild(
        svgEl("circle", {
          class: "symbol-second",
          "data-label-safe": m.dataLabelSafe,
          r: m.radiusSecond,
          fill: m.fill,
          opacity: m.opacitySecond ?? m.opacity,
        }),
      );
    }

    if (o.showLabels) {
      const radiusThreshold =
        m.radiusSecond != null ? Math.max(m.radius, m.radiusSecond) : m.radius;
      if (radiusThreshold >= 16) {
        const label = svgEl("text", {
          class: "symbol-label",
          "text-anchor": "middle",
          "dominant-baseline": "central",
          fill: readableTextColor(m.fill),
        });
        label.textContent = fitText(m.label, radiusThreshold);
        g.appendChild(label);
      }
    }

    // Invisible forgiving hit target (B3.7): a small mark's own painted circle
    // is too small a native hit region for a real pointer (the actual reported
    // bug), so an unpainted circle floored to SYMBOL_MIN_HIT_RADIUS sits on top
    // - `fill: "transparent"` (NOT "none") keeps it hit-testable under the
    // default `pointer-events: visiblePainted` while staying invisible. For a
    // mark whose own radius already meets the floor this is the SAME size as
    // its visible circle, so large-bubble hit behaviour is unchanged.
    g.appendChild(
      svgEl("circle", {
        class: "symbol-hit",
        r: symbolEffectiveHitRadius(m),
        fill: "transparent",
      }),
    );

    g.style.cursor = "pointer";
    g.addEventListener("mouseenter", (e) => ia.onEnter(m, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick(m, e));
    root.appendChild(g);
  }

  parent.appendChild(root);
}
