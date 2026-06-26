// Dedicated, hand-tuned thumbnail data for the home-page chart catalog cards.
//
// These are intentionally SMALL and clean — a few series/points, no markers, no
// titles — so each chart reads as a crisp mini-shape at ~190x110px. They are
// decorative landing-page data, separate from the real per-chart examples in
// @michi-vz/examples (which power the full chart pages).
//
// The cards mount the @michi-vz/core ENGINE directly (not the <michi-vz-*> web
// component) because the elements expose only a fixed prop subset — notably no
// `margin`, so a wc thumbnail can't escape the engine's full-size default
// margins (which collapse the plot at 124px). Mounting the engine gives full
// prop control (margin/colors/sizeRange/…). The card injects width/height/margin;
// previews carry data + styling only. `satisfies` keeps shapes honest.
import {
  mountLineChart,
  mountAreaChart,
  mountScatterChart,
  mountRangeChart,
  mountRibbonChart,
  mountRadarChart,
  mountVerticalStackBarChart,
  mountComparableHorizontalBarChart,
  mountDualHorizontalBarChart,
  mountBarBellChart,
  mountGapChart,
} from "@michi-vz/core";
import type {
  ChartInstance,
  LineChartProps,
  AreaChartProps,
  ScatterChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  GapChartProps,
} from "@michi-vz/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mount = (el: HTMLElement, props: any) => ChartInstance<any>;

export interface Preview {
  mount: Mount;
  props: Record<string, unknown>;
}

// Heraldic-leaning palette (Geneva red + gold, with cool accents) for a cohesive
// gallery on the cream card body.
const RED = "#c0392b";
const GOLD = "#d99b2b";
const BLUE = "#2c6fbb";
const GREEN = "#3b8c5a";
const PLUM = "#8e5aa8";

export const previews: Record<string, Preview> = {
  "line-chart": {
    mount: mountLineChart as Mount,
    props: {
      xAxisDataType: "date_annual",
      curve: "curveMonotoneX",
      dataSet: [
        { label: "Solar", color: GOLD, series: [
          { date: 2018, value: 12, certainty: true }, { date: 2019, value: 17, certainty: true },
          { date: 2020, value: 21, certainty: true }, { date: 2021, value: 30, certainty: true },
          { date: 2022, value: 43, certainty: true }] },
        // One series mixes solid + dashed on a single line: the segments INTO the
        // certainty:false points (2020, 2021) render dashed, so the blue line reads
        // solid -> dashed gap -> solid (shows off detectGaps / certainty).
        { label: "Wind", color: BLUE, series: [
          { date: 2018, value: 18, certainty: true }, { date: 2019, value: 22, certainty: true },
          { date: 2020, value: 27, certainty: false }, { date: 2021, value: 33, certainty: false },
          { date: 2022, value: 39, certainty: true }] },
        { label: "Hydro", color: GREEN, series: [
          { date: 2018, value: 9, certainty: true }, { date: 2019, value: 11, certainty: true },
          { date: 2020, value: 13, certainty: true }, { date: 2021, value: 15, certainty: true },
          { date: 2022, value: 18, certainty: true }] },
      ],
    } satisfies LineChartProps,
  },

  "area-chart": {
    mount: mountAreaChart as Mount,
    props: {
      xAxisDataType: "date_annual",
      keys: ["Services", "Industry", "Farming"],
      colors: [BLUE, GOLD, GREEN],
      series: [
        { date: 2018, Services: 18, Industry: 12, Farming: 8 },
        { date: 2019, Services: 20, Industry: 12, Farming: 7 },
        { date: 2020, Services: 23, Industry: 13, Farming: 7 },
        { date: 2021, Services: 26, Industry: 13, Farming: 6 },
        { date: 2022, Services: 30, Industry: 14, Farming: 6 },
      ],
    } satisfies AreaChartProps,
  },

  "scatter-chart": {
    mount: mountScatterChart as Mount,
    props: {
      xAxisDataType: "number",
      sizeRange: [4, 15],
      dataSet: [
        { label: "a", x: 1, y: 2, d: 7, color: BLUE },
        { label: "b", x: 2, y: 4, d: 12, color: GOLD },
        { label: "c", x: 3, y: 3, d: 5, color: GREEN },
        { label: "d", x: 4, y: 6, d: 15, color: RED },
        { label: "e", x: 5, y: 7, d: 9, color: PLUM },
        { label: "f", x: 6, y: 9, d: 11, color: BLUE },
      ],
    } satisfies ScatterChartProps,
  },

  "range-chart": {
    mount: mountRangeChart as Mount,
    props: {
      xAxisDataType: "date_annual",
      dataSet: [
        { label: "High", color: RED, series: [
          { date: 2019, valueMin: 6, valueMax: 12, certainty: true },
          { date: 2020, valueMin: 7, valueMax: 14, certainty: true },
          { date: 2021, valueMin: 8, valueMax: 17, certainty: true },
          { date: 2022, valueMin: 9, valueMax: 20, certainty: true }] },
        { label: "Low", color: BLUE, series: [
          { date: 2019, valueMin: 2, valueMax: 5, certainty: true },
          { date: 2020, valueMin: 2, valueMax: 6, certainty: true },
          { date: 2021, valueMin: 3, valueMax: 7, certainty: true },
          { date: 2022, valueMin: 3, valueMax: 8, certainty: true }] },
      ],
    } satisfies RangeChartProps,
  },

  "ribbon-chart": {
    mount: mountRibbonChart as Mount,
    props: {
      keys: ["A", "B", "C"],
      colors: [RED, GOLD, BLUE],
      series: [
        { date: "2019", A: 42, B: 33, C: 25 },
        { date: "2020", A: 36, B: 36, C: 28 },
        { date: "2021", A: 31, B: 38, C: 31 },
        { date: "2022", A: 27, B: 39, C: 34 },
      ],
    } satisfies RibbonChartProps,
  },

  "radar-chart": {
    mount: mountRadarChart as Mount,
    props: {
      axes: ["Health", "Cost", "Safety", "Culture", "Transit", "Green"],
      maxValue: 100,
      fillOpacity: 0.18,
      series: [
        { label: "X", color: RED, values: [88, 55, 80, 70, 62, 75] },
        { label: "Y", color: BLUE, values: [60, 82, 62, 78, 84, 58] },
      ],
    } satisfies RadarChartProps,
  },

  "vertical-stack-bar-chart": {
    mount: mountVerticalStackBarChart as Mount,
    props: {
      keys: ["Services", "Industry", "Farming"],
      keysOrder: "bottomToTop",
      yAxisDomain: [0, 100],
      colors: [BLUE, GOLD, GREEN],
      dataSet: [
        { seriesKey: "W", seriesKeyAbbreviation: "", series: [
          { date: "2018", Services: 42, Industry: 25, Farming: 33 },
          { date: "2019", Services: 46, Industry: 25, Farming: 29 },
          { date: "2020", Services: 50, Industry: 24, Farming: 26 },
          { date: "2021", Services: 54, Industry: 24, Farming: 22 },
          { date: "2022", Services: 58, Industry: 23, Farming: 19 }] },
      ],
    } satisfies VerticalStackBarChartProps,
  },

  "comparable-horizontal-bar-chart": {
    mount: mountComparableHorizontalBarChart as Mount,
    props: {
      dataSet: [
        { label: "a", valueBased: 30, valueCompared: 44, color: BLUE },
        { label: "b", valueBased: 26, valueCompared: 22, color: GOLD },
        { label: "c", valueBased: 18, valueCompared: 28, color: RED },
        { label: "d", valueBased: 12, valueCompared: 17, color: GREEN },
      ],
    } satisfies ComparableBarChartProps,
  },

  "dual-horizontal-bar-chart": {
    mount: mountDualHorizontalBarChart as Mount,
    props: {
      dataSet: [
        { label: "a", value1: 5, value2: 4, color: BLUE },
        { label: "b", value1: 9, value2: 8, color: BLUE },
        { label: "c", value1: 12, value2: 11, color: BLUE },
        { label: "d", value1: 10, value2: 12, color: BLUE },
        { label: "e", value1: 6, value2: 8, color: BLUE },
        { label: "f", value1: 3, value2: 5, color: BLUE },
      ],
    } satisfies DualBarChartProps,
  },

  "bar-bell-chart": {
    mount: mountBarBellChart as Mount,
    props: {
      keys: ["A", "B", "C"],
      colors: [RED, GOLD, BLUE],
      dataSet: [
        { date: "2019", A: 8, B: 4, C: 2 },
        { date: "2020", A: 12, B: 7, C: 4 },
        { date: "2021", A: 18, B: 10, C: 6 },
        { date: "2022", A: 26, B: 14, C: 9 },
      ],
    } satisfies BarBellChartProps,
  },

  "gap-chart": {
    mount: mountGapChart as Mount,
    props: {
      dataSet: [
        { label: "a", value1: 6, value2: 14 },
        { label: "b", value1: 18, value2: 11 },
        { label: "c", value1: 10, value2: 16 },
        { label: "d", value1: 13, value2: 8 },
      ],
    } satisfies GapChartProps,
  },
};
