// Public chart-export helpers: CSV from the a11yTable, and correctly-styled
// SVG/PNG from a mounted chart host (inlining the adoptedStyleSheets CSS that
// generic serializers miss). Framework-agnostic; consumers pair these with their
// own download trigger (file-saver, an <a download>, etc.).
export { chartContextToCsv } from "./csv";
export type { CsvOptions } from "./csv";
export { chartToStyledSvgString, chartToStyledSvgDataUri, chartToPngDataUrl } from "./image";
export type { StyledSvgOptions, PngOptions, PngTextBlock } from "./image";
