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
  DualHorizontalBarChartElement,
  BarBellChartElement,
  RangeChartElement,
  RibbonChartElement,
  RadarChartElement,
} from "@michi-vz/wc";
import type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
} from "@michi-vz/core";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
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
  DualHorizontalBarChartElement,
  BarBellChartElement,
  RangeChartElement,
  RibbonChartElement,
  RadarChartElement,
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
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.shapeValue1 !== undefined) el.shapeValue1 = props.shapeValue1;
  if (props.shapeValue2 !== undefined) el.shapeValue2 = props.shapeValue2;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
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
  if (props.locale !== undefined) el.locale = props.locale;
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
  if (props.locale !== undefined) el.locale = props.locale;
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
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
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
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.valueBasedOpacity !== undefined) el.valueBasedOpacity = props.valueBasedOpacity;
  if (props.valueComparedOpacity !== undefined) el.valueComparedOpacity = props.valueComparedOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
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
}

/** Apply engine props onto a <michi-vz-radar-chart> element. */
export function applyRadarChartProps(el: RadarChartElement, props: RadarChartProps): void {
  el.series = props.series;
  el.axes = props.axes;
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
}
