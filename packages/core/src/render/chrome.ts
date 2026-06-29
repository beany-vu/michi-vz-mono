// Shared per-render "chrome" for every chart engine: the loading / no-data
// DECISION + the host `data-mv-state` attribute + the `--michi-vz-font-family`
// CSS var + the default (vanilla) loading/no-data overlays. Centralised so every
// chart behaves identically; a framework wrapper opts out of the default overlay
// (and renders its own node) via `suppressDefaultOverlay`.
import { evaluateDataState, type DataState } from "../state/dataState";
import { toggleLoadingIndicator } from "./svg/loadingIndicator";
import { toggleNodataIndicator } from "./svg/nodataIndicator";

export interface ChromeRefs {
  loadingEl: HTMLDivElement | null;
  nodataEl: HTMLDivElement | null;
}

export interface ChromeProps<T> {
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: T[] | null | undefined) => boolean);
  noDataLabel?: string;
  suppressDefaultOverlay?: boolean;
  fontFamily?: string;
}

/** Per-instance overlay handles; create once at mount, reuse across renders. */
export function createChromeRefs(): ChromeRefs {
  return { loadingEl: null, nodataEl: null };
}

/**
 * Apply data-state + font + default overlays for one render; returns the resolved
 * DataState. The engine should skip drawing axes/marks when the result is "nodata".
 */
export function applyChartChrome<T>(
  host: HTMLElement,
  props: ChromeProps<T>,
  dataSet: T[] | null | undefined,
  refs: ChromeRefs
): DataState {
  const state = evaluateDataState({
    isLoading: props.isLoading,
    isNodata: props.isNodata,
    dataSet,
  });
  host.setAttribute("data-mv-state", state);
  if (props.fontFamily) host.style.setProperty("--michi-vz-font-family", props.fontFamily);

  const suppress = props.suppressDefaultOverlay ?? false;
  refs.loadingEl = toggleLoadingIndicator(host, !suppress && state === "loading", refs.loadingEl);
  refs.nodataEl = toggleNodataIndicator(
    host,
    !suppress && state === "nodata",
    props.noDataLabel ?? "No data available",
    refs.nodataEl
  );
  return state;
}
