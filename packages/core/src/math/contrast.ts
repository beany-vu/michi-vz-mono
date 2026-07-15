// Pick a readable text colour for a given background fill (WCAG relative
// luminance → black or white, whichever contrasts more). Dependency-free; parses
// hex (#rgb/#rrggbb) and rgb()/rgba() (what the SVG colour probe returns). Unknown
// inputs fall back to the `light` colour (safe over the saturated default palette).

function parseColor(input: string): [number, number, number] | null {
  const s = input.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) {
    const h = m[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  m = /^#([0-9a-f]{6})$/.exec(s);
  if (m) {
    const h = m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return null;
}

function channel(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance in [0,1]. */
export function relativeLuminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

/**
 * Return `dark` or `light` - whichever has the higher WCAG contrast against `bg`.
 * Unparseable colours return `light`.
 */
export function readableTextColor(bg: string, dark = "#1a1a1a", light = "#ffffff"): string {
  const rgb = parseColor(bg);
  if (!rgb) return light;
  const L = relativeLuminance(rgb);
  const contrastLight = 1.05 / (L + 0.05); // contrast ratio vs white
  const contrastDark = (L + 0.05) / 0.05; // contrast ratio vs black
  return contrastDark >= contrastLight ? dark : light;
}
