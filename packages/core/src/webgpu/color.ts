// ⚠️ SHARED WebGPU foundation - do not edit/remove per chart (see webgpu/marks.ts).
// CSS-colour-string → premultiplied RGBA floats, the single conversion point for
// the `alphaMode: "premultiplied"` swap-chain contract. resolveMarkColors() hands
// back computed CSS colours (getComputedStyle → rgb()/rgba() form) or model
// fallbacks (typically hex), so those two forms are the fast path; anything else
// is normalized via a shared 1x1 canvas when a 2D context is available.

export type RGBA = [number, number, number, number];

// 0 alpha → "transparent skip": the renderer drops these instances entirely,
// preserving the canvas-mode "fill: transparent = don't draw" convention.
const TRANSPARENT: RGBA = [0, 0, 0, 0];

let normCtx: CanvasRenderingContext2D | null | undefined;
function getNormCtx(): CanvasRenderingContext2D | null {
  if (normCtx !== undefined) return normCtx;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    normCtx = c.getContext("2d");
  } catch {
    normCtx = null;
  }
  return normCtx;
}

function premultiply(r: number, g: number, b: number, a: number): RGBA {
  return [(r / 255) * a, (g / 255) * a, (b / 255) * a, a];
}

function parseHex(hex: string): RGBA | null {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 && h.length !== 8) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return premultiply(r, g, b, a);
}

/**
 * Parse any CSS colour string to PREMULTIPLIED [r,g,b,a] floats in 0..1.
 * "transparent"/"none"/empty → [0,0,0,0] (the caller skips the instance).
 */
export function cssColorToPremultiplied(css: string | undefined | null): RGBA {
  if (!css) return TRANSPARENT;
  const s = css.trim().toLowerCase();
  if (s === "transparent" || s === "none") return TRANSPARENT;

  if (s[0] === "#") {
    const hex = parseHex(s);
    if (hex) return hex;
  }

  // rgb(r g b / a) and rgb(r,g,b,a) - the getComputedStyle output form.
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;
      if (![r, g, b, a].some(Number.isNaN))
        return premultiply(r, g, b, Math.max(0, Math.min(1, a)));
    }
  }

  // Named/other forms (e.g. "red", "hsl(...)"): normalize via canvas if possible.
  const ctx = getNormCtx();
  if (ctx) {
    ctx.fillStyle = "#000";
    ctx.fillStyle = s;
    const normalized = ctx.fillStyle; // browser normalizes to #rrggbb or rgba(...)
    if (normalized[0] === "#") {
      const hex = parseHex(normalized);
      if (hex) return hex;
    } else {
      return cssColorToPremultiplied(normalized);
    }
  }
  return TRANSPARENT;
}

/** Test-only: drop the cached normalization context. */
export function __resetColorCacheForTest(): void {
  normCtx = undefined;
}
