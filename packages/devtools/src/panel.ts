// The in-page devtools panel. Discovers every mounted michi-vz chart (via the core
// hook for imperative/post-enable mounts + a DOM sweep for <michi-vz-*> elements),
// shows each chart's live ChartContext (incl. actual vs predicted provenance), and
// lets you drive highlight/disable, invoke agent tools, and edit the dataSet.
//
// Light DOM only, namespaced under `.mv-devtools` (never touches the charts' color
// contract). No framework deps.
import {
  enableDevtools,
  type AgentTool,
  type ChartContext,
  type DevtoolsChartEntry,
} from "@michi-vz/core";
import { ensureDevtoolsStyles } from "./styles";

export interface DevtoolsHotkey {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface MountDevtoolsOptions {
  /** Where to attach the panel (default: document.body). */
  container?: HTMLElement;
  /** Start open (default true). */
  open?: boolean;
  /** Toggle hotkey; set null to disable. Default: Ctrl/Cmd+Shift+M. */
  hotkey?: DevtoolsHotkey | null;
}

export interface DevtoolsHandle {
  open(): void;
  close(): void;
  toggle(): void;
  /** Re-scan the DOM and re-render (use after mounting charts outside the hook). */
  refresh(): void;
  destroy(): void;
}

interface WcElement extends HTMLElement {
  getContext?: () => ChartContext | null;
  getTools?: () => AgentTool[];
  dataSet?: unknown;
  highlightItems?: string[];
  disabledItems?: string[];
}

const DEFAULT_HOTKEY: DevtoolsHotkey = { key: "m", ctrl: true, meta: true, shift: true };

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
    return { open: noop, close: noop, toggle: noop, refresh: noop, destroy: noop };
  }
  ensureDevtoolsStyles();
  const hook = enableDevtools();
  const container = opts.container ?? document.body;
  const hotkey = opts.hotkey === undefined ? DEFAULT_HOTKEY : opts.hotkey;

  let selectedId: string | null = null;
  let controlsFor: string | null = null; // selection the controls were last built for
  let isOpen = opts.open ?? true;

  // -- structure --
  const toggleBtn = el("button", { class: "mv-devtools-toggle", title: "michi-vz devtools" }, ["◧ michi-vz"]);
  const countEl = el("span", { class: "mv-devtools-count" });
  const listEl = el("div", { class: "mv-devtools-list" });
  const readoutEl = el("div");
  const controlsEl = el("div");
  const detailEl = el("div", { class: "mv-devtools-detail" }, [readoutEl, controlsEl]);

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

  container.append(toggleBtn, panel);

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
    if (!list.some((e) => e.id === selectedId)) selectedId = list[0]?.id ?? null;
    renderList(list);
    const sel = list.find((e) => e.id === selectedId) ?? null;
    renderReadout(sel);
    if (selectedId !== controlsFor) {
      renderControls(sel);
      controlsFor = selectedId;
    }
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

  function renderReadout(entry: DevtoolsChartEntry | null): void {
    readoutEl.replaceChildren();
    if (!entry) return;
    const ctx = entry.getContext();
    if (!ctx) {
      readoutEl.append(el("div", { class: "empty" }, ["No context yet (chart not rendered)"]));
      return;
    }

    // Summary — "what the AI sees".
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

    // Series — including actual vs predicted provenance where present.
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
            el("td", {}, [s.forecastStart == null ? "—" : String(s.forecastStart)])
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

  function renderControls(entry: DevtoolsChartEntry | null): void {
    controlsEl.replaceChildren();
    if (!entry) return;

    function apply(patch: Record<string, unknown>): void {
      try {
        entry!.setProps(patch);
      } finally {
        render();
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

    // Agent tools.
    const tools = entry.getTools?.() ?? [];
    if (tools.length) {
      controlsEl.append(el("h4", {}, [`Tools (${tools.length})`]));
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
          render();
        });
        controlsEl.append(
          el("div", { class: "row" }, [el("strong", {}, [tool.name]), run]),
          el("div", {}, [tool.description]),
          args,
          out
        );
      }
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
  refreshBtn.addEventListener("click", render);

  const unsubscribe = hook.subscribe(() => render());

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
  render();

  return {
    open,
    close,
    toggle,
    refresh: render,
    destroy() {
      unsubscribe();
      if (onKey) window.removeEventListener("keydown", onKey);
      panel.remove();
      toggleBtn.remove();
    },
  };
}
