import "@michi-vz/wc/fountain-chart"; // registers <michi-vz-fountain-chart>
import type { FountainChartElement } from "@michi-vz/wc";
import type { FountainChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { FountainChartElement } from "@michi-vz/wc";
export type { FountainChartProps } from "@michi-vz/core";

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
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
