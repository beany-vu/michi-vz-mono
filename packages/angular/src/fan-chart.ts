import "@michi-vz/wc/fan-chart"; // registers <michi-vz-fan-chart>
import type { FanChartElement } from "@michi-vz/wc";
import type { FanChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { FanChartElement } from "@michi-vz/wc";
export type { FanChartProps } from "@michi-vz/core";

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
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
