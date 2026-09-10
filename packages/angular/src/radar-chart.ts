import "@michi-vz/wc/radar-chart"; // registers <michi-vz-radar-chart>
import type { RadarChartElement } from "@michi-vz/wc";
import type { RadarChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { RadarChartElement } from "@michi-vz/wc";
export type { RadarChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-radar-chart> element. */
export function applyRadarChartProps(el: RadarChartElement, props: RadarChartProps): void {
  el.series = props.series;
  // `axes` became optional in the radar drop-in (the engine derives it from
  // poles.labels when absent), so guard the assignment like every other optional prop.
  if (props.axes !== undefined) el.axes = props.axes;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.maxValue !== undefined) el.maxValue = props.maxValue;
  if (props.rings !== undefined) el.rings = props.rings;
  if (props.fillOpacity !== undefined) el.fillOpacity = props.fillOpacity;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.poles !== undefined) el.poles = props.poles;
  if (props.showFilled !== undefined) el.showFilled = props.showFilled;
  if (props.showDimmedFill !== undefined) el.showDimmedFill = props.showDimmedFill;
  if (props.radialLabelFormatter !== undefined)
    el.radialLabelFormatter = props.radialLabelFormatter;
  if (props.poleLabelFormatter !== undefined) el.poleLabelFormatter = props.poleLabelFormatter;
  if (props.tooltipContainerStyle !== undefined)
    el.tooltipContainerStyle = props.tooltipContainerStyle;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.progressiveDraw !== undefined) el.progressiveDraw = props.progressiveDraw;
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
