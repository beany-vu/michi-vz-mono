// Band x-axis layout decision. Ported from the legacy michi-vz
// (shared/xaxisBand/chooseAxisMode.ts) verbatim so the new engine matches the
// old behaviour: fit horizontally, else rotate -45° (all labels), else thin to a
// readable subset. Pure — no DOM (measurement is injected).
export type AxisMode = "horizontal" | "rotated" | "fallback";

export interface ChooseAxisModeParams {
  domain: string[];
  formatter: (d: string) => string;
  /** Per-band slot width in px — pass `xScale.step()` (not bandwidth()). */
  bandWidth: number;
  measure: (label: string) => number;
  padding?: number;
  maxTicks?: number;
  forceMode?: "auto" | "horizontal";
}

export interface ChooseAxisModeResult {
  mode: AxisMode;
  tickValues: string[];
}

const ESTIMATED_TICK_WIDTH = 80;

function sampleEvenly(domain: string[], bandWidth: number, maxTicks: number): string[] {
  if (domain.length === 0) return [];
  if (domain.length === 1) return domain;

  const first = domain[0];
  const last = domain[domain.length - 1];

  const availableWidth = bandWidth * domain.length;
  const maxFittingTicks = Math.floor(availableWidth / ESTIMATED_TICK_WIDTH);
  const effectiveTicks = Math.max(2, Math.min(maxFittingTicks, maxTicks));

  if (effectiveTicks <= 2 || domain.length <= 2) {
    return [first, last];
  }

  if (domain.length <= effectiveTicks) {
    return domain;
  }

  const result: string[] = [first];
  const step = (domain.length - 1) / (effectiveTicks - 1);
  for (let i = 1; i < effectiveTicks - 1; i++) {
    const index = Math.round(i * step);
    if (index > 0 && index < domain.length - 1) {
      result.push(domain[index]);
    }
  }
  result.push(last);
  return result;
}

export function chooseAxisMode(params: ChooseAxisModeParams): ChooseAxisModeResult {
  const {
    domain,
    formatter,
    bandWidth,
    measure,
    padding = 8,
    maxTicks = 15,
    forceMode = "auto",
  } = params;

  if (domain.length === 0) return { mode: "horizontal", tickValues: [] };
  if (domain.length === 1) return { mode: "horizontal", tickValues: domain };

  const labels = domain.map((d) => formatter(d));
  const maxLabelWidth = labels.reduce((max, label) => Math.max(max, measure(label)), 0);

  if (maxLabelWidth + padding <= bandWidth) {
    return { mode: "horizontal", tickValues: domain };
  }

  if (forceMode === "auto") {
    const COS_45 = Math.SQRT1_2;
    // Rotated labels trail diagonally, so adjacent labels can graze each other
    // without their text colliding. 3× lets the -45° footprint extend past one
    // band before we give up and thin — prioritizes "all labels visible".
    const ROTATED_MAX_OVERLAP = 3;
    if (maxLabelWidth * COS_45 <= bandWidth * ROTATED_MAX_OVERLAP) {
      return { mode: "rotated", tickValues: domain };
    }
  }

  return { mode: "fallback", tickValues: sampleEvenly(domain, bandWidth, maxTicks) };
}
