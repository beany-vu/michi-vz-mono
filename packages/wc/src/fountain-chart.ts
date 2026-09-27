// <michi-vz-fountain-chart> - Lit, LIGHT DOM, over the @michi-vz/core FountainChart
// ("Jet d'Eau") engine. Categorical x = snapshot, temporal/numeric x = trend.
// The look options core ignores since 1.29 (style as `fountainStyle`, frothLayers,
// bloomExponent, stemFraction, showDroplets, showMist) are still accepted and passed on
// for one release, so the engine raises its ignored-option warning for each.
import { LitElement, html, type PropertyValues } from "lit";
import { mountFountainChart } from "@michi-vz/core";
import type {
  AgentTool,
  FountainChartProps,
  FountainDataItem,
  FountainLabels,
  FountainReferenceLine,
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
    xAxisDataType: { type: String, attribute: "x-axis-data-type" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    showTrendLine: { attribute: false },
    fountainStyle: { type: String, attribute: "fountain-style" },
    frothLayers: { attribute: false },
    bloomExponent: { attribute: false },
    stemFraction: { attribute: false },
    showDroplets: { attribute: false },
    showMist: { attribute: false },
    showRange: { type: Boolean, attribute: "show-range" },
    showSamples: { type: Boolean, attribute: "show-samples" },
    showValueLabels: { type: Boolean, attribute: "show-value-labels" },
    drift: { type: Boolean, attribute: "drift" },
    yAxisTitle: { type: String, attribute: "y-axis-title" },
    endLabels: { attribute: false },
    referenceLines: { attribute: false },
    labels: { attribute: false },
    readingGuide: { attribute: false },
    sampleWord: { type: String, attribute: "sample-word" },
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
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    progressiveDraw: { attribute: false },
    timeline: { attribute: false },
  };

  dataSet: FountainDataItem[] = [];
  chartTitle = "";
  width = 900;
  height = 480;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  xAxisDataType?: FountainXAxisType;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  showTrendLine?: boolean;
  /** @deprecated ignored since core 1.29 (core's `style`); emits an ignored-option warning */
  fountainStyle?: "jet" | "plume";
  /** @deprecated ignored since core 1.29; emits an ignored-option warning */
  frothLayers?: number;
  /** @deprecated ignored since core 1.29; emits an ignored-option warning */
  bloomExponent?: number;
  /** @deprecated ignored since core 1.29; emits an ignored-option warning */
  stemFraction?: number;
  /** @deprecated ignored since core 1.29; emits an ignored-option warning */
  showDroplets?: boolean;
  /** @deprecated ignored since core 1.29; emits an ignored-option warning */
  showMist?: boolean;
  // showRange, showSamples and showValueLabels are left undefined so the core default
  // (true) applies: a boolean attribute can only switch ON, so turn one off with the
  // PROPERTY, e.g. `el.showRange = false`.
  showRange?: boolean;
  showSamples?: boolean;
  showValueLabels?: boolean;
  drift?: boolean;
  yAxisTitle?: string;
  endLabels?: [string, string];
  referenceLines?: FountainReferenceLine[];
  labels?: FountainLabels;
  readingGuide?: boolean | string;
  sampleWord?: string;
  skipColorMappingDispatch = false;
  tooltipFormatter?: FountainChartProps["tooltipFormatter"];
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
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: FountainDataItem[] | null | undefined) => boolean);
  noDataLabel?: string;
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
      xAxisDataType: this.xAxisDataType,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      showTrendLine: this.showTrendLine,
      style: this.fountainStyle,
      frothLayers: this.frothLayers,
      bloomExponent: this.bloomExponent,
      stemFraction: this.stemFraction,
      showDroplets: this.showDroplets,
      showMist: this.showMist,
      showRange: this.showRange,
      showSamples: this.showSamples,
      showValueLabels: this.showValueLabels,
      drift: this.drift,
      yAxisTitle: this.yAxisTitle,
      endLabels: this.endLabels,
      referenceLines: this.referenceLines,
      labels: this.labels,
      readingGuide: this.readingGuide,
      sampleWord: this.sampleWord,
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
