import "@michi-vz/wc/area-chart"; // registers <michi-vz-area-chart>
import type { AreaChartElement } from "@michi-vz/wc";
import type { AreaChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { AreaChartElement } from "@michi-vz/wc";
export type { AreaChartProps } from "@michi-vz/core";

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
  if (props.forcePercentageScale !== undefined)
    el.forcePercentageScale = props.forcePercentageScale;
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
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
