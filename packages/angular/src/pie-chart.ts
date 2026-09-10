import "@michi-vz/wc/pie-chart"; // registers <michi-vz-pie-chart>
import type { PieChartElement } from "@michi-vz/wc";
import type { PieChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { PieChartElement } from "@michi-vz/wc";
export type { PieChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-pie-chart> element (property binding). */
export function applyPieChartProps(el: PieChartElement, props: PieChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.innerRadiusRatio !== undefined) el.innerRadiusRatio = props.innerRadiusRatio;
  if (props.padAngle !== undefined) el.padAngle = props.padAngle;
  if (props.cornerRadius !== undefined) el.cornerRadius = props.cornerRadius;
  if (props.sortByValue !== undefined) el.sortByValue = props.sortByValue;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
  if (props.showLegend !== undefined) el.showLegend = props.showLegend;
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
