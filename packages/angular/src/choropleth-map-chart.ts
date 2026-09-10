import "@michi-vz/wc/choropleth-map-chart"; // registers <michi-vz-choropleth-map-chart>
import type { ChoroplethMapChartElement } from "@michi-vz/wc";
import type { ChoroplethMapChartProps } from "@michi-vz/core";

export { bindChart } from "./internal/bind";
export type { ChoroplethMapChartElement } from "@michi-vz/wc";
export type { ChoroplethMapChartProps } from "@michi-vz/core";

/** Apply engine props onto a <michi-vz-choropleth-map-chart> element (property binding). */
export function applyChoroplethMapChartProps(
  el: ChoroplethMapChartElement,
  props: ChoroplethMapChartProps,
): void {
  el.geography = props.geography;
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.projection !== undefined) el.projection = props.projection;
  if (props.projectionConfig !== undefined) el.projectionConfig = props.projectionConfig;
  if (props.colorScale !== undefined) el.colorScale = props.colorScale;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.noDataColor !== undefined) el.noDataColor = props.noDataColor;
  if (props.colors !== undefined) el.colors = props.colors;
  if (props.joinBy !== undefined) el.joinBy = props.joinBy;
  if (props.strokeColor !== undefined) el.strokeColor = props.strokeColor;
  if (props.strokeWidth !== undefined) el.strokeWidth = props.strokeWidth;
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
