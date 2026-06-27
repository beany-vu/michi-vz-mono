// Shared imperative SVG sub-component builders — ported once from the legacy
// React `shared/*.tsx` so every chart (GapChart, LineChart, AreaChart, …) draws
// its title / axes / loading / overlay through one implementation.
export { renderTitle } from "./title";
export type { TitleOptions } from "./title";

export { renderXAxisLinear } from "./xAxisLinear";
export type { XAxisLinearOptions, LinearOrTimeScale } from "./xAxisLinear";

export { renderYAxisBand } from "./yAxisBand";
export type { YAxisBandOptions } from "./yAxisBand";

export { renderYAxisLinear } from "./yAxisLinear";
export type { YAxisLinearOptions } from "./yAxisLinear";

export { renderXAxisBand } from "./xAxisBand";
export type { XAxisBandOptions } from "./xAxisBand";

export { renderLoadingIndicator, toggleLoadingIndicator } from "./loadingIndicator";
export type { LoadingIndicatorOptions } from "./loadingIndicator";

export { renderOverlay } from "./overlay";
export type { OverlayOptions } from "./overlay";

export { renderAnnotationsSvg } from "./annotations";
export type { AnnotationRenderContext } from "./annotations";
