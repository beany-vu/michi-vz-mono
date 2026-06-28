// Actual-vs-predicted provenance. `certainty` drives solid/dashed RENDERING but is
// overloaded (detectGaps also flips it false), so a point's forecast status is read
// from the explicit `predicted` flag, falling back to `certainty === false`. Keeping
// this in one place means every context builder (and the devtools) agree on the split.

/** A data point that may carry provenance (Line/Fan `DataPoint`, `RangeDataPoint`, ...). */
export interface ProvenancePoint {
  date: number | string;
  certainty?: boolean;
  predicted?: boolean;
}

/** True when the point is a forecast/projection rather than an observed value. */
export function isPredicted(pt: ProvenancePoint): boolean {
  return pt.predicted ?? pt.certainty === false;
}

export interface ProvenanceCounts {
  actualCount: number;
  predictedCount: number;
  /** x of the first predicted point (the forecast boundary), or null when none. */
  forecastStart: number | string | null;
}

/** Count actual vs predicted points and find where the forecast begins. */
export function provenanceCounts(points: ReadonlyArray<ProvenancePoint>): ProvenanceCounts {
  let actualCount = 0;
  let predictedCount = 0;
  let forecastStart: number | string | null = null;
  for (const pt of points) {
    if (isPredicted(pt)) {
      predictedCount++;
      if (forecastStart === null) forecastStart = pt.date;
    } else {
      actualCount++;
    }
  }
  return { actualCount, predictedCount, forecastStart };
}
