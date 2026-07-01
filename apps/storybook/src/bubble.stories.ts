import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/bubble-chart";
import { renderElement } from "./render";

// Export potential by market (realized vs untapped) - the docs demo data.
const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const split = reg["bubble-chart"][0].props; // realized/untapped split
const plain = reg["bubble-chart"][1].props; // single-fill cloud

const meta: Meta = {
  title: "Charts/Bubble",
  render: (args) => renderElement("michi-vz-bubble-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    gravity: { control: { type: "range", min: 0.01, max: 0.4, step: 0.01 } },
    padding: { control: { type: "range", min: 0, max: 12, step: 1 } },
    fillRatio: { control: { type: "range", min: 0.2, max: 0.95, step: 0.05 } },
    showSplit: { control: "boolean" },
    showLegend: { control: "boolean" },
    showLabels: { control: "boolean" },
    splitOpacity: { control: { type: "range", min: 0.1, max: 1, step: 0.05 } },
    width: { control: { type: "range", min: 320, max: 1000, step: 20 } },
    height: { control: { type: "range", min: 320, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Gravity-clustered bubbles with a realized/untapped split. */
export const RealizedVsUntapped: Story = {
  args: { ...split, width: 720, height: 520, renderer: "svg" },
};

/** Single-fill bubbles (no split) sized by value. */
export const PlainCloud: Story = {
  args: { ...plain, width: 720, height: 520, renderer: "svg" },
};

/** Canvas renderer - same settled layout, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...split, width: 720, height: 520, renderer: "canvas" },
};

/** Tighter cluster: crank up gravity. */
export const TightCluster: Story = {
  args: { ...split, width: 720, height: 520, gravity: 0.25, renderer: "svg" },
};
