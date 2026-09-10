import "@michi-vz/wc/gap-chart"; // registers <michi-vz-gap-chart>
import type { GapChartElement } from "@michi-vz/wc";
import type { GapChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { GapChartElement } from "@michi-vz/wc";
export type { GapChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-gap-chart> element (property binding). */
export function applyGapChartProps(el: GapChartElement, props: GapChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.xAxisDomain !== undefined) el.xAxisDomain = props.xAxisDomain;
  if (props.interactiveRowLabels !== undefined)
    el.interactiveRowLabels = props.interactiveRowLabels;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.shapeValue1 !== undefined) el.shapeValue1 = props.shapeValue1;
  if (props.shapeValue2 !== undefined) el.shapeValue2 = props.shapeValue2;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.colorMode !== undefined) el.colorMode = props.colorMode;
  if (props.shapeColorsMapping !== undefined) el.shapeColorsMapping = props.shapeColorsMapping;
  if (props.shapesLabelsMapping !== undefined) el.shapesLabelsMapping = props.shapesLabelsMapping;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.timeline !== undefined) el.timeline = props.timeline;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.enableExplicitTickValues !== undefined)
    el.enableExplicitTickValues = props.enableExplicitTickValues;
  if (props.tickHtmlWidth !== undefined) el.tickHtmlWidth = props.tickHtmlWidth;
  if (props.squareRadius !== undefined) el.squareRadius = props.squareRadius;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
  if (props.legendAlign !== undefined) el.legendAlign = props.legendAlign;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.showZeroLineForXAxis !== undefined)
    el.showZeroLineForXAxis = props.showZeroLineForXAxis;
  if (props.maxBarHeight !== undefined) el.maxBarHeight = props.maxBarHeight;
}
