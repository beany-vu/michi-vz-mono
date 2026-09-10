import "@michi-vz/wc/scatter-chart"; // registers <michi-vz-scatter-chart>
import type { ScatterChartElement } from "@michi-vz/wc";
import type { ScatterChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { ScatterChartElement } from "@michi-vz/wc";
export type { ScatterChartProps } from "@michi-vz/core";

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
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.timeline !== undefined) el.timeline = props.timeline;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.showCrosshair !== undefined) el.showCrosshair = props.showCrosshair;
  if (props.crosshairLabels !== undefined) el.crosshairLabels = props.crosshairLabels;
  if (props.crosshairLineStyle !== undefined) el.crosshairLineStyle = props.crosshairLineStyle;
  if (props.crosshairSpan !== undefined) el.crosshairSpan = props.crosshairSpan;
  if (props.crosshairLabelPlacement !== undefined)
    el.crosshairLabelPlacement = props.crosshairLabelPlacement;
  if (props.dScaleLegend !== undefined) el.dScaleLegend = props.dScaleLegend;
  if (props.yTicksQty !== undefined) el.yTicksQty = props.yTicksQty;
  if (props.showGrid !== undefined) el.showGrid = props.showGrid;
  if (props.pinIcon !== undefined) el.pinIcon = props.pinIcon;
  if (props.svgChildren !== undefined) el.svgChildren = props.svgChildren;
  if (props.pointLabels !== undefined) el.pointLabels = props.pointLabels;
  if (props.drawOrder !== undefined) el.drawOrder = props.drawOrder;
}
