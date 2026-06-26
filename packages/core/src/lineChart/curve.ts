// Moved from michi-vz src/utils/curve.ts. Granular d3-shape imports keep the
// core bundle tree-shakeable (no full `d3`).
import { curveBumpX, curveLinear, curveMonotoneX } from "d3-shape";
import type { CurveFactory } from "d3-shape";
import type { CurveType } from "../types";

// Library-wide default interpolation. curveMonotoneX passes through every point,
// follows the data's local slope without overshoot, and emits a straight lineTo
// for exactly two points -- so a 2-point series is never drawn as an S-bend.
export const DEFAULT_CURVE: CurveType = "curveMonotoneX";

export const resolveCurveName = (curve?: CurveType): CurveType => curve ?? DEFAULT_CURVE;

const CURVE_FACTORIES: Record<CurveType, CurveFactory> = {
  curveBumpX,
  curveLinear,
  curveMonotoneX,
};

export const resolveCurveFactory = (curve?: CurveType): CurveFactory =>
  CURVE_FACTORIES[resolveCurveName(curve)];
