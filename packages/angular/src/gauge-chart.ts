import "@michi-vz/wc/gauge-chart"; // registers <michi-vz-gauge-chart>
import type { GaugeChartElement } from "@michi-vz/wc";
import type { GaugeChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { GaugeChartElement } from "@michi-vz/wc";
export type { GaugeChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-gauge-chart> element (property binding). */
export function applyGaugeChartProps(el: GaugeChartElement, props: GaugeChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.max !== undefined) el.max = props.max;
  if (props.ringThickness !== undefined) el.ringThickness = props.ringThickness;
  if (props.ringGap !== undefined) el.ringGap = props.ringGap;
  if (props.outerRadius !== undefined) el.outerRadius = props.outerRadius;
  if (props.startAngle !== undefined) el.startAngle = props.startAngle;
  if (props.roundedCaps !== undefined) el.roundedCaps = props.roundedCaps;
  if (props.ringOpacity !== undefined) el.ringOpacity = props.ringOpacity;
  if (props.trackColor !== undefined) el.trackColor = props.trackColor;
  if (props.trackOpacity !== undefined) el.trackOpacity = props.trackOpacity;
  if (props.defaultActive !== undefined) el.defaultActive = props.defaultActive;
  if (props.activeStyle !== undefined) el.activeStyle = props.activeStyle;
  if (props.showCenterLabel !== undefined) el.showCenterLabel = props.showCenterLabel;
  if (props.centerContent !== undefined) el.centerContent = props.centerContent;
  if (props.valueFormatter !== undefined) el.valueFormatter = props.valueFormatter;
  if (props.noValueLabel !== undefined) el.noValueLabel = props.noValueLabel;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.margin !== undefined) el.margin = props.margin;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.locale !== undefined) el.locale = props.locale;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.enableTransitions !== undefined) el.enableTransitions = props.enableTransitions;
  if (props.fontFamily !== undefined) el.fontFamily = props.fontFamily;
  if (props.isLoading !== undefined) el.isLoading = props.isLoading;
  if (props.isNodata !== undefined) el.isNodata = props.isNodata;
  if (props.noDataLabel !== undefined) el.noDataLabel = props.noDataLabel;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
}
