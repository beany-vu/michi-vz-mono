// React wrapper over the @michi-vz/core engine. SSR-safe: renders a sized
// placeholder on the server and mounts the engine on the client in an effect.
//
// Back-compat barrel. Prefer the per-chart subpaths (@michi-vz/react/line-chart)
// so a bundler can drop the 21 charts you do not use; this barrel pulls in all 22.
import { useEffect } from "react";

// Shared-state provider + hook. They live in ONE internal module because React
// context identity is per module instance: a second createContext would give a
// provider that appears mounted but reaches nothing.
export { MichiVzProvider, useChartContext } from "./internal/context";
export type { MichiVzProviderProps } from "./internal/context";
export type { MichiVzState } from "./internal/context";

export type {
  GapChartProps,
  LineChartProps,
  FanChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  ComparableBarDataPoint,
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  TreemapChartProps,
  PieChartProps,
  GaugeChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethDataItem,
  GeoFeatureItem,
  ChoroplethMapChartProps,
  SymbolMapDataItem,
  SymbolMapChartProps,
  RadialTreeNode,
  RadialTreeChartProps,
  ChartContext,
} from "@michi-vz/core";

// Hatch-pattern helper (for the `patternsMapping` prop) - re-exported so consumers
// import it from @michi-vz/react like the legacy michi-vz did.
export { createHatchPattern } from "@michi-vz/core";
export type { HatchPatternOptions } from "@michi-vz/core";

export * from "./gauge-chart";
export * from "./line-chart";
export * from "./fan-chart";
export * from "./area-chart";
export * from "./scatter-chart";
export * from "./range-chart";
export * from "./ribbon-chart";
export * from "./radar-chart";
export * from "./vertical-stack-bar-chart";
export * from "./comparable-horizontal-bar-chart";
export * from "./comparable-vertical-bar-chart";
export * from "./dual-horizontal-bar-chart";
export * from "./bar-bell-chart";
export * from "./gap-chart";
export * from "./treemap-chart";
export * from "./pie-chart";
export * from "./bubble-chart";
export * from "./sankey-chart";
export * from "./fountain-chart";
export * from "./choropleth-map-chart";
export * from "./symbol-map-chart";
export * from "./radial-tree-chart";

// ---- devtools ---------------------------------------------------------------

// Module-local ambient: this package ships no node types, but the check below must
// stay the literal `process.env.NODE_ENV` so bundlers constant-fold it and drop the
// devtools chunk from production builds.
declare const process: { env: { NODE_ENV?: string } } | undefined;

export interface MichiVzDevtoolsProps {
  /** Mount even when process.env.NODE_ENV === "production" (default: dev-only). */
  forceMount?: boolean;
  /** Where to attach the panel's shadow host (default: document.body). */
  container?: HTMLElement;
  /**
   * Force the initial state. Default: restore the last open/closed state from
   * localStorage; closed (floating button only) on first run.
   */
  open?: boolean;
  /** Toggle hotkey; null disables it. Default: Ctrl/Cmd+Shift+M. */
  hotkey?: import("@michi-vz/devtools").DevtoolsHotkey | null;
  /** Panel theme; "auto" (default) follows prefers-color-scheme. */
  theme?: import("@michi-vz/devtools").DevtoolsTheme;
  /**
   * Starting corner for the floating toggle button (default "bottom-right").
   * The button is draggable; a dragged spot is remembered and wins over this.
   */
  buttonPosition?: import("@michi-vz/devtools").DevtoolsButtonPosition;
}

/**
 * Renders nothing; mounts the @michi-vz/devtools floating toggle button (click it,
 * or Ctrl/Cmd+Shift+M, to open the panel; drag it anywhere) while it is in the
 * tree. Dev-only by default: the dynamic import is behind a NODE_ENV check, so
 * bundlers drop the devtools chunk from production builds entirely (pass
 * `forceMount` to opt into shipping it, e.g. on a staging build).
 *
 *   {process.env.NODE_ENV !== "production" && <MichiVzDevtools />}
 */
export function MichiVzDevtools({
  forceMount,
  container,
  open,
  hotkey,
  theme,
  buttonPosition,
}: MichiVzDevtoolsProps = {}): null {
  useEffect(() => {
    const isProd = typeof process !== "undefined" && process.env.NODE_ENV === "production";
    if (isProd && !forceMount) return;
    let handle: import("@michi-vz/devtools").DevtoolsHandle | null = null;
    let cancelled = false;
    void import("@michi-vz/devtools").then((m) => {
      if (cancelled) return;
      handle = m.mountDevtools({ container, open, hotkey, theme, buttonPosition });
    });
    return () => {
      cancelled = true;
      handle?.destroy();
    };
    // mount once; the panel tracks charts itself via the core hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
