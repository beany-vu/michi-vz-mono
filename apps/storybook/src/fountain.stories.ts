import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/fountain-chart";
import { renderElement } from "./render";

// Famous fountain snapshot + forecast trend - the docs demo data.
const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const snapshot = reg["fountain-chart"][0].props;
const trend = reg["fountain-chart"][1].props;

const meta: Meta = {
  title: "Charts/Fountain",
  render: (args) => renderElement("michi-vz-fountain-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    xAxisDataType: { control: "inline-radio", options: ["band", "date_annual", "date_monthly", "number"] },
    frothLayers: { control: { type: "range", min: 1, max: 20, step: 1 } },
    bloomExponent: { control: { type: "range", min: 1, max: 8, step: 0.5 } },
    showDroplets: { control: "boolean" },
    showMist: { control: "boolean" },
    showTrendLine: { control: "boolean" },
    width: { control: { type: "range", min: 360, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 320, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Snapshot mode: world-famous fountains compared by jet height; plume = wind sway. */
export const Snapshot: Story = {
  args: { ...snapshot, width: 820, height: 500, renderer: "svg" },
};

/** Trend mode: rising apex heights trace a trend; dashed jets are forecast. */
export const Trend: Story = {
  args: { ...trend, width: 820, height: 500, renderer: "svg" },
};

/** Canvas renderer - same jets, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...snapshot, width: 820, height: 500, renderer: "canvas" },
};

/** Tighter column, more dramatic crown (bloomExponent cranked up). */
export const TightColumn: Story = {
  args: { ...snapshot, width: 820, height: 500, bloomExponent: 6, renderer: "svg" },
};

/** No droplets, no mist - minimal look. */
export const Minimal: Story = {
  args: { ...snapshot, width: 820, height: 500, showDroplets: false, showMist: false, renderer: "svg" },
};
