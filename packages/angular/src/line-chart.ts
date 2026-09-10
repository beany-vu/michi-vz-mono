import "@michi-vz/wc/line-chart"; // registers <michi-vz-line-chart>
import type { LineChartElement } from "@michi-vz/wc";
import type { LineChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { LineChartElement } from "@michi-vz/wc";
export type { LineChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-line-chart> element (property binding). */
export function applyLineChartProps(el: LineChartElement, props: LineChartProps): void {
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
  if (props.detectGaps !== undefined) el.detectGaps = props.detectGaps;
  if (props.expectedStep !== undefined) el.expectedStep = props.expectedStep;
  if (props.showDataPoints !== undefined) el.showDataPoints = props.showDataPoints;
  if (props.enableMouseLine !== undefined) el.enableMouseLine = props.enableMouseLine;
  if (props.singlePointLine !== undefined) el.singlePointLine = props.singlePointLine;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.sharedTooltip !== undefined) el.sharedTooltip = props.sharedTooltip;
  if (props.sharedTooltipFormatter !== undefined)
    el.sharedTooltipFormatter = props.sharedTooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.yTicks !== undefined) el.yTicks = props.yTicks;
  if (props.showGridLines !== undefined) el.showGridLines = props.showGridLines;
  if (props.showVerticalGridLines !== undefined)
    el.showVerticalGridLines = props.showVerticalGridLines;
  if (props.highlightZeroLine !== undefined) el.highlightZeroLine = props.highlightZeroLine;
  if (props.fontFamily !== undefined) el.fontFamily = props.fontFamily;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.yAxisDomain !== undefined) el.yAxisDomain = props.yAxisDomain;
  if (props.yAxisScale !== undefined) el.yAxisScale = props.yAxisScale;
  if (props.xAxisFormat !== undefined) el.xAxisFormat = props.xAxisFormat;
  if (props.yAxisFormat !== undefined) el.yAxisFormat = props.yAxisFormat;
  if (props.ticks !== undefined) el.ticks = props.ticks;
  if (props.tickValues !== undefined) el.tickValues = props.tickValues;
  if (props.fillPeriodTicks !== undefined) el.fillPeriodTicks = props.fillPeriodTicks;
  if (props.noDataTickTooltip !== undefined) el.noDataTickTooltip = props.noDataTickTooltip;
  if (props.noDataTickColor !== undefined) el.noDataTickColor = props.noDataTickColor;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.svgChildren !== undefined) el.svgChildren = props.svgChildren;
  if (props.timeline !== undefined) el.timeline = props.timeline;
  if (props.zoom !== undefined) el.zoom = props.zoom;
}
