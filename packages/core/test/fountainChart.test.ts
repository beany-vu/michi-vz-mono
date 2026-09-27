import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { buildJetPath, buildFrothSlices } from "../src/fountainChart/legacyGeometry";
import { enableDevtools, type DevtoolsHitEvent } from "../src/devtools/hook";
import { __resetGPUDeviceForTest } from "../src/webgpu/device";
import { sanitizeForClassName } from "../src/math/sanitize";
import * as core from "../src/index";
import { examples } from "../../examples/src/index";
import type {
  ChartContext,
  DataWarning,
  FountainChartContext,
  FountainChartProps,
  FountainDataItem,
  FountainTooltipJet,
  Margin,
} from "../src/types";

// The engine (jsdom). Pure layers have their own files (fountainData, fountainGeometry,
// fountainPack, fountainScales, fountainColors, fountainLabels, fountainLayout,
// fountainRenderModel, fountainHitTest, fountainWarnings, fountainRenderers).
// jsdom rects are all zero, so a pointer's clientX / clientY are model pixels.

interface G {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: unknown;
}
const g = globalThis as unknown as G;
const examplesFountain = examples["fountain-chart"];

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
const bus: FountainDataItem = {
  label: "Bus",
  value: 40,
  low: 32,
  high: 65,
  samples: [38, 44, 36, 40, 65, 52, 39, 58, 35, 40, 32, 61, 37, 47, 40, 54, 34, 51, 38, 57],
};
const commute = [car, train, bus];
const allow = {
  value: 45,
  label: "Time I allow: 45 min",
  goodSide: "below" as const,
  countLabel: "within 45 min",
};
const commuteProps: Partial<FountainChartProps> = {
  referenceLines: [allow],
  endLabels: ["best", "worst"],
  sampleWord: "days",
  yAxisTitle: "minutes (higher = slower)",
};

const mounted: Array<{ host: HTMLElement; chart: { destroy(): void } }> = [];

function mount(data: FountainDataItem[], extra: Partial<FountainChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(host, {
    dataSet: data,
    title: "Demo",
    width: 700,
    height: 460,
    ...extra,
  });
  mounted.push({ host, chart });
  return { host, chart };
}

afterEach(() => {
  for (const m of mounted.splice(0)) {
    m.chart.destroy();
    m.host.remove();
  }
});

const fountainCtx = (c: ChartContext | null): FountainChartContext => {
  expect(c?.chartType).toBe("fountain-chart");
  return c as FountainChartContext;
};

const num = (el: Element, a: string): number => Number(el.getAttribute(a));

/** The y scale the axis shows, read back from two tick labels. */
function yScaleOf(host: HTMLElement): (v: number) => number {
  const ticks = Array.from(host.querySelectorAll("g.mv-y-axis text.mv-axis-label")).map((t) => ({
    v: Number((t.textContent ?? "").replace(/[^\d.-]/g, "")),
    y: num(t, "y"),
  }));
  const [a, b] = [ticks[0], ticks[ticks.length - 1]];
  return (v) => a.y + ((v - a.v) * (b.y - a.y)) / (b.v - a.v);
}

const pathPoints = (d: string): Array<[number, number]> =>
  [...d.matchAll(/[ML]\s*(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

function move(host: HTMLElement, x: number, y: number): void {
  host.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
}
function click(host: HTMLElement, x: number, y: number): void {
  host.dispatchEvent(new MouseEvent("click", { clientX: x, clientY: y, bubbles: true }));
}
const tooltipOf = (host: HTMLElement) => host.querySelector<HTMLElement>(".tooltip")!;
const bigDots = (host: HTMLElement) =>
  Array.from(host.querySelectorAll("circle.mv-fountain-value")).map((c) => ({
    label: c.getAttribute("data-label")!,
    x: num(c, "cx"),
    y: num(c, "cy"),
  }));

describe("deprecated legacy geometry exports (kept for one release)", () => {
  const plumeBase = {
    xCenter: 100,
    yApex: 50,
    yBase: 250,
    stemHalf: 6,
    crownDrift: 0,
    bloomExponent: 3,
  };
  it("buildJetPath and buildFrothSlices still work", () => {
    expect(buildJetPath({ ...plumeBase, bloomHalf: 40 })).not.toMatch(/NaN|Infinity/);
    expect(buildFrothSlices({ ...plumeBase, bloomHalf: 40 }, 8, 0.18)).toHaveLength(8);
  });
});

describe("svg DOM: the marks read off the y-axis", () => {
  it("the stem ends at the big dot; the bell spans y(high) to y(low); dots at their values", () => {
    const { host } = mount(commute, commuteProps);
    const y = yScaleOf(host);
    for (const d of commute) {
      const safe = sanitizeForClassName(d.label);
      const gEl = host.querySelector(`g.mv-fountain-jet-group[data-label-safe="${safe}"]`)!;
      const stem = gEl.querySelector("rect.mv-fountain-stem")!;
      const big = gEl.querySelector("circle.mv-fountain-value")!;
      expect(num(stem, "y")).toBeCloseTo(y(d.value!), 1);
      expect(num(big, "cy")).toBeCloseTo(y(d.value!), 1);
      expect(num(stem, "y") + num(stem, "height")).toBeCloseTo(y(0), 1);
      const ys = pathPoints(gEl.querySelector("path.mv-fountain-jet")!.getAttribute("d")!).map(
        (p) => p[1],
      );
      expect(Math.min(...ys)).toBeCloseTo(y(d.high!), 1);
      expect(Math.max(...ys)).toBeCloseTo(y(d.low!), 1);
      const dots = Array.from(gEl.querySelectorAll("circle.mv-fountain-dot"));
      expect(dots.length).toBe(d.samples!.length);
      for (const dot of dots) {
        const v = Number(dot.getAttribute("data-value"));
        expect(num(dot, "cy")).toBeCloseTo(y(v), 1);
        expect(num(dot, "cy")).toBeGreaterThanOrEqual(Math.min(...ys) - 0.01);
        expect(num(dot, "cy")).toBeLessThanOrEqual(Math.max(...ys) + 0.01);
      }
    }
  });

  it("value labels under each x label, the reference line and its counts", () => {
    const { host } = mount(commute, commuteProps);
    const y = yScaleOf(host);
    const block = host.querySelector('g.mv-fountain-value-label[data-label="Car"]')!;
    expect(Array.from(block.querySelectorAll("text")).map((t) => t.textContent)).toEqual([
      "usual 30",
      "best 22",
      "worst 55",
      "17 of 20",
      "within 45 min",
    ]);
    const xLabel = Array.from(host.querySelectorAll(".mv-x-axis-band text")).find(
      (t) => t.textContent === "Car",
    )!;
    const first = block.querySelector("text")!;
    expect(num(first, "y")).toBeGreaterThan(num(xLabel, "y"));
    expect(num(first, "x")).toBeCloseTo(num(xLabel, "x"), 1);
    // every line inside the svg (the bottom margin was reserved)
    const ys = Array.from(host.querySelectorAll("text.mv-fountain-value-line")).map((t) =>
      num(t, "y"),
    );
    expect(Math.max(...ys)).toBeLessThanOrEqual(460 - 4);
    const ref = host.querySelector("line.mv-fountain-reference")!;
    expect(num(ref, "y1")).toBeCloseTo(y(45), 1);
    const label = host.querySelector("text.mv-fountain-reference-label")!;
    expect(label.textContent).toContain("Time I allow:");
    // the right margin holds the label (7 px per character without a canvas)
    for (const t of Array.from(label.querySelectorAll("tspan"))) {
      const w = (t.textContent ?? "").length * 7 * (11 / 12) * 1.07;
      expect(num(t, "x") + w).toBeLessThanOrEqual(700 + 0.5);
    }
    const counts = ["17 of 20", "20 of 20", "12 of 20"];
    commute.forEach((d, i) => {
      const b = host.querySelector(`g.mv-fountain-value-label[data-label="${d.label}"]`)!;
      expect(b.querySelector('[data-kind="count"]')!.textContent).toBe(counts[i]);
    });
  });

  it("the y-axis title is rotated beside the axis, clear of the tick labels", () => {
    const { host } = mount(commute, commuteProps);
    const t = host.querySelector("text.mv-fountain-y-title")!;
    expect(t.textContent).toBe("minutes (higher = slower)");
    expect(t.getAttribute("transform")).toMatch(/^rotate\(-90/);
    const tickLeft = Math.min(
      ...Array.from(host.querySelectorAll("g.mv-y-axis text.mv-axis-label")).map(
        (l) => num(l, "x") - (l.textContent ?? "").length * 7,
      ),
    );
    expect(num(t, "x")).toBeLessThan(tickLeft);
    expect(num(t, "x")).toBeGreaterThan(8);
  });

  it("forecast: dashed stem and outline, hollow big dot, '(forecast)' after the x label", () => {
    const { host, chart } = mount([car, { ...bus, label: "Fri", forecast: true }]);
    const gEl = host.querySelector('g.mv-fountain-jet-group[data-label="Fri"]')!;
    expect(gEl.querySelector("line.mv-fountain-stem")!.getAttribute("stroke-dasharray")).toBe(
      "5 4",
    );
    expect(gEl.querySelector("path.mv-fountain-jet")!.getAttribute("stroke-dasharray")).toBe("4 3");
    // Hollow on any background: a ring with nothing painted inside, the marks under it
    // knocked out (never a surface-coloured disc, which reads as solid white on dark).
    expect(gEl.querySelector("circle.mv-fountain-value")!.getAttribute("fill")).toBe("none");
    expect(gEl.getAttribute("clip-path")).toMatch(/^url\(#mv-fountain-knockout-\d+\)$/);
    expect(gEl.querySelectorAll("circle.mv-fountain-dot").length).toBe(0);
    const labels = Array.from(host.querySelectorAll(".mv-x-axis-band text")).map(
      (t) => t.textContent,
    );
    expect(labels).toEqual(["Car", "Fri (forecast)"]);
    expect(fountainCtx(chart.getContext()).stats.predictedCount).toBe(1);
  });

  it("when '(forecast)' alone would make the x labels collide, it moves to a second line", () => {
    const week: FountainDataItem[] = ["Today", "Fri", "Sat", "Sun", "Mon", "Tue"].map((d, i) => ({
      label: d,
      value: 22 + (i % 3),
      low: 18,
      high: 27,
      forecast: i > 0,
    }));
    let warned: DataWarning[] = [];
    const { host } = mount(week, { width: 600, onDataWarning: (w) => (warned = w) });
    const axis = Array.from(host.querySelectorAll(".mv-x-axis-band text")).map(
      (t) => t.textContent,
    );
    expect(axis).toEqual(["Today", "Fri", "Sat", "Sun", "Mon", "Tue"]);
    const notes = Array.from(host.querySelectorAll("text.mv-fountain-axis-note"));
    expect(notes.map((n) => n.textContent)).toEqual(Array(5).fill("(forecast)"));
    const fri = Array.from(host.querySelectorAll(".mv-x-axis-band text"))[1];
    expect(num(notes[0], "x")).toBeCloseTo(num(fri, "x"), 1);
    expect(num(notes[0], "y")).toBeGreaterThan(num(fri, "y"));
    // the value labels stay, below the note
    const friBlock = host.querySelector('g.mv-fountain-value-label[data-label="Fri"]')!;
    expect(num(friBlock.querySelector("text")!, "y")).toBeGreaterThan(num(notes[0], "y"));
    expect(warned.filter((w) => w.type === "layout-overflow")).toEqual([]);
  });

  it("x labels too wide for their column wrap to lines instead of tilting (value labels stay)", () => {
    const shifts: FountainDataItem[] = [
      "Weekday lunch",
      "Weekday dinner",
      "Friday night",
      "Saturday night",
      "Sunday brunch",
    ].map((label, i) => ({ label, value: 20 + 10 * i, low: 10 + 10 * i, high: 40 + 10 * i }));
    const { host } = mount(shifts, { width: 520 });
    const axis = Array.from(host.querySelectorAll(".mv-x-axis-band text"));
    expect(axis.map((t) => t.textContent)).toEqual([
      "Weekday",
      "Weekday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(axis.every((t) => !(t.getAttribute("transform") ?? "").includes("rotate"))).toBe(true);
    const notes = Array.from(host.querySelectorAll("text.mv-fountain-axis-note"));
    expect(notes.map((n) => n.textContent)).toEqual([
      "lunch",
      "dinner",
      "night",
      "night",
      "brunch",
    ]);
    const blocks = host.querySelectorAll("g.mv-fountain-value-label");
    expect(blocks.length).toBe(5);
    const firstValue = num(blocks[0].querySelector("text")!, "y");
    expect(firstValue).toBeGreaterThan(Math.max(...notes.map((n) => num(n, "y"))));
  });

  it("drift shifts only the upper part of the bell", () => {
    const tip = (host: HTMLElement) => {
      const pts = pathPoints(host.querySelector("path.mv-fountain-jet")!.getAttribute("d")!);
      const top = Math.min(...pts.map((p) => p[1]));
      const bottom = Math.max(...pts.map((p) => p[1]));
      return {
        tipX: pts.find((p) => p[1] === top)![0],
        base: pts.filter((p) => p[1] === bottom).map((p) => p[0]),
      };
    };
    const off = tip(mount([car]).host);
    const on = tip(mount([car], { drift: true }).host);
    expect(on.base).toEqual(off.base);
    expect(on.tipX).toBeGreaterThan(off.tipX + 3);
  });

  it("showRange / showSamples / showValueLabels off", () => {
    const noRange = mount(commute, { ...commuteProps, showRange: false }).host;
    expect(noRange.querySelector("path.mv-fountain-jet")).toBeNull();
    expect(noRange.querySelector("circle.mv-fountain-dot")).toBeNull();
    const kinds = Array.from(noRange.querySelectorAll("text.mv-fountain-value-line")).map((t) =>
      t.getAttribute("data-kind"),
    );
    expect(kinds).toContain("usual");
    expect(kinds).not.toContain("low");
    expect(kinds).not.toContain("high");

    const noSamples = mount(commute, { showSamples: false }).host;
    expect(noSamples.querySelectorAll("path.mv-fountain-jet").length).toBe(3);
    expect(noSamples.querySelector("circle.mv-fountain-dot")).toBeNull();

    const noLabels = mount(commute, { ...commuteProps, showValueLabels: false }).host;
    expect(noLabels.querySelector("g.mv-fountain-value-label")).toBeNull();
    const withLabels = mount(commute, commuteProps).host;
    // without value labels the plot keeps more height
    const plotBottom = (h: HTMLElement) => num(h.querySelector("rect.mv-fountain-lake")!, "y");
    expect(plotBottom(noLabels)).toBeGreaterThan(plotBottom(withLabels));
  });

  it("readingGuide: true prints the default line under everything; a string replaces it", () => {
    const on = mount(commute, { readingGuide: true }).host;
    const guide = on.querySelector("text.mv-fountain-reading-guide")!;
    expect(guide.textContent).toContain("Small dot = one measurement");
    const guideY = Math.min(...Array.from(guide.querySelectorAll("tspan")).map((t) => num(t, "y")));
    const lastValue = Math.max(
      ...Array.from(on.querySelectorAll("text.mv-fountain-value-line")).map((t) => num(t, "y")),
    );
    expect(guideY).toBeGreaterThan(lastValue);
    const lastGuide = Math.max(
      ...Array.from(guide.querySelectorAll("tspan")).map((t) => num(t, "y")),
    );
    expect(lastGuide).toBeLessThanOrEqual(460 - 4);
    const custom = mount(commute, { readingGuide: "Big dot = the usual day" }).host;
    expect(custom.querySelector("text.mv-fountain-reading-guide")!.textContent).toBe(
      "Big dot = the usual day",
    );
    expect(mount(commute).host.querySelector("text.mv-fountain-reading-guide")).toBeNull();
  });

  it("readingGuide: true names only the marks the chart draws", () => {
    const guideOf = (data: FountainDataItem[], extra: Partial<FountainChartProps> = {}) =>
      Array.from(
        mount(data, { width: 1200, readingGuide: true, ...extra }).host.querySelectorAll(
          "text.mv-fountain-reading-guide tspan",
        ),
      )
        .map((t) => t.textContent)
        .join(" · ");
    const dotRules = [
      "Small dot = one measurement",
      "Dots close together = steady",
      "Few dots = just a guess",
    ];
    const tall = "Tall fountain = changes a lot";
    expect(guideOf(commute)).toBe(
      "Small dot = one measurement · Big dot = the usual one · Dots close together = steady · Tall fountain = changes a lot · Few dots = just a guess",
    );
    // No small dots drawn: showSamples off, no samples, or only forecasts.
    const noSamples = commute.map(({ samples: _s, ...rest }) => rest);
    for (const guide of [
      guideOf(commute, { showSamples: false }),
      guideOf(noSamples),
      guideOf(commute.map((d) => ({ ...d, forecast: true }))),
    ]) {
      for (const rule of dotRules) expect(guide).not.toContain(rule);
      expect(guide).toBe(`Big dot = the usual one · ${tall}`);
    }
    // No fountain drawn: showRange off, or no jet with a range.
    expect(guideOf(commute, { showRange: false })).toBe("Big dot = the usual one");
    expect(guideOf(commute.map((d) => ({ label: d.label, value: d.value })))).toBe(
      "Big dot = the usual one",
    );
  });

  it("readingGuide: true names only the marks drawn after the y-domain clip and disabled items", () => {
    const ex = examplesFountain.find((e) => e.id === "fountain-commute-by-mode")!
      .props as FountainChartProps;
    const guideOf = (extra: Partial<FountainChartProps>) => {
      const { host } = mount(ex.dataSet, { ...ex, width: 600, readingGuide: true, ...extra });
      return {
        guide: Array.from(host.querySelectorAll("text.mv-fountain-reading-guide tspan"))
          .map((t) => t.textContent)
          .join(" · "),
        dots: host.querySelectorAll("circle.mv-fountain-dot").length,
        bells: host.querySelectorAll("path.mv-fountain-jet").length,
      };
    };
    // Every commute time is over 20 min: no small dot and no fountain is drawn.
    const clipped = guideOf({ yAxisDomain: [0, 20] });
    expect([clipped.dots, clipped.bells]).toEqual([0, 0]);
    expect(clipped.guide).toBe("Big dot = the usual one");
    // Up to 30 min: some small dots and fountains still show.
    const some = guideOf({ yAxisDomain: [0, 30] });
    expect(some.dots).toBeGreaterThan(0);
    expect(some.guide).toBe(core.FOUNTAIN_DEFAULT_READING_GUIDE);
    // The one jet with a range and samples disabled: the others are bare values.
    const bare = ex.dataSet.map((d, i) => (i === 0 ? d : { label: d.label, value: d.value }));
    const off = guideOf({ dataSet: bare, disabledItems: [ex.dataSet[0].label] });
    expect([off.dots, off.bells]).toEqual([0, 0]);
    expect(off.guide).toBe("Big dot = the usual one");
  });

  it("readingGuide: true is chosen on the final plot, so a fountain too short to draw is not named", () => {
    // At 600 x 460 the range 50..50.15 of 0..100 is under half a pixel tall on the final
    // plot (no fountain drawn), though it was taller on the plot before the words took
    // their room; 50..50.2 is drawn.
    const drawn = (high: number) => {
      const { host } = mount([{ label: "A", value: 50, low: 50, high }], {
        yAxisDomain: [0, 100],
        readingGuide: true,
        width: 600,
      });
      return {
        bells: host.querySelectorAll("path.mv-fountain-jet").length,
        guide: Array.from(host.querySelectorAll("text.mv-fountain-reading-guide tspan"))
          .map((t) => t.textContent)
          .join(" · "),
      };
    };
    expect(drawn(50.15)).toEqual({ bells: 0, guide: "Big dot = the usual one" });
    expect(drawn(50.2)).toEqual({
      bells: 1,
      guide: "Big dot = the usual one · Tall fountain = changes a lot",
    });
  });

  it("the reading guide wraps between its rules (the commute example at 600 px)", () => {
    const ex = examplesFountain.find((e) => e.id === "fountain-commute-by-mode")!
      .props as FountainChartProps;
    const { host } = mount(ex.dataSet, { ...ex, width: 600 });
    const text = ex.readingGuide as string;
    const rules = text.split(" · ");
    const lines = Array.from(host.querySelectorAll("text.mv-fountain-reading-guide tspan")).map(
      (t) => t.textContent ?? "",
    );
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      for (const part of line.split(" · ")) expect(rules).toContain(part);
    }
    expect(lines.join(" · ")).toBe(text);
  });

  it("negative values: the stem runs down from the lake; the bell is narrow at high", () => {
    let warned: DataWarning[] = [];
    const { host } = mount(
      [
        { label: "Gain", value: 20, low: 10, high: 30 },
        { label: "Loss", value: -20, low: -35, high: -5, samples: [-35, -22, -20, -18, -5] },
      ],
      { onDataWarning: (w) => (warned = w) },
    );
    const y = yScaleOf(host);
    const gEl = host.querySelector('g.mv-fountain-jet-group[data-label="Loss"]')!;
    const stem = gEl.querySelector("rect.mv-fountain-stem")!;
    expect(num(stem, "y")).toBeCloseTo(y(0), 1);
    expect(num(stem, "y") + num(stem, "height")).toBeCloseTo(y(-20), 1);
    const pts = pathPoints(gEl.querySelector("path.mv-fountain-jet")!.getAttribute("d")!);
    const top = Math.min(...pts.map((p) => p[1]));
    expect(top).toBeCloseTo(y(-5), 1);
    const atTop = pts.filter((p) => Math.abs(p[1] - top) < 0.01).map((p) => p[0]);
    expect(Math.max(...atTop) - Math.min(...atTop)).toBeLessThan(0.01);
    expect(num(host.querySelector("rect.mv-fountain-lake")!, "y")).toBeCloseTo(y(0), 1);
    expect(warned).toEqual([]);
  });

  it("the removed looks are gone; each removed prop warns once (ignored-option)", () => {
    let warned: DataWarning[] = [];
    const { host } = mount(commute, {
      style: "plume",
      frothLayers: 8,
      bloomExponent: 3,
      stemFraction: 0.4,
      showDroplets: true,
      showMist: true,
      onDataWarning: (w) => (warned = w),
    });
    for (const gone of ["mist", "droplet", "outline", "froth", "crown"]) {
      expect(host.querySelector(`.mv-fountain-${gone}`)).toBeNull();
    }
    expect(host.querySelectorAll("path.mv-fountain-jet").length).toBe(3);
    const ignored = warned.filter((w) => w.type === "ignored-option");
    expect(ignored.map((w) => w.message.match(/`(\w+)`/)![1])).toEqual([
      "style",
      "frothLayers",
      "bloomExponent",
      "stemFraction",
      "showDroplets",
      "showMist",
    ]);
  });
});

describe("hover and pin (one host-level hit-test for every renderer)", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
  });
  afterEach(() => {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
    __resetGPUDeviceForTest();
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
  });

  const margin: Margin = { top: 37, right: 91, bottom: 83, left: 113 };

  it("svg, canvas and webgpu name the same jet at every pointer (non-default margin)", () => {
    const ref = mount(commute, { margin });
    const dots = bigDots(ref.host);
    // pointers: each big dot, each stem foot, beside each jet, and the margins
    const probes: Array<[number, number]> = [];
    for (const d of dots) probes.push([d.x, d.y], [d.x, 300], [d.x + 30, 100]);
    probes.push([margin.left - 10, 200], [5, 5], [699, 200]);

    const hook = enableDevtools();
    const byRenderer: Record<string, Array<string | null>> = {};
    for (const renderer of ["svg", "canvas", "webgpu"] as const) {
      if (renderer === "webgpu") {
        Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
      }
      const events: DevtoolsHitEvent[] = [];
      const unsub = hook.subscribeHits((e) => events.push(e));
      const { host } = mount(commute, { margin, renderer });
      for (const [x, y] of probes) move(host, x, y);
      unsub();
      byRenderer[renderer] = events.filter((e) => e.host === host).map((e) => e.label);
    }
    expect(byRenderer.svg).toEqual([
      "Car",
      "Car",
      "Car",
      "Train",
      "Train",
      "Train",
      "Bus",
      "Bus",
      "Bus",
      null,
      null,
      null,
    ]);
    expect(byRenderer.canvas).toEqual(byRenderer.svg);
    expect(byRenderer.webgpu).toEqual(byRenderer.svg);
  });

  it("the default tooltip: plain words, formatted numbers, placed next to the pointer", () => {
    const { host } = mount(commute, commuteProps);
    const car0 = bigDots(host)[0];
    move(host, car0.x, car0.y);
    const tip = tooltipOf(host);
    expect(tip.style.visibility).toBe("visible");
    expect(tip.innerHTML).toBe(
      "<strong>Car</strong><br>usual 30<br>best 22 · worst 55<br>20 days<br>17 of 20 within 45 min",
    );
    // placed by placeTooltip: 10 px beside the pointer (jsdom's zero-size host flips it
    // to the left), and it follows the pointer
    const left = parseFloat(tip.style.left);
    expect(Math.abs(left - car0.x)).toBeCloseTo(10, 6);
    move(host, car0.x + 4, car0.y + 20);
    expect(parseFloat(tip.style.left)).toBeCloseTo(left + 4, 6);
  });

  it("tooltipFormatter gets the jet as drawn: range, samples, counts, period, default lines", () => {
    const seen: Array<FountainTooltipJet | undefined> = [];
    const flow: FountainDataItem[] = [
      { label: "Flow", value: 30, low: 22, high: 55, samples: car.samples, date: 2001 },
      { label: "Flow", value: 35, low: 32, high: 42, date: 2002, forecast: true },
    ];
    const { host } = mount(flow, {
      ...commuteProps,
      xAxisDataType: "number",
      tooltipFormatter: (d, jet) => {
        seen.push(jet);
        return `<b>${d.label}</b>`;
      },
    });
    const dots = bigDots(host).sort((p, q) => p.x - q.x);
    move(host, dots[0].x, dots[0].y);
    const jet = seen[seen.length - 1]!;
    expect(jet.label).toBe("Flow");
    expect(jet.period).toBe("2001");
    expect([jet.value, jet.low, jet.high, jet.samples.length, jet.forecast]).toEqual([
      30,
      22,
      55,
      20,
      false,
    ]);
    expect(jet.referenceCounts.map((c) => `${c.count}/${c.total}`)).toEqual(["17/20"]);
    expect(jet.lines).toEqual([
      "Flow · 2001",
      "usual 30",
      "best 22 · worst 55",
      "20 days",
      "17 of 20 within 45 min",
    ]);
    expect(jet.color).toMatch(/^#/);
    move(host, dots[1].x, dots[1].y);
    expect(seen[seen.length - 1]!.forecast).toBe(true);
    expect(seen[seen.length - 1]!.lines[0]).toBe("Flow · 2002 (forecast)");
    expect(tooltipOf(host).innerHTML).toBe("<b>Flow</b>");
  });

  it("numbers follow the locale; a label is escaped; tooltipFormatter wins", () => {
    const big = [{ label: "<b>Big</b>", value: 1234.5, low: 1000, high: 1500 }];
    const fr = mount(big, { locale: "fr-FR" }).host;
    move(fr, bigDots(fr)[0].x, 200);
    const html = tooltipOf(fr).innerHTML;
    expect(html).toContain("&lt;b&gt;Big&lt;/b&gt;");
    expect(html).toMatch(/usual 1\s?234,5/);
    const custom = mount(big, { tooltipFormatter: (d) => `<em>${d.value}</em>` }).host;
    move(custom, bigDots(custom)[0].x, 200);
    expect(tooltipOf(custom).innerHTML).toBe("<em>1234.5</em>");
  });

  it("onHighlightItem fires only when the hovered label changes; mouseleave hides", () => {
    const calls: string[][] = [];
    const { host } = mount(commute, { onHighlightItem: (l) => calls.push(l) });
    const [c, t] = bigDots(host);
    move(host, 5, 5); // outside: nothing was highlighted, nothing to clear
    expect(calls).toEqual([]);
    move(host, c.x, c.y);
    move(host, c.x + 2, c.y + 30);
    move(host, c.x - 2, c.y + 60);
    expect(calls).toEqual([["Car"]]);
    move(host, t.x, t.y);
    expect(calls).toEqual([["Car"], ["Train"]]);
    host.dispatchEvent(new MouseEvent("mouseleave"));
    expect(calls).toEqual([["Car"], ["Train"], []]);
    expect(tooltipOf(host).style.visibility).toBe("hidden");
    host.dispatchEvent(new MouseEvent("mouseleave"));
    move(host, 5, 5);
    expect(calls).toHaveLength(3);
  });

  it("click pins; moving does not change the pin; clicking another jet moves it", () => {
    const calls: string[][] = [];
    const { host } = mount(commute, { onHighlightItem: (l) => calls.push(l) });
    const [c, t] = bigDots(host);
    click(host, c.x, c.y);
    const tip = tooltipOf(host);
    expect(tip.classList.contains("sticky")).toBe(true);
    expect(tip.innerHTML).toContain("Car");
    move(host, t.x, t.y);
    expect(tip.innerHTML).toContain("Car");
    expect(calls).toEqual([["Car"]]);
    click(host, t.x, t.y);
    expect(tip.innerHTML).toContain("Train");
    expect(tip.classList.contains("sticky")).toBe(true);
    expect(calls).toEqual([["Car"], ["Train"]]);
  });

  it("clicking the pinned jet, or empty space, or Escape unpins", () => {
    const { host } = mount(commute);
    const [c] = bigDots(host);
    const tip = tooltipOf(host);

    click(host, c.x, c.y);
    click(host, c.x, c.y + 40); // the same jet's column
    expect(tip.classList.contains("sticky")).toBe(false);
    expect(tip.style.visibility).toBe("hidden");

    click(host, c.x, c.y);
    click(host, 5, 5); // empty space inside the host
    expect(tip.classList.contains("sticky")).toBe(false);
    expect(tip.style.visibility).toBe("hidden");

    click(host, c.x, c.y);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(tip.classList.contains("sticky")).toBe(false);
    expect(tip.style.visibility).toBe("hidden");
    // hover works again after an unpin
    move(host, c.x, c.y);
    expect(tip.style.visibility).toBe("visible");
  });

  it("canvas: the same pin rules", () => {
    const [c] = bigDots(mount(commute).host);
    const { host } = mount(commute, { renderer: "canvas" });
    const tip = tooltipOf(host);
    click(host, c.x, c.y);
    expect(tip.classList.contains("sticky")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(tip.classList.contains("sticky")).toBe(false);
  });

  it("reportDevtoolsHit on every resolved hover, hits and misses", () => {
    const hook = enableDevtools();
    const events: DevtoolsHitEvent[] = [];
    hook.subscribeHits((e) => events.push(e));
    const { host } = mount(commute);
    const [c] = bigDots(host);
    move(host, c.x, c.y);
    move(host, 5, 5);
    const mine = events.filter((e) => e.host === host);
    expect(mine.map((e) => e.label)).toEqual(["Car", null]);
    expect(mine[0].x).toBe(c.x);
  });
});

describe("colours, legend, context", () => {
  it("disabling a jet never recolours the others; its colour and legend slot stay", () => {
    const mappings: Array<Record<string, string>> = [];
    const { host, chart } = mount(commute, {
      onColorMappingGenerated: (m) => mappings.push(m),
    });
    const fillOf = (label: string) =>
      host
        .querySelector(`g.mv-fountain-jet-group[data-label="${label}"] path.mv-fountain-jet`)
        ?.getAttribute("fill");
    const before = { car: fillOf("Car"), bus: fillOf("Bus") };
    chart.update({ dataSet: commute, width: 700, height: 460, disabledItems: ["Train"] });
    expect(fillOf("Train")).toBeUndefined();
    expect({ car: fillOf("Car"), bus: fillOf("Bus") }).toEqual(before);
    expect(mappings).toHaveLength(1);
    const ctx = fountainCtx(chart.getContext());
    expect(ctx.legendData!.map((l) => [l.label, l.disabled ?? false])).toEqual([
      ["Car", false],
      ["Train", true],
      ["Bus", false],
    ]);
    expect(ctx.jets.map((j) => j.label)).toEqual(["Car", "Bus"]);
  });

  it("context: ranges, sample and reference counts; plain summary; a11y table", () => {
    const { host, chart } = mount(commute, commuteProps);
    const ctx = fountainCtx(chart.getContext());
    const j = ctx.jets[0];
    expect([j.value, j.low, j.high, j.range, j.sampleCount]).toEqual([30, 22, 55, 33, 20]);
    expect(j.referenceCounts).toEqual([
      { value: 45, goodSide: "below", count: 17, total: 20, countLabel: "within 45 min" },
    ]);
    expect(j.spread).toBe(16.5);
    expect(j.upperBound).toBe(55);
    expect(ctx.stats.widestRange).toEqual({ label: "Car", range: 33 });
    expect(ctx.summary).toBe(
      'Fountain chart "Demo" with 3 jets. Highest usual value: Bus at 40. Widest range: Car, from 22 to 55.',
    );
    expect(ctx.a11yTable.headers).toEqual([
      "Label",
      "Usual",
      "best",
      "worst",
      "Samples",
      "within 45 min",
    ]);
    expect(ctx.a11yTable.rows[0]).toEqual(["Car", 30, 22, 55, 20, "17 of 20"]);
    expect(host.querySelectorAll(".mv-a11y table tbody tr").length).toBe(3);
    // the context's y domain is the one the axis shows
    const ticks = Array.from(host.querySelectorAll("g.mv-y-axis text.mv-axis-label")).map((t) =>
      Number(t.textContent),
    );
    expect(ctx.yAxis.domain[1]).toBe(Math.max(...ticks));
  });

  it("onChartDataProcessed fires once per distinct context", () => {
    const seen: ChartContext[] = [];
    const props: FountainChartProps = {
      dataSet: commute,
      title: "Demo",
      width: 700,
      height: 460,
      onChartDataProcessed: (c) => seen.push(c),
    };
    const { chart } = mount(commute, props);
    chart.update({ ...props });
    chart.update({ ...props, highlightItems: ["Car"] });
    expect(seen).toHaveLength(1);
    chart.update({ ...props, disabledItems: ["Car"] });
    expect(seen).toHaveLength(2);
  });

  it("context is identical in svg and canvas, renderer aside", () => {
    const a = fountainCtx(mount(commute, { ...commuteProps, renderer: "svg" }).chart.getContext());
    const b = fountainCtx(
      mount(commute, { ...commuteProps, renderer: "canvas" }).chart.getContext(),
    );
    expect({ ...a, renderer: undefined }).toEqual({ ...b, renderer: undefined });
  });

  it("trend mode: one tick per period, the trend line, a period-sorted a11y table", () => {
    const flow: FountainDataItem[] = [
      { label: "Flow", value: 95, spread: 14, date: 2003 },
      { label: "Flow", value: 50, spread: 8, date: 2001 },
      { label: "Flow", value: 70, spread: 10, date: 2002, forecast: true },
    ];
    const { host, chart } = mount(flow, { xAxisDataType: "number" });
    const ctx = fountainCtx(chart.getContext());
    expect(ctx.mode).toBe("trend");
    expect(ctx.stats.trendSlope!).toBeGreaterThan(0);
    expect(ctx.a11yTable.rows.map((r) => r[0])).toEqual(["2001", "2002", "2003"]);
    expect(host.querySelector("path.mv-fountain-trend")).not.toBeNull();
    const ticks = Array.from(host.querySelectorAll("g.mv-x-axis text")).map((t) => t.textContent);
    expect(ticks).toEqual(["2001", "2002 (forecast)", "2003"]);
    // no vertical grid lines through the stems (the approved look has none)
    expect(host.querySelectorAll("g.mv-x-axis line.mv-grid").length).toBe(0);
    // and no grey tick dots under them: on this chart a small dot is a measurement
    expect(host.querySelectorAll("g.mv-x-axis circle").length).toBe(0);
    // hover names the period
    const dots = bigDots(host).sort((p, q) => p.x - q.x);
    move(host, dots[0].x, dots[0].y);
    expect(tooltipOf(host).innerHTML).toContain("<strong>Flow · 2001</strong>");
  });

  it("date_monthly with epoch-ms dates: one flat tick per period, every period labelled", () => {
    const months = [0, 1, 2].map((m) => Date.UTC(2021, m, 1));
    const data: FountainDataItem[] = months.map((date, i) => ({
      label: "S",
      date,
      value: 3 + i,
      low: 1,
      high: 6 + i,
      samples: [1, 2, 3 + i, 4, 6 + i],
    }));
    const { host } = mount(data, { xAxisDataType: "date_monthly", locale: "en" });
    const labels = Array.from(host.querySelectorAll("g.mv-x-axis text.mv-axis-label"));
    expect(labels.map((t) => t.textContent)).toEqual(["Jan 2021", "Feb 2021", "Mar 2021"]);
    // Flat, as the frame planned them, so they stay clear of the value labels.
    expect(labels.every((t) => !(t.getAttribute("transform") ?? "").includes("rotate"))).toBe(true);
    // Each tick sits under its jet.
    const xs = bigDots(host)
      .map((d) => d.x)
      .sort((a, b) => a - b);
    labels.forEach((t, i) => expect(num(t, "x")).toBeCloseTo(xs[i], 1));
  });
});

describe("warnings, loading and no data", () => {
  it("crowding is judged in pixels, not by a fixed jet count", () => {
    const many = (n: number): FountainDataItem[] =>
      Array.from({ length: n }, (_, i) => ({ label: `c${i}`, value: 10 + i, spread: 2 }));
    let wide: DataWarning[] = [];
    mount(many(12), { width: 1600, onDataWarning: (w) => (wide = w) });
    expect(wide.some((w) => w.type === "layout-overflow" && /24 px/.test(w.message))).toBe(false);
    let narrow: DataWarning[] = [];
    mount(many(60), { width: 600, onDataWarning: (w) => (narrow = w) });
    expect(narrow.some((w) => w.type === "layout-overflow" && /24 px/.test(w.message))).toBe(true);
  });

  it("narrow columns drop the end lines of the value labels before overlapping, and say so", () => {
    let warned: DataWarning[] = [];
    const data: FountainDataItem[] = Array.from({ length: 9 }, (_, i) => ({
      label: `D${i}`,
      value: 30 + i,
      low: 20,
      high: 55,
    }));
    const { host } = mount(data, {
      width: 520,
      endLabels: ["cheapest", "dearest"],
      onDataWarning: (w) => (warned = w),
    });
    const kinds = Array.from(host.querySelectorAll("text.mv-fountain-value-line")).map((t) =>
      t.getAttribute("data-kind"),
    );
    expect(kinds).toContain("usual");
    expect(kinds).not.toContain("low");
    expect(warned.some((w) => w.type === "layout-overflow" && /value label/.test(w.message))).toBe(
      true,
    );
    // neighbouring blocks never overlap (7 px per char without a canvas)
    const blocks = Array.from(host.querySelectorAll("g.mv-fountain-value-label")).map((b) => {
      const lines = Array.from(b.querySelectorAll("text"));
      const x = num(lines[0], "x");
      const fs = parseFloat(lines[0].style.fontSize.match(/\* ([\d.]+)/)![1]) * 12;
      const w = Math.max(...lines.map((l) => (l.textContent ?? "").length * 7 * (fs / 12) * 1.07));
      return [x - w / 2, x + w / 2];
    });
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i][0]).toBeGreaterThan(blocks[i - 1][1]);
    }
  });

  it("an empty dataSet shows the no-data overlay and draws no axes or marks", () => {
    let warned: DataWarning[] = [];
    const { host, chart } = mount([], { onDataWarning: (w) => (warned = w) });
    expect(host.getAttribute("data-mv-state")).toBe("nodata");
    expect(host.querySelector(".mv-nodata")!.textContent).toBe("No data available");
    expect(host.querySelector("g.mv-y-axis")).toBeNull();
    expect(host.querySelector("g.mv-fountain-jet-group")).toBeNull();
    expect(warned.some((w) => w.type === "empty-dataset")).toBe(true);
    expect(fountainCtx(chart.getContext()).jets).toEqual([]);
    chart.update({ dataSet: commute, width: 700, height: 460 });
    expect(host.getAttribute("data-mv-state")).toBe("ready");
    expect(host.querySelector(".mv-nodata")).toBeNull();
    expect(host.querySelectorAll("g.mv-fountain-jet-group").length).toBe(3);
  });

  it("isLoading shows the loading overlay; stale data stays drawn during a refetch", () => {
    const first = mount([], { isLoading: true }).host;
    expect(first.getAttribute("data-mv-state")).toBe("loading");
    expect(first.querySelector(".mv-loading")).not.toBeNull();
    expect(first.querySelector("g.mv-y-axis")).toBeNull();
    const refetch = mount(commute, { isLoading: true }).host;
    expect(refetch.querySelector(".mv-loading")).not.toBeNull();
    expect(refetch.querySelectorAll("g.mv-fountain-jet-group").length).toBe(3);
    const custom = mount(commute, { isNodata: true, noDataLabel: "Nothing yet" }).host;
    expect(custom.querySelector(".mv-nodata")!.textContent).toBe("Nothing yet");
    expect(custom.querySelector("g.mv-fountain-jet-group")).toBeNull();
  });

  it("update() re-renders and destroy() cleans the host and its listeners", () => {
    const calls: string[][] = [];
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountFountainChart(host, {
      dataSet: commute,
      width: 700,
      height: 460,
      onHighlightItem: (l) => calls.push(l),
    });
    const [c] = bigDots(host);
    click(host, c.x, c.y);
    chart.update({ dataSet: [{ label: "Solo", value: 50, spread: 5 }], width: 700, height: 460 });
    expect(fountainCtx(chart.getContext()).jets).toHaveLength(1);
    chart.destroy();
    expect(host.querySelector("svg")).toBeNull();
    const n = calls.length;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    move(host, c.x, c.y);
    expect(calls).toHaveLength(n);
    host.remove();
  });
});

describe("public exports", () => {
  it("exposes the pure layers and keeps the old names", () => {
    for (const name of [
      "resolveFountainData",
      "buildFountainScales",
      "fountainYDomain",
      "fountainPeriodTicks",
      "bellOutline",
      "packFountainDots",
      "fountainValueLabels",
      "fountainTooltipLines",
      "fountainReferenceCounts",
      "buildFountainRenderModel",
      "hitTestFountain",
      "buildFountainContext",
      "checkFountainData",
      "fitFountainValueLabels",
      "buildFountainTextModel",
      // deprecated, kept for one release
      "processFountainData",
      "createFountainScales",
      "buildJetPath",
      "buildFrothSlices",
      "buildDropletPaths",
      "buildMistPath",
    ]) {
      expect(typeof (core as Record<string, unknown>)[name]).toBe("function");
    }
  });
});
