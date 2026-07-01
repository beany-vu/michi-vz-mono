import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/line-chart";
import { renderElement } from "./render";

const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const renewable = reg["line-chart"][0].props; // four series, annual 2012-2024
const gaps = reg["line-chart"][1].props; // two series with a reporting gap

const meta: Meta = {
  title: "Charts/Line",
  render: (args) => renderElement("michi-vz-line-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    xAxisDataType: { control: "inline-radio", options: ["date_annual", "date_monthly", "number"] },
    showDataPoints: { control: "boolean" },
    showGridLines: { control: "boolean" },
    showVerticalGridLines: { control: "boolean" },
    highlightZeroLine: { control: "boolean" },
    isLoading: { control: "boolean" },
    yTicks: { control: { type: "range", min: 2, max: 20, step: 1 } },
    width: { control: { type: "range", min: 320, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 280, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Four-series annual line chart: renewable electricity share (%) 2012-2024, markers on. */
export const Default: Story = {
  args: { ...renewable, width: 820, height: 480, renderer: "svg", showDataPoints: true },
};

/** isLoading=true - the engine shows its loading overlay and skips axes/marks. */
export const Loading: Story = {
  args: { ...renewable, width: 820, height: 480, renderer: "svg", isLoading: true },
};

/** isNodata=true - the engine shows the no-data overlay (default text unless noDataLabel is set). */
export const NoData: Story = {
  args: {
    ...renewable,
    width: 820,
    height: 480,
    renderer: "svg",
    isNodata: true,
    noDataLabel: "No data available for the selected filters",
  },
};

/** showGridLines:false - horizontal dashed grid lines suppressed; zero line still solid. */
export const NoGridlines: Story = {
  args: {
    ...renewable,
    width: 820,
    height: 480,
    renderer: "svg",
    showDataPoints: true,
    showGridLines: false,
  },
};

/** showVerticalGridLines:true - vertical dashed grid lines at each x tick (off by default). */
export const WithVerticalGrid: Story = {
  args: {
    ...renewable,
    width: 820,
    height: 480,
    renderer: "svg",
    showDataPoints: true,
    showVerticalGridLines: true,
  },
};

/** fontFamily - axis tick and title text rendered in a custom system font stack. */
export const CustomFont: Story = {
  args: {
    ...renewable,
    width: 820,
    height: 480,
    renderer: "svg",
    showDataPoints: true,
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
};

/** detectGaps - Brazil skips 2021-2022; the gap segment auto-dashes while Spain stays solid. */
export const Gaps: Story = {
  args: { ...gaps, width: 820, height: 420, renderer: "svg", showDataPoints: true },
};

/** Canvas renderer - same four-series data painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...renewable, width: 820, height: 480, renderer: "canvas", showDataPoints: true },
};
