// Every fountain example in packages/examples (the 16 approved examples, the reading
// key and the switches), drawn by the engine at phone, docs and wide widths, short and
// tall, with the drift off and on: every small dot's disc goes at most half the outline's
// stroke past its fountain (near the tip, where no spot is that close, no further than
// the best spot in its row); the big dot (drawn on top) never wholly covers a small dot,
// and no two small dots are drawn at one point, wherever their row has room within that
// allowance. Counting the small dots is how the chart is read ("only 5 days").
import { afterEach, describe, expect, it } from "vitest";
import { mountFountainChart } from "../src/engine/fountainChart";
import { examples } from "../../examples/src/index";
import type { FountainChartProps } from "../src/types";
import { checkDots, hiddenBy, outsideBy, rowAt, visibleParts } from "./fountainOutline";

const fountainExamples = examples["fountain-chart"] as Array<{
  id: string;
  props: FountainChartProps;
}>;

const hosts: Array<{ host: HTMLElement; destroy(): void }> = [];
afterEach(() => {
  for (const h of hosts.splice(0)) {
    h.destroy();
    h.host.remove();
  }
});

const num = (el: Element, a: string): number => Number(el.getAttribute(a));

interface Jet {
  label: string;
  big: { x: number; y: number; r: number };
  dots: Array<{ x: number; y: number; r: number; value: string }>;
  bell: Array<[number, number]>;
}

function draw(
  props: FountainChartProps,
  width: number,
  height = 460,
  extra: Partial<FountainChartProps> = {},
): Jet[] {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountFountainChart(host, { ...props, ...extra, width, height, renderer: "svg" });
  hosts.push({ host, destroy: () => chart.destroy() });
  return Array.from(host.querySelectorAll("g.mv-fountain-jet-group")).map((g) => {
    const big = g.querySelector("circle.mv-fountain-value")!;
    const d = g.querySelector("path.mv-fountain-jet")?.getAttribute("d") ?? "";
    return {
      label: g.getAttribute("data-label") ?? "",
      big: { x: num(big, "cx"), y: num(big, "cy"), r: num(big, "r") },
      dots: Array.from(g.querySelectorAll("circle.mv-fountain-dot")).map((c) => ({
        x: num(c, "cx"),
        y: num(c, "cy"),
        r: num(c, "r"),
        value: c.getAttribute("data-value") ?? "",
      })),
      bell: [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(
        (m) => [Number(m[1]), Number(m[2])] as [number, number],
      ),
    };
  });
}

const SIZES: Array<[number, number]> = [
  [390, 340],
  [390, 460],
  [700, 340],
  [700, 460],
  [900, 340],
  [900, 460],
];

describe("fountain examples: every small dot inside its fountain, none hidden", () => {
  it("covers every fountain example", () => {
    expect(fountainExamples.length).toBeGreaterThanOrEqual(25);
  });

  for (const [width, height] of SIZES) {
    it(`${width} x ${height}, drift off and on: every disc inside its fountain, none under the big dot, none on another`, () => {
      const outside: string[] = [];
      const hidden: string[] = [];
      const together: string[] = [];
      let dots = 0;
      for (const drift of [false, true]) {
        for (const ex of fountainExamples) {
          for (const jet of draw(ex.props, width, height, { drift })) {
            const tag = (d: Jet["dots"][number]): string =>
              `${ex.id}${drift ? " (drift)" : ""} ${jet.label} ${d.value} (${d.x.toFixed(2)},${d.y.toFixed(2)})`;
            dots += jet.dots.length;
            const found = checkDots(jet.bell, jet.big, jet.dots, tag);
            outside.push(...found.outside);
            hidden.push(...found.hidden);
            together.push(...found.together);
          }
        }
      }
      expect(dots).toBeGreaterThan(1000);
      expect(outside).toEqual([]);
      expect(hidden).toEqual([]);
      expect(together).toEqual([]);
      // 50 charts per size: give the parallel suite room.
    }, 30_000);
  }

  it("at docs width the big dot leaves every small dot clearly visible, where the fountain has room", () => {
    const barely: string[] = [];
    for (const ex of fountainExamples) {
      for (const jet of draw(ex.props, 700)) {
        for (const d of jet.dots) {
          if (hiddenBy(jet.big, d) <= -1.5) continue;
          const room = visibleParts(rowAt(jet.bell, d.y), jet.big, d.y, 1.6).length > 0;
          if (room) barely.push(`${ex.id} ${jet.label} ${d.value}`);
        }
      }
    }
    expect(barely).toEqual([]);
  });

  it('"Just a guess" shows 5 separate small dots, none under the big dot', () => {
    const ex = fountainExamples.find((e) => e.id === "fountain-key-just-a-guess")!;
    for (const width of [390, 700]) {
      const [jet] = draw(ex.props, width);
      expect(jet.dots).toHaveLength(5);
      for (const d of jet.dots) expect(hiddenBy(jet.big, d)).toBeLessThanOrEqual(1e-6);
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          const [a, b] = [jet.dots[i], jet.dots[j]];
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r);
        }
      }
    }
  });

  it("ties at the value (30 x6, 31, 25): every disc inside, some of each shows past the big dot", () => {
    // The bell is barely wider than the big dot at 30, so the six 30s share the thin
    // strip beside it: inside the bell first, then visible, then apart.
    const [jet] = draw(
      { dataSet: [{ label: "On time", samples: [30, 30, 30, 30, 30, 30, 31, 25] }] },
      700,
    );
    expect(jet.dots).toHaveLength(8);
    for (const d of jet.dots) {
      expect(outsideBy(jet.bell, d)).toBeNull();
      expect(hiddenBy(jet.big, d)).toBeLessThan(0);
    }
  });

  it("ties at the value with room beside the big dot (30 x6, 36, 25): no two at one point", () => {
    const [jet] = draw(
      { dataSet: [{ label: "On time", samples: [30, 30, 30, 30, 30, 30, 36, 25] }] },
      700,
    );
    expect(jet.dots).toHaveLength(8);
    for (let i = 0; i < jet.dots.length; i++) {
      for (let j = i + 1; j < jet.dots.length; j++) {
        const [a, b] = [jet.dots[i], jet.dots[j]];
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(0.5);
      }
    }
    for (const d of jet.dots) {
      expect(outsideBy(jet.bell, d)).toBeNull();
      expect(hiddenBy(jet.big, d)).toBeLessThan(0);
    }
  });
});
