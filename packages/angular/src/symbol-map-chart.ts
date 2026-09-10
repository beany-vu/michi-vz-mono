import "@michi-vz/wc/symbol-map-chart"; // registers <michi-vz-symbol-map-chart>
import type { SymbolMapChartElement } from "@michi-vz/wc";
import type { SymbolMapChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { SymbolMapChartElement } from "@michi-vz/wc";
export type { SymbolMapChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-symbol-map-chart> element (property binding). */
export function applySymbolMapChartProps(
  el: SymbolMapChartElement,
  props: SymbolMapChartProps,
): void {
  el.dataSet = props.dataSet;
  if (props.geography !== undefined) el.geography = props.geography;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.projection !== undefined) el.projection = props.projection;
  if (props.projectionConfig !== undefined) el.projectionConfig = props.projectionConfig;
  if (props.radiusRange !== undefined) el.radiusRange = props.radiusRange;
  if (props.radiusVisibleMin !== undefined) el.radiusVisibleMin = props.radiusVisibleMin;
  if (props.positionMode !== undefined) el.positionMode = props.positionMode;
  if (props.shape !== undefined) el.shape = props.shape;
  if (props.honeycomb !== undefined) el.honeycomb = props.honeycomb;
  if (props.colorScale !== undefined) el.colorScale = props.colorScale;
  if (props.noDataColor !== undefined) el.noDataColor = props.noDataColor;
  if (props.markers !== undefined) el.markers = props.markers;
  if (props.geographyColor !== undefined) el.geographyColor = props.geographyColor;
  if (props.strokeColor !== undefined) el.strokeColor = props.strokeColor;
  if (props.strokeWidth !== undefined) el.strokeWidth = props.strokeWidth;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.showLabels !== undefined) el.showLabels = props.showLabels;
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
  if (props.timeline !== undefined) el.timeline = props.timeline;
}
