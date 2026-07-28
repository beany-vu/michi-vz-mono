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

/** A text block composited into the exported PNG (title above / caption below). */
export interface PngTextBlock {
  text: string;
  /** Horizontal alignment inside the image. Default: title "center", caption "right". */
  align?: "left" | "center" | "right";
  /** Font size in px. Default: title 16, caption 11. */
  fontSize?: number;
  /** Text colour. Default: title #333333, caption #666666. */
  color?: string;
  /** Bold text. Default: title true, caption false. */
  bold?: boolean;
}

export interface PngOptions extends StyledSvgOptions {
  /** Solid background painted behind the chart (else transparent). */
  background?: string;
  /** Output pixel-density multiplier. Default: window.devicePixelRatio (or 1). */
  scale?: number;
  /** Text drawn ABOVE the chart in the export (e.g. the chart title). Long text
   *  word-wraps to the image width. */
  title?: string | PngTextBlock;
  /** Text drawn BELOW the chart (e.g. a source / copyright line). */
  caption?: string | PngTextBlock;
  /** Font family for title/caption text. Default: the host's
   *  --michi-vz-font-family, else its computed font, else sans-serif. */
  textFontFamily?: string;
}

const TEXT_PAD_X = 12;

function resolveTextBlock(
  v: string | PngTextBlock | undefined,
  defaults: Required<Omit<PngTextBlock, "text">>,
): (Required<PngTextBlock> & { lines: string[] }) | null {
  if (!v) return null;
  const block = typeof v === "string" ? { text: v } : v;
  if (!block.text) return null;
  return { ...defaults, ...block, lines: [] };
}

/** Greedy word-wrap against ctx.measureText; falls back to one line when the
 *  context cannot measure (jsdom). */
function wrapLines(cx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${line} ${words[i]}`;
    const wTest = cx.measureText ? cx.measureText(candidate).width : 0;
    if (wTest > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = candidate;
    }
  }
  lines.push(line);
  return lines;
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

    // Title/caption text blocks composited above/below the chart. Font: explicit
    // option, else the host's --michi-vz-font-family, else its computed font.
    const fontFamily =
      opts.textFontFamily ||
      el.style.getPropertyValue("--michi-vz-font-family") ||
      (typeof getComputedStyle === "function" ? getComputedStyle(el).fontFamily : "") ||
      "sans-serif";
    const title = resolveTextBlock(opts.title, {
      align: "center",
      fontSize: 16,
      color: "#333333",
      bold: true,
    });
    const caption = resolveTextBlock(opts.caption, {
      align: "right",
      fontSize: 11,
      color: "#666666",
      bold: false,
    });

    const img = new Image();
    img.onload = () => {
      try {
        const out = document.createElement("canvas");
        const cx = out.getContext("2d");
        if (!cx) {
          resolve("");
          return;
        }
        // Measure + wrap the text blocks first: their line counts decide the
        // extra image height. (Canvas resize resets ctx state; fonts are re-set
        // per draw below.)
        const fontOf = (b: { bold: boolean; fontSize: number }): string =>
          `${b.bold ? "bold " : ""}${b.fontSize}px ${fontFamily}`;
        const LINE_HEIGHT = 1.35;
        const maxTextWidth = Math.max(50, w - TEXT_PAD_X * 2);
        let titleH = 0;
        if (title) {
          cx.font = fontOf(title);
          title.lines = wrapLines(cx, title.text, maxTextWidth);
          titleH = Math.round(title.lines.length * title.fontSize * LINE_HEIGHT + 16);
        }
        let captionH = 0;
        if (caption) {
          cx.font = fontOf(caption);
          caption.lines = wrapLines(cx, caption.text, maxTextWidth);
          captionH = Math.round(caption.lines.length * caption.fontSize * LINE_HEIGHT + 12);
        }
        const totalH = titleH + h + captionH;

        out.width = Math.max(1, Math.round(w * scale));
        out.height = Math.max(1, Math.round(totalH * scale));
        cx.scale(scale, scale);
        if (opts.background) {
          cx.fillStyle = opts.background;
          cx.fillRect(0, 0, w, totalH);
        }

        const drawBlock = (
          block: Required<PngTextBlock> & { lines: string[] },
          yTop: number,
        ): void => {
          cx.font = fontOf(block);
          cx.fillStyle = block.color;
          cx.textBaseline = "top";
          cx.textAlign = block.align;
          const x =
            block.align === "left" ? TEXT_PAD_X : block.align === "right" ? w - TEXT_PAD_X : w / 2;
          block.lines.forEach((line, i) => {
            cx.fillText(line, x, yTop + i * block.fontSize * LINE_HEIGHT);
          });
        };
        if (title) drawBlock(title, 10);
        cx.translate(0, titleH);
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
        if (caption) drawBlock(caption, h + 6);
        resolve(out.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("michi-vz: failed to rasterize chart SVG"));
    img.src = dataUri;
  });
}
