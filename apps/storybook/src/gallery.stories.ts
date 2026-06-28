import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc";
import { renderElement } from "./render";

// One story per chart, driven straight off @michi-vz/examples so the gallery can
// never drift from the docs. Validates that the Storybook setup works for every
// element, not just the treemap.
const reg = examples as unknown as Record<
  string,
  Array<{ element: string; title: string; props: Record<string, unknown> }>
>;

const meta: Meta = { title: "Charts/Gallery" };
export default meta;

function fromExample(key: string): StoryObj {
  const ex = reg[key][0];
  return { name: ex.title, render: () => renderElement(ex.element, ex.props) };
}

export const Line = fromExample("line-chart");
export const Fan = fromExample("fan-chart");
export const Area = fromExample("area-chart");
export const Scatter = fromExample("scatter-chart");
export const Range = fromExample("range-chart");
export const Ribbon = fromExample("ribbon-chart");
export const Radar = fromExample("radar-chart");
export const VerticalStackBar = fromExample("vertical-stack-bar-chart");
export const ComparableBar = fromExample("comparable-horizontal-bar-chart");
export const DualBar = fromExample("dual-horizontal-bar-chart");
export const BarBell = fromExample("bar-bell-chart");
export const Gap = fromExample("gap-chart");
export const Treemap = fromExample("treemap-chart");
export const Pie = fromExample("pie-chart");
export const Bubble = fromExample("bubble-chart");
export const Sankey = fromExample("sankey-chart");
