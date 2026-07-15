// Dependency-free easing functions (core deliberately avoids pulling in
// d3-ease for three one-liners). Input and output both live in [0, 1].

export type EasingFn = (t: number) => number;

export type EasingName = "linear" | "easeOutQuad" | "easeInOutCubic";

export const linear: EasingFn = (t) => t;

export const easeOutQuad: EasingFn = (t) => 1 - (1 - t) * (1 - t);

export const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const byName: Record<EasingName, EasingFn> = {
  linear,
  easeOutQuad,
  easeInOutCubic,
};

export function resolveEasing(
  easing: EasingName | EasingFn | undefined,
  fallback: EasingFn,
): EasingFn {
  if (typeof easing === "function") return easing;
  if (easing && easing in byName) return byName[easing];
  return fallback;
}
