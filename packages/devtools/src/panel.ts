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
} from "@michi-vz/core";
import { ensureDevtoolsStyles } from "./styles";
import { diffObjects } from "./diff";

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

type TabKey = "overview" | "sizing" | "scales" | "diff" | "insights";
const TABS: Array<[TabKey, string]> = [
  ["overview", "Overview"],
  ["sizing", "Sizing"],
  ["scales", "Scales"],
  ["diff", "Diff"],
  ["insights", "Insights"],
];

// The one-click AI actions the Insights tab knows how to surface. Tool names may be
// bare ("narrate") or registry-namespaced ("chart.narrate"); both match.
const AI_ACTIONS: Array<{ key: string; label: string }> = [
  { key: "narrate", label: "✦ Narrate" },
  { key: "anomaly", label: "✦ Detect anomalies" },
  { key: "forecast", label: "✦ Forecast" },
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

  function capture(): void {
    for (const e of entries()) {
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
    render();
  }

  // -- structure --
  const toggleBtn = el("button", { class: "mv-devtools-toggle", title: "michi-vz devtools" }, ["◧ michi-vz"]);
  const countEl = el("span", { class: "mv-devtools-count" });
  const listEl = el("div", { class: "mv-devtools-list" });
  const historyNavEl = el("div");
  const tabsEl = el("div", { class: "mv-devtools-tabs" });
  const contentEl = el("div");
  const readoutEl = el("div");
  const controlsEl = el("div");
  const detailEl = el("div", { class: "mv-devtools-detail" }, [historyNavEl, tabsEl, contentEl]);

  const refreshBtn = el("button", { class: "mv-devtools-btn" }, ["⟳"]);
  const closeBtn = el("button", { class: "mv-devtools-btn" }, ["×"]);
  const header = el("div", { class: "mv-devtools-header" }, [
    el("span", { class: "mv-devtools-title" }, ["michi-vz devtools"]),
    countEl,
    el("span", { class: "mv-devtools-spacer" }),
    refreshBtn,
    closeBtn,
  ]);
  const panel = el("div", { class: "mv-devtools" }, [header, el("div", { class: "mv-devtools-body" }, [listEl, detailEl])]);

  root.append(toggleBtn, panel);

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

  function renderList(list: DevtoolsChartEntry[]): void {
    listEl.replaceChildren();
    if (list.length === 0) {
      listEl.append(el("div", { class: "empty" }, ["No charts found"]));
      return;
    }
    for (const e of list) {
      const item = el("div", { class: "mv-devtools-item" + (e.id === selectedId ? " is-active" : "") }, [
        el("span", { class: "ct" }, [e.chartType]),
        el("div", {}, [e.id]),
      ]);
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
    if (selectedTab === "sizing") renderSizing(sel);
    else if (selectedTab === "scales") renderScales(viewedContext(sel));
    else if (selectedTab === "diff") renderDiff(sel);
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

  // -- Insights tab: the chart's own summary + one-click @michi-vz/insights actions --
  function renderInsights(entry: DevtoolsChartEntry, ctx: ChartContext | null): void {
    contentEl.append(el("h4", {}, ["What the AI sees"]));
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
      const rowEl = el("div", { class: "row" });
      for (const action of known) {
        const btn = el("button", { class: "mv-devtools-ai-action" }, [action.label]);
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const result = await action.tool!.run({});
            const text = typeof result === "string" ? result : safeJson(result);
            // Anomaly results carry per-series labels we can highlight on the chart.
            const labels = Array.isArray(result)
              ? (result as Array<{ label?: string; anomalies?: unknown[] }>)
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

  const unsubscribe = hook.subscribe(() => refresh());

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
      if (onKey) window.removeEventListener("keydown", onKey);
      wrapper.remove();
    },
  };
}
