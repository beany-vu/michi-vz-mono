import { effect, type Injector, type Signal } from "@angular/core";

/**
 * Signals-first binding: re-apply a `Signal<Props>` to a michi-vz element whenever
 * the signal changes, via Angular `effect`. Call inside an injection context (a
 * component constructor) or pass an `injector`.
 */
export function bindChart<E, P>(
  el: E,
  props: Signal<P>,
  apply: (el: E, props: P) => void,
  injector?: Injector,
): void {
  effect(() => apply(el, props()), injector ? { injector } : undefined);
}
