// <michi-vz-area-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core AreaChart engine. Same pattern as the other elements.
import { LitElement, html, type PropertyValues } from "lit";
import { mountAreaChart } from "@michi-vz/core";
import type {
  AgentTool,
  AreaChartProps,
  AreaDataRow,
  CurveType,
  ChartContext,
  ChartInstance,
  Margin,
  MichiVzPlugin,
  ProgressiveDrawConfig,
  TimelinePeriodConfig,
  TimelineController,
  XaxisDataType,
} from "@michi-vz/core";

export class AreaChartElement extends LitElement {
  static properties = {
    series: { attribute: false },
    keys: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    xAxisDataType: { type: String, attribute: "x-axis-data-type" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    curve: { type: String },
    forcePercentageScale: { type: Boolean, attribute: "force-percentage-scale" },
    stackOffset: { type: String, attribute: "stack-offset" },
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
    tickValues: { attribute: false },
    fillPeriodTicks: { type: Boolean, attribute: "fill-period-ticks" },
    noDataTickTooltip: { attribute: false },
    noDataTickColor: { type: String, attribute: "no-data-tick-color" },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    progressiveDraw: { attribute: false },
    timeline: { attribute: false },
  };

  series: AreaDataRow[] = [];
  keys: string[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  xAxisDataType: XaxisDataType = "number";
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  curve?: CurveType;
  forcePercentageScale = false;
  stackOffset?: "none" | "expand";
  skipColorMappingDispatch = false;
  tooltipFormatter?: (row: AreaDataRow, series: AreaDataRow[], key: string) => string;
  plugins?: MichiVzPlugin<AreaChartProps>[];
  locale?: string;
  margin?: Margin;
  colors?: string[];
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yAxisDomain?: [number, number];
  ticks?: number;
  tickValues?: Array<number | Date>;
  fillPeriodTicks?: boolean;
  noDataTickTooltip?: (date: number) => string;
  noDataTickColor?: string;
  enableTransitions?: boolean;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: AreaDataRow[] | null | undefined) => boolean);
  noDataLabel?: string;
  progressiveDraw?: boolean | ProgressiveDrawConfig;
  timeline?: boolean | TimelinePeriodConfig;

  private chart?: ChartInstance<AreaChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): AreaChartProps {
    return {
      series: this.series,
      keys: this.keys,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      xAxisDataType: this.xAxisDataType,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      curve: this.curve,
      forcePercentageScale: this.forcePercentageScale,
      stackOffset: this.stackOffset,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      colors: this.colors,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      yAxisDomain: this.yAxisDomain,
      ticks: this.ticks,
      tickValues: this.tickValues,
      fillPeriodTicks: this.fillPeriodTicks,
      noDataTickTooltip: this.noDataTickTooltip,
      noDataTickColor: this.noDataTickColor,
      enableTransitions: this.enableTransitions,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      progressiveDraw: this.progressiveDraw,
      timeline: this.timeline,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountAreaChart(host, this.chartProps, { plugins: this.plugins });
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

  /** Re-run the progressiveDraw reveal animation (no-op unless the prop is set). */
  replay(): void {
    this.chart?.replay?.();
  }

  /** Headless playback controller (null unless the `timeline` prop is set). */
  getTimeline(): TimelineController | null {
    return this.chart?.timeline?.() ?? null;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-area-chart")) {
  customElements.define("michi-vz-area-chart", AreaChartElement);
}
