// Renderer-agnostic loading / no-data decision. Ported verbatim (logic) from the
// legacy michi-vz hooks/useDisplayIsNodata so the migrated charts decide "no data"
// IDENTICALLY to the old React components — the consumer (e.g. thd MonitorV2) often
// passes only `isLoading` + a no-data component and relies on this DEFAULT predicate.
//
// Used by the engine (vanilla default overlay + skip marks) AND re-exported so a
// framework wrapper can decide whether to render its own isNodata/isLoading node.

export type DataState = "loading" | "nodata" | "ready";

/**
 * Mirrors useDisplayIsNodata's data check (minus the React-only `!isNodataComponent`
 * short-circuit, which the wrapper handles):
 *  - function  -> isNodata(dataSet)
 *  - boolean   -> isNodata
 *  - else, for an array dataSet: series-shaped (item has `series`) → every series
 *    empty; otherwise length === 0.
 */
export function resolveIsNodata<T>(
  isNodata: boolean | ((dataSet: T[] | null | undefined) => boolean) | undefined,
  dataSet: T[] | null | undefined
): boolean {
  if (typeof isNodata === "function") return isNodata(dataSet);
  if (typeof isNodata === "boolean") return isNodata;

  if (Array.isArray(dataSet)) {
    const first = dataSet[0] as { series?: unknown } | undefined;
    if (dataSet.length > 0 && typeof first === "object" && first !== null && "series" in first) {
      return dataSet.every((d) => {
        const s = (d as { series?: unknown }).series;
        return !(Array.isArray(s) && s.length > 0);
      });
    }
    return dataSet.length === 0;
  }
  return false;
}

/** loading takes precedence over no-data; both over ready. */
export function evaluateDataState<T>(opts: {
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: T[] | null | undefined) => boolean);
  dataSet: T[] | null | undefined;
}): DataState {
  if (opts.isLoading) return "loading";
  if (resolveIsNodata(opts.isNodata, opts.dataSet)) return "nodata";
  return "ready";
}
