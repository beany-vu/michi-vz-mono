// Tiny, pure helpers that fold a plugin list at each engine hook point. Kept
// separate so all 11 engines wire plugins identically. Folding over an empty list
// is the identity, so zero-plugin charts are unaffected.
import type { ChartContext, DataWarning } from "../types";
import type { AgentTool, Annotation, MichiVzPlugin, PluginContext } from "./types";

export function applyTransformData<P>(
  plugins: MichiVzPlugin<P>[],
  props: P,
  pc: PluginContext<P>
): P {
  return plugins.reduce((acc, pl) => (pl.transformData ? pl.transformData(acc, pc) : acc), props);
}

export function applyEnrichContext<P>(
  plugins: MichiVzPlugin<P>[],
  ctx: ChartContext,
  pc: PluginContext<P>
): ChartContext {
  return plugins.reduce((acc, pl) => (pl.enrichContext ? pl.enrichContext(acc, pc) : acc), ctx);
}

export function collectValidate<P>(
  plugins: MichiVzPlugin<P>[],
  props: P,
  pc: PluginContext<P>
): DataWarning[] {
  return plugins.flatMap((pl) => (pl.validate ? pl.validate(props, pc) : []));
}

export function collectAnnotations<P>(
  plugins: MichiVzPlugin<P>[],
  ctx: ChartContext,
  pc: PluginContext<P>
): Annotation[] {
  return plugins.flatMap((pl) => (pl.annotate ? pl.annotate(ctx, pc) : []));
}

export function collectTools<P>(plugins: MichiVzPlugin<P>[], pc: PluginContext<P>): AgentTool[] {
  return plugins.flatMap((pl) => (pl.provideTools ? pl.provideTools(pc) : []));
}

/** Run each plugin's setup; return the teardown fns to call on destroy. */
export function setupPlugins<P>(plugins: MichiVzPlugin<P>[], pc: PluginContext<P>): Array<() => void> {
  const teardowns: Array<() => void> = [];
  for (const pl of plugins) {
    const t = pl.setup?.(pc);
    if (typeof t === "function") teardowns.push(t);
  }
  return teardowns;
}
