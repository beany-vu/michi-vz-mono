// placeTooltip: the ONE tooltip placement every chart uses. jsdom has no layout,
// so the host rect and the tooltip size are simulated - including the browser's
// shrink-to-fit: an absolutely positioned box near the right edge is squeezed
// to the room left, which is why the width must be measured at left 0.
import { describe, it, expect, afterEach } from "vitest";
import { placeTooltip } from "../src/render/placeTooltip";
import { mountTreemapChart } from "../src/engine/treemapChart";

const NATURAL_W = 120;
const NATURAL_H = 50;

function setup(hostWidth = 400, hostHeight = 300, hostLeft = 0) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  host.getBoundingClientRect = () =>
    ({
      left: hostLeft,
      top: 0,
      width: hostWidth,
      height: hostHeight,
      right: hostLeft + hostWidth,
      bottom: hostHeight,
    }) as DOMRect;
  const tooltip = document.createElement("div");
  host.appendChild(tooltip);
  Object.defineProperty(tooltip, "offsetWidth", {
    configurable: true,
    // shrink-to-fit: never wider than the room between `left` and the host's right edge
    get: () => Math.max(0, Math.min(NATURAL_W, hostWidth - (parseFloat(tooltip.style.left) || 0))),
  });
  Object.defineProperty(tooltip, "offsetHeight", { configurable: true, get: () => NATURAL_H });
  return { host, tooltip };
}

const ev = (clientX: number, clientY: number) => new MouseEvent("mousemove", { clientX, clientY });

afterEach(() => {
  document.body.innerHTML = "";
  Object.defineProperty(document.documentElement, "clientWidth", { configurable: true, value: 0 });
});

describe("placeTooltip", () => {
  it("sits right of the cursor when it fits", () => {
    const { host, tooltip } = setup();
    placeTooltip(host, tooltip, ev(100, 100));
    expect(tooltip.style.left).toBe("110px");
    expect(tooltip.style.top).toBe("90px");
  });

  it("flips left at the right edge using the NATURAL width, not a squeezed one", () => {
    const { host, tooltip } = setup();
    tooltip.style.left = "395px"; // left over from the previous hover, near the edge
    placeTooltip(host, tooltip, ev(390, 100));
    expect(tooltip.style.left).toBe(`${390 - NATURAL_W - 10}px`);
  });

  it("also flips at the right edge of the window when the chart is wider than the view", () => {
    const { host, tooltip } = setup(400);
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 300,
    });
    placeTooltip(host, tooltip, ev(250, 100));
    expect(tooltip.style.left).toBe(`${250 - NATURAL_W - 10}px`);
  });

  it("never goes past the left edge", () => {
    const { host, tooltip } = setup(150);
    placeTooltip(host, tooltip, ev(100, 100));
    expect(tooltip.style.left).toBe("0px");
  });

  it('"above" puts it above the cursor, and below when that clips the top', () => {
    const { host, tooltip } = setup();
    placeTooltip(host, tooltip, ev(100, 100), 10, "above");
    expect(tooltip.style.top).toBe(`${100 - NATURAL_H - 10}px`);
    placeTooltip(host, tooltip, ev(100, 20), 10, "above");
    expect(tooltip.style.top).toBe("30px");
  });

  it("keeps the tooltip inside the host vertically", () => {
    const { host, tooltip } = setup(400, 300);
    placeTooltip(host, tooltip, ev(100, 290));
    expect(tooltip.style.top).toBe(`${300 - NATURAL_H}px`);
  });
});

describe("treemap tooltip near the right edge (uses placeTooltip)", () => {
  it("flips left instead of overflowing", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    host.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 300, right: 600, bottom: 300 }) as DOMRect;
    const chart = mountTreemapChart(host, {
      width: 600,
      height: 300,
      dataSet: [
        { label: "Alpha", value: 30 },
        { label: "Beta", value: 20 },
      ],
    });
    const tooltip = host.querySelector<HTMLElement>(".tooltip")!;
    Object.defineProperty(tooltip, "offsetWidth", {
      configurable: true,
      get: () => Math.max(0, Math.min(NATURAL_W, 600 - (parseFloat(tooltip.style.left) || 0))),
    });
    Object.defineProperty(tooltip, "offsetHeight", { configurable: true, get: () => NATURAL_H });
    const tiles = host.querySelectorAll("rect.tile");
    const right = tiles[tiles.length - 1];
    right.dispatchEvent(
      new MouseEvent("mouseenter", { clientX: 590, clientY: 150, bubbles: true }),
    );
    right.dispatchEvent(new MouseEvent("mousemove", { clientX: 590, clientY: 150, bubbles: true }));
    const left = parseFloat(tooltip.style.left);
    expect(left + NATURAL_W).toBeLessThanOrEqual(600);
    chart.destroy();
  });
});
