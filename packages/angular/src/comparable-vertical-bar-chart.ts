import "@michi-vz/wc/comparable-vertical-bar-chart"; // registers <michi-vz-comparable-vertical-bar-chart>
import type { ComparableVerticalBarChartElement } from "@michi-vz/wc";
import type { ComparableVerticalBarChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { ComparableVerticalBarChartElement } from "@michi-vz/wc";
export type { ComparableVerticalBarChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-comparable-vertical-bar-chart> element. */
export function applyComparableVerticalBarChartProps(
  el: ComparableVerticalBarChartElement,
  props: ComparableVerticalBarChartProps,
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
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.xAxisLabelPadding !== undefined) el.xAxisLabelPadding = props.xAxisLabelPadding;
  if (props.xAxisMode !== undefined) el.xAxisMode = props.xAxisMode;
  if (props.patternsMapping !== undefined) el.patternsMapping = props.patternsMapping;
  if (props.showZeroLineForYAxis !== undefined)
    el.showZeroLineForYAxis = props.showZeroLineForYAxis;
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
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
