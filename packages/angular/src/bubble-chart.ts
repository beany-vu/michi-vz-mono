import "@michi-vz/wc/bubble-chart"; // registers <michi-vz-bubble-chart>
import type { BubbleChartElement } from "@michi-vz/wc";
import type { BubbleChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { BubbleChartElement } from "@michi-vz/wc";
export type { BubbleChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-bubble-chart> element (property binding). */
export function applyBubbleChartProps(el: BubbleChartElement, props: BubbleChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.gravity !== undefined) el.gravity = props.gravity;
  if (props.chargeStrength !== undefined) el.chargeStrength = props.chargeStrength;
  if (props.padding !== undefined) el.padding = props.padding;
  if (props.fillRatio !== undefined) el.fillRatio = props.fillRatio;
  if (props.layoutMode !== undefined) el.layoutMode = props.layoutMode;
  if (props.settleTicks !== undefined) el.settleTicks = props.settleTicks;
  if (props.splitLabels !== undefined) el.splitLabels = props.splitLabels;
  if (props.splitOpacity !== undefined) el.splitOpacity = props.splitOpacity;
  if (props.showSplit !== undefined) el.showSplit = props.showSplit;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
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
  if (props.filter !== undefined) el.filter = props.filter;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
