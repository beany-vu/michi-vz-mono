import "@michi-vz/wc/treemap-chart"; // registers <michi-vz-treemap-chart>
import type { TreemapChartElement } from "@michi-vz/wc";
import type { TreemapChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { TreemapChartElement } from "@michi-vz/wc";
export type { TreemapChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-treemap-chart> element. */
export function applyTreemapChartProps(el: TreemapChartElement, props: TreemapChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.layout !== undefined) el.layout = props.layout;
  if (props.stackBreakpoint !== undefined) el.stackBreakpoint = props.stackBreakpoint;
  if (props.splitLabels !== undefined) el.splitLabels = props.splitLabels;
  if (props.splitOpacity !== undefined) el.splitOpacity = props.splitOpacity;
  if (props.showSplit !== undefined) el.showSplit = props.showSplit;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
  if (props.minTileShare !== undefined) el.minTileShare = props.minTileShare;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.valueFormatter !== undefined) el.valueFormatter = props.valueFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.paddingInner !== undefined) el.paddingInner = props.paddingInner;
  if (props.paddingTop !== undefined) el.paddingTop = props.paddingTop;
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.tileValueLabels !== undefined) el.tileValueLabels = props.tileValueLabels;
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
