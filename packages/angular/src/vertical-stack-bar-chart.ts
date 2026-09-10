import "@michi-vz/wc/vertical-stack-bar-chart"; // registers <michi-vz-vertical-stack-bar-chart>
import type { VerticalStackBarChartElement } from "@michi-vz/wc";
import type { VerticalStackBarChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { VerticalStackBarChartElement } from "@michi-vz/wc";
export type { VerticalStackBarChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-vertical-stack-bar-chart> element. */
export function applyVerticalStackBarChartProps(
  el: VerticalStackBarChartElement,
  props: VerticalStackBarChartProps,
): void {
  el.dataSet = props.dataSet;
  if (props.keys !== undefined) el.keys = props.keys;
  if (props.keysOrder !== undefined) el.keysOrder = props.keysOrder;
  if (props.layout !== undefined) el.layout = props.layout;
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
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
