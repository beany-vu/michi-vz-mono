// Plugin contract for @michi-vz. INTERFACES ONLY — zero runtime, so core stays
// AI-dependency-free while the engines can host opt-in plugins (e.g. the
// @michi-vz/insights forecast / anomaly / narrate / agent suite). A chart with no
// plugins registered runs exactly as before (the runner folds over an empty list).
import type { ChartContext, DataWarning } from "../types";

/** Handle a plugin receives to read props/context and drive a re-render. */
export interface PluginContext<P> {
  chartType: string;
  /** The user's props (NOT the plugin-transformed copy). */
  getProps(): Readonly<P>;
  /** The most recent renderer-agnostic context, or null before first render. */
  getContext(): ChartContext | null;
  /** Merge a patch into props and trigger a re-render (engine `update()` path). */
  setProps(patch: Partial<P>): void;
}

/** A function-calling / MCP-style tool a chart exposes to an agent. */
export interface AgentTool {
  name: string;
  description: string;
  /** JSON-schema-ish description of the args (opaque to core). */
  inputSchema?: unknown;
  run(args: unknown): unknown | Promise<unknown>;
}

/** A decorative annotation (threshold/goal line, fall-point marker, band, forecast zone). */
export interface Annotation {
  type: "hline" | "vline" | "point" | "band" | "xband";
  /** y-value for hline / band edge; ignored for vline. */
  value?: number;
  /** x-position for vline / point; the LEFT edge for an `xband`. */
  at?: number | string;
  /** the RIGHT edge for an `xband` (a full-height vertical region at..at2). */
  at2?: number | string;
  /** second edge for a `band` (with `value` as the other edge). */
  value2?: number;
  label?: string;
  dashed?: boolean;
  color?: string;
  /** fill opacity override for band / xband (default ~0.08). */
  opacity?: number;
}

/**
 * A plugin implements any subset of these optional hooks. Hooks fire in
 * registration order (later plugins see earlier output) at fixed points in every
 * engine's render():
 *  - transformData: before data processing (forecast appends predicted points)
 *  - validate:      merged into the onDataWarning path
 *  - enrichContext: after the context is built, before a11y mirror + event
 *  - annotate:      fed to the annotations renderer (drawn above marks)
 *  - provideTools:  collected by the agent / MCP host
 */
export interface MichiVzPlugin<P = unknown> {
  name: string;
  setup?(pc: PluginContext<P>): void | (() => void);
  transformData?(props: P, pc: PluginContext<P>): P;
  validate?(props: P, pc: PluginContext<P>): DataWarning[];
  enrichContext?(ctx: ChartContext, pc: PluginContext<P>): ChartContext;
  annotate?(ctx: ChartContext, pc: PluginContext<P>): Annotation[];
  provideTools?(pc: PluginContext<P>): AgentTool[];
}
