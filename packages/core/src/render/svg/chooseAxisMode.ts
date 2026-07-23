// Band x-axis layout decision: fit horizontally, else rotate -45°, else thin to a
// readable subset - and, since the overlap work below, rotate AND thin, which fits
// roughly three times more labels than horizontal thinning at the same density.
// Pure - no DOM (measurement is injected).
export type AxisMode = "horizontal" | "rotated" | "fallback";

export interface ChooseAxisModeParams {
  domain: string[];
  formatter: (d: string) => string;
  /** Per-band slot width in px - pass `xScale.step()` (not bandwidth()). */
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

const COS_45 = Math.SQRT1_2;

/** Perpendicular clearance a -45° label needs from its neighbour: ~one 12px line-height. */
const ROTATED_MIN_PERP_SLOT = 16;

/**
 * Axis-parallel px a -45° label needs per neighbour. Rotated labels trail as PARALLEL
 * diagonals, so their clearance is the horizontal gap projected onto the perpendicular
 * (`gap · cos45`) - independent of how long any single label is. That is why rotating
 * fits far more labels than laying them flat, where each one costs its full width.
 */
const ROTATED_MIN_SLOT = ROTATED_MIN_PERP_SLOT / COS_45;

// ---------------------------------------------------------------------------
// Overlap detection
// ---------------------------------------------------------------------------

/** A candidate tick: its position in the band domain and its measured label width. */
export interface LabelSlot {
  index: number;
  width: number;
}

export interface CollisionOptions {
  /** Per-band slot width in px (`xScale.step()`). */
  bandWidth: number;
  mode: "horizontal" | "rotated";
  /** Minimum breathing room between two horizontal labels. */
  padding: number;
  /** Minimum perpendicular clearance between two rotated labels. */
  lineHeight: number;
}

/**
 * Would these two labels collide? Exact, not heuristic - the caller already injects a
 * `measure`, so no DOM and no guessing is involved.
 *
 * Horizontal labels are centred on their band, so a pair needs half of each label's
 * width plus padding. Rotated labels are parallel diagonals one or more bands apart,
 * so only the perpendicular projection of the gap matters.
 */
export function labelsCollide(a: LabelSlot, b: LabelSlot, o: CollisionOptions): boolean {
  const gap = Math.abs(b.index - a.index) * o.bandWidth;
  if (o.mode === "rotated") {
    return gap * COS_45 < o.lineHeight;
  }
  return gap < (a.width + b.width) / 2 + o.padding;
}

/**
 * Drop candidate ticks until none collide, walking left to right.
 *
 * BOTH endpoints are always kept (they orient the axis), so only interior ticks are
 * dropped - including any that would crowd the final endpoint. This is the pass that
 * makes "the sampler picked a tick count but not a tick spacing" impossible; the
 * `niceNumberSample` path could otherwise land two ticks on ADJACENT bands, which is
 * how a monthly axis ended up printing "12-2021" on top of "01-2022".
 */
export function enforceNoOverlap(slots: LabelSlot[], o: CollisionOptions): LabelSlot[] {
  if (slots.length <= 2) return slots;

  const last = slots[slots.length - 1];
  const kept: LabelSlot[] = [slots[0]];

  for (let i = 1; i < slots.length - 1; i++) {
    const slot = slots[i];
    if (labelsCollide(kept[kept.length - 1], slot, o)) continue;
    if (labelsCollide(slot, last, o)) continue;
    kept.push(slot);
  }

  kept.push(last);
  return kept;
}

// ---------------------------------------------------------------------------
// Tick selection
// ---------------------------------------------------------------------------

/** Round a raw step up to the nearest 1/2/5 × 10^k - d3's "nice number" ladder. */
function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

/**
 * Nordic default: when the band labels are numeric (years, etc.), land the thinned
 * ticks on ROUND values (2000, 2050, 2100 …) by snapping nice-number targets to the
 * nearest existing category - instead of index-sampling to arbitrary values (2089).
 * The two endpoints are always kept so the axis still spans the full data extent.
 *
 * Returns INDICES; the caller enforces spacing before mapping back to labels. Snapping
 * gives no spacing guarantee of its own: several targets can snap onto near-adjacent
 * categories wherever the domain's numeric spacing is uneven.
 */
function niceNumberSample(domain: string[], nums: number[], count: number): number[] {
  const lo = nums[0];
  const hi = nums[nums.length - 1];
  const span = Math.abs(hi - lo);
  if (span === 0) return [0, domain.length - 1];

  const step = niceStep(span / Math.max(1, count - 1));
  const start = Math.ceil(Math.min(lo, hi) / step) * step;
  const chosen = new Set<number>([0, domain.length - 1]); // endpoints for orientation
  for (let v = start; v <= Math.max(lo, hi) + 1e-9; v += step) {
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < nums.length; i++) {
      const d = Math.abs(nums[i] - v);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    chosen.add(bestI);
  }
  return [...chosen].sort((a, b) => a - b);
}

const MONTH_PATTERN = /^(\d{4})(\d{2})$/;

/**
 * Recognise a `YYYYMM` band domain and return one month ordinal per category
 * (`year * 12 + month - 1`), or `null` when the domain is anything else.
 *
 * Why this exists: `"202105"` is a finite number, so a monthly domain used to be thinned
 * with the base-10 nice ladder, which is meaningless over a base-12 month field - a step
 * of 50 puts targets either side of every year boundary and they snap onto adjacent
 * categories. Ordinals make the domain evenly spaced, so a calendar step works.
 *
 * Four-digit years are deliberately NOT handled here: base-10 nice steps genuinely are
 * calendar-sensible for years, and `niceNumberSample` already produces round decades.
 */
export function detectMonthDomain(domain: string[]): number[] | null {
  if (domain.length < 2) return null;

  const ordinals: number[] = [];
  for (const value of domain) {
    const match = MONTH_PATTERN.exec(value);
    if (!match) return null;
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    const ordinal = Number(match[1]) * 12 + (month - 1);
    if (ordinals.length > 0 && ordinal <= ordinals[ordinals.length - 1]) return null;
    ordinals.push(ordinal);
  }
  return ordinals;
}

/** Calendar steps in months. Each one lands on a conventional anchor - see monthSample. */
const MONTH_STEPS = [1, 2, 3, 6, 12, 24, 60, 120];

/**
 * Pick month ticks on calendar anchors. `ordinal % step === 0` does the anchoring for
 * free, because the ordinal is `year * 12 + (month - 1)`: `% 12` is every January,
 * `% 6` is Jan/Jul, `% 3` is Jan/Apr/Jul/Oct, `% 24` is January of even years.
 */
function monthSample(
  domain: string[],
  ordinals: number[],
  count: number,
  stride: number,
): number[] {
  const span = ordinals[ordinals.length - 1] - ordinals[0];
  const step =
    MONTH_STEPS.find((s) => s >= stride && span / s + 1 <= count) ??
    MONTH_STEPS[MONTH_STEPS.length - 1];

  const chosen = new Set<number>([0, domain.length - 1]);
  for (let i = 0; i < ordinals.length; i++) {
    if (ordinals[i] % step === 0) chosen.add(i);
  }
  return [...chosen].sort((a, b) => a - b);
}

/**
 * Even index spacing at a whole number of bands, endpoints kept. The fallback for
 * non-numeric categories.
 *
 * Striding rather than dividing the range into `count` parts matters: ticks can only
 * land on whole bands, so "4 ticks fit in 250px" is not the same as "4 ticks fit on 5
 * bands". Rounding a fractional step down to integers produced neighbouring pairs one
 * band apart - too close - which then had to be thrown away, thinning the axis further
 * than necessary. A stride is correct by construction and keeps the most labels.
 */
function evenSample(lastIndex: number, stride: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < lastIndex; i += stride) result.push(i);
  result.push(lastIndex);
  return result;
}

/**
 * Keep at least `minGap` bands between consecutive ticks, dropping interior violators.
 * Both endpoints survive, and an interior tick that would crowd the final endpoint is
 * dropped in its favour.
 *
 * This is the uniform-slot sibling of `enforceNoOverlap` (which measures each label
 * individually). It lives here so `sampleBandTicks`' other caller - the y band axis,
 * whose slot is a line height - gets the same guarantee with no change of its own.
 */
function withMinGap(indices: number[], minGap: number): number[] {
  if (indices.length <= 2 || minGap <= 1) return indices;

  const lastIndex = indices[indices.length - 1];
  const kept = [indices[0]];
  for (let i = 1; i < indices.length - 1; i++) {
    const index = indices[i];
    if (index - kept[kept.length - 1] < minGap) continue;
    if (lastIndex - index < minGap) continue;
    kept.push(index);
  }
  kept.push(lastIndex);
  return kept;
}

/**
 * Evenly thin a band domain so each kept tick gets at least `minSlot` px of the axis.
 * Keeps both endpoints; `YYYYMM` domains land on calendar anchors and other numeric
 * domains on round (nice-number) values. Shared by the x-band thinner (minSlot = a
 * measured label width, or the rotated diagonal slot) and the y-band axis (minSlot = a
 * label's line height).
 */
export function sampleBandTicks(
  domain: string[],
  bandSize: number,
  minSlot: number,
  maxTicks: number,
): string[] {
  if (domain.length === 0) return [];
  if (domain.length === 1) return domain;

  const lastIndex = domain.length - 1;
  const availableWidth = bandSize * domain.length;
  const maxFittingTicks = Math.floor(availableWidth / minSlot);
  const effectiveTicks = Math.max(2, Math.min(maxFittingTicks, maxTicks));

  if (effectiveTicks <= 2 || domain.length <= 2) {
    return [domain[0], domain[lastIndex]];
  }

  if (domain.length <= effectiveTicks) {
    return domain;
  }

  // Whole bands between ticks: what `minSlot` demands, widened if `maxTicks` is the
  // tighter constraint. Every sampler below is held to it.
  const slotStride = bandSize > 0 ? Math.max(1, Math.ceil(minSlot / bandSize)) : 1;
  const stride = Math.max(slotStride, Math.ceil(lastIndex / Math.max(1, maxTicks - 1)));

  const months = detectMonthDomain(domain);
  const nums = domain.map((d) => Number(d));
  let indices: number[];
  if (months) {
    indices = monthSample(domain, months, effectiveTicks, stride);
  } else if (nums.every((n) => Number.isFinite(n))) {
    indices = niceNumberSample(domain, nums, effectiveTicks);
  } else {
    indices = evenSample(lastIndex, stride);
  }

  return withMinGap(indices, stride).map((i) => domain[i]);
}

// ---------------------------------------------------------------------------
// Mode decision
// ---------------------------------------------------------------------------

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

  // 1. Everything fits flat.
  if (maxLabelWidth + padding <= bandWidth) {
    return { mode: "horizontal", tickValues: domain };
  }

  // 2. Every label fits tilted. Whether -45° labels collide depends on the PERPENDICULAR
  // gap between neighbours, NOT on label width: they trail as parallel diagonals exactly
  // one band apart. A few long labels at wide bands therefore rotate cleanly (they only
  // need more bottom margin, which the engine reserves), while a genuinely dense axis -
  // bands narrower than a line of text - falls through to the thinned candidates below.
  const canRotate = forceMode === "auto";
  if (canRotate && bandWidth * COS_45 >= ROTATED_MIN_PERP_SLOT) {
    return { mode: "rotated", tickValues: domain };
  }

  // 3. Too dense to show every label, so thin - and prefer whichever orientation keeps
  // MORE of them. A tilted label costs only its diagonal clearance (~23px) while a flat
  // one costs its full width plus padding, so rotating usually wins by a wide margin on
  // a dense axis. Rotating anyway when it buys nothing would just burn bottom margin,
  // hence the strict comparison rather than an unconditional preference.
  const horizontalTicks = thin(domain, bandWidth, maxLabelWidth + padding, maxTicks, {
    bandWidth,
    mode: "horizontal",
    padding,
    lineHeight: ROTATED_MIN_PERP_SLOT,
    measure,
    formatter,
  });

  if (canRotate) {
    const rotatedTicks = thin(domain, bandWidth, ROTATED_MIN_SLOT, maxTicks, {
      bandWidth,
      mode: "rotated",
      padding,
      lineHeight: ROTATED_MIN_PERP_SLOT,
      measure,
      formatter,
    });
    if (rotatedTicks.length > horizontalTicks.length) {
      return { mode: "rotated", tickValues: rotatedTicks };
    }
  }

  return { mode: "fallback", tickValues: horizontalTicks };
}

/** Sample the domain for one orientation, then drop anything that still collides. */
function thin(
  domain: string[],
  bandWidth: number,
  minSlot: number,
  maxTicks: number,
  o: CollisionOptions & { measure: (label: string) => number; formatter: (d: string) => string },
): string[] {
  const sampled = sampleBandTicks(domain, bandWidth, minSlot, maxTicks);
  const positions = new Map(domain.map((d, i) => [d, i]));
  const slots = sampled.map((d) => ({
    index: positions.get(d) ?? 0,
    width: o.measure(o.formatter(d)),
  }));
  return enforceNoOverlap(slots, o).map((slot) => domain[slot.index]);
}
