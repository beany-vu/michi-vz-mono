import { describe, it, expect, vi, afterEach } from "vitest";
import { mountScatterChart } from "../src/engine/scatterChart";
import type { ScatterChartProps, ScatterDataPoint } from "../src/types";

// Integration: the scatter dScaleLegend is draggable, and its drag attaches document
// pointer listeners. destroy()/re-render MUST tear those down (leak regression guard),
// while the drag-to-move feature keeps working. jsdom simulates pointer events with
// MouseEvent (the handlers only read clientX/clientY + stopPropagation/preventDefault).

const dataSet: ScatterDataPoint[] = [
  { label: "A", x: 1, y: 2, d: 5 },
  { label: "B", x: 3, y: 6, d: 10 },
  { label: "C", x: 5, y: 10, d: 2 },
];

function baseProps(extra: Partial<ScatterChartProps> = {}): ScatterChartProps {
  return {
    dataSet,
    title: "Demo",
    width: 600,
    height: 300,
    xAxisDataType: "number",
    dScaleLegend: { title: "Size" },
    ...extra,
  } as ScatterChartProps;
}

function mount(extra: Partial<ScatterChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountScatterChart(host, baseProps(extra));
  return { host, chart };
}

// The draggable legend group is the <g> the draggable marked with cursor:grab.
function findDraggable(host: HTMLElement): SVGGElement {
  const g = [...host.querySelectorAll<SVGGElement>("g")].find((el) => el.style.cursor === "grab");
  if (!g) throw new Error("draggable dScaleLegend group not found (cursor:grab)");
  return g;
}

function spyDocPointer() {
  const add = vi.spyOn(document, "addEventListener");
  const rm = vi.spyOn(document, "removeEventListener");
  const isPointer = (c: unknown[]): boolean => c[0] === "pointermove" || c[0] === "pointerup";
  return {
    net: (): number =>
      add.mock.calls.filter(isPointer).length - rm.mock.calls.filter(isPointer).length,
    added: (): number => add.mock.calls.filter(isPointer).length,
    restore: (): void => {
      add.mockRestore();
      rm.mockRestore();
    },
  };
}

const downOn = (el: Element, x = 10, y = 10): boolean =>
  el.dispatchEvent(new MouseEvent("pointerdown", { clientX: x, clientY: y, bubbles: true }));

afterEach(() => {
  document.dispatchEvent(new MouseEvent("pointerup")); // clear any dangling drag
  document.body.innerHTML = "";
});

describe("scatter dScaleLegend draggable lifecycle (jsdom)", () => {
  it("renders a draggable legend group when dScaleLegend is set", () => {
    const { host } = mount();
    expect(() => findDraggable(host)).not.toThrow();
  });

  it("dragging the legend moves it (feature preserved)", () => {
    const { host } = mount();
    const legend = findDraggable(host);
    downOn(legend, 0, 0);
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 20, clientY: 30 }));
    expect(legend.style.transform).toContain("translate(20px, 30px)");
    document.dispatchEvent(new MouseEvent("pointerup"));
  });

  it("mount + destroy without a drag attaches no document pointer listeners", () => {
    const spy = spyDocPointer();
    const { chart } = mount();
    chart.destroy();
    // No drag started, so the draggable must never attach document listeners (the
    // group-level pointerdown listener is torn down with the cleared host DOM). A
    // positive net would mean a leak; destroy's defensive detach can only lower it.
    expect(spy.added()).toBe(0);
    expect(spy.net()).toBeLessThanOrEqual(0);
    spy.restore();
  });

  it("destroy() WHILE dragging removes the document pointer listeners (leak regression)", () => {
    const { host, chart } = mount();
    const legend = findDraggable(host);
    const spy = spyDocPointer();
    downOn(legend); // start dragging -> document listeners attached
    expect(spy.added()).toBeGreaterThanOrEqual(2);
    chart.destroy();
    expect(spy.net()).toBe(0); // destroy tore them down
    spy.restore();
  });

  it("re-render WHILE dragging does not accumulate document pointer listeners", () => {
    const { host, chart } = mount();
    const spy = spyDocPointer();
    downOn(findDraggable(host)); // drag in progress -> +2 document listeners
    chart.update(baseProps({ title: "Demo 2" })); // recreates the legend group
    // the prior drag's document listeners must be detached by the re-render, not left
    // dangling on the old (now-detached) group.
    expect(spy.net()).toBe(0);
    chart.destroy();
    spy.restore();
  });

  it("destroy() is idempotent", () => {
    const { chart } = mount();
    chart.destroy();
    expect(() => chart.destroy()).not.toThrow();
  });
});
