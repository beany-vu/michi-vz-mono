// Chart image export. @michi-vz/core injects all chart CSS via
// document.adoptedStyleSheets (see styles.ts `ensureStyles`), which XMLSerializer /
// save-svg-as-png cannot see - so a naively-serialized <svg> loses every gridline,
// axis label and zero-line. These helpers rebuild a STANDALONE, correctly-styled SVG
// (and optional PNG) by inlining CORE_CSS + the host's per-instance CSS custom
// properties into the cloned <svg>.
import { CORE_CSS } from "../styles";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";

// Per-instance CSS custom properties the engine/chrome can set inline on the host
// element (styles.ts documents each). CORE_CSS references them via var(); copy any
// that are present onto the exported <svg> root so they resolve standalone. Ones set
// on descendant elements (e.g. the crosshair vars on .mv-mouse-line) ride along in the
// deep clone already.
const HOST_CSS_VARS = [
  "--michi-vz-font-family",
  "--michi-vz-font-size",
  "--michi-vz-tick-nodata",
  "--michi-vz-grid",
  "--michi-vz-zero-line",
  "--michi-vz-ink",
  "--michi-vz-muted",
] as const;

export interface StyledSvgOptions {
  /** Explicit output width in px. Default: read from the live <svg>. */
  width?: number;
  /** Explicit output height in px. Default: read from the live <svg>. */
  height?: number;
  /** Prepend an XML prolog (<?xml ...?>). Default false (unneeeded for data URIs). */
  xmlProlog?: boolean;
}

function numericAttr(el: Element, name: string): number | undefined {
  const raw = el.getAttribute(name);
  if (!raw) return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : undefined;
}

// The chart host div gets the engine's <svg> appended as a direct child (and, for
// canvas/webgpu charts, a <canvas>). Resolve the <svg> the same way the a11y mirror
// does (a11yMirror.ts uses ":scope > svg").
function resolveSvg(el: HTMLElement): SVGSVGElement | null {
  const direct = el.querySelector(":scope > svg");
  if (direct) return direct as SVGSVGElement;
  return el.querySelector("svg");
}

function measure(
  el: HTMLElement,
  svg: SVGSVGElement,
  opts: StyledSvgOptions,
): { w: number; h: number } {
  const box = typeof svg.getBoundingClientRect === "function" ? svg.getBoundingClientRect() : null;
  const w = opts.width ?? numericAttr(svg, "width") ?? (box && box.width) ?? el.clientWidth ?? 0;
  const h =
    opts.height ?? numericAttr(svg, "height") ?? (box && box.height) ?? el.clientHeight ?? 0;
  return { w, h };
}

/**
 * Build a STANDALONE, correctly-styled SVG string for a mounted michi-vz chart.
 *
 * @param el the chart host element - the `.michi-vz` div the engine renders into
 *           (React consumers get it from `chartRef.current.getElement()`).
 * @returns the serialized SVG, or "" when the host has no <svg> (e.g. before mount).
 */
export function chartToStyledSvgString(el: HTMLElement, opts: StyledSvgOptions = {}): string {
  const svg = resolveSvg(el);
  if (!svg) return "";

  const clone = svg.cloneNode(true) as SVGSVGElement;

  // CORE_CSS rules are namespaced `.michi-vz ...` (descendant selectors). Standalone,
  // the exported <svg> root must itself be the `.michi-vz` ancestor so those rules
  // match its subtree; carry any chart-type class(es) too for type-scoped rules.
  clone.classList.add("michi-vz");
  el.classList.forEach((c) => {
    if (c.startsWith("michi-vz")) clone.classList.add(c);
  });

  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("xmlns:xlink", XLINK_NS);

  const { w, h } = measure(el, svg, opts);
  if (w) clone.setAttribute("width", String(w));
  if (h) clone.setAttribute("height", String(h));

  // Copy per-instance CSS custom props set inline on the host so var() resolves.
  for (const v of HOST_CSS_VARS) {
    const val = el.style.getPropertyValue(v);
    if (val) clone.style.setProperty(v, val);
  }

  // Inline the full stylesheet as the first child so the whole subtree is styled.
  const styleEl = document.createElementNS(SVG_NS, "style");
  styleEl.textContent = CORE_CSS;
  clone.insertBefore(styleEl, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  return opts.xmlProlog ? '<?xml version="1.0" encoding="UTF-8"?>\n' + xml : xml;
}

/** `data:image/svg+xml` data URI wrapping {@link chartToStyledSvgString}. */
export function chartToStyledSvgDataUri(el: HTMLElement, opts: StyledSvgOptions = {}): string {
  const svg = chartToStyledSvgString(el, opts);
  if (!svg) return "";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export interface PngOptions extends StyledSvgOptions {
  /** Solid background painted behind the chart (else transparent). */
  background?: string;
  /** Output pixel-density multiplier. Default: window.devicePixelRatio (or 1). */
  scale?: number;
}

/**
 * Rasterize a mounted chart to a PNG data URL. Handles pure-SVG charts (inlines
 * CORE_CSS as above) and canvas-renderer charts (composites the live <canvas> marks
 * on top of the SVG axes). Browser-only and async (image load); jsdom lacks real
 * Image/canvas rasterization, so this path is verified live, not in unit tests.
 */
export function chartToPngDataUrl(el: HTMLElement, opts: PngOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgSurface = resolveSvg(el);
    if (!svgSurface) {
      resolve("");
      return;
    }
    const { w, h } = measure(el, svgSurface, opts);
    const scale = opts.scale ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const dataUri = chartToStyledSvgDataUri(el, { width: w, height: h });
    if (!dataUri) {
      resolve("");
      return;
    }

    const canvasSurface = el.querySelector(":scope > canvas") as HTMLCanvasElement | null;

    const img = new Image();
    img.onload = () => {
      try {
        const out = document.createElement("canvas");
        out.width = Math.max(1, Math.round(w * scale));
        out.height = Math.max(1, Math.round(h * scale));
        const cx = out.getContext("2d");
        if (!cx) {
          resolve("");
          return;
        }
        cx.scale(scale, scale);
        if (opts.background) {
          cx.fillStyle = opts.background;
          cx.fillRect(0, 0, w, h);
        }
        cx.drawImage(img, 0, 0, w, h);
        // Composite canvas-renderer marks: draw the live <canvas> at its on-screen
        // offset relative to the host so it lines up with the SVG axes underneath.
        if (canvasSurface && canvasSurface.width > 0) {
          const hostBox = el.getBoundingClientRect();
          const cBox = canvasSurface.getBoundingClientRect();
          cx.drawImage(
            canvasSurface,
            cBox.left - hostBox.left,
            cBox.top - hostBox.top,
            cBox.width,
            cBox.height,
          );
        }
        resolve(out.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("michi-vz: failed to rasterize chart SVG"));
    img.src = dataUri;
  });
}
