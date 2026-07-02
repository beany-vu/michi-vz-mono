// The in-page devtools panel. Discovers every mounted michi-vz chart (via the core
// hook for imperative/post-enable mounts + a DOM sweep for <michi-vz-*> elements),
// shows each chart's live ChartContext (incl. actual vs predicted provenance), and
// lets you diagnose sizing, inspect scales, diff snapshots, run AI insights, drive
// highlight/disable, and edit the dataSet.
//
// The panel renders inside its OWN shadow root so its styles never leak into (or get
// broken by) the host app; the charts themselves stay light-DOM per the library's
// color contract. No framework deps.
import {
  enableDevtools,
  type AgentTool,
  type ChartContext,
  type DevtoolsChartEntry,
  type DevtoolsHitEvent,
} from "@michi-vz/core";
import { ensureDevtoolsStyles } from "./styles";
import { diffObjects } from "./diff";
import { auditContext, type AuditableContext } from "./a11y";

export interface DevtoolsHotkey {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type DevtoolsTheme = "auto" | "dark" | "light";

export interface MountDevtoolsOptions {
  /** Where to attach the panel's shadow host (default: document.body). */
  container?: HTMLElement;
  /** Start open (default true). */
  open?: boolean;
  /** Toggle hotkey; set null to disable. Default: Ctrl/Cmd+Shift+M. */
  hotkey?: DevtoolsHotkey | null;
  /** Panel theme; "auto" (default) follows prefers-color-scheme. */
  theme?: DevtoolsTheme;
}

export interface DevtoolsHandle {
  open(): void;
  close(): void;
  toggle(): void;
  /** Re-scan the DOM and re-render (use after mounting charts outside the hook). */
  refresh(): void;
  destroy(): void;
  /** The panel's shadow root (query into it from tests/custom UIs); null in SSR. */
  getRoot(): ShadowRoot | null;
}

interface WcElement extends HTMLElement {
  getContext?: () => ChartContext | null;
  getTools?: () => AgentTool[];
  dataSet?: unknown;
  highlightItems?: string[];
  disabledItems?: string[];
}

const DEFAULT_HOTKEY: DevtoolsHotkey = { key: "m", ctrl: true, meta: true, shift: true };

type TabKey = "overview" | "sizing" | "scales" | "diff" | "hittest" | "profiler" | "insights" | "a11y";
const TABS: Array<[TabKey, string]> = [
  ["overview", "Overview"],
  ["sizing", "Sizing"],
  ["scales", "Scales"],
  ["diff", "Diff"],
  ["hittest", "Hit-test"],
  ["profiler", "Profiler"],
  ["insights", "Insights"],
  ["a11y", "A11y"],
];

// The one-click AI actions the Insights tab knows how to surface. Tool names may be
// bare ("narrate") or registry-namespaced ("chart.narrate"); both match. Each hint
// states exactly what runs - by default NO language model is involved, and saying so
// out loud is the point (no mystery, no surprise downloads).
const AI_ACTIONS: Array<{ key: string; label: string; hint: string }> = [
  {
    key: "narrate",
    label: "✦ Narrate",
    hint: "Deterministic prose computed from the chart's data by fixed rules - no language model runs and nothing is downloaded. (The narrate plugin CAN be configured with a model; even then it falls back to these rules.)",
  },
  {
    key: "anomaly",
    label: "✦ Detect anomalies",
    hint: "Pure statistics (z-score, IQR fences, or forecast band) - the result names the method, threshold, and the exact logic. No language model, nothing downloaded.",
  },
  {
    key: "forecast",
    label: "✦ Forecast",
    hint: "Statistical projection (Holt exponential smoothing or a least-squares line) with a confidence band - no language model, nothing downloaded.",
  },
];

// ---- tiny DOM helpers -------------------------------------------------------
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = []
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.append(c);
  return n;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function shortJson(value: unknown, max = 80): string {
  let s: string;
  try {
    s = JSON.stringify(value);
  } catch {
    s = String(value);
  }
  if (s == null) s = String(value);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// ---- discovery --------------------------------------------------------------
// Wrap a <michi-vz-*> custom element as a devtools entry (fallback for charts that
// mounted before devtools was enabled, so they never registered with the hook).
function domEntry(node: WcElement, index: number): DevtoolsChartEntry {
  const tag = node.tagName.toLowerCase();
  const ctxType = node.getContext?.()?.chartType;
  return {
    id: node.id ? `${tag}#${node.id}` : `${tag}-dom-${index}`,
    chartType: ctxType ?? tag.replace(/^michi-vz-/, ""),
    host: node,
    getContext: () => node.getContext?.() ?? null,
    getProps: () => ({
      dataSet: node.dataSet,
      highlightItems: node.highlightItems ?? [],
      disabledItems: node.disabledItems ?? [],
    }),
    setProps: (patch) => Object.assign(node, patch),
    getTools: node.getTools ? () => node.getTools!() : undefined,
  };
}

// ---- panel ------------------------------------------------------------------
export function mountDevtools(opts: MountDevtoolsOptions = {}): DevtoolsHandle {
  if (typeof document === "undefined") {
    const noop = () => {};
    return { open: noop, close: noop, toggle: noop, refresh: noop, destroy: noop, getRoot: () => null };
  }
  const hook = enableDevtools();
  const container = opts.container ?? document.body;
  const hotkey = opts.hotkey === undefined ? DEFAULT_HOTKEY : opts.hotkey;

  // Shadow host wrapper: style isolation without an iframe (the TanStack pattern).
  const wrapper = el("div", { class: "mv-devtools-root" });
  if (opts.theme && opts.theme !== "auto") wrapper.setAttribute("data-theme", opts.theme);
  const root = wrapper.attachShadow({ mode: "open" });
  ensureDevtoolsStyles(root);
  container.append(wrapper);

  const MAX_HISTORY = 30;
  let selectedId: string | null = null;
  let selectedTab: TabKey = "overview";
  let controlsKey = ""; // selection + live/history mode the controls were last built for
  let viewBack = 0; // 0 = live (latest); N = N snapshots back for the selected chart
  let isOpen = opts.open ?? true;

  // Per-chart ring buffer of ChartContext snapshots (captured on every update), so
  // you can step back through how a chart's state changed - the core debug feature.
  const history = new Map<string, ChartContext[]>();
  const lastJson = new Map<string, string>();
  // Last AI action result per chart (survives re-renders; cleared on selection change).
  const aiState = new Map<string, { tool: string; text: string; labels?: string[] }>();
  // Each chart's editable props as first seen by the panel, so Reset can undo every
  // panel-driven edit (dataSet, highlight, disable) in one click. JSON-cloned: the
  // three fields are data-only, and function props are never touched by the panel.
  const initialProps = new Map<string, { dataSet?: unknown; highlightItems: string[]; disabledItems: string[] }>();
  function rememberInitial(e: DevtoolsChartEntry): void {
    if (initialProps.has(e.id)) return;
    const p = (e.getProps() ?? {}) as { dataSet?: unknown; highlightItems?: string[]; disabledItems?: string[] };
    try {
      initialProps.set(e.id, {
        dataSet: p.dataSet === undefined ? undefined : (JSON.parse(JSON.stringify(p.dataSet)) as unknown),
        highlightItems: [...(p.highlightItems ?? [])],
        disabledItems: [...(p.disabledItems ?? [])],
      });
    } catch {
      // non-serializable dataSet - reset stays unavailable for this chart
    }
  }
  // Canvas hit-test event ring buffer (all hosts; filtered per selection at render).
  const MAX_HITS = 200;
  const hitLog: DevtoolsHitEvent[] = [];
  let hitRenderQueued = false;
  const onHit = (e: DevtoolsHitEvent): void => {
    hitLog.push(e);
    if (hitLog.length > MAX_HITS) hitLog.shift();
    // Throttle: a mousemove stream must not re-render the panel per event.
    if (!isOpen || selectedTab !== "hittest" || hitRenderQueued) return;
    hitRenderQueued = true;
    setTimeout(() => {
      hitRenderQueued = false;
      if (isOpen && selectedTab === "hittest") render();
    }, 80);
  };
  // Per-chart render durations reported by attachDevtools around update() (ring 60).
  const MAX_TIMINGS = 60;
  const timings = new Map<string, number[]>();
  const onTiming = (id: string, ms: number): void => {
    const arr = timings.get(id) ?? [];
    arr.push(ms);
    if (arr.length > MAX_TIMINGS) arr.shift();
    timings.set(id, arr);
  };

  // Marker dot placed over the chart host at the last hit position (inline-styled:
  // it lives in the app's light DOM, outside our shadow root).
  let hitDot: HTMLElement | null = null;
  function removeHitDot(): void {
    hitDot?.remove();
    hitDot = null;
  }
  function placeHitDot(host: HTMLElement, e: DevtoolsHitEvent): void {
    if (!hitDot || hitDot.parentElement !== host) {
      removeHitDot();
      hitDot = document.createElement("div");
      hitDot.setAttribute("data-michi-vz-devtools-hitdot", "");
      host.appendChild(hitDot);
    }
    const color = e.label ? "#2ec56f" : "#e05252";
    hitDot.style.cssText =
      `position:absolute;left:${e.x - 5}px;top:${e.y - 5}px;width:10px;height:10px;` +
      `border:2px solid ${color};border-radius:999px;pointer-events:none;z-index:9999;box-sizing:border-box;`;
  }

  function capture(): void {
    for (const e of entries()) {
      rememberInitial(e);
      const ctx = e.getContext();
      if (!ctx) continue;
      const json = safeJson(ctx);
      if (lastJson.get(e.id) === json) continue; // unchanged since last snapshot
      const arr = history.get(e.id) ?? [];
      arr.push(JSON.parse(json) as ChartContext);
      lastJson.set(e.id, json);
      let shifted = false;
      if (arr.length > MAX_HISTORY) {
        arr.shift();
        shifted = true;
      }
      history.set(e.id, arr);
      // Keep a paused view pinned to the same snapshot when newer data lands.
      if (e.id === selectedId && viewBack > 0 && !shifted) {
        viewBack = Math.min(viewBack + 1, arr.length - 1);
      }
    }
  }

  function refresh(): void {
    capture();
    // Snapshots always happen (history stays complete); DOM work only when visible.
    if (isOpen) render();
  }

  // Hook-notify coalescing for many-chart pages. Small pages keep the synchronous,
  // instant refresh; past the threshold a burst (N charts mounting/updating in one
  // frame, each notifying) collapses into a leading refresh + ONE trailing refresh
  // instead of N full re-renders with N context serializations each.
  const BURST_THRESHOLD = 8;
  let lastRefreshAt = 0;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleRefresh(): void {
    if (hook.charts.size <= BURST_THRESHOLD) {
      refresh();
      return;
    }
    if (refreshTimer !== null) return; // trailing refresh already queued
    const now = Date.now();
    if (now - lastRefreshAt > 100) {
      lastRefreshAt = now;
      refresh();
      return;
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      lastRefreshAt = Date.now();
      refresh();
    }, 100);
  }

  // -- structure --
  const toggleBtn = el("button", { class: "mv-devtools-toggle", title: "michi-vz devtools" }, ["◧ michi-vz"]);
  const countEl = el("span", { class: "mv-devtools-count" });
  // Long-lived filter input (never rebuilt, so typing survives re-renders).
  let filterText = "";
  const filterEl = el("input", { class: "mv-devtools-filter", type: "search", placeholder: "filter charts" });
  filterEl.addEventListener("input", () => {
    filterText = filterEl.value.trim().toLowerCase();
    render();
  });
  const listEl = el("div", { class: "mv-devtools-list" });
  const listWrapEl = el("div", { class: "mv-devtools-listwrap" }, [filterEl, listEl]);
  const historyNavEl = el("div");
  const tabsEl = el("div", { class: "mv-devtools-tabs" });
  const contentEl = el("div");
  const readoutEl = el("div");
  const controlsEl = el("div");
  const detailEl = el("div", { class: "mv-devtools-detail" }, [historyNavEl, tabsEl, contentEl]);

  const refreshBtn = el("button", { class: "mv-devtools-btn" }, ["⟳"]);
  const maxBtn = el("button", { class: "mv-devtools-btn", title: "Maximize / restore panel" }, ["⛶"]);
  const closeBtn = el("button", { class: "mv-devtools-btn" }, ["×"]);
  const header = el("div", { class: "mv-devtools-header" }, [
    el("span", { class: "mv-devtools-title" }, ["michi-vz devtools"]),
    countEl,
    el("span", { class: "mv-devtools-spacer" }),
    refreshBtn,
    maxBtn,
    closeBtn,
  ]);
  const resizeHandle = el("div", { class: "mv-devtools-resize", title: "Drag to resize" });
  const panel = el("div", { class: "mv-devtools" }, [
    resizeHandle,
    header,
    el("div", { class: "mv-devtools-body" }, [listWrapEl, detailEl]),
  ]);

  root.append(toggleBtn, panel);

  // -- sizing: default 560px wide, drag the top-left corner to grow (the panel is
  //    right/bottom-anchored so it grows leftward/upward), remembered per browser --
  const SIZE_KEY = "michi-vz-devtools-size";
  const MIN_W = 360;
  const MIN_H = 240;
  const clampW = (w: number): number => Math.min(Math.max(w, MIN_W), Math.max(MIN_W, window.innerWidth - 32));
  const clampH = (h: number): number => Math.min(Math.max(h, MIN_H), Math.max(MIN_H, window.innerHeight - 32));
  function applySize(w: number, h: number): void {
    panel.style.setProperty("--mvdt-w", `${clampW(w)}px`);
    panel.style.setProperty("--mvdt-h", `${clampH(h)}px`);
  }
  try {
    const saved = JSON.parse(localStorage.getItem(SIZE_KEY) ?? "null") as { w?: number; h?: number } | null;
    if (saved && typeof saved.w === "number" && typeof saved.h === "number") applySize(saved.w, saved.h);
  } catch {
    // storage unavailable (privacy mode) - keep defaults
  }

  maxBtn.addEventListener("click", () => panel.classList.toggle("is-max"));

  let dragMove: ((e: MouseEvent) => void) | null = null;
  let dragUp: (() => void) | null = null;
  function endDrag(): void {
    if (dragMove) window.removeEventListener("mousemove", dragMove);
    if (dragUp) window.removeEventListener("mouseup", dragUp);
    dragMove = null;
    dragUp = null;
  }
  resizeHandle.addEventListener("mousedown", (e: MouseEvent) => {
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    // jsdom rects are 0x0 - fall back to the current vars / defaults
    const startW = rect.width || parseFloat(panel.style.getPropertyValue("--mvdt-w")) || 560;
    const startH = rect.height || parseFloat(panel.style.getPropertyValue("--mvdt-h")) || 480;
    const startX = e.clientX;
    const startY = e.clientY;
    endDrag();
    dragMove = (ev: MouseEvent) => applySize(startW + (startX - ev.clientX), startH + (startY - ev.clientY));
    dragUp = () => {
      endDrag();
      try {
        localStorage.setItem(
          SIZE_KEY,
          JSON.stringify({
            w: parseFloat(panel.style.getPropertyValue("--mvdt-w")),
            h: parseFloat(panel.style.getPropertyValue("--mvdt-h")),
          })
        );
      } catch {
        // storage unavailable - size stays session-only
      }
    };
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragUp);
  });

  // -- entry list (hook entries first; DOM-discovered wc elements that aren't hooked) --
  function entries(): DevtoolsChartEntry[] {
    const hooked = [...hook.charts.values()];
    const hostSet = new Set(hooked.map((e) => e.host));
    const dom: DevtoolsChartEntry[] = [];
    const nodes = document.querySelectorAll<WcElement>('[class*="michi-vz-"]');
    let i = 0;
    nodes.forEach((node) => {
      // Only treat custom elements that expose getContext() and aren't already hooked.
      if (typeof node.getContext === "function" && !hostSet.has(node)) {
        dom.push(domEntry(node, i++));
      }
    });
    return [...hooked, ...dom];
  }

  // -- render --
  function render(): void {
    const list = entries();
    countEl.textContent = `${list.length} chart${list.length === 1 ? "" : "s"}`;
    const prev = selectedId;
    if (!list.some((e) => e.id === selectedId)) selectedId = list[0]?.id ?? null;
    if (selectedId !== prev) {
      viewBack = 0; // reset the history view when selection changes
      aiState.delete(prev ?? "");
    }
    renderList(list);
    const sel = list.find((e) => e.id === selectedId) ?? null;
    renderHistoryNav(sel);
    renderTabs();
    renderContent(sel);
  }

  // Scroll the chart into view and flash an outline so it is findable among many.
  function locateChart(host: HTMLElement): void {
    if (typeof host.scrollIntoView === "function") {
      host.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const prevOutline = host.style.outline;
    const prevOffset = host.style.outlineOffset;
    host.style.outline = "3px solid #6f7fc9";
    host.style.outlineOffset = "2px";
    setTimeout(() => {
      host.style.outline = prevOutline;
      host.style.outlineOffset = prevOffset;
    }, 1200);
  }

  function renderList(list: DevtoolsChartEntry[]): void {
    listEl.replaceChildren();
    if (list.length === 0) {
      listEl.append(el("div", { class: "empty" }, ["No charts found"]));
      return;
    }
    const shown = filterText
      ? list.filter((e) => e.id.toLowerCase().includes(filterText) || e.chartType.toLowerCase().includes(filterText))
      : list;
    if (shown.length === 0) {
      listEl.append(el("div", { class: "empty" }, [`No charts match "${filterText}"`]));
      return;
    }
    for (const e of shown) {
      const locate = el("button", { class: "mv-devtools-btn locate", title: "Locate this chart on the page" }, ["◎"]);
      locate.addEventListener("click", (ev) => {
        ev.stopPropagation();
        locateChart(e.host);
      });
      const renderer = e.getContext()?.renderer;
      const children: Array<Node | string> = [el("span", { class: "ct" }, [e.chartType]), locate];
      if (renderer) children.push(el("span", { class: "rend" }, [renderer]));
      children.push(el("div", {}, [e.id]));
      const item = el("div", { class: "mv-devtools-item" + (e.id === selectedId ? " is-active" : "") }, children);
      item.addEventListener("click", () => {
        selectedId = e.id;
        render();
      });
      listEl.append(item);
    }
  }

  function renderTabs(): void {
    tabsEl.replaceChildren();
    for (const [key, label] of TABS) {
      const btn = el("button", { class: "mv-devtools-tab" + (key === selectedTab ? " is-active" : "") }, [label]);
      btn.addEventListener("click", () => {
        selectedTab = key;
        render();
      });
      tabsEl.append(btn);
    }
  }

  /** The ChartContext the tabs should show: live, or the pinned history snapshot. */
  function viewedContext(entry: DevtoolsChartEntry): ChartContext | null {
    const hist = history.get(entry.id) ?? [];
    const live = viewBack === 0 || hist.length === 0;
    return live ? entry.getContext() : hist[hist.length - 1 - viewBack];
  }

  function renderHistoryNav(entry: DevtoolsChartEntry | null): void {
    historyNavEl.replaceChildren();
    if (!entry) return;
    const hist = history.get(entry.id) ?? [];
    if (hist.length <= 1) return;
    const live = viewBack === 0;
    const older = el("button", { class: "mv-devtools-btn" }, ["◀"]);
    const newer = el("button", { class: "mv-devtools-btn" }, ["▶"]);
    const liveBtn = el("button", { class: "mv-devtools-btn" + (live ? " is-active" : "") }, ["● live"]);
    const pos = live ? `${hist.length}/${hist.length}` : `${hist.length - viewBack}/${hist.length}`;
    older.addEventListener("click", () => {
      viewBack = Math.min(viewBack + 1, hist.length - 1);
      render();
    });
    newer.addEventListener("click", () => {
      viewBack = Math.max(viewBack - 1, 0);
      render();
    });
    liveBtn.addEventListener("click", () => {
      viewBack = 0;
      render();
    });
    historyNavEl.append(
      el("div", { class: "mv-devtools-history" }, [
        el("span", { class: "k" }, ["History"]),
        older,
        el("span", { class: "k" }, [pos]),
        newer,
        liveBtn,
      ])
    );
    if (!live) {
      historyNavEl.append(el("div", { class: "mv-devtools-histbanner" }, ["viewing snapshot (read-only)"]));
    }
  }

  function renderContent(sel: DevtoolsChartEntry | null): void {
    if (selectedTab === "overview") {
      // Overview keeps its two long-lived children so a live edit (notify -> render)
      // never blows away the dataSet textarea mid-typing.
      if (contentEl.firstChild !== readoutEl) contentEl.replaceChildren(readoutEl, controlsEl);
      renderReadout(sel);
      const key = `${selectedId}|${viewBack === 0 ? "live" : "hist"}`;
      if (key !== controlsKey) {
        renderControls(sel);
        controlsKey = key;
      }
      return;
    }
    controlsKey = ""; // force a controls rebuild when returning to Overview
    contentEl.replaceChildren();
    if (!sel) {
      contentEl.append(el("div", { class: "empty" }, ["No chart selected"]));
      return;
    }
    if (selectedTab !== "hittest") removeHitDot();
    if (selectedTab === "sizing") renderSizing(sel);
    else if (selectedTab === "scales") renderScales(viewedContext(sel));
    else if (selectedTab === "diff") renderDiff(sel);
    else if (selectedTab === "hittest") renderHitTest(sel);
    else if (selectedTab === "profiler") renderProfiler(sel);
    else if (selectedTab === "a11y") renderA11y(viewedContext(sel));
    else renderInsights(sel, viewedContext(sel));
  }

  function renderReadout(entry: DevtoolsChartEntry | null): void {
    readoutEl.replaceChildren();
    if (!entry) return;
    const ctx = viewedContext(entry);
    if (!ctx) {
      readoutEl.append(el("div", { class: "empty" }, ["No context yet (chart not rendered)"]));
      return;
    }

    // Renderer - what actually paints the marks. Axes/labels/tooltips (the chrome)
    // are ALWAYS SVG; only the data marks switch technology.
    readoutEl.append(el("h4", {}, ["Renderer"]));
    const rendererNote =
      ctx.renderer === "canvas"
        ? "canvas - data marks paint on a <canvas> (no per-mark DOM; hover uses the host hit-test, see the Hit-test tab). Axes, labels and tooltips stay SVG/DOM."
        : ctx.renderer === "webgpu"
          ? "webgpu - data marks paint on a GPU canvas (falls back to canvas when no adapter). Axes, labels and tooltips stay SVG/DOM."
          : "svg - everything is vector DOM: marks, axes, labels. Every mark is inspectable in the browser's Elements panel.";
    readoutEl.append(el("div", { class: "mv-devtools-kv" }, [
      el("span", { class: "k" }, ["marks"]),
      el("span", {}, [rendererNote]),
    ]));

    // Summary - "what the AI sees".
    readoutEl.append(el("h4", {}, ["Summary"]));
    readoutEl.append(el("div", { class: "mv-devtools-summary" }, [ctx.summary]));

    // Stats.
    const stats = (ctx as { stats?: Record<string, unknown> }).stats;
    if (stats) {
      readoutEl.append(el("h4", {}, ["Stats"]));
      const kv = el("div", { class: "mv-devtools-kv" });
      for (const [k, v] of Object.entries(stats)) {
        kv.append(el("span", { class: "k" }, [k]), el("span", {}, [safeJson(v)]));
      }
      readoutEl.append(kv);
    }

    // Series - including actual vs predicted provenance where present.
    const series = (ctx as { series?: Array<Record<string, unknown>> }).series;
    if (Array.isArray(series) && series.length) {
      const hasProvenance = series.some((s) => "predictedCount" in s || "forecastCount" in s);
      readoutEl.append(el("h4", {}, [hasProvenance ? "Series (actual vs predicted)" : "Series"]));
      const head = ["label", "points"];
      if (hasProvenance) head.push("actual", "predicted", "forecastStart");
      const table = el("table");
      table.append(el("thead", {}, [el("tr", {}, head.map((h) => el("th", {}, [h])))]));
      const tbody = el("tbody");
      for (const s of series) {
        const actual = (s.actualCount ?? s.historyCount) as number | undefined;
        const predicted = (s.predictedCount ?? s.forecastCount) as number | undefined;
        const points = (s.pointCount ?? "") as number | string;
        const cells: Array<Node | string> = [
          el("td", {}, [String(s.label ?? "")]),
          el("td", {}, [String(points)]),
        ];
        if (hasProvenance) {
          cells.push(
            el("td", {}, [el("span", { class: "badge actual" }, [String(actual ?? 0)])]),
            el("td", {}, [el("span", { class: "badge predicted" }, [String(predicted ?? 0)])]),
            el("td", {}, [s.forecastStart == null ? "-" : String(s.forecastStart)])
          );
        }
        tbody.append(el("tr", {}, cells));
      }
      table.append(tbody);
      readoutEl.append(table);
    }

    // Full context JSON (collapsible).
    const details = el("details");
    details.append(el("summary", {}, ["ChartContext (raw)"]), el("pre", {}, [safeJson(ctx)]));
    readoutEl.append(el("h4", {}, ["Context"]), details);
  }

  // -- Sizing tab: pain point #1, "why is my chart 0x0 / overflowing?" --
  function renderSizing(entry: DevtoolsChartEntry): void {
    const host = entry.host;
    const rect = host.getBoundingClientRect();
    const cs = getComputedStyle(host);
    const num = (v: string): number => parseFloat(v) || 0;
    const padX = num(cs.paddingLeft) + num(cs.paddingRight);
    const padY = num(cs.paddingTop) + num(cs.paddingBottom);
    const props = (entry.getProps() ?? {}) as { width?: unknown; height?: unknown };
    const reqW = typeof props.width === "number" ? props.width : null;
    const reqH = typeof props.height === "number" ? props.height : null;
    const state = host.getAttribute("data-mv-state");

    contentEl.append(el("h4", {}, ["Host measurements"]));
    const kv = el("div", { class: "mv-devtools-kv" });
    const row = (k: string, v: string): void => {
      kv.append(el("span", { class: "k" }, [k]), el("span", {}, [v]));
    };
    row("host rect", `${Math.round(rect.width)} × ${Math.round(rect.height)} px`);
    row("host client", `${host.clientWidth} × ${host.clientHeight} px`);
    row("host padding", `${padX} px horizontal, ${padY} px vertical`);
    row("requested (props)", `${reqW ?? "?"} × ${reqH ?? "?"} px`);
    if (state) row("data-mv-state", state);
    contentEl.append(kv);

    contentEl.append(el("h4", {}, ["Diagnosis"]));
    const innerW = host.clientWidth - padX;
    if (rect.width === 0 || rect.height === 0) {
      contentEl.append(
        el("div", { class: "mv-devtools-flag err" }, [
          "Host has zero size - the chart is invisible. Check for display:none ancestors, a collapsed flex/grid track, or a container measured before layout (e.g. a hidden tab).",
        ])
      );
    } else if (reqW != null && host.clientWidth > 0 && reqW > innerW) {
      contentEl.append(
        el("div", { class: "mv-devtools-flag warn" }, [
          `Requested width ${reqW}px exceeds the host's inner width (${innerW}px = clientWidth ${host.clientWidth} minus ${padX}px padding). clientWidth INCLUDES padding - subtract paddingLeft + paddingRight when sizing a chart from it, or the chart overflows the host.`,
        ])
      );
    } else if (reqW != null && reqW > rect.width) {
      contentEl.append(
        el("div", { class: "mv-devtools-flag warn" }, [
          `Requested width ${reqW}px is wider than the host's rendered box (${Math.round(rect.width)}px) - the chart overflows or is clipped.`,
        ])
      );
    } else {
      contentEl.append(el("div", { class: "mv-devtools-flag ok" }, ["No sizing problems detected."]));
    }

    contentEl.append(el("h4", {}, ["Responsive hint"]));
    contentEl.append(
      el("div", {}, [
        "michi-vz charts are fixed-size (width/height props) and do not auto-resize. To make one responsive, observe the host and re-render:",
      ]),
      el("pre", {}, [
        `const ro = new ResizeObserver(() => {
  const w = host.clientWidth
    - parseFloat(getComputedStyle(host).paddingLeft)
    - parseFloat(getComputedStyle(host).paddingRight);
  requestAnimationFrame(() => chart.update({ ...props, width: w }));
});
ro.observe(host);`,
      ])
    );
  }

  // -- Scales tab: pain point #4, "why are my axis values wrong?" --
  function renderScales(ctx: ChartContext | null): void {
    if (!ctx) {
      contentEl.append(el("div", { class: "empty" }, ["No context yet (chart not rendered)"]));
      return;
    }
    const anyCtx = ctx as unknown as {
      xAxis?: { type?: string; domain?: unknown };
      yAxis?: { domain?: unknown; labels?: string[] };
    };
    if (!anyCtx.xAxis && !anyCtx.yAxis) {
      contentEl.append(
        el("div", { class: "empty" }, [
          `${ctx.chartType} has no axis scales (pie, sankey, treemap and friends place marks without x/y domains).`,
        ])
      );
      return;
    }

    const checks: Array<{ kind: "warn" | "err"; text: string }> = [];
    const numericChecks = (name: string, domain: unknown): void => {
      if (!Array.isArray(domain) || domain.length !== 2) return;
      const [a, b] = domain as [unknown, unknown];
      if (typeof a !== "number" || typeof b !== "number") return;
      if (Number.isNaN(a) || Number.isNaN(b)) {
        checks.push({ kind: "err", text: `${name} domain contains NaN - a data point's value/date failed to parse.` });
      } else if (a === b) {
        checks.push({ kind: "warn", text: `${name} domain is zero-width [${a}, ${b}] - all values are identical, marks collapse onto one coordinate.` });
      } else if (a > b) {
        checks.push({ kind: "warn", text: `${name} domain is inverted [${a}, ${b}] - the axis runs backwards; check a manual domain prop.` });
      }
    };

    if (anyCtx.xAxis) {
      contentEl.append(el("h4", {}, ["xAxis"]));
      const kv = el("div", { class: "mv-devtools-kv" });
      if (anyCtx.xAxis.type) kv.append(el("span", { class: "k" }, ["type"]), el("span", {}, [String(anyCtx.xAxis.type)]));
      kv.append(el("span", { class: "k" }, ["domain"]), el("span", {}, [shortJson(anyCtx.xAxis.domain, 160)]));
      contentEl.append(kv);
      numericChecks("xAxis", anyCtx.xAxis.domain);
    }
    if (anyCtx.yAxis) {
      contentEl.append(el("h4", {}, ["yAxis"]));
      const kv = el("div", { class: "mv-devtools-kv" });
      if (anyCtx.yAxis.domain !== undefined) {
        kv.append(el("span", { class: "k" }, ["domain"]), el("span", {}, [shortJson(anyCtx.yAxis.domain, 160)]));
        numericChecks("yAxis", anyCtx.yAxis.domain);
      }
      if (Array.isArray(anyCtx.yAxis.labels)) {
        kv.append(
          el("span", { class: "k" }, ["labels"]),
          el("span", {}, [`${anyCtx.yAxis.labels.length}: ${shortJson(anyCtx.yAxis.labels, 140)}`])
        );
      }
      contentEl.append(kv);
    }

    contentEl.append(el("h4", {}, ["Checks"]));
    if (checks.length === 0) {
      contentEl.append(el("div", { class: "mv-devtools-flag ok" }, ["Domains look sane."]));
    } else {
      for (const c of checks) contentEl.append(el("div", { class: `mv-devtools-flag ${c.kind}` }, [c.text]));
    }
  }

  // -- Diff tab: what changed between the last two ChartContext snapshots --
  function renderDiff(entry: DevtoolsChartEntry): void {
    const hist = history.get(entry.id) ?? [];
    if (hist.length < 2) {
      contentEl.append(
        el("div", { class: "empty" }, [
          "Need at least two snapshots to diff. Update the chart (new data, a prop change) and the difference between the last two ChartContext snapshots shows here.",
        ])
      );
      return;
    }
    const idx = hist.length - 1 - viewBack;
    if (idx <= 0) {
      contentEl.append(el("div", { class: "empty" }, ["Viewing the oldest snapshot - nothing earlier to diff against."]));
      return;
    }
    const prev = hist[idx - 1];
    const next = hist[idx];
    const changes = diffObjects(prev, next);
    contentEl.append(el("h4", {}, [`Snapshot ${idx} → ${idx + 1} (${changes.length} change${changes.length === 1 ? "" : "s"})`]));
    if (changes.length === 0) {
      contentEl.append(el("div", { class: "mv-devtools-flag ok" }, ["Snapshots are identical."]));
      return;
    }
    const grid = el("div", { class: "mv-devtools-diff" });
    for (const c of changes.slice(0, 200)) {
      grid.append(el("span", { class: `kind ${c.kind}` }, [c.kind]), el("span", { class: "path" }, [c.path]));
      const vals =
        c.kind === "changed"
          ? `${shortJson(c.from)} → ${shortJson(c.to)}`
          : c.kind === "added"
            ? `+ ${shortJson(c.to)}`
            : `- ${shortJson(c.from)}`;
      grid.append(el("span", { class: "vals" }, [vals]));
    }
    contentEl.append(grid);
    if (changes.length > 200) {
      contentEl.append(el("div", { class: "empty" }, [`… ${changes.length - 200} more changes not shown`]));
    }
  }

  // -- Hit-test tab: live canvas pointer log (pain point #5; makes a dead/rebound
  //    canvas listener visually obvious - the log goes silent on hover) --
  function renderHitTest(entry: DevtoolsChartEntry): void {
    const mine = hitLog.filter((e) => e.host === entry.host);
    contentEl.append(el("h4", {}, ["Pointer log"]));
    if (mine.length === 0) {
      contentEl.append(
        el("div", { class: "empty" }, [
          "Waiting for pointer events. Move the mouse over the chart (canvas/webgpu mode - SVG marks are inspectable directly). If the log stays silent while you hover, the chart's canvas listener is dead.",
        ])
      );
      return;
    }
    const last = mine[mine.length - 1];
    placeHitDot(entry.host, last);
    contentEl.append(
      el("div", { class: `mv-devtools-flag ${last.label ? "ok" : "warn"}` }, [
        last.label
          ? `Last: hit "${last.label}" at ${Math.round(last.x)}, ${Math.round(last.y)}`
          : `Last: miss at ${Math.round(last.x)}, ${Math.round(last.y)}`,
      ])
    );
    const log = el("div", { class: "mv-devtools-hitlog" });
    const rows = mine.slice(-50).reverse();
    for (const e of rows) {
      log.append(
        el("div", { class: "row" }, [
          el("span", { class: e.label ? "hit" : "miss" }, [e.label ? "hit " : "miss"]),
          el("span", { class: "k" }, [`${Math.round(e.x)}, ${Math.round(e.y)}`]),
          el("span", {}, [e.label ?? "-"]),
          el("span", { class: "k" }, [`${Math.round(e.t)} ms`]),
        ])
      );
    }
    contentEl.append(log);
    if (mine.length > 50) {
      contentEl.append(el("div", { class: "empty" }, [`showing the last 50 of ${mine.length} events`]));
    }
  }

  // -- Profiler tab: per-update render durations (pain points #6/#7) --
  function renderProfiler(entry: DevtoolsChartEntry): void {
    const arr = timings.get(entry.id) ?? [];
    contentEl.append(el("h4", {}, ["Render timings"]));
    if (arr.length === 0) {
      contentEl.append(
        el("div", { class: "empty" }, [
          "No updates timed yet. Update the chart (new data, a prop change) and each update's render duration appears here.",
        ])
      );
      return;
    }
    const last = arr[arr.length - 1];
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = Math.max(...arr);
    const kv = el("div", { class: "mv-devtools-kv" });
    const row = (k: string, v: string): void => {
      kv.append(el("span", { class: "k" }, [k]), el("span", {}, [v]));
    };
    row("updates", `${arr.length} update${arr.length === 1 ? "" : "s"} timed`);
    row("last", `${last.toFixed(1)} ms`);
    row("mean", `${mean.toFixed(1)} ms`);
    row("max", `${max.toFixed(1)} ms`);
    contentEl.append(kv);

    // Bar strip: one bar per update, height proportional to duration.
    const strip = el("div", { class: "mv-devtools-profbars" });
    for (const ms of arr.slice(-40)) {
      const bar = el("span", { class: "bar" });
      bar.style.height = `${Math.max(2, Math.round((ms / (max || 1)) * 36))}px`;
      bar.title = `${ms.toFixed(1)} ms`;
      strip.append(bar);
    }
    contentEl.append(strip);

    // Trend check: is the recent half meaningfully slower than the early half?
    if (arr.length >= 10) {
      const half = Math.floor(arr.length / 2);
      const early = arr.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const recent = arr.slice(-half).reduce((a, b) => a + b, 0) / half;
      if (early > 0 && recent > early * 1.5) {
        contentEl.append(
          el("div", { class: "mv-devtools-flag warn" }, [
            `Render time is trending up (${early.toFixed(1)} ms → ${recent.toFixed(1)} ms mean). Look for growing data, non-memoized props forcing full re-renders, or leaked listeners.`,
          ])
        );
      } else {
        contentEl.append(el("div", { class: "mv-devtools-flag ok" }, ["Render time is stable."]));
      }
    }
  }

  // -- A11y tab: Chartability-inspired audit of the live context --
  function renderA11y(ctx: ChartContext | null): void {
    if (!ctx) {
      contentEl.append(el("div", { class: "empty" }, ["No context yet (chart not rendered)"]));
      return;
    }
    contentEl.append(el("h4", {}, ["Audit"]));
    for (const f of auditContext(ctx as unknown as AuditableContext)) {
      contentEl.append(el("div", { class: `mv-devtools-flag ${f.kind}` }, [f.text]));
    }

    const table = (ctx as unknown as AuditableContext).a11yTable;
    contentEl.append(el("h4", {}, ["A11y data table (what a screen reader gets)"]));
    if (!table || table.rows.length === 0) {
      contentEl.append(el("div", { class: "empty" }, ["This chart emits no a11y table."]));
      return;
    }
    const t = el("table");
    t.append(el("thead", {}, [el("tr", {}, table.headers.map((h) => el("th", {}, [h])))]));
    const tbody = el("tbody");
    for (const r of table.rows.slice(0, 30)) {
      tbody.append(el("tr", {}, r.map((c) => el("td", {}, [String(c)]))));
    }
    t.append(tbody);
    contentEl.append(t);
    if (table.rows.length > 30) {
      contentEl.append(el("div", { class: "empty" }, [`… ${table.rows.length - 30} more rows`]));
    }
  }

  // -- Insights tab: the chart's own summary + one-click @michi-vz/insights actions --
  function renderInsights(entry: DevtoolsChartEntry, ctx: ChartContext | null): void {
    contentEl.append(
      el(
        "h4",
        { title: "The plain-language summary every chart carries in its ChartContext - this exact text is what an AI agent or a screen reader receives. Computed from the data; no model involved." },
        ["What the AI sees"]
      )
    );
    if (ctx?.summary) {
      contentEl.append(el("div", { class: "mv-devtools-ai" }, [ctx.summary]));
    } else {
      contentEl.append(el("div", { class: "empty" }, ["No context yet (chart not rendered)"]));
    }

    const tools = entry.getTools?.() ?? [];
    const findTool = (key: string): AgentTool | undefined =>
      tools.find((t) => t.name === key || t.name.endsWith(`.${key}`) || t.name.startsWith(`${key}.`));
    const known = AI_ACTIONS.map((a) => ({ ...a, tool: findTool(a.key) })).filter((a) => a.tool);

    if (known.length === 0 && tools.length === 0) {
      contentEl.append(el("h4", {}, ["Insights"]));
      contentEl.append(
        el("div", { class: "empty" }, [
          "Attach @michi-vz/insights to unlock one-click AI actions here: chart.use(narrate()) for prose narration, chart.use(anomaly()) for outlier detection, chart.use(forecast()) for projections.",
        ])
      );
      return;
    }

    if (known.length > 0) {
      contentEl.append(el("h4", {}, ["AI actions"]));
      contentEl.append(
        el("div", { class: "mv-devtools-ai-caption" }, [
          "These run the chart's attached insights plugins locally, in your browser. By default they are deterministic rules and statistics - no language model runs and nothing is downloaded. Hover an action for what it computes.",
        ])
      );
      const rowEl = el("div", { class: "row" });
      for (const action of known) {
        const btn = el("button", { class: "mv-devtools-ai-action", title: action.hint }, [action.label]);
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const result = await action.tool!.run({});
            const text = typeof result === "string" ? result : safeJson(result);
            // Anomaly results carry per-series labels we can highlight on the chart
            // (either a bare array or the self-explaining { method, series } shape).
            const seriesList = Array.isArray(result)
              ? result
              : (result as { series?: unknown })?.series;
            const labels = Array.isArray(seriesList)
              ? (seriesList as Array<{ label?: string; anomalies?: unknown[] }>)
                  .filter((r) => r.label && Array.isArray(r.anomalies) && r.anomalies.length > 0)
                  .map((r) => String(r.label))
              : undefined;
            aiState.set(entry.id, { tool: action.key, text, labels: labels?.length ? labels : undefined });
          } catch (err) {
            aiState.set(entry.id, { tool: action.key, text: `Error: ${(err as Error).message}` });
          }
          render();
        });
        rowEl.append(btn);
      }
      contentEl.append(rowEl);

      const state = aiState.get(entry.id);
      if (state) {
        const bubble = el("div", { class: "mv-devtools-ai" });
        bubble.append(el("div", { class: "mv-devtools-ai-result" }, [state.text]));
        contentEl.append(bubble);
        if (state.labels?.length) {
          const hl = el("button", { class: "mv-devtools-btn" }, [
            `Highlight ${state.labels.length} flagged series`,
          ]);
          hl.addEventListener("click", () => {
            try {
              entry.setProps({ highlightItems: state.labels });
            } finally {
              refresh();
            }
          });
          contentEl.append(el("div", { class: "row" }, [hl]));
        }
      }
    }

    // Advanced: the raw tool runner for everything a plugin exposes.
    if (tools.length > 0) {
      const details = el("details");
      details.append(el("summary", {}, [`All tools (${tools.length})`]));
      for (const tool of tools) {
        const args = el("textarea", { rows: "2", placeholder: '{ "args": ... }' });
        args.style.minHeight = "40px";
        const out = el("pre");
        out.hidden = true;
        const run = el("button", { class: "mv-devtools-btn" }, ["Run"]);
        run.addEventListener("click", async () => {
          try {
            const parsed = args.value.trim() ? JSON.parse(args.value) : {};
            const result = await tool.run(parsed);
            out.textContent = safeJson(result);
            out.className = "";
          } catch (err) {
            out.textContent = `Error: ${(err as Error).message}`;
            out.className = "err";
          }
          out.hidden = false;
        });
        details.append(
          el("div", { class: "row" }, [el("strong", {}, [tool.name]), run]),
          el("div", {}, [tool.description]),
          args,
          out
        );
      }
      contentEl.append(el("h4", {}, ["Advanced"]), details);
    }
  }

  function renderControls(entry: DevtoolsChartEntry | null): void {
    controlsEl.replaceChildren();
    if (!entry) return;

    const hist = history.get(entry.id) ?? [];
    if (viewBack !== 0 && hist.length > 0) {
      controlsEl.append(
        el("div", { class: "empty" }, ["Controls are disabled while viewing history. Click the live button to resume."])
      );
      return;
    }

    function apply(patch: Record<string, unknown>): void {
      try {
        entry!.setProps(patch);
      } finally {
        refresh();
      }
    }

    const props = (entry.getProps() ?? {}) as {
      highlightItems?: string[];
      disabledItems?: string[];
      dataSet?: unknown;
    };
    const ctx = entry.getContext();
    const labels: string[] = Array.isArray((ctx as { series?: Array<{ label?: string }> })?.series)
      ? (ctx as { series: Array<{ label?: string }> }).series.map((s) => String(s.label ?? "")).filter(Boolean)
      : [];

    // Highlight / disable toggles per series.
    if (labels.length) {
      const highlight = new Set(props.highlightItems ?? []);
      const disabled = new Set(props.disabledItems ?? []);

      controlsEl.append(el("h4", {}, ["Highlight"]));
      const hRow = el("div", { class: "row" });
      for (const label of labels) {
        const cb = el("input", highlight.has(label) ? { type: "checkbox", checked: "" } : { type: "checkbox" });
        cb.addEventListener("change", () => {
          if (cb.checked) highlight.add(label);
          else highlight.delete(label);
          apply({ highlightItems: [...highlight] });
        });
        hRow.append(el("label", { class: "chk" }, [cb, label]));
      }
      controlsEl.append(hRow);

      controlsEl.append(el("h4", {}, ["Disable"]));
      const dRow = el("div", { class: "row" });
      for (const label of labels) {
        const cb = el("input", disabled.has(label) ? { type: "checkbox", checked: "" } : { type: "checkbox" });
        cb.addEventListener("change", () => {
          if (cb.checked) disabled.add(label);
          else disabled.delete(label);
          apply({ disabledItems: [...disabled] });
        });
        dRow.append(el("label", { class: "chk" }, [cb, label]));
      }
      controlsEl.append(dRow);
    }

    // Reset: undo every panel-driven edit at once (back to the props as first seen).
    const initial = initialProps.get(entry.id);
    if (initial) {
      const resetBtn = el(
        "button",
        { class: "mv-devtools-btn", title: "Restore the chart's dataSet, highlight and disable state as they were when devtools first saw it" },
        ["Reset chart"]
      );
      resetBtn.addEventListener("click", () => {
        const patch: Record<string, unknown> = {
          highlightItems: [...initial.highlightItems],
          disabledItems: [...initial.disabledItems],
        };
        if (initial.dataSet !== undefined) patch.dataSet = JSON.parse(JSON.stringify(initial.dataSet));
        controlsKey = ""; // force the controls (incl. the dataSet textarea) to rebuild
        apply(patch);
      });
      controlsEl.append(el("div", { class: "row" }, [resetBtn]));
    }

    // Data editor.
    if (props.dataSet !== undefined) {
      controlsEl.append(el("h4", {}, ["Edit dataSet"]));
      const ta = el("textarea", {});
      ta.value = safeJson(props.dataSet);
      const err = el("div", { class: "err" });
      const applyBtn = el("button", { class: "mv-devtools-btn" }, ["Apply"]);
      const resetBtn = el("button", { class: "mv-devtools-btn" }, ["Reset"]);
      applyBtn.addEventListener("click", () => {
        try {
          const next = JSON.parse(ta.value);
          err.textContent = "";
          apply({ dataSet: next });
        } catch (e) {
          err.textContent = `Invalid JSON: ${(e as Error).message}`;
        }
      });
      resetBtn.addEventListener("click", () => {
        const p = entry.getProps() as { dataSet?: unknown };
        ta.value = safeJson(p.dataSet);
        err.textContent = "";
      });
      controlsEl.append(ta, el("div", { class: "row" }, [applyBtn, resetBtn]), err);
    }
  }

  // -- open/close --
  function applyVisibility(): void {
    panel.hidden = !isOpen;
    toggleBtn.hidden = isOpen;
  }
  const open = () => {
    isOpen = true;
    applyVisibility();
    render();
  };
  const close = () => {
    isOpen = false;
    applyVisibility();
  };
  const toggle = () => (isOpen ? close() : open());

  toggleBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  refreshBtn.addEventListener("click", refresh);

  const unsubscribe = hook.subscribe(() => scheduleRefresh());
  // Optional chaining: an older core (version skew) has no hit/timing channels.
  const unsubscribeHits = hook.subscribeHits?.(onHit) ?? null;
  const unsubscribeTimings = hook.subscribeTimings?.(onTiming) ?? null;

  let onKey: ((e: KeyboardEvent) => void) | null = null;
  if (hotkey) {
    onKey = (e: KeyboardEvent) => {
      const mod = (hotkey.ctrl && e.ctrlKey) || (hotkey.meta && e.metaKey);
      if (mod && (!hotkey.shift || e.shiftKey) && (!hotkey.alt || e.altKey) &&
          e.key.toLowerCase() === hotkey.key.toLowerCase()) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
  }

  applyVisibility();
  refresh();

  return {
    open,
    close,
    toggle,
    refresh: render,
    getRoot: () => root,
    destroy() {
      unsubscribe();
      unsubscribeHits?.();
      unsubscribeTimings?.();
      if (refreshTimer !== null) clearTimeout(refreshTimer);
      endDrag();
      removeHitDot();
      if (onKey) window.removeEventListener("keydown", onKey);
      wrapper.remove();
    },
  };
}
