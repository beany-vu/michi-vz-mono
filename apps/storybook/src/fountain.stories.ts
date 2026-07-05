import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/fountain-chart";
import { renderElement } from "./render";

// Docs demo data: SaaS snapshot (0), forecast trend (3), and the field-guide reads.
const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const snapshot = reg["fountain-chart"][0].props;
const trend = reg["fountain-chart"][3].props;
const certainty = reg["fountain-chart"][6].props;
const latency = reg["fountain-chart"][7].props;
const skew = reg["fountain-chart"][11].props;
const storm = reg["fountain-chart"][12].props;

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

/** Same apex, three plumes: the "same number, three certainties" field-guide read. */
export const Certainty: Story = {
  args: { ...certainty, width: 820, height: 500, renderer: "svg" },
};

/** Level x stability 2x2: two latency pairs split by their plumes. */
export const Latency: Story = {
  args: { ...latency, width: 820, height: 500, renderer: "svg" },
};

/** Symmetry as meaning: lean 0 stands upright, a leaning crown flags one-sided risk. */
export const Skew: Story = {
  args: { ...skew, width: 820, height: 500, renderer: "svg" },
};

/** Literal lean: typhoons over the Philippines, crowns bent along each storm's track. */
export const Storm: Story = {
  args: { ...storm, width: 820, height: 500, renderer: "svg" },
};
