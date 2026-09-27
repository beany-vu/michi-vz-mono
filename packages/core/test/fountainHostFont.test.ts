import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { fountainHostMeasure } from "../src/fountainChart/measure";
import type { FountainChartProps, FountainDataItem } from "../src/types";

// The words around a fountain (value labels, reference labels, the y title, the x
// labels) are laid out in the page's font, not in a stand-in: a page font wider than
// "12px sans-serif" pushed the reference label past the SVG's right edge (it rendered
// 12 px outside a 520 px chart in the playground).
//
// jsdom has no 2D canvas, so every canvas here gets a fake context whose text is a fixed
// width per character for its font: "Wide" 0.9 em, "Narrow" 0.3 em, anything else
// (sans-serif) 0.5 em; bold 10 % wider. Each canvas has its own context, as in a browser.
// Without a canvas (plain jsdom) the measure is measureLabelWidth's 7 px per character
// stand-in, which every other fountain suite runs on.

function perChar(font: string): number {
  const px = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 10);
  const em = /Wide/.test(font) ? 0.9 : /Narrow/.test(font) ? 0.3 : 0.5;
  return px * em * (/bold/.test(font) ? 1.1 : 1);
}
function fakeContext(): CanvasRenderingContext2D {
  const ctx = {
    font: "10px sans-serif",
    measureText(text: string) {
      return { width: text.length * perChar(ctx.font) } as TextMetrics;
    },
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

beforeAll(() => {
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement,
  ) {
    if (!contexts.has(this)) contexts.set(this, fakeContext());
    return contexts.get(this)!;
  } as unknown as HTMLCanvasElement["getContext"]);
});
afterAll(() => {
  vi.restoreAllMocks();
});

const mounted: Array<{ host: HTMLElement; destroy(): void }> = [];
afterEach(() => {
  for (const m of mounted.splice(0)) {
    m.destroy();
    m.host.remove();
  }
});

function mountIn(
  font: string,
  props: Partial<FountainChartProps> & { dataSet: FountainDataItem[] },
) {
  const host = document.createElement("div");
  host.style.fontFamily = font;
  host.style.fontSize = "12px";
  document.body.appendChild(host);
  const chart = mountFountainChart(host, { width: 520, height: 400, ...props });
  mounted.push({ host, destroy: () => chart.destroy() });
  return host;
}

describe("fountainHostMeasure", () => {
  it("measures in the element's own font family and size, bold as bold", () => {
    const el = document.createElement("div");
    el.style.fontFamily = "Wide";
    el.style.fontSize = "20px";
    document.body.appendChild(el);
    const m = fountainHostMeasure(el);
    expect(m.regular("abcd")).toBeCloseTo(4 * 20 * 0.9);
    expect(m.bold?.("abcd")).toBeCloseTo(4 * 20 * 0.9 * 1.1);
    expect(m.regular("")).toBe(0);
    el.remove();
  });

  it("falls back to 12 px sans-serif when the element has no usable font", () => {
    const el = document.createElement("div");
    const m = fountainHostMeasure(el);
    expect(m.regular("abcd")).toBeCloseTo(4 * 12 * 0.5);
  });
});

describe("the fountain lays out its words in the page's font", () => {
  const car: FountainDataItem = {
    label: "Car",
    value: 30,
    low: 22,
    high: 55,
    samples: [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48],
  };
  const bus: FountainDataItem = { label: "Bus", value: 40, low: 32, high: 65 };

  it("the reference label stays inside the SVG when the page font is wider", () => {
    const host = mountIn("Wide", {
      dataSet: [car, bus],
      referenceLines: [{ value: 45, label: "Time I allow: 45 min", goodSide: "below" }],
    });
    const label = host.querySelector("text.mv-fountain-reference-label")!;
    const spans = Array.from(label.querySelectorAll("tspan"));
    expect(spans.length).toBeGreaterThan(0);
    // 11 px text in the page font; the first line is bold.
    const right = Math.max(
      ...spans.map(
        (s) =>
          Number(s.getAttribute("x")) +
          (s.textContent ?? "").length *
            11 *
            0.9 *
            (s.getAttribute("font-weight") === "bold" ? 1.1 : 1),
      ),
    );
    expect(right).toBeLessThanOrEqual(520);
  });

  it("trend x labels: the axis tilts only when the layout planned it (value labels kept)", () => {
    // Six one-word labels 44 px wide in "Narrow" but 66 px in sans-serif, in 50 px
    // columns: flat in the page's font, so the value labels stay and nothing tilts.
    const dataSet = [2001, 2002, 2003, 2004, 2005, 2006].map((d) => ({
      label: "Swim",
      date: d,
      value: 40,
      low: 38,
      high: 44,
    }));
    const host = mountIn("Narrow", {
      dataSet,
      width: 400,
      xAxisDataType: "number",
      xAxisFormat: (d) => `P-${d}-xyzw`,
    });
    const xLabels = Array.from(host.querySelectorAll("g.mv-x-axis text.mv-axis-label"));
    expect(xLabels.length).toBe(6);
    expect(xLabels.some((l) => (l.getAttribute("transform") ?? "").includes("rotate"))).toBe(false);
    expect(host.querySelectorAll("g.mv-fountain-value-label").length).toBe(6);
  });
});

describe("a web font that is still loading", () => {
  it("lays the words out again once the page's fonts are ready", async () => {
    let done!: () => void;
    const ready = new Promise<void>((r) => (done = r));
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { status: "loading", ready },
    });
    try {
      const host = mountIn("Wide", {
        dataSet: [{ label: "Car", value: 30, low: 22, high: 55 }],
        referenceLines: [{ value: 45, label: "Time I allow: 45 min" }],
      });
      const first = host.querySelector("text.mv-fountain-reference-label")!;
      expect(first.isConnected).toBe(true);
      done();
      await ready;
      await Promise.resolve();
      // Redrawn with the loaded font's metrics: the old label node is gone.
      expect(first.isConnected).toBe(false);
      expect(host.querySelector("text.mv-fountain-reference-label")).not.toBeNull();
    } finally {
      delete (document as unknown as { fonts?: unknown }).fonts;
    }
  });

  it("a chart destroyed before the fonts load does not redraw", async () => {
    let done!: () => void;
    const ready = new Promise<void>((r) => (done = r));
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { status: "loading", ready },
    });
    try {
      const host = document.createElement("div");
      document.body.appendChild(host);
      const chart = mountFountainChart(host, { dataSet: [{ label: "Car", value: 30 }] });
      chart.destroy();
      done();
      await ready;
      await Promise.resolve();
      expect(host.children.length).toBe(0);
      host.remove();
    } finally {
      delete (document as unknown as { fonts?: unknown }).fonts;
    }
  });
});
