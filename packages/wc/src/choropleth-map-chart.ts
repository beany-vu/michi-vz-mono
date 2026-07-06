// <michi-vz-choropleth-map-chart> - Lit, LIGHT DOM, over the @michi-vz/core
// ChoroplethMap engine. `geography` and `dataSet` are `{attribute: false}` -
// consumers set them as JS properties (this element never bundles topology
// data; you import your own world/region GeoJSON and pass it through).
import { LitElement, html, type PropertyValues } from "lit";
import { mountChoroplethMapChart } from "@michi-vz/core";
import type {
  AgentTool,
  ChoroplethDataItem,
  ChoroplethMapChartProps,
  ChartContext,
  ChartInstance,
  GeoFeatureItem,
  Margin,
  MichiVzPlugin,
} from "@michi-vz/core";

export class ChoroplethMapChartElement extends LitElement {
  static properties = {
    geography: { attribute: false },
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    projection: { type: String },
    projectionConfig: { attribute: false },
    colorScale: { attribute: false },
    colorsMapping: { attribute: false },
    noDataColor: { type: String, attribute: "no-data-color" },
    colors: { attribute: false },
    joinBy: { type: String, attribute: "join-by" },
    strokeColor: { type: String, attribute: "stroke-color" },
    strokeWidth: { type: Number, attribute: "stroke-width" },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
  };

  geography: GeoJSON.FeatureCollection | GeoFeatureItem[] = [];
  dataSet: ChoroplethDataItem[] = [];
  chartTitle = "";
  width = 900;
  height = 520;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  projection?: ChoroplethMapChartProps["projection"];
  projectionConfig?: ChoroplethMapChartProps["projectionConfig"];
  colorScale?: { domain: number[]; range: string[] };
  colorsMapping?: Record<string, string>;
  noDataColor?: string;
  colors?: string[];
  joinBy?: "id" | "name";
  strokeColor?: string;
  strokeWidth?: number;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: ChoroplethDataItem | { id: string; name?: string }) => string;
  plugins?: MichiVzPlugin<ChoroplethMapChartProps>[];
  locale?: string;
  margin?: Margin;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: ChoroplethDataItem[] | null | undefined) => boolean);
  noDataLabel?: string;
  enableTransitions?: boolean;

  private chart?: ChartInstance<ChoroplethMapChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): ChoroplethMapChartProps {
    return {
      geography: this.geography,
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      projection: this.projection,
      projectionConfig: this.projectionConfig,
      colorScale: this.colorScale,
      colorsMapping: this.colorsMapping,
      noDataColor: this.noDataColor,
      colors: this.colors,
      joinBy: this.joinBy,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
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
      this.chart = mountChoroplethMapChart(host, this.chartProps, {
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
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-choropleth-map-chart")) {
  customElements.define("michi-vz-choropleth-map-chart", ChoroplethMapChartElement);
}
