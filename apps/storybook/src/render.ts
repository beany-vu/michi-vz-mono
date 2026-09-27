// Shared story renderer: build a <michi-vz-*> element from engine-style args.
// Mirrors the docs ChartDemo adapter (title -> chartTitle), so stories stay DRY
// against @michi-vz/examples.
export function renderElement(tag: string, args: Record<string, unknown>): HTMLElement {
  const el = document.createElement(tag) as HTMLElement & Record<string, unknown>;
  const { title, style, ...rest } = args as { title?: string; style?: unknown } & Record<
    string,
    unknown
  >;
  if (title) el.chartTitle = title;
  // `style` would land on HTMLElement.style (the element's inline CSS), not on the chart
  // (audit fountain #1): forward the fountain's deprecated `style` as `fountainStyle`
  // while the element still declares it, so the chart reports it as ignored.
  if (style !== undefined && "fountainStyle" in el) el.fountainStyle = style;
  Object.assign(el, rest);
  el.style.display = "block";
  return el;
}
