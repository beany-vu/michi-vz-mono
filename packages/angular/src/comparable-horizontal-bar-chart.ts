import "@michi-vz/wc/comparable-horizontal-bar-chart"; // registers <michi-vz-comparable-horizontal-bar-chart>
import type { ComparableHorizontalBarChartElement } from "@michi-vz/wc";
import type { ComparableBarChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { ComparableHorizontalBarChartElement } from "@michi-vz/wc";
export type { ComparableBarChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-comparable-horizontal-bar-chart> element. */
export function applyComparableHorizontalBarChartProps(
  el: ComparableHorizontalBarChartElement,
  props: ComparableBarChartProps,
): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colorsBasedMapping !== undefined) el.colorsBasedMapping = props.colorsBasedMapping;
  if (props.interactiveRowLabels !== undefined)
    el.interactiveRowLabels = props.interactiveRowLabels;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.valueBasedOpacity !== undefined) el.valueBasedOpacity = props.valueBasedOpacity;
  if (props.valueComparedOpacity !== undefined)
    el.valueComparedOpacity = props.valueComparedOpacity;
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
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
