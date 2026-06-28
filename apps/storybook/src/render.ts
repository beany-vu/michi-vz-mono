// Shared story renderer: build a <michi-vz-*> element from engine-style args.
// Mirrors the docs ChartDemo adapter (title -> chartTitle), so stories stay DRY
// against @michi-vz/examples.
export function renderElement(tag: string, args: Record<string, unknown>): HTMLElement {
  const el = document.createElement(tag) as HTMLElement & Record<string, unknown>;
  const { title, ...rest } = args as { title?: string } & Record<string, unknown>;
  if (title) el.chartTitle = title;
  Object.assign(el, rest);
  el.style.display = "block";
  return el;
}
