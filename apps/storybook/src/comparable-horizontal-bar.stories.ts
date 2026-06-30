import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/comparable-horizontal-bar-chart";
import { renderElement } from "./render";

const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const base = reg["comparable-horizontal-bar-chart"][0].props; // 7 economies, two periods

const meta: Meta = {
  title: "Charts/ComparableHorizontalBar",
  render: (args) => renderElement("michi-vz-comparable-horizontal-bar-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    maxBarHeight: { control: { type: "range", min: 8, max: 80, step: 2 } },
    symmetricXDomain: { control: "boolean" },
    width: { control: { type: "range", min: 320, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 200, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Two values per row (value-based vs value-compared) for seven economies. */
export const Default: Story = {
  args: { ...base, width: 760, height: 460, renderer: "svg" },
};

// A 2-row result: without a cap the band bandwidth balloons into giant blocks.
const fewRows = {
  title: "Two rows: bars capped so they don't balloon",
  dataSet: [
    { label: "Intra-regional", valueBased: 420, valueCompared: 560, color: "#c0392b" },
    { label: "Extra-regional", valueBased: 310, valueCompared: 390, color: "#2c6fbb" },
  ],
};

/**
 * `maxBarHeight` caps bar thickness so a 1-2 row result doesn't expand into giant
 * blocks: the band range shrinks to yield exactly that thickness and is centred in
 * the plot (symmetric whitespace). No-op for dense charts. Band *padding* can't do
 * this — the band step (hence label spacing) is fixed by height/count.
 */
export const MaxBarHeight: Story = {
  args: { ...fewRows, maxBarHeight: 28, width: 760, height: 420, renderer: "svg" },
};

// Asymmetric +/- magnitudes: the negative side is much smaller than the positive.
const signed = {
  title: "Trade balance: zero centred via symmetricXDomain",
  dataSet: [
    { label: "Machinery", valueBased: -40, valueCompared: 120, color: "#c0392b" },
    { label: "Textiles", valueBased: 30, valueCompared: -15, color: "#2c6fbb" },
    { label: "Agriculture", valueBased: -8, valueCompared: 55, color: "#1f8a4c" },
  ],
};

/**
 * `symmetricXDomain` forces `[-M, M]`, M = max(|min|, |max|), so 0 sits dead-centre
 * and the ± sides mirror. Wins over xAxisDomain / xAxisPredefinedDomain. The
 * smaller-magnitude side then shows empty axis — inherent to symmetric, not a bug.
 */
export const SymmetricXDomain: Story = {
  args: { ...signed, symmetricXDomain: true, width: 760, height: 420, renderer: "svg" },
};

/** Canvas renderer — same two-period comparison, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...base, width: 760, height: 460, renderer: "canvas" },
};
