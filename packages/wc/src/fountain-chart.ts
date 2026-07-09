// <michi-vz-fountain-chart> - Lit, LIGHT DOM, over the @michi-vz/core FountainChart
// ("Jet d'Eau") engine. Categorical x = snapshot, temporal/numeric x = trend.
import { LitElement, html, type PropertyValues } from "lit";
import { mountFountainChart } from "@michi-vz/core";
import type {
  AgentTool,
  FountainChartProps,
  FountainDataItem,
  FountainXAxisType,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  Margin,
  ProgressiveDrawConfig,
  TimelinePeriodConfig,
  TimelineController,
} from "@michi-vz/core";

export class FountainChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    fountainStyle: { type: String, attribute: "fountain-style" },
    xAxisDataType: { type: String, attribute: "x-axis-data-type" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    frothLayers: { attribute: false },
    bloomExponent: { attribute: false },
    stemFraction: { attribute: false },
    showDroplets: { attribute: false },
    showMist: { attribute: false },
    showTrendLine: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    colors: { attribute: false },
    yAxisDomain: { attribute: false },
    xAxisFormat: { attribute: false },
    yAxisFormat: { attribute: false },
    ticks: { type: Number },
    tickValues: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    progressiveDraw: { attribute: false },
    timeline: { attribute: false },
  };

  dataSet: FountainDataItem[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  fountainStyle?: "jet" | "plume";
  xAxisDataType?: FountainXAxisType;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  frothLayers?: number;
  bloomExponent?: number;
  stemFraction?: number;
  showDroplets?: boolean;
  showMist?: boolean;
  showTrendLine?: boolean;
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: FountainDataItem) => string;
  plugins?: MichiVzPlugin<FountainChartProps>[];
  locale?: string;
  margin?: Margin;
  colors?: string[];
  yAxisDomain?: [number, number];
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  ticks?: number;
  tickValues?: Array<number | Date>;
  enableTransitions?: boolean;
  progressiveDraw?: boolean | ProgressiveDrawConfig;
  timeline?: boolean | TimelinePeriodConfig;

  private chart?: ChartInstance<FountainChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): FountainChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      style: this.fountainStyle,
      xAxisDataType: this.xAxisDataType,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      frothLayers: this.frothLayers,
      bloomExponent: this.bloomExponent,
      stemFraction: this.stemFraction,
      showDroplets: this.showDroplets,
      showMist: this.showMist,
      showTrendLine: this.showTrendLine,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      colors: this.colors,
      yAxisDomain: this.yAxisDomain,
      xAxisFormat: this.xAxisFormat,
      yAxisFormat: this.yAxisFormat,
      ticks: this.ticks,
      tickValues: this.tickValues,
      enableTransitions: this.enableTransitions,
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
    if (host) this.chart = mountFountainChart(host, this.chartProps, { plugins: this.plugins });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-fountain-chart")) {
  customElements.define("michi-vz-fountain-chart", FountainChartElement);
}
