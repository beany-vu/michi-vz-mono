// Replaces styled-components. Light DOM has no shadow encapsulation, so every
// rule is namespaced under `.michi-vz` and stays OUT of the fill/stroke business
// (mark colours are the consumer's color contract). Per-instance width/height
// are set as inline styles by the engine, not here.
//
// Auto-injected once via document.adoptedStyleSheets from the engine `mount()`
// (call-time, never on import - so it can't defeat tree-shaking). Opt out with
// globalThis.__MICHI_VZ_NO_AUTO_STYLE__ = true, or import the raw stylesheet and
// manage it yourself.

export const CORE_CSS = `
.michi-vz {
  position: relative;
  /* Default to INHERIT the host/page font (e.g. an app's Museo) when no fontFamily
     prop is set - the canvas reads the computed family too. Pass fontFamily to pin it. */
  font-family: var(--michi-vz-font-family, inherit);
  /* One global knob for ALL chart text (SVG + canvas). Per-role sizes scale off it. */
  font-size: var(--michi-vz-font-size, 12px);
}
.michi-vz svg { overflow: visible; display: block; }
.michi-vz .title { font-size: calc(var(--michi-vz-font-size, 12px) * 1.33); font-weight: 600; fill: var(--michi-vz-ink, currentColor); }
.michi-vz .gap-line { stroke-width: 2; fill: none; }
.michi-vz .mv-axis-label { fill: var(--michi-vz-muted, #666); font-size: var(--michi-vz-font-size, 12px); }
/* Faded label for a fillPeriodTicks period with no data. Colour = --michi-vz-tick-nodata
   (set via the noDataTickColor prop) else the muted axis colour; the extra opacity fades it
   below the real labels. Theme-adaptive on light AND dark (derives from currentColor). The
   engine wires a "Data not available" hover tooltip; cursor:help signals it. */
.michi-vz .mv-tick-nodata { fill: var(--michi-vz-tick-nodata, var(--michi-vz-muted, #999)); opacity: 0.45; cursor: help; }
.michi-vz .mv-grid { stroke: var(--michi-vz-grid, lightgray); stroke-dasharray: 2 2; }
/* y=0 baseline: SOLID (not dashed) but GRAY by default (matches the previous
   version - user preference); override --michi-vz-zero-line for emphasis. */
.michi-vz .mv-zero-line { stroke: var(--michi-vz-zero-line, var(--michi-vz-grid, lightgray)); stroke-width: 1; stroke-dasharray: none; }
/* Vertical hover crosshair (LineChart mouse line): SOLID legacy grey, snapped to the
   nearest data point x by the engine (enableMouseLine, default ON). Theme via the
   --michi-vz-crosshair* vars - host-level CSS or per-instance through the
   enableMouseLine config prop, which sets the same vars on the line element. */
.michi-vz .mv-mouse-line { stroke: var(--michi-vz-crosshair, #a9a9a9); stroke-width: var(--michi-vz-crosshair-width, 1); stroke-dasharray: var(--michi-vz-crosshair-dash, none); }
/* Row-label leader line (interactiveRowLabels on band-row charts): connects a
   hovered/focused y-axis label to its row's marks. Same theme vars as the crosshair. */
.michi-vz .mv-row-leader { stroke: var(--michi-vz-crosshair, #a9a9a9); stroke-width: var(--michi-vz-crosshair-width, 1); stroke-dasharray: 3 3; pointer-events: none; }
/* Opt-in "calm" axis theme (Nordic / lagom): a whisper-quiet grid and muted labels so
   the axis recedes and the data carries the only saturation. Add class="michi-vz-calm"
   to the chart host (or ANY ancestor - the vars cascade); pair with fewer ticks
   (the ticks / yTicksQty props) for the full airy look. color-mix keeps it theme-adaptive:
   the grid/labels derive from the inherited text colour, so it works on light AND dark. */
.michi-vz-calm {
  --michi-vz-grid: color-mix(in srgb, currentColor 11%, transparent);
  --michi-vz-muted: color-mix(in srgb, currentColor 55%, transparent);
}
.michi-vz-calm .mv-grid { stroke-dasharray: 1 5; }
.michi-vz-calm .mv-zero-line { stroke: color-mix(in srgb, currentColor 22%, transparent); }
.michi-vz .mv-ylabel {
  display: flex; align-items: center; height: 100%; cursor: pointer;
  /* Match the x-axis tick labels (.mv-axis-label) EXACTLY - same configurable colour
     (--michi-vz-muted, NOT the darker --michi-vz-ink), font family + normal weight. The
     y-label is an HTML <div> in a <foreignObject>, so set these explicitly: it can
     otherwise inherit a different family/weight from the app cascade than the SVG <text>
     x-labels, making the two axes read in visibly different fonts. */
  font-size: var(--michi-vz-font-size, 12px); color: var(--michi-vz-muted, #666);
  font-family: var(--michi-vz-font-family, inherit); font-weight: 400;
  /* Wrap long category labels (legacy behaviour) instead of single-line ellipsis;
     overflow:visible (the foreignObject is also overflow:visible) lets a centred
     multi-line label spill into the empty inter-band gaps instead of clipping at the
     band height - worst case the TOP band, whose label was cut off. */
  white-space: normal; overflow: visible; line-height: 1.15;
}
.michi-vz .mv-ylabel span {
  /* Cap a wrapped label at 2 lines: unbounded wrapping relies on the neighbouring
     band's gap being EMPTY to spill into, which breaks down when adjacent rows both
     have long labels (both spill into the same shared gap and collide, rendering
     illegibly). The full label stays available via the div's title attribute. */
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis;
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

let greeted = false;

/**
 * A friendly once-per-page console hello - hidden from end users, found by curious devs.
 * Opt out with `globalThis.__MICHI_VZ_NO_GREETING__ = true`. SSR-safe.
 */
function greetOnce(): void {
  if (greeted) return;
  greeted = true;
  if (typeof window === "undefined") return; // browser-only (no SSR/Node log spam)
  if (typeof console === "undefined" || typeof console.log !== "function") return;
  if ((globalThis as Record<string, unknown>).__MICHI_VZ_NO_GREETING__) return;
  console.log(
    "%c📊 michi-vz%c  made with love 💛\n" +
      "%cThis chart is drawn with michi-vz.\n" +
      "→ Docs:   https://michi-vz.netlify.app\n" +
      "→ Source: https://github.com/beany-vu/michi-vz-mono\n" +
      "Spotted a bug, have an idea, or just curious? Issues & feedback are very welcome - come say hi! 🌻",
    "font-weight:700;font-size:13px;color:#fff;background:#2e7ebb;padding:2px 8px;border-radius:6px;",
    "font-weight:600;color:#e8833a;",
    "color:#6b5b4f;line-height:1.6;"
  );
}

let injected = false;

export function ensureStyles(): void {
  greetOnce();
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
