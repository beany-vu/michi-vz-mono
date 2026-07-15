// <michi-vz-comparable-vertical-bar-chart> - Lit, LIGHT DOM, over the
// @michi-vz/core ComparableVerticalBar engine.
import { LitElement, html, type PropertyValues } from "lit";
import { mountComparableVerticalBarChart } from "@michi-vz/core";
import type {
  AgentTool,
  ComparableVerticalBarChartProps,
  ComparableBarDataPoint,
  ChartContext,
  ChartInstance,
  DeltaIndicatorConfig,
  Margin,
  MichiVzPlugin,
  TimelinePeriodConfig,
  TimelineController,
} from "@michi-vz/core";

export class ComparableVerticalBarChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    colorsMapping: { attribute: false },
    colorsBasedMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    valueBasedOpacity: { type: Number, attribute: "value-based-opacity" },
    valueComparedOpacity: { type: Number, attribute: "value-compared-opacity" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    colors: { attribute: false },
    xAxisFormat: { attribute: false },
    yAxisFormat: { attribute: false },
    yAxisDomain: { attribute: false },
    ticks: { type: Number },
    xAxisLabelPadding: { type: Number, attribute: "x-axis-label-padding" },
    xAxisMode: { type: String, attribute: "x-axis-mode" },
    patternsMapping: { attribute: false },
    showZeroLineForYAxis: { type: Boolean, attribute: "show-zero-line-for-y-axis" },
    showGrid: { type: Boolean, attribute: "show-grid" },
    hideTickLabels: { type: Boolean, attribute: "hide-tick-labels" },
    minBarHeight: { type: Number, attribute: "min-bar-height" },
    maxBarWidth: { type: Number, attribute: "max-bar-width" },
    symmetricYDomain: { type: Boolean, attribute: "symmetric-y-domain" },
    deltaIndicator: { attribute: false },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    filter: { attribute: false },
    timeline: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
  };

  dataSet: ComparableBarDataPoint[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  colorsMapping?: Record<string, string>;
  colorsBasedMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  valueBasedOpacity?: number;
  valueComparedOpacity?: number;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: ComparableBarDataPoint) => string;
  plugins?: MichiVzPlugin<ComparableVerticalBarChartProps>[];
  locale?: string;
  margin?: Margin;
  colors?: string[];
  xAxisFormat?: (d: string) => string;
  yAxisFormat?: (d: number | string) => string;
  yAxisDomain?: [number, number];
  ticks?: number;
  xAxisLabelPadding?: number;
  xAxisMode?: "auto" | "horizontal";
  patternsMapping?: Record<string, string>;
  showZeroLineForYAxis?: boolean;
  showGrid?: boolean;
  hideTickLabels?: boolean;
  minBarHeight?: number;
  maxBarWidth?: number;
  symmetricYDomain?: boolean;
  deltaIndicator?: DeltaIndicatorConfig;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: ComparableBarDataPoint[] | null | undefined) => boolean);
  noDataLabel?: string;
  filter?: { limit: number; criteria: "valueBased" | "valueCompared"; sortingDir: "asc" | "desc" };
  timeline?: boolean | TimelinePeriodConfig;
  enableTransitions?: boolean;

  private chart?: ChartInstance<ComparableVerticalBarChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): ComparableVerticalBarChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      colorsMapping: this.colorsMapping,
      colorsBasedMapping: this.colorsBasedMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      valueBasedOpacity: this.valueBasedOpacity,
      valueComparedOpacity: this.valueComparedOpacity,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      colors: this.colors,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      yAxisDomain: this.yAxisDomain,
      ticks: this.ticks,
      xAxisLabelPadding: this.xAxisLabelPadding,
      xAxisMode: this.xAxisMode,
      patternsMapping: this.patternsMapping,
      showZeroLineForYAxis: this.showZeroLineForYAxis,
      showGrid: this.showGrid,
      hideTickLabels: this.hideTickLabels,
      minBarHeight: this.minBarHeight,
      maxBarWidth: this.maxBarWidth,
      symmetricYDomain: this.symmetricYDomain,
      deltaIndicator: this.deltaIndicator,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      filter: this.filter,
      timeline: this.timeline,
      enableTransitions: this.enableTransitions,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host)
      this.chart = mountComparableVerticalBarChart(host, this.chartProps, {
        plugins: this.plugins,
      });
  }

  protected updated(_changed: PropertyValues): void {
    this.chart?.update(this.chartProps);
  }

  disconnectedCallback(): void {
    this.chart?.destroy();
    this.chart = undefined;
    super.disconnectedCallback();
  }

  getContext(): ChartContext | null {
    return this.chart?.getContext() ?? null;
  }

  getTools(): AgentTool[] {
    return this.chart?.getTools?.() ?? [];
  }

  /** Headless playback controller (null unless the `timeline` prop is set). */
  getTimeline(): TimelineController | null {
    return this.chart?.timeline?.() ?? null;
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("michi-vz-comparable-vertical-bar-chart")
) {
  customElements.define(
    "michi-vz-comparable-vertical-bar-chart",
    ComparableVerticalBarChartElement,
  );
}
