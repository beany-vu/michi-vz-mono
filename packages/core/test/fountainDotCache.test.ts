// The small dots are packed once per jet and reused while nothing that places them
// changes: a highlight-only update (the usual onHighlightItem -> highlightItems echo
// on every hover) or a hover must not re-pack every bell.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/fountainChart/geometry", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/fountainChart/geometry")>();
  return { ...mod, packFountainDots: vi.fn(mod.packFountainDots) };
});

import { packFountainDots } from "../src/fountainChart/geometry";
import { mountFountainChart } from "../src/engine/fountainChart";
import type { FountainChartProps, FountainDataItem } from "../src/types";

const pack = vi.mocked(packFountainDots);

const car: FountainDataItem = {
  label: "Car",
  value: 30,
  low: 22,
  high: 55,
  samples: [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48],
};
const train: FountainDataItem = {
  label: "Train",
  value: 35,
  low: 32,
  high: 42,
  samples: [34, 35, 33, 36, 42, 35, 34, 37, 35, 32, 36, 34, 38, 35, 33, 40, 36, 34, 37, 35],
};

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of hosts.splice(0)) h.remove();
  pack.mockClear();
});

function mount(props: Partial<FountainChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  const base: FountainChartProps = { dataSet: [car, train], width: 700, height: 460 };
  const chart = mountFountainChart(host, { ...base, ...props });
  return { host, chart, base: { ...base, ...props } };
}

const dotsOf = (host: HTMLElement): string[] =>
  Array.from(host.querySelectorAll("circle.mv-fountain-dot")).map(
    (c) => `${c.getAttribute("cx")},${c.getAttribute("cy")}`,
  );

describe("fountain: packed dots are reused between renders", () => {
  it("a highlightItems-only update does not pack again, and draws the same dots", () => {
    const { host, chart, base } = mount();
    expect(pack).toHaveBeenCalledTimes(2);
    const before = dotsOf(host);
    chart.update({ ...base, highlightItems: ["Car"] });
    chart.update({ ...base, highlightItems: ["Train"] });
    chart.update({ ...base, highlightItems: [] });
    expect(pack).toHaveBeenCalledTimes(2);
    expect(dotsOf(host)).toEqual(before);
    chart.destroy();
  });

  it("hovering does not pack again", () => {
    const { host, chart } = mount({ renderer: "canvas" });
    expect(pack).toHaveBeenCalledTimes(2);
    for (let x = 0; x < 700; x += 25) {
      host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: 200, bubbles: true }));
    }
    expect(pack).toHaveBeenCalledTimes(2);
    chart.destroy();
  });

  it("packs again when the samples, the size or the look change", () => {
    const { chart, base } = mount();
    expect(pack).toHaveBeenCalledTimes(2);
    // New samples for one jet: only that jet re-packs.
    chart.update({ ...base, dataSet: [car, { ...train, samples: [...train.samples, 41] }] });
    expect(pack).toHaveBeenCalledTimes(3);
    // A new size moves every bell.
    chart.update({ ...base, width: 640 });
    expect(pack).toHaveBeenCalledTimes(5);
    // drift changes every row.
    chart.update({ ...base, width: 640, drift: true });
    expect(pack).toHaveBeenCalledTimes(7);
    chart.destroy();
  });
});
