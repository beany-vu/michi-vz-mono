// FountainChart text measure in the page's font. The chart lays out its own words
// (value labels, reference labels, the y title, the x labels) and reserves margins for
// them, so it must measure them in the font they render in: the host's computed
// font-family at the chart's base font size (--michi-vz-font-size, 12 px by default).
// The shared measureLabelWidth measures "12px sans-serif", which can be narrower than
// the page's font (a reference label then paints past the SVG's right edge) or wider.
// Without a 2D canvas (SSR, jsdom) it falls back to measureLabelWidth, whose 7 px per
// character stand-in every test runs on.
import { measureLabelWidth } from "../render/svg/measureLabelWidth";

/** Width in px of a text at the chart's base font size, regular and bold. */
export interface FountainHostMeasure {
  regular: (text: string) => number;
  /** Bold, measured bold; undefined when there is no canvas (callers then scale regular) */
  bold: ((text: string) => number) | undefined;
}

let ctx: CanvasRenderingContext2D | null | undefined;

function context(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  if (typeof document === "undefined") return (ctx = null);
  try {
    ctx = document.createElement("canvas").getContext("2d");
  } catch {
    ctx = null;
  }
  return ctx;
}

/** A computed font-family the canvas can use, or null (unset, unresolved var(), inherit). */
function usableFamily(v: string | undefined): string | null {
  const f = (v ?? "").trim();
  if (!f || f.includes("var(") || f === "inherit" || f === "initial" || f === "unset") {
    return null;
  }
  return f;
}

/** The measure for text drawn inside `el` (the chart host). */
export function fountainHostMeasure(el: Element | null): FountainHostMeasure {
  const c = context();
  if (!c || !el || typeof getComputedStyle !== "function") {
    return { regular: measureLabelWidth, bold: undefined };
  }
  const cs = getComputedStyle(el);
  const family = usableFamily(cs.fontFamily) ?? "sans-serif";
  const size = parseFloat(cs.fontSize);
  const px = Number.isFinite(size) && size > 0 ? size : 12;
  const at = (font: string) => (text: string) => {
    if (!text) return 0;
    c.font = font;
    return c.measureText(text).width;
  };
  return { regular: at(`${px}px ${family}`), bold: at(`bold ${px}px ${family}`) };
}
