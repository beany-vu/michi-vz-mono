import "@michi-vz/wc/sankey-chart"; // registers <michi-vz-sankey-chart>
import type { SankeyChartElement } from "@michi-vz/wc";
import type { SankeyChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { SankeyChartElement } from "@michi-vz/wc";
export type { SankeyChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-sankey-chart> element (property binding). */
export function applySankeyChartProps(el: SankeyChartElement, props: SankeyChartProps): void {
  el.nodes = props.nodes;
  el.links = props.links;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.nodeWidth !== undefined) el.nodeWidth = props.nodeWidth;
  if (props.nodePadding !== undefined) el.nodePadding = props.nodePadding;
  if (props.nodeRadius !== undefined) el.nodeRadius = props.nodeRadius;
  if (props.linkRadius !== undefined) el.linkRadius = props.linkRadius;
  if (props.linkColorMode !== undefined) el.linkColorMode = props.linkColorMode;
  if (props.linkOpacity !== undefined) el.linkOpacity = props.linkOpacity;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
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
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
