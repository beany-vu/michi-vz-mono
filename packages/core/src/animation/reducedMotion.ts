// prefers-reduced-motion lookup, injectable so engines and tests can stub it.
// Animations opt down to their instant/discrete equivalent when reduced motion
// is requested; the feature itself stays on because the consumer opted in.

export interface MotionPreference {
  prefersReduced(): boolean;
}

/** Queries matchMedia live on every call (the OS setting can change while the
 *  page is open). Safe no-window/no-matchMedia fallback: false. */
export function defaultMotionPreference(): MotionPreference {
  return {
    prefersReduced() {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
  };
}
