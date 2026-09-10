import "@michi-vz/wc/dual-horizontal-bar-chart"; // registers <michi-vz-dual-horizontal-bar-chart>
import type { DualHorizontalBarChartElement } from "@michi-vz/wc";
import type { DualBarChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { DualHorizontalBarChartElement } from "@michi-vz/wc";
export type { DualBarChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-dual-horizontal-bar-chart> element. */
export function applyDualHorizontalBarChartProps(
  el: DualHorizontalBarChartElement,
  props: DualBarChartProps,
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
  if (props.interactiveRowLabels !== undefined)
    el.interactiveRowLabels = props.interactiveRowLabels;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
