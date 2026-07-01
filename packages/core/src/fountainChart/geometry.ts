// Pure silhouette geometry for the Fountain ("Jet d'Eau") chart. Builds the
// hand-written SVG path strings (M..L..A..L..Z) for a jet's outline, its
// graduated-opacity froth slices, the ballistic droplet arcs, and the misty
// falling skirt. All numbers are PIXELS (post-scale). Path strings are reused
// verbatim by both the SVG renderer (`<path d>`) and canvas (`new Path2D(str)`),
// the Ribbon-chart parity pattern. No d3-shape: the apex arc + lean can't be
// expressed by d3.area.

export interface JetGeometryInput {
  /** pixel x of the nozzle centre */
  xCenter: number;
  /** pixel y of the apex (top) */
  yApex: number;
  /** pixel y of the base/nozzle (bottom) */
  yBase: number;
  /** half-width at the base (tight column) */
  stemHalf: number;
  /** half-width at the apex (the bloom) */
  bloomHalf: number;
  /** horizontal pixels the crown drifts from the base (wind), precomputed by the caller */
  crownDrift: number;
  /** bloom easing exponent (larger = tighter stem, sharper crown) */
  bloomExponent: number;
  /** edge sample count (default 24) */
  samples?: number;
}

export interface FrothSlice {
  path: string;
  /** base opacity (before dimming) for this slice */
  opacity: number;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/** Half-width of the jet at height h (0..H) above the base. */
function widthAt(h: number, H: number, stemHalf: number, bloomHalf: number, p: number): number {
  if (H <= 0) return stemHalf;
  const t = Math.min(1, Math.max(0, h / H));
  return stemHalf + (bloomHalf - stemHalf) * Math.pow(t, p);
}

/** Centreline x of the jet at height h: drifts toward the crown like wind. */
function centerAt(h: number, H: number, xCenter: number, crownDrift: number): number {
  if (H <= 0) return xCenter;
  const t = Math.min(1, Math.max(0, h / H));
  return xCenter + crownDrift * Math.pow(t, 1.2);
}

/** The x of the apex centre (top of the column), drift included. */
export function jetApexCenter(g: JetGeometryInput): number {
  const H = g.yBase - g.yApex;
  return centerAt(H, H, g.xCenter, g.crownDrift);
}

/**
 * The closed silhouette path: up the left edge, an elliptical arc across the
 * crown, down the right edge, close. Falls back to a flat top (a clean spike)
 * when the bloom barely exceeds the stem (near-zero spread).
 */
export function buildJetPath(g: JetGeometryInput): string {
  const stemHalf = Math.max(0.5, g.stemHalf);
  const bloomHalf = Math.max(g.bloomHalf, stemHalf);
  const H = g.yBase - g.yApex;
  const K = Math.max(2, g.samples ?? 24);

  if (H <= 0) {
    // Degenerate (zero/negative height): a thin sliver so nothing throws.
    const x0 = round(g.xCenter - stemHalf);
    const x1 = round(g.xCenter + stemHalf);
    return `M${x0},${round(g.yBase)} L${x0},${round(g.yApex)} L${x1},${round(g.yApex)} L${x1},${round(g.yBase)} Z`;
  }

  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let k = 0; k <= K; k++) {
    const h = (H * k) / K;
    const y = g.yBase - h;
    const w = widthAt(h, H, stemHalf, bloomHalf, g.bloomExponent);
    const cx = centerAt(h, H, g.xCenter, g.crownDrift);
    left.push([round(cx - w), round(y)]);
    right.push([round(cx + w), round(y)]);
  }

  let d = `M${left[0][0]},${left[0][1]}`;
  for (let k = 1; k <= K; k++) d += ` L${left[k][0]},${left[k][1]}`;

  // Crown: an elliptical arc bulging up by a small, capped amount, or a flat top
  // for spikes (bloom ~ stem). rx = bloomHalf so the endpoints are reachable.
  if (bloomHalf > stemHalf + 2) {
    const rx = round(bloomHalf);
    const ry = round(Math.min(bloomHalf * 0.4, 14));
    d += ` A${rx},${ry} 0 0 1 ${right[K][0]},${right[K][1]}`;
  } else {
    d += ` L${right[K][0]},${right[K][1]}`;
  }

  for (let k = K - 1; k >= 0; k--) d += ` L${right[k][0]},${right[k][1]}`;
  d += " Z";
  return d;
}

/**
 * N nested froth slices: slice j rises to H*(j+1)/N with a bloom scaled by the
 * same easing. Stacked translucent, the base (covered by every slice) reads
 * dense and the crown (covered by one) reads wispy. Opacity tapers slightly so
 * the crown is fainter still. Modulates ALPHA of the consumer's single hue only
 * (hard rule #4) - never a hardcoded white.
 */
export function buildFrothSlices(g: JetGeometryInput, layers: number, baseOpacity: number): FrothSlice[] {
  const N = Math.max(1, Math.min(20, Math.round(layers)));
  const stemHalf = Math.max(0.5, g.stemHalf);
  const bloomHalf = Math.max(g.bloomHalf, stemHalf);
  const H = g.yBase - g.yApex;
  const slices: FrothSlice[] = [];
  for (let j = 0; j < N; j++) {
    const frac = (j + 1) / N;
    const sliceApexY = g.yBase - H * frac;
    const sliceBloom = stemHalf + (bloomHalf - stemHalf) * Math.pow(frac, g.bloomExponent);
    const path = buildJetPath({ ...g, yApex: sliceApexY, bloomHalf: sliceBloom });
    // Crown slices a touch fainter than base slices.
    slices.push({ path, opacity: baseOpacity * (1 - 0.4 * frac) });
  }
  return slices;
}

/**
 * Ballistic droplet arcs fanned above the crown (quadratic Beziers). Count is
 * the caller's call (driven by density). Decorative spray; stroked, not filled.
 */
export function buildDropletPaths(g: JetGeometryInput, count: number): string[] {
  const n = Math.max(0, Math.round(count));
  if (n === 0) return [];
  const bloomHalf = Math.max(g.bloomHalf, g.stemHalf);
  const apexX = jetApexCenter(g);
  const apexY = g.yApex;
  const dist = bloomHalf * 0.6 + 10;
  const spreadHalfDeg = 35;
  const paths: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angleDeg = -90 - spreadHalfDeg + t * (2 * spreadHalfDeg);
    const a = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(a) * dist;
    const dy = Math.sin(a) * dist; // negative = up (screen y grows downward)
    const endX = round(apexX + dx);
    const endY = round(apexY + dy);
    const ctrlX = round(apexX + dx * 0.5);
    const ctrlY = round(apexY + dy * 1.4);
    paths.push(`M${round(apexX)},${round(apexY)} Q${ctrlX},${ctrlY} ${endX},${endY}`);
  }
  return paths;
}

/**
 * The misty falling skirt: a wide low cone around the nozzle, widest at the
 * base, tapering to the stem by ~25% of the height. Filled at very low alpha so
 * it reads as haze. The detail that makes the silhouette read as THE Jet d'Eau.
 */
export function buildMistPath(g: JetGeometryInput, slotHalf: number): string | null {
  const stemHalf = Math.max(0.5, g.stemHalf);
  const bloomHalf = Math.max(g.bloomHalf, stemHalf);
  const H = g.yBase - g.yApex;
  if (H <= 0) return null;
  const hTop = H * 0.25;
  const mistHalfBase = Math.min(Math.max(bloomHalf * 1.2, stemHalf * 2.5), slotHalf);
  if (mistHalfBase <= stemHalf + 1) return null;

  const K = 6;
  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let k = 0; k <= K; k++) {
    const h = (hTop * k) / K;
    const y = g.yBase - h;
    const taper = Math.pow(1 - h / hTop, 1.5);
    const half = stemHalf + (mistHalfBase - stemHalf) * taper;
    const cx = centerAt(h, H, g.xCenter, g.crownDrift);
    left.push([round(cx - half), round(y)]);
    right.push([round(cx + half), round(y)]);
  }
  let d = `M${left[0][0]},${left[0][1]}`;
  for (let k = 1; k <= K; k++) d += ` L${left[k][0]},${left[k][1]}`;
  for (let k = K; k >= 0; k--) d += ` L${right[k][0]},${right[k][1]}`;
  d += " Z";
  return d;
}
