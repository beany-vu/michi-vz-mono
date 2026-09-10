import "@michi-vz/wc/ribbon-chart"; // registers <michi-vz-ribbon-chart>
import type { RibbonChartElement } from "@michi-vz/wc";
import type { RibbonChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { RibbonChartElement } from "@michi-vz/wc";
export type { RibbonChartProps } from "@michi-vz/core";

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
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
