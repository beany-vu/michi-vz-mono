import "@michi-vz/wc/radial-tree-chart"; // registers <michi-vz-radial-tree-chart>
import type { RadialTreeChartElement } from "@michi-vz/wc";
import type { RadialTreeChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { RadialTreeChartElement } from "@michi-vz/wc";
export type { RadialTreeChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-radial-tree-chart> element (property binding). */
export function applyRadialTreeChartProps(
  el: RadialTreeChartElement,
  props: RadialTreeChartProps,
): void {
  el.dataSet = props.dataSet;
  if (props.centerLabel !== undefined) el.centerLabel = props.centerLabel;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.radiusRange !== undefined) el.radiusRange = props.radiusRange;
  if (props.labelDensityThresholds !== undefined)
    el.labelDensityThresholds = props.labelDensityThresholds;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
