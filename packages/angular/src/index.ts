// Angular integration. Angular has first-class custom-element interop, so this
// package registers the <michi-vz-gap-chart> element and provides a typed helper
// for property binding from Angular templates (use CUSTOM_ELEMENTS_SCHEMA).
// An idiomatic standalone @Component wrapper (built with ng-packagr) is a later
// increment; this thin layer works today with zero Angular-compiler coupling.
import "@michi-vz/wc"; // registers <michi-vz-gap-chart> + auto-injects core.css
import type { GapChartElement } from "@michi-vz/wc";
import type { GapChartProps } from "@michi-vz/core";

export type { GapChartProps, ChartContext } from "@michi-vz/core";
export type { GapChartElement } from "@michi-vz/wc";

/** Apply engine props onto a <michi-vz-gap-chart> element (property binding). */
export function applyGapChartProps(el: GapChartElement, props: GapChartProps): void {
  el.dataSet = props.dataSet;
  if (props.title !== undefined) el.chartTitle = props.title;
  if (props.width !== undefined) el.width = props.width;
  if (props.height !== undefined) el.height = props.height;
  if (props.renderer !== undefined) el.renderer = props.renderer;
  if (props.xAxisDataType !== undefined) el.xAxisDataType = props.xAxisDataType;
  if (props.colorsMapping !== undefined) el.colorsMapping = props.colorsMapping;
  if (props.highlightItems !== undefined) el.highlightItems = props.highlightItems;
  if (props.disabledItems !== undefined) el.disabledItems = props.disabledItems;
  if (props.shapeValue1 !== undefined) el.shapeValue1 = props.shapeValue1;
  if (props.shapeValue2 !== undefined) el.shapeValue2 = props.shapeValue2;
  if (props.skipColorMappingDispatch !== undefined)
    el.skipColorMappingDispatch = props.skipColorMappingDispatch;
  if (props.tooltipFormatter !== undefined) el.tooltipFormatter = props.tooltipFormatter;
  if (props.locale !== undefined) el.locale = props.locale;
}
