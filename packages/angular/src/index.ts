// Angular integration. Angular has first-class custom-element interop, so this
// package registers the <michi-vz-gap-chart> element and provides a typed helper
// for property binding from Angular templates (use CUSTOM_ELEMENTS_SCHEMA).
// An idiomatic standalone @Component wrapper (built with ng-packagr) is a later
// increment; this thin layer works today with zero Angular-compiler coupling.
import "@michi-vz/wc"; // registers all michi-vz elements + auto-injects core.css
import { effect, type Injector, type Signal } from "@angular/core";
import type {
  GapChartElement,
  LineChartElement,
  FanChartElement,
  AreaChartElement,
  ScatterChartElement,
  VerticalStackBarChartElement,
  ComparableHorizontalBarChartElement,
  ComparableVerticalBarChartElement,
  DualHorizontalBarChartElement,
  BarBellChartElement,
  RangeChartElement,
  RibbonChartElement,
  RadarChartElement,
  TreemapChartElement,
  PieChartElement,
  BubbleChartElement,
  SankeyChartElement,
  FountainChartElement,
  ChoroplethMapChartElement,
  SymbolMapChartElement,
  RadialTreeChartElement,
} from "@michi-vz/wc";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
  ChartContext,
} from "@michi-vz/core";
export type {
  GapChartElement,
  LineChartElement,
  FanChartElement,
  AreaChartElement,
  ScatterChartElement,
  VerticalStackBarChartElement,
  ComparableHorizontalBarChartElement,
  ComparableVerticalBarChartElement,
  DualHorizontalBarChartElement,
  BarBellChartElement,
  RangeChartElement,
  RibbonChartElement,
  RadarChartElement,
  TreemapChartElement,
  PieChartElement,
  BubbleChartElement,
  SankeyChartElement,
  FountainChartElement,
  ChoroplethMapChartElement,
  SymbolMapChartElement,
  RadialTreeChartElement,
} from "@michi-vz/wc";

/**
 * Signals-first binding (preferred): re-apply a `Signal<Props>` to a michi-vz
 * element whenever the signal changes, via Angular `effect`. Call inside an
 * injection context (a component constructor) or pass an `injector`. Compose with
 * the per-chart `apply*` fns below:
 *
 * ```ts
 * @Component({ standalone: true, schemas: [CUSTOM_ELEMENTS_SCHEMA],
 *   template: `<michi-vz-fan-chart #c></michi-vz-fan-chart>` })
 * export class Forecast {
 *   readonly props = input.required<FanChartProps>();        // signal input
 *   @ViewChild('c', { read: ElementRef }) c!: ElementRef<FanChartElement>;
 *   constructor() { afterNextRender(() => bindChart(this.c.nativeElement, this.props, applyFanChartProps)); }
 * }
 * ```
 */
export function bindChart<E, P>(
  el: E,
  props: Signal<P>,
  apply: (el: E, props: P) => void,
  injector?: Injector
): void {
  effect(() => apply(el, props()), injector ? { injector } : undefined);
}

/** Apply engine props onto a <michi-vz-gap-chart> element (property binding). */
export function applyGapChartProps(el: GapChartElement, props: GapChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.interactiveRowLabels !== undefined) el.interactiveRowLabels = props.interactiveRowLabels;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.shapeValue1 !== undefined) el.shapeValue1 = props.shapeValue1;
  if (props.shapeValue2 !== undefined) el.shapeValue2 = props.shapeValue2;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.colorMode !== undefined) el.colorMode = props.colorMode;
  if (props.shapeColorsMapping !== undefined) el.shapeColorsMapping = props.shapeColorsMapping;
  if (props.shapesLabelsMapping !== undefined) el.shapesLabelsMapping = props.shapesLabelsMapping;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.enableExplicitTickValues !== undefined)
    el.enableExplicitTickValues = props.enableExplicitTickValues;
  if (props.tickHtmlWidth !== undefined) el.tickHtmlWidth = props.tickHtmlWidth;
  if (props.squareRadius !== undefined) el.squareRadius = props.squareRadius;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
  if (props.legendAlign !== undefined) el.legendAlign = props.legendAlign;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.showZeroLineForXAxis !== undefined)
    el.showZeroLineForXAxis = props.showZeroLineForXAxis;
  if (props.maxBarHeight !== undefined) el.maxBarHeight = props.maxBarHeight;
}

/** Apply engine props onto a <michi-vz-line-chart> element (property binding). */
export function applyLineChartProps(el: LineChartElement, props: LineChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.curve !== undefined) el.curve = props.curve;
  if (props.detectGaps !== undefined) el.detectGaps = props.detectGaps;
  if (props.expectedStep !== undefined) el.expectedStep = props.expectedStep;
  if (props.showDataPoints !== undefined) el.showDataPoints = props.showDataPoints;
  if (props.enableMouseLine !== undefined) el.enableMouseLine = props.enableMouseLine;
  if (props.singlePointLine !== undefined) el.singlePointLine = props.singlePointLine;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.sharedTooltip !== undefined) el.sharedTooltip = props.sharedTooltip;
  if (props.sharedTooltipFormatter !== undefined)
    el.sharedTooltipFormatter = props.sharedTooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.yTicks !== undefined) el.yTicks = props.yTicks;
  if (props.showGridLines !== undefined) el.showGridLines = props.showGridLines;
  if (props.showVerticalGridLines !== undefined)
    el.showVerticalGridLines = props.showVerticalGridLines;
  if (props.highlightZeroLine !== undefined) el.highlightZeroLine = props.highlightZeroLine;
  if (props.fontFamily !== undefined) el.fontFamily = props.fontFamily;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.yAxisScale !== undefined) el.yAxisScale = props.yAxisScale;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.fillPeriodTicks !== undefined) el.fillPeriodTicks = props.fillPeriodTicks;
  if (props.noDataTickTooltip !== undefined) el.noDataTickTooltip = props.noDataTickTooltip;
  if (props.noDataTickColor !== undefined) el.noDataTickColor = props.noDataTickColor;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.svgChildren !== undefined) el.svgChildren = props.svgChildren;
}

/** Apply engine props onto a <michi-vz-fan-chart> element (property binding). */
export function applyFanChartProps(el: FanChartElement, props: FanChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.curve !== undefined) el.curve = props.curve;
  if (props.fillOpacity !== undefined) el.fillOpacity = props.fillOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.showDataPoints !== undefined) el.showDataPoints = props.showDataPoints;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.forecastZone !== undefined) el.forecastZone = props.forecastZone;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-area-chart> element (property binding). */
export function applyAreaChartProps(el: AreaChartElement, props: AreaChartProps): void {
  el.series = props.series;
  el.keys = props.keys;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.curve !== undefined) el.curve = props.curve;
  if (props.forcePercentageScale !== undefined) el.forcePercentageScale = props.forcePercentageScale;
  if (props.stackOffset !== undefined) el.stackOffset = props.stackOffset;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.fillPeriodTicks !== undefined) el.fillPeriodTicks = props.fillPeriodTicks;
  if (props.noDataTickTooltip !== undefined) el.noDataTickTooltip = props.noDataTickTooltip;
  if (props.noDataTickColor !== undefined) el.noDataTickColor = props.noDataTickColor;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
}

/** Apply engine props onto a <michi-vz-scatter-chart> element (property binding). */
export function applyScatterChartProps(el: ScatterChartElement, props: ScatterChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.sizeRange !== undefined) el.sizeRange = props.sizeRange;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.showCrosshair !== undefined) el.showCrosshair = props.showCrosshair;
  if (props.crosshairLabels !== undefined) el.crosshairLabels = props.crosshairLabels;
  if (props.crosshairLineStyle !== undefined) el.crosshairLineStyle = props.crosshairLineStyle;
  if (props.crosshairSpan !== undefined) el.crosshairSpan = props.crosshairSpan;
  if (props.crosshairLabelPlacement !== undefined)
    el.crosshairLabelPlacement = props.crosshairLabelPlacement;
  if (props.dScaleLegend !== undefined) el.dScaleLegend = props.dScaleLegend;
  if (props.yTicksQty !== undefined) el.yTicksQty = props.yTicksQty;
  if (props.showGrid !== undefined) el.showGrid = props.showGrid;
  if (props.pinIcon !== undefined) el.pinIcon = props.pinIcon;
  if (props.svgChildren !== undefined) el.svgChildren = props.svgChildren;
  if (props.pointLabels !== undefined) el.pointLabels = props.pointLabels;
  if (props.drawOrder !== undefined) el.drawOrder = props.drawOrder;
}

/** Apply engine props onto a <michi-vz-vertical-stack-bar-chart> element. */
export function applyVerticalStackBarChartProps(
  el: VerticalStackBarChartElement,
  props: VerticalStackBarChartProps
): void {
  el.dataSet = props.dataSet;
  if (props.keys !== undefined) el.keys = props.keys;
  if (props.keysOrder !== undefined) el.keysOrder = props.keysOrder;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.missingDataMarker !== undefined) el.missingDataMarker = props.missingDataMarker;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.xAxisLabelPadding !== undefined) el.xAxisLabelPadding = props.xAxisLabelPadding;
  if (props.xAxisMode !== undefined) el.xAxisMode = props.xAxisMode;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.minBarWidth !== undefined) el.minBarWidth = props.minBarWidth;
  if (props.minBarHeight !== undefined) el.minBarHeight = props.minBarHeight;
  if (props.minBarHeightZero !== undefined) el.minBarHeightZero = props.minBarHeightZero;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.fontFamily !== undefined) el.fontFamily = props.fontFamily;
  if (props.yTicks !== undefined) el.yTicks = props.yTicks;
  if (props.showGridLines !== undefined) el.showGridLines = props.showGridLines;
  if (props.highlightZeroLine !== undefined) el.highlightZeroLine = props.highlightZeroLine;
}

/** Apply engine props onto a <michi-vz-comparable-horizontal-bar-chart> element. */
export function applyComparableHorizontalBarChartProps(
  el: ComparableHorizontalBarChartElement,
  props: ComparableBarChartProps
): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colorsBasedMapping !== undefined) el.colorsBasedMapping = props.colorsBasedMapping;
  if (props.interactiveRowLabels !== undefined) el.interactiveRowLabels = props.interactiveRowLabels;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.valueBasedOpacity !== undefined) el.valueBasedOpacity = props.valueBasedOpacity;
  if (props.valueComparedOpacity !== undefined) el.valueComparedOpacity = props.valueComparedOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickHtmlWidth !== undefined) el.tickHtmlWidth = props.tickHtmlWidth;
  if (props.xAxisPredefinedDomain !== undefined)
    el.xAxisPredefinedDomain = props.xAxisPredefinedDomain;
  if (props.patternsMapping !== undefined) el.patternsMapping = props.patternsMapping;
  if (props.showZeroLineForXAxis !== undefined)
    el.showZeroLineForXAxis = props.showZeroLineForXAxis;
  if (props.showGrid !== undefined) el.showGrid = props.showGrid;
  if (props.hideTickLabels !== undefined) el.hideTickLabels = props.hideTickLabels;
  if (props.minBarWidth !== undefined) el.minBarWidth = props.minBarWidth;
  if (props.padding !== undefined) el.padding = props.padding;
  if (props.horizontalTickPosition !== undefined)
    el.horizontalTickPosition = props.horizontalTickPosition;
  if (props.maxBarHeight !== undefined) el.maxBarHeight = props.maxBarHeight;
  if (props.symmetricXDomain !== undefined) el.symmetricXDomain = props.symmetricXDomain;
  if (props.layout !== undefined) el.layout = props.layout;
  if (props.deltaIndicator !== undefined) el.deltaIndicator = props.deltaIndicator;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-comparable-vertical-bar-chart> element. */
export function applyComparableVerticalBarChartProps(
  el: ComparableVerticalBarChartElement,
  props: ComparableVerticalBarChartProps
): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colorsBasedMapping !== undefined) el.colorsBasedMapping = props.colorsBasedMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.valueBasedOpacity !== undefined) el.valueBasedOpacity = props.valueBasedOpacity;
  if (props.valueComparedOpacity !== undefined) el.valueComparedOpacity = props.valueComparedOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.xAxisLabelPadding !== undefined) el.xAxisLabelPadding = props.xAxisLabelPadding;
  if (props.xAxisMode !== undefined) el.xAxisMode = props.xAxisMode;
  if (props.patternsMapping !== undefined) el.patternsMapping = props.patternsMapping;
  if (props.showZeroLineForYAxis !== undefined) el.showZeroLineForYAxis = props.showZeroLineForYAxis;
  if (props.showGrid !== undefined) el.showGrid = props.showGrid;
  if (props.hideTickLabels !== undefined) el.hideTickLabels = props.hideTickLabels;
  if (props.minBarHeight !== undefined) el.minBarHeight = props.minBarHeight;
  if (props.maxBarWidth !== undefined) el.maxBarWidth = props.maxBarWidth;
  if (props.symmetricYDomain !== undefined) el.symmetricYDomain = props.symmetricYDomain;
  if (props.deltaIndicator !== undefined) el.deltaIndicator = props.deltaIndicator;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-dual-horizontal-bar-chart> element. */
export function applyDualHorizontalBarChartProps(
  el: DualHorizontalBarChartElement,
  props: DualBarChartProps
): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.value1Opacity !== undefined) el.value1Opacity = props.value1Opacity;
  if (props.value2Opacity !== undefined) el.value2Opacity = props.value2Opacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickHtmlWidth !== undefined) el.tickHtmlWidth = props.tickHtmlWidth;
  if (props.yAxisPosition !== undefined) el.yAxisPosition = props.yAxisPosition;
  if (props.interactiveRowLabels !== undefined) el.interactiveRowLabels = props.interactiveRowLabels;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-range-chart> element. */
export function applyRangeChartProps(el: RangeChartElement, props: RangeChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.curve !== undefined) el.curve = props.curve;
  if (props.fillOpacity !== undefined) el.fillOpacity = props.fillOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-ribbon-chart> element. */
export function applyRibbonChartProps(el: RibbonChartElement, props: RibbonChartProps): void {
  el.series = props.series;
  el.keys = props.keys;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.columnWidth !== undefined) el.columnWidth = props.columnWidth;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-radar-chart> element. */
export function applyRadarChartProps(el: RadarChartElement, props: RadarChartProps): void {
  el.series = props.series;
  // `axes` became optional in the radar drop-in (the engine derives it from
  // poles.labels when absent), so guard the assignment like every other optional prop.
  if (props.axes !== undefined) el.axes = props.axes;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.maxValue !== undefined) el.maxValue = props.maxValue;
  if (props.rings !== undefined) el.rings = props.rings;
  if (props.fillOpacity !== undefined) el.fillOpacity = props.fillOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.poles !== undefined) el.poles = props.poles;
  if (props.showFilled !== undefined) el.showFilled = props.showFilled;
  if (props.showDimmedFill !== undefined) el.showDimmedFill = props.showDimmedFill;
  if (props.radialLabelFormatter !== undefined)
    el.radialLabelFormatter = props.radialLabelFormatter;
  if (props.poleLabelFormatter !== undefined) el.poleLabelFormatter = props.poleLabelFormatter;
  if (props.tooltipContainerStyle !== undefined)
    el.tooltipContainerStyle = props.tooltipContainerStyle;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-bar-bell-chart> element. */
export function applyBarBellChartProps(el: BarBellChartElement, props: BarBellChartProps): void {
  el.dataSet = props.dataSet;
  el.keys = props.keys;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickHtmlWidth !== undefined) el.tickHtmlWidth = props.tickHtmlWidth;
  if (props.xAxisPosition !== undefined) el.xAxisPosition = props.xAxisPosition;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.dodgeOverlappingCaps !== undefined)
    el.dodgeOverlappingCaps = props.dodgeOverlappingCaps;
}

/** Apply engine props onto a <michi-vz-treemap-chart> element. */
export function applyTreemapChartProps(el: TreemapChartElement, props: TreemapChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.layout !== undefined) el.layout = props.layout;
  if (props.stackBreakpoint !== undefined) el.stackBreakpoint = props.stackBreakpoint;
  if (props.splitLabels !== undefined) el.splitLabels = props.splitLabels;
  if (props.splitOpacity !== undefined) el.splitOpacity = props.splitOpacity;
  if (props.showSplit !== undefined) el.showSplit = props.showSplit;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
  if (props.minTileShare !== undefined) el.minTileShare = props.minTileShare;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.valueFormatter !== undefined) el.valueFormatter = props.valueFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.paddingInner !== undefined) el.paddingInner = props.paddingInner;
  if (props.paddingTop !== undefined) el.paddingTop = props.paddingTop;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.tileValueLabels !== undefined) el.tileValueLabels = props.tileValueLabels;
}

/** Apply engine props onto a <michi-vz-pie-chart> element (property binding). */
export function applyPieChartProps(el: PieChartElement, props: PieChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.innerRadiusRatio !== undefined) el.innerRadiusRatio = props.innerRadiusRatio;
  if (props.padAngle !== undefined) el.padAngle = props.padAngle;
  if (props.cornerRadius !== undefined) el.cornerRadius = props.cornerRadius;
  if (props.sortByValue !== undefined) el.sortByValue = props.sortByValue;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.valueFormatter !== undefined) el.valueFormatter = props.valueFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-bubble-chart> element (property binding). */
export function applyBubbleChartProps(el: BubbleChartElement, props: BubbleChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.gravity !== undefined) el.gravity = props.gravity;
  if (props.chargeStrength !== undefined) el.chargeStrength = props.chargeStrength;
  if (props.padding !== undefined) el.padding = props.padding;
  if (props.fillRatio !== undefined) el.fillRatio = props.fillRatio;
  if (props.layoutMode !== undefined) el.layoutMode = props.layoutMode;
  if (props.settleTicks !== undefined) el.settleTicks = props.settleTicks;
  if (props.splitLabels !== undefined) el.splitLabels = props.splitLabels;
  if (props.splitOpacity !== undefined) el.splitOpacity = props.splitOpacity;
  if (props.showSplit !== undefined) el.showSplit = props.showSplit;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.valueFormatter !== undefined) el.valueFormatter = props.valueFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-sankey-chart> element (property binding). */
export function applySankeyChartProps(el: SankeyChartElement, props: SankeyChartProps): void {
  el.nodes = props.nodes;
  el.links = props.links;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.nodeWidth !== undefined) el.nodeWidth = props.nodeWidth;
  if (props.nodePadding !== undefined) el.nodePadding = props.nodePadding;
  if (props.nodeRadius !== undefined) el.nodeRadius = props.nodeRadius;
  if (props.linkRadius !== undefined) el.linkRadius = props.linkRadius;
  if (props.linkColorMode !== undefined) el.linkColorMode = props.linkColorMode;
  if (props.linkOpacity !== undefined) el.linkOpacity = props.linkOpacity;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.valueFormatter !== undefined) el.valueFormatter = props.valueFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
}

/** Apply engine props onto a <michi-vz-fountain-chart> element (property binding). */
export function applyFountainChartProps(el: FountainChartElement, props: FountainChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.style !== undefined) el.fountainStyle = props.style;
  if (props.frothLayers !== undefined) el.frothLayers = props.frothLayers;
  if (props.bloomExponent !== undefined) el.bloomExponent = props.bloomExponent;
  if (props.stemFraction !== undefined) el.stemFraction = props.stemFraction;
  if (props.showDroplets !== undefined) el.showDroplets = props.showDroplets;
  if (props.showMist !== undefined) el.showMist = props.showMist;
  if (props.showTrendLine !== undefined) el.showTrendLine = props.showTrendLine;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-choropleth-map-chart> element (property binding). */
export function applyChoroplethMapChartProps(
  el: ChoroplethMapChartElement,
  props: ChoroplethMapChartProps
): void {
  el.geography = props.geography;
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.projection !== undefined) el.projection = props.projection;
  if (props.projectionConfig !== undefined) el.projectionConfig = props.projectionConfig;
  if (props.colorScale !== undefined) el.colorScale = props.colorScale;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.noDataColor !== undefined) el.noDataColor = props.noDataColor;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.joinBy !== undefined) el.joinBy = props.joinBy;
  if (props.strokeColor !== undefined) el.strokeColor = props.strokeColor;
  if (props.strokeWidth !== undefined) el.strokeWidth = props.strokeWidth;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-symbol-map-chart> element (property binding). */
export function applySymbolMapChartProps(el: SymbolMapChartElement, props: SymbolMapChartProps): void {
  el.dataSet = props.dataSet;
  if (props.geography !== undefined) el.geography = props.geography;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.projection !== undefined) el.projection = props.projection;
  if (props.projectionConfig !== undefined) el.projectionConfig = props.projectionConfig;
  if (props.radiusRange !== undefined) el.radiusRange = props.radiusRange;
  if (props.radiusVisibleMin !== undefined) el.radiusVisibleMin = props.radiusVisibleMin;
  if (props.positionMode !== undefined) el.positionMode = props.positionMode;
  if (props.geographyColor !== undefined) el.geographyColor = props.geographyColor;
  if (props.strokeColor !== undefined) el.strokeColor = props.strokeColor;
  if (props.strokeWidth !== undefined) el.strokeWidth = props.strokeWidth;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}

/** Apply engine props onto a <michi-vz-radial-tree-chart> element (property binding). */
export function applyRadialTreeChartProps(el: RadialTreeChartElement, props: RadialTreeChartProps): void {
  el.dataSet = props.dataSet;
  if (props.centerLabel !== undefined) el.centerLabel = props.centerLabel;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.radiusRange !== undefined) el.radiusRange = props.radiusRange;
  if (props.labelDensityThresholds !== undefined) el.labelDensityThresholds = props.labelDensityThresholds;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
}
