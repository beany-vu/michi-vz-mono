import "@michi-vz/wc/bar-bell-chart"; // registers <michi-vz-bar-bell-chart>
import type { BarBellChartElement } from "@michi-vz/wc";
import type { BarBellChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { BarBellChartElement } from "@michi-vz/wc";
export type { BarBellChartProps } from "@michi-vz/core";

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
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
