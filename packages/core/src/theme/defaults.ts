// App-wide chart defaults (setMichiVzDefaults): the look every chart starts
// from, set once per app the way Highcharts.setOptions was. Precedence is always
// chart prop > these defaults > the built-in look. Every value is resolved
// BEFORE a renderer draws (palette and radii in the data/model layer, font and
// tooltip as css variables on the chart host), so svg, canvas and webgpu agree.

/** Tooltip look shared by every chart (an HTML element in every renderer). */
export interface MichiVzTooltipDefaults {
  /** Corner radius in px (built-in 4). */
  borderRadius?: number;
  /** false = no shadow, true = the built-in shadow, or a css box-shadow value. */
  shadow?: boolean | string;
  /** Background colour (built-in #fff). */
  background?: string;
  /** Border colour (built-in #ccc). */
  borderColor?: string;
  /** Text colour (built-in: inherited). */
  color?: string;
  /** Font size in px (built-in: --michi-vz-font-size, 12px). */
  fontSize?: number;
}

export interface MichiVzDefaults {
  /** Categorical palette for charts given no `colors` (built-in DEFAULT_COLORS). */
  colors?: string[];
  /** Font family for chart text (built-in: inherited from the page). */
  fontFamily?: string;
  /** Corner radius in px for ComparableHorizontal/VerticalBar bars (built-in 5). */
  barRadius?: number;
  /** Corner radius in px for treemap tiles (built-in 1). */
  tileRadius?: number;
  tooltip?: MichiVzTooltipDefaults;
}

let current: MichiVzDefaults = {};

/** Set app-wide chart defaults. Merges into what was set before (tooltip
 *  merges key by key). Charts read them on every render, so call it before the
 *  first chart mounts; mounted charts pick changes up on their next update. */
export function setMichiVzDefaults(next: MichiVzDefaults): void {
  current = {
    ...current,
    ...next,
    ...(next.tooltip ? { tooltip: { ...current.tooltip, ...next.tooltip } } : {}),
  };
}

/** The defaults currently in effect (an empty object when none were set). */
export function getMichiVzDefaults(): Readonly<MichiVzDefaults> {
  return current;
}

/** Back to the built-in look (mainly for tests). */
export function resetMichiVzDefaults(): void {
  current = {};
}

// Built-in tooltip shadow, kept in sync with CORE_CSS.
const BUILT_IN_TOOLTIP_SHADOW = "0 2px 4px rgba(0,0,0,.1)";

/** The tooltip defaults as css custom properties for a chart host. */
export function tooltipCssVars(t: MichiVzTooltipDefaults | undefined): Array<[string, string]> {
  if (!t) return [];
  const vars: Array<[string, string]> = [];
  if (t.borderRadius != null) vars.push(["--michi-vz-tooltip-radius", `${t.borderRadius}px`]);
  if (t.shadow != null) {
    const shadow =
      t.shadow === false ? "none" : t.shadow === true ? BUILT_IN_TOOLTIP_SHADOW : t.shadow;
    vars.push(["--michi-vz-tooltip-shadow", shadow]);
  }
  if (t.background) vars.push(["--michi-vz-tooltip-bg", t.background]);
  if (t.borderColor) vars.push(["--michi-vz-tooltip-border", t.borderColor]);
  if (t.color) vars.push(["--michi-vz-tooltip-color", t.color]);
  if (t.fontSize != null) vars.push(["--michi-vz-tooltip-font-size", `${t.fontSize}px`]);
  return vars;
}

/** Put the app-wide font and tooltip look on a chart host as css variables.
 *  Every engine calls it at mount; the shared chart chrome calls it again each
 *  render. A `fontFamily` prop wins (the chrome writes it after this). */
export function applyHostDefaults(host: HTMLElement): void {
  const d = current;
  if (d.fontFamily) host.style.setProperty("--michi-vz-font-family", d.fontFamily);
  for (const [name, value] of tooltipCssVars(d.tooltip)) host.style.setProperty(name, value);
}
