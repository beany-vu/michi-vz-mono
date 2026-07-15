// Merge shared MichiVz state (from a provider/store/event bus) into a chart's
// props before mount/update. Faithful to the legacy michi-vz behaviour where a
// chart combined its MichiVzContext values with its own props:
//   - colorsMapping: context ∪ props, PROP WINS per-label (so a chart can override).
//   - highlightItems / disabledItems / fontFamily / singlePointLine: PROP WINS when
//     provided; otherwise fall back to the shared state.
//
// Pure + framework-agnostic, so react/vue/svelte/angular wrappers (and a future
// CustomEvent coordinator) all apply IDENTICAL merge semantics.
import type { MichiVzState } from "./store";

type SharedProps = {
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  fontFamily?: string;
  singlePointLine?: MichiVzState["singlePointLine"];
};

export function resolveEffectiveProps<P extends SharedProps>(
  props: P,
  state: Partial<MichiVzState> | null | undefined,
): P {
  if (!state) return props;
  const merged: P = { ...props };

  // colorsMapping: shared first, prop overrides per-label.
  if (state.colorsMapping || props.colorsMapping) {
    merged.colorsMapping = { ...(state.colorsMapping ?? {}), ...(props.colorsMapping ?? {}) };
  }
  // The rest: only fill from shared state when the prop didn't supply them.
  if (props.highlightItems === undefined && state.highlightItems) {
    merged.highlightItems = state.highlightItems;
  }
  if (props.disabledItems === undefined && state.disabledItems) {
    merged.disabledItems = state.disabledItems;
  }
  if (props.fontFamily === undefined && state.fontFamily !== undefined) {
    merged.fontFamily = state.fontFamily;
  }
  if (props.singlePointLine === undefined && state.singlePointLine !== undefined) {
    merged.singlePointLine = state.singlePointLine;
  }
  return merged;
}
