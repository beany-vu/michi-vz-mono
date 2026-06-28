import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/vertical-stack-bar-chart";
import { renderElement } from "./render";

const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const single = reg["vertical-stack-bar-chart"][0].props; // one stacked bar per year
const grouped = reg["vertical-stack-bar-chart"][1].props; // two grouped stacked bars per year

const meta: Meta = {
  title: "Charts/VerticalStackBar",
  render: (args) => renderElement("michi-vz-vertical-stack-bar-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    keysOrder: { control: "inline-radio", options: ["bottomToTop", "topToBottom"] },
    width: { control: { type: "range", min: 320, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 280, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** One stacked bar per year (single series): composition over time. */
export const Single: Story = {
  args: { ...single, width: 760, height: 460, renderer: "svg" },
};

/** Grouped + stacked: two series per year sit side by side, each stacked. */
export const GroupedStacked: Story = {
  args: { ...grouped, width: 820, height: 480, renderer: "svg" },
};

/** Canvas renderer — same grouped layout, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...grouped, width: 820, height: 480, renderer: "canvas" },
};
