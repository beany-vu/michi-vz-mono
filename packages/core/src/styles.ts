// Replaces styled-components. Light DOM has no shadow encapsulation, so every
// rule is namespaced under `.michi-vz` and stays OUT of the fill/stroke business
// (mark colours are the consumer's color contract). Per-instance width/height
// are set as inline styles by the engine, not here.
//
// Auto-injected once via document.adoptedStyleSheets from the engine `mount()`
// (call-time, never on import — so it can't defeat tree-shaking). Opt out with
// globalThis.__MICHI_VZ_NO_AUTO_STYLE__ = true, or import the raw stylesheet and
// manage it yourself.

export const CORE_CSS = `
.michi-vz {
  position: relative;
  /* Default to INHERIT the host/page font (e.g. an app's Museo) when no fontFamily
     prop is set — the canvas reads the computed family too. Pass fontFamily to pin it. */
  font-family: var(--michi-vz-font-family, inherit);
  /* One global knob for ALL chart text (SVG + canvas). Per-role sizes scale off it. */
  font-size: var(--michi-vz-font-size, 12px);
}
.michi-vz svg { overflow: visible; display: block; }
.michi-vz .title { font-size: calc(var(--michi-vz-font-size, 12px) * 1.33); font-weight: 600; fill: var(--michi-vz-ink, currentColor); }
.michi-vz .gap-line { stroke-width: 2; fill: none; }
.michi-vz .mv-axis-label { fill: var(--michi-vz-muted, #666); font-size: var(--michi-vz-font-size, 12px); }
.michi-vz .mv-grid { stroke: var(--michi-vz-grid, lightgray); stroke-dasharray: 2 2; }
/* y=0 baseline: SOLID (not dashed) but GRAY by default (matches the previous
   version — user preference); override --michi-vz-zero-line for emphasis. */
.michi-vz .mv-zero-line { stroke: var(--michi-vz-zero-line, var(--michi-vz-grid, lightgray)); stroke-width: 1; stroke-dasharray: none; }
.michi-vz .mv-ylabel {
  display: flex; align-items: center; height: 100%; cursor: pointer;
  /* Match the x-axis tick labels (.mv-axis-label) EXACTLY — same configurable colour
     (--michi-vz-muted, NOT the darker --michi-vz-ink), font family + normal weight. The
     y-label is an HTML <div> in a <foreignObject>, so set these explicitly: it can
     otherwise inherit a different family/weight from the app cascade than the SVG <text>
     x-labels, making the two axes read in visibly different fonts. */
  font-size: var(--michi-vz-font-size, 12px); color: var(--michi-vz-muted, #666);
  font-family: var(--michi-vz-font-family, inherit); font-weight: 400;
  /* Wrap long category labels (legacy behaviour) instead of single-line ellipsis;
     overflow:visible (the foreignObject is also overflow:visible) lets a centred
     multi-line label spill into the empty inter-band gaps instead of clipping at the
     band height — worst case the TOP band, whose label was cut off. */
  white-space: normal; overflow: visible; line-height: 1.15;
}
/* Treemap / stack / annotation labels: font-size lives in CSS (NOT inline) so this
   one var controls them; weights stay here too. */
.michi-vz .tile-label { pointer-events: none; user-select: none; font-size: calc(var(--michi-vz-font-size, 12px) * 0.92); }
.michi-vz .tile-pct { pointer-events: none; user-select: none; font-size: calc(var(--michi-vz-font-size, 12px) * 1.08); font-weight: 700; }
.michi-vz .tile-group-label { pointer-events: none; user-select: none; font-size: calc(var(--michi-vz-font-size, 12px) * 0.92); font-weight: 600; }
.michi-vz .treemap-legend-label { pointer-events: none; user-select: none; font-size: var(--michi-vz-font-size, 12px); }
.michi-vz .slice-label { pointer-events: none; user-select: none; font-size: calc(var(--michi-vz-font-size, 12px) * 0.92); font-weight: 600; }
.michi-vz .pie-legend-label { pointer-events: none; user-select: none; font-size: var(--michi-vz-font-size, 12px); }
.michi-vz .bubble-label { pointer-events: none; user-select: none; font-size: calc(var(--michi-vz-font-size, 12px) * 0.92); font-weight: 600; }
.michi-vz .bubble-legend-label { pointer-events: none; user-select: none; font-size: var(--michi-vz-font-size, 12px); }
.michi-vz .sankey-nodes .node-label { pointer-events: none; user-select: none; font-size: calc(var(--michi-vz-font-size, 12px) * 0.92); }
.michi-vz .sankey-links .link { transition: stroke-opacity 0.2s ease-in-out; }
.michi-vz .mv-stack-abbrev { font-size: var(--michi-vz-font-size, 12px); }
.michi-vz .mv-annotation-label { font-size: calc(var(--michi-vz-font-size, 12px) * 0.92); }
.michi-vz .tooltip {
  position: absolute; background: #fff; border: 1px solid #ccc; border-radius: 4px;
  padding: 8px; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,.1);
  font-size: var(--michi-vz-font-size, 12px); z-index: 10;
}
.michi-vz .tooltip.sticky { pointer-events: auto; cursor: default; border-color: #666; }
.michi-vz .mv-a11y {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.michi-vz .mv-loading {
  position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;
  background-color: var(--michi-vz-loading, #ffc0cb);
  display: flex; justify-content: center; align-items: center;
  animation: mv-fade-in-out 0.9s linear infinite;
  cursor: wait; pointer-events: none;
}
@keyframes mv-fade-in-out {
  0% { opacity: 0; } 50% { opacity: 0.2; } 100% { opacity: 0; }
}
.michi-vz .mv-nodata {
  position: absolute; inset: 0;
  display: flex; justify-content: center; align-items: center; text-align: center;
  padding: 8px; box-sizing: border-box;
  background: var(--michi-vz-surface, #fff);
  color: var(--michi-vz-muted, #666);
  font-size: var(--michi-vz-font-size, 12px);
  pointer-events: none;
}
`;

let injected = false;

export function ensureStyles(): void {
  if (injected) return;
  if (typeof document === "undefined") return; // SSR-safe: no-op on the server
  if ((globalThis as Record<string, unknown>).__MICHI_VZ_NO_AUTO_STYLE__) return;
  try {
    if ("adoptedStyleSheets" in document && typeof CSSStyleSheet !== "undefined") {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CORE_CSS);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } else {
      const style = document.createElement("style");
      style.id = "michi-vz-styles";
      style.textContent = CORE_CSS;
      document.head.appendChild(style);
    }
  } catch {
    const style = document.createElement("style");
    style.id = "michi-vz-styles";
    style.textContent = CORE_CSS;
    document.head.appendChild(style);
  }
  injected = true;
}
