// Moved verbatim from michi-vz src/components/hooks/lineChart/lttb.ts.
// LTTB (Largest-Triangle-Three-Buckets) downsampling — reduces a series to
// roughly `threshold` points while preserving the shape a human reads off a line
// chart. Pure; never constructs new points (the result is a subset, so
// `certainty`/`label`/`code` and object identity are preserved). Used by the
// Canvas renderer so very large series stay cheap to draw.
import type { DataPoint } from "../types";

export function lttb(
  points: DataPoint[],
  threshold: number,
  getX: (d: DataPoint) => number,
  getY: (d: DataPoint) => number
): DataPoint[] {
  // Nothing to gain: the series already fits, or the threshold is too small to
  // form even one middle bucket. Return the input untouched (same reference).
  if (threshold < 3 || points.length <= threshold) {
    return points;
  }

  const sampled: DataPoint[] = [];
  const bucketSize = (points.length - 2) / (threshold - 2);

  sampled.push(points[0]);
  let prevSelectedIndex = 0;

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < points.length ? avgRangeEnd : points.length;

    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += getX(points[avgRangeStart]);
      avgY += getY(points[avgRangeStart]);
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    let rangeOffset = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    const pointAX = getX(points[prevSelectedIndex]);
    const pointAY = getY(points[prevSelectedIndex]);

    let maxArea = -1;
    let maxAreaIndex = rangeOffset;
    for (; rangeOffset < rangeTo; rangeOffset++) {
      const area = Math.abs(
        (pointAX - avgX) * (getY(points[rangeOffset]) - pointAY) -
          (pointAX - getX(points[rangeOffset])) * (avgY - pointAY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = rangeOffset;
      }
    }

    sampled.push(points[maxAreaIndex]);
    prevSelectedIndex = maxAreaIndex;
  }

  sampled.push(points[points.length - 1]);

  return sampled;
}
