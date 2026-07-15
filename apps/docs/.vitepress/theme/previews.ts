// Dedicated, hand-tuned thumbnail data for the home-page chart catalog cards.
//
// These are intentionally SMALL and clean - a few series/points, no markers, no
// titles - so each chart reads as a crisp mini-shape at ~190x110px. They are
// decorative landing-page data, separate from the real per-chart examples in
// @michi-vz/examples (which power the full chart pages).
//
// The cards mount the @michi-vz/core ENGINE directly (not the <michi-vz-*> web
// component) because the elements expose only a fixed prop subset - notably no
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
  mountFanChart,
  mountTreemapChart,
  mountPieChart,
  mountBubbleChart,
  mountSankeyChart,
  mountFountainChart,
  mountComparableVerticalBarChart,
  mountChoroplethMapChart,
  mountSymbolMapChart,
  mountRadialTreeChart,
} from "@michi-vz/core";
import type {
  ChartInstance,
  FanChartProps,
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
  TreemapChartProps,
  PieChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ComparableVerticalBarChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
} from "@michi-vz/core";
// Real 176-country world atlas, reused from the examples package (geography is
// ALWAYS consumer-supplied; core bundles no topology). Vite dedupes the module,
// so the thumbnail shares the JSON already bundled for the chart pages.
import { examples } from "@michi-vz/examples";

const world = (examples["choropleth-map-chart"][0].props as ChoroplethMapChartProps).geography;

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
        {
          label: "Solar",
          color: GOLD,
          series: [
            { date: 2018, value: 12, certainty: true },
            { date: 2019, value: 17, certainty: true },
            { date: 2020, value: 21, certainty: true },
            { date: 2021, value: 30, certainty: true },
            { date: 2022, value: 43, certainty: true },
          ],
        },
        // One series mixes solid + dashed on a single line: the segments INTO the
        // certainty:false points (2020, 2021) render dashed, so the blue line reads
        // solid -> dashed gap -> solid (shows off detectGaps / certainty).
        {
          label: "Wind",
          color: BLUE,
          series: [
            { date: 2018, value: 18, certainty: true },
            { date: 2019, value: 22, certainty: true },
            { date: 2020, value: 27, certainty: false },
            { date: 2021, value: 33, certainty: false },
            { date: 2022, value: 39, certainty: true },
          ],
        },
        {
          label: "Hydro",
          color: GREEN,
          series: [
            { date: 2018, value: 9, certainty: true },
            { date: 2019, value: 11, certainty: true },
            { date: 2020, value: 13, certainty: true },
            { date: 2021, value: 15, certainty: true },
            { date: 2022, value: 18, certainty: true },
          ],
        },
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
        {
          label: "High",
          color: RED,
          series: [
            { date: 2019, valueMin: 6, valueMax: 12, certainty: true },
            { date: 2020, valueMin: 7, valueMax: 14, certainty: true },
            { date: 2021, valueMin: 8, valueMax: 17, certainty: true },
            { date: 2022, valueMin: 9, valueMax: 20, certainty: true },
          ],
        },
        {
          label: "Low",
          color: BLUE,
          series: [
            { date: 2019, valueMin: 2, valueMax: 5, certainty: true },
            { date: 2020, valueMin: 2, valueMax: 6, certainty: true },
            { date: 2021, valueMin: 3, valueMax: 7, certainty: true },
            { date: 2022, valueMin: 3, valueMax: 8, certainty: true },
          ],
        },
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
      // Thumbnail: blank the radial ring value labels (100/75/50/25) - they clutter
      // the tiny card; the shape reads on its own.
      radialLabelFormatter: () => "",
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
      // Thumbnail: keep dates flat (labels are hidden anyway) so no rotated-label
      // bottom margin is reserved and the bars fill the frame.
      xAxisMode: "horizontal",
      yAxisDomain: [0, 100],
      colors: [BLUE, GOLD, GREEN],
      dataSet: [
        {
          seriesKey: "W",
          seriesKeyAbbreviation: "",
          series: [
            { date: "2018", Services: 42, Industry: 25, Farming: 33 },
            { date: "2019", Services: 46, Industry: 25, Farming: 29 },
            { date: "2020", Services: 50, Industry: 24, Farming: 26 },
            { date: "2021", Services: 54, Industry: 24, Farming: 22 },
            { date: "2022", Services: 58, Industry: 23, Farming: 19 },
          ],
        },
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

  "treemap-chart": {
    mount: mountTreemapChart as Mount,
    props: {
      splitOpacity: 0.4,
      paddingInner: 2,
      dataSet: [
        { label: "A", value: 40, partial: 27, color: BLUE },
        { label: "B", value: 30, partial: 11, color: GOLD },
        { label: "C", value: 24, partial: 16, color: RED },
        { label: "D", value: 18, partial: 13, color: GREEN },
        { label: "E", value: 14, partial: 5, color: PLUM },
        { label: "F", value: 11, partial: 7, color: BLUE },
        { label: "G", value: 8, partial: 3, color: RED },
      ],
    } satisfies TreemapChartProps,
  },

  "pie-chart": {
    mount: mountPieChart as Mount,
    props: {
      innerRadiusRatio: 0.55,
      padAngle: 0.02,
      showLabels: false,
      dataSet: [
        { label: "A", value: 40, color: BLUE },
        { label: "B", value: 30, color: GOLD },
        { label: "C", value: 18, color: RED },
        { label: "D", value: 12, color: GREEN },
      ],
    } satisfies PieChartProps,
  },

  "bubble-chart": {
    mount: mountBubbleChart as Mount,
    props: {
      splitOpacity: 0.4,
      showLabels: false,
      dataSet: [
        { label: "A", value: 40, partial: 27, color: BLUE },
        { label: "B", value: 30, partial: 11, color: GOLD },
        { label: "C", value: 24, partial: 16, color: RED },
        { label: "D", value: 16, partial: 6, color: GREEN },
        { label: "E", value: 11, partial: 7, color: PLUM },
      ],
    } satisfies BubbleChartProps,
  },

  "sankey-chart": {
    mount: mountSankeyChart as Mount,
    props: {
      nodePadding: 8,
      nodeWidth: 10,
      showLabels: false,
      nodes: [
        { id: "A", color: BLUE },
        { id: "B", color: GOLD },
        { id: "M", color: RED },
        { id: "N", color: GREEN },
      ],
      links: [
        { source: "A", target: "M", value: 20 },
        { source: "A", target: "N", value: 10 },
        { source: "B", target: "M", value: 14 },
        { source: "B", target: "N", value: 18 },
      ],
    } satisfies SankeyChartProps,
  },

  "fountain-chart": {
    mount: mountFountainChart as Mount,
    props: {
      xAxisDataType: "band",
      frothLayers: 7,
      dataSet: [
        { label: "A", value: 28, spread: 8, color: GOLD },
        { label: "B", value: 20, spread: 4, color: BLUE },
        { label: "C", value: 15, spread: 7, color: RED },
      ],
    } satisfies FountainChartProps,
  },

  "fan-chart": {
    mount: mountFanChart as Mount,
    props: {
      xAxisDataType: "date_annual",
      fillOpacity: 0.28,
      dataSet: [
        {
          label: "Fc",
          color: BLUE,
          series: [
            { date: 2019, value: 10, certainty: true },
            { date: 2020, value: 14, certainty: true },
            { date: 2021, value: 17, certainty: true },
            { date: 2022, value: 21, certainty: true },
            { date: 2023, value: 25, certainty: false },
            { date: 2024, value: 29, certainty: false },
          ],
          bands: [
            {
              level: 0.95,
              series: [
                { date: 2022, valueMin: 21, valueMax: 21, valueMedium: 21 },
                { date: 2023, valueMin: 22, valueMax: 28, valueMedium: 25 },
                { date: 2024, valueMin: 23, valueMax: 35, valueMedium: 29 },
              ],
            },
            {
              level: 0.8,
              series: [
                { date: 2022, valueMin: 21, valueMax: 21, valueMedium: 21 },
                { date: 2023, valueMin: 23, valueMax: 27, valueMedium: 25 },
                { date: 2024, valueMin: 26, valueMax: 32, valueMedium: 29 },
              ],
            },
          ],
        },
      ],
    } satisfies FanChartProps,
  },

  "comparable-vertical-bar-chart": {
    mount: mountComparableVerticalBarChart as Mount,
    props: {
      // Pale tint behind + solid in front (the legacy-parity recipe): the
      // before/after overlap is the chart's signature, so the thumbnail keeps it.
      valueBasedOpacity: 1,
      valueComparedOpacity: 1,
      colorsBasedMapping: { A: "#f2dcaf", B: "#c5d9ee", C: "#c9e0d1", D: "#ddd0e7" },
      dataSet: [
        { label: "A", valueBased: 24, valueCompared: 33, color: GOLD },
        { label: "B", valueBased: 30, valueCompared: 25, color: BLUE },
        { label: "C", valueBased: 15, valueCompared: 27, color: GREEN },
        { label: "D", valueBased: 22, valueCompared: 35, color: PLUM },
      ],
    } satisfies ComparableVerticalBarChartProps,
  },

  "choropleth-map-chart": {
    mount: mountChoroplethMapChart as Mount,
    props: {
      geography: world,
      noDataColor: "#ece5d8",
      colorScale: {
        domain: [20, 45, 70],
        range: ["#f5e7c6", GOLD, RED, "#7c1f14"],
      },
      dataSet: [
        { id: "USA", label: "United States", value: 75 },
        { id: "CAN", label: "Canada", value: 30 },
        { id: "BRA", label: "Brazil", value: 50 },
        { id: "ARG", label: "Argentina", value: 25 },
        { id: "FRA", label: "France", value: 55 },
        { id: "DEU", label: "Germany", value: 72 },
        { id: "DZA", label: "Algeria", value: 18 },
        { id: "NGA", label: "Nigeria", value: 35 },
        { id: "ZAF", label: "South Africa", value: 48 },
        { id: "EGY", label: "Egypt", value: 22 },
        { id: "RUS", label: "Russia", value: 40 },
        { id: "IND", label: "India", value: 60 },
        { id: "CHN", label: "China", value: 78 },
        { id: "IDN", label: "Indonesia", value: 42 },
        { id: "AUS", label: "Australia", value: 52 },
      ],
    } satisfies ChoroplethMapChartProps,
  },

  "symbol-map-chart": {
    mount: mountSymbolMapChart as Mount,
    props: {
      showLabels: false,
      radiusRange: [1.5, 7],
      // The muted landmass is what makes the tiny card read as a MAP: without
      // geography the projection fits the points' own bounding box and the
      // de-overlap scatters them into an abstract cloud. Warm tint to sit on
      // the cream card body.
      geography: world,
      geographyColor: "#eadfc4",
      strokeColor: "#dbcda8",
      // precise: at thumbnail scale the force sim's charge overpowers the
      // position pull and blasts every dot to the boundary clamp (a ring, not
      // a map). True lng/lat + tiny radii read correctly.
      positionMode: "precise",
      dataSet: [
        { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 90, color: BLUE },
        { id: "can", label: "Canada", lng: -75.7, lat: 45.4, value: 30, color: RED },
        { id: "mex", label: "Mexico", lng: -99.1, lat: 19.4, value: 26, color: GOLD },
        { id: "col", label: "Colombia", lng: -74.1, lat: 4.7, value: 12, color: PLUM },
        { id: "per", label: "Peru", lng: -77.0, lat: -12.0, value: 10, color: BLUE },
        { id: "bra", label: "Brazil", lng: -47.9, lat: -15.8, value: 45, color: GREEN },
        { id: "arg", label: "Argentina", lng: -58.4, lat: -34.6, value: 16, color: GOLD },
        { id: "chl", label: "Chile", lng: -70.7, lat: -33.4, value: 12, color: RED },
        { id: "gbr", label: "United Kingdom", lng: -0.1, lat: 51.5, value: 40, color: RED },
        { id: "esp", label: "Spain", lng: -3.7, lat: 40.4, value: 22, color: PLUM },
        { id: "fra", label: "France", lng: 2.3, lat: 48.9, value: 36, color: BLUE },
        { id: "nld", label: "Netherlands", lng: 4.9, lat: 52.4, value: 28, color: GREEN },
        { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 55, color: GOLD },
        { id: "ita", label: "Italy", lng: 12.5, lat: 41.9, value: 26, color: GREEN },
        { id: "swe", label: "Sweden", lng: 18.1, lat: 59.3, value: 12, color: BLUE },
        { id: "pol", label: "Poland", lng: 21.0, lat: 52.2, value: 15, color: RED },
        { id: "tur", label: "Turkey", lng: 32.9, lat: 39.9, value: 14, color: GOLD },
        { id: "mar", label: "Morocco", lng: -6.8, lat: 34.0, value: 8, color: GREEN },
        { id: "egy", label: "Egypt", lng: 31.2, lat: 30.0, value: 9, color: BLUE },
        { id: "nga", label: "Nigeria", lng: 7.5, lat: 9.1, value: 10, color: RED },
        { id: "ken", label: "Kenya", lng: 36.8, lat: -1.3, value: 8, color: GOLD },
        { id: "zaf", label: "South Africa", lng: 28.2, lat: -25.7, value: 20, color: PLUM },
        { id: "sau", label: "Saudi Arabia", lng: 46.7, lat: 24.7, value: 16, color: GREEN },
        { id: "rus", label: "Russia", lng: 37.6, lat: 55.8, value: 20, color: PLUM },
        { id: "ind", label: "India", lng: 77.2, lat: 28.6, value: 60, color: GOLD },
        { id: "tha", label: "Thailand", lng: 100.5, lat: 13.8, value: 14, color: RED },
        { id: "sgp", label: "Singapore", lng: 103.8, lat: 1.4, value: 22, color: BLUE },
        { id: "idn", label: "Indonesia", lng: 106.8, lat: -6.2, value: 15, color: GOLD },
        { id: "chn", label: "China", lng: 116.4, lat: 39.9, value: 85, color: RED },
        { id: "kor", label: "South Korea", lng: 127.0, lat: 37.6, value: 26, color: GREEN },
        { id: "jpn", label: "Japan", lng: 139.7, lat: 35.7, value: 50, color: BLUE },
        { id: "aus", label: "Australia", lng: 151.2, lat: -33.9, value: 30, color: GREEN },
        { id: "nzl", label: "New Zealand", lng: 174.8, lat: -41.3, value: 8, color: PLUM },
      ],
    } satisfies SymbolMapChartProps,
  },

  "radial-tree-chart": {
    mount: mountRadialTreeChart as Mount,
    props: {
      // Labels off entirely: 12 leaves at 124px would be pure clutter.
      labelDensityThresholds: { hideAbove: 0 },
      dataSet: [
        {
          label: "Alpha",
          color: GOLD,
          children: [
            { label: "a1", value: 12, color: GOLD },
            { label: "a2", value: 7, color: GOLD },
            { label: "a3", value: 9, color: GOLD },
            { label: "a4", value: 5, color: GOLD },
          ],
        },
        {
          label: "Beta",
          color: BLUE,
          children: [
            { label: "b1", value: 15, color: BLUE },
            { label: "b2", value: 6, color: BLUE },
            { label: "b3", value: 11, color: BLUE },
            { label: "b4", value: 8, color: BLUE },
          ],
        },
        {
          label: "Gamma",
          color: GREEN,
          children: [
            { label: "g1", value: 10, color: GREEN },
            { label: "g2", value: 13, color: GREEN },
            { label: "g3", value: 4, color: GREEN },
            { label: "g4", value: 7, color: GREEN },
          ],
        },
      ],
    } satisfies RadialTreeChartProps,
  },
};
