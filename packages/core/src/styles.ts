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
  font-family: var(--michi-vz-font-family, system-ui, -apple-system, sans-serif);
}
.michi-vz svg { overflow: visible; display: block; }
.michi-vz .title { font-size: 16px; font-weight: 600; fill: var(--michi-vz-ink, #2a1c15); }
.michi-vz .gap-line { stroke-width: 2; fill: none; }
.michi-vz .mv-axis-label { fill: var(--michi-vz-muted, #666); font-size: 12px; }
.michi-vz .mv-grid { stroke: var(--michi-vz-grid, lightgray); stroke-dasharray: 1.5; }
.michi-vz .mv-ylabel {
  display: flex; align-items: center; height: 100%; cursor: pointer;
  font-size: 12px; color: var(--michi-vz-ink, #2a1c15);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.michi-vz .tooltip {
  position: absolute; background: #fff; border: 1px solid #ccc; border-radius: 4px;
  padding: 8px; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,.1);
  font-size: 12px; z-index: 10;
}
.michi-vz .tooltip.sticky { pointer-events: auto; cursor: default; border-color: #666; }
.michi-vz .mv-a11y {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
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
