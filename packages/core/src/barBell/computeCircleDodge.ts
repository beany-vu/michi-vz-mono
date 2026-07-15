// When several end-cap "bell" circles in a BarBell row land within a circle-
// diameter of each other - typically because their key values are 0 / near-0, so
// the cumulative bar segment has no width - they stack on top of one another and
// only the topmost is visible. This spreads such a cluster vertically into a
// column centred on the row's centre line, so every circle stays visible.
//
// `cxs` are the circle centre x-positions in draw order (cumulative, monotonically
// non-decreasing), so a cluster is a run of consecutive circles each within a
// diameter of the previous. Returns a vertical offset (px, delta from the row
// centre line) per circle - 0 for circles that don't overlap a neighbour. Shared
// by the SVG and canvas renderers so both dodge identically.
//
// `boxHeight` (optional) bounds a cluster's spread to the row's y-band so circles
// stay inside it (50% above / 50% below the bar line) instead of spilling into
// neighbouring rows. The natural one-diameter spacing is kept whenever it fits;
// only an over-tall cluster has its spacing compressed. Ported verbatim from the
// legacy michi-vz hooks/barBellChart/computeCircleDodge.ts.
export function computeCircleDodgeOffsets(
  cxs: number[],
  radius: number,
  boxHeight?: number,
): number[] {
  const n = cxs.length;
  const offsets = new Array<number>(n).fill(0);
  if (n < 2) return offsets;
  const diameter = radius * 2;

  const spread = (start: number, end: number): void => {
    const size = end - start;
    if (size < 2) return;
    let step = diameter;
    if (boxHeight !== undefined) {
      const fitStep = Math.max(0, (boxHeight - diameter) / (size - 1));
      step = Math.min(diameter, fitStep);
    }
    for (let i = start; i < end; i++) {
      offsets[i] = (i - start - (size - 1) / 2) * step;
    }
  };

  let clusterStart = 0;
  for (let i = 1; i < n; i++) {
    if (cxs[i] - cxs[i - 1] >= diameter) {
      spread(clusterStart, i);
      clusterStart = i;
    }
  }
  spread(clusterStart, n);
  return offsets;
}

export default computeCircleDodgeOffsets;
