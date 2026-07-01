import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/area-chart";
import { renderElement } from "./render";

const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const stacked = reg["area-chart"][0].props; // stacked composition example

// Sparse monthly area data (Jan 2022 - Dec 2023) with 2022-04/05/09 + 2023-02/03 MISSING,
// so the fillPeriodTicks story has real gaps to reveal as faded no-data ticks.
const monthsPresent = [
  "2022-01", "2022-02", "2022-03", "2022-06", "2022-07", "2022-08",
  "2022-10", "2022-11", "2022-12", "2023-01", "2023-04", "2023-05",
  "2023-06", "2023-07", "2023-08", "2023-09", "2023-10", "2023-11", "2023-12",
];
const keys = ["Raw", "Semi-processed", "Processed"];
const sparseMonthly = {
  series: monthsPresent.map((date, i) => ({
    date,
    Raw: 20 + Math.round(Math.sin(i / 3) * 8),
    "Semi-processed": 30 + Math.round(Math.cos(i / 2) * 6),
    Processed: 50 + Math.round(Math.sin(i / 4) * 5),
  })),
  keys,
  xAxisDataType: "date_monthly",
  colorsMapping: { Raw: "#2c6fbb", "Semi-processed": "#e07b39", Processed: "#3aa757" },
  noDataTickTooltip: () => "No data reported for this month",
};

const meta: Meta = {
  title: "Charts/Area",
  render: (args) => renderElement("michi-vz-area-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    xAxisDataType: { control: "inline-radio", options: ["date_annual", "date_monthly", "number"] },
    fillPeriodTicks: { control: "boolean" },
    isLoading: { control: "boolean" },
    width: { control: { type: "range", min: 320, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 280, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Stacked composition over time (the default area example). */
export const Default: Story = {
  args: { ...stacked, width: 820, height: 480, renderer: "svg" },
};

/**
 * fillPeriodTicks - a tick for EVERY month; the missing months (2022-04/05/09, 2023-02/03)
 * render faded with a "No data reported" hover tooltip, first + last always kept. Toggle
 * `fillPeriodTicks` in Controls to compare against the data-only axis.
 */
export const FillPeriodTicks: Story = {
  args: { ...sparseMonthly, width: 900, height: 420, renderer: "svg", fillPeriodTicks: true },
};
