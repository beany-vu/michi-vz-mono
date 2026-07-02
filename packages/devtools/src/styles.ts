// Self-contained styles for the devtools panel. Injected into the panel's own
// SHADOW ROOT (never document.head), so nothing leaks in or out of the host app -
// the charts' light-DOM color contract stays untouched. Theming is variable-driven:
// dark is the default, light comes from prefers-color-scheme or an explicit
// data-theme on the shadow host.
export const DEVTOOLS_CSS = `
:host {
  /* dark theme (default) */
  --mvdt-bg: #1c1f26;
  --mvdt-bg-raised: #232733;
  --mvdt-bg-inset: #14171d;
  --mvdt-bg-hover: #262b36;
  --mvdt-bg-active: #2f3a52;
  --mvdt-border: #333a45;
  --mvdt-border-soft: #2a2f3a;
  --mvdt-ink: #e6e6e6;
  --mvdt-ink-strong: #ffffff;
  --mvdt-muted: #8a93a3;
  --mvdt-accent: #ffd24a;
  --mvdt-chart: #7fd1ff;
  --mvdt-btn-bg: #2c3240;
  --mvdt-btn-ink: #cfd6e0;
  --mvdt-btn-border: #3a4250;
  --mvdt-btn-hover: #353c4c;
  --mvdt-pre-ink: #cdd6e2;
  --mvdt-ok-bg: #1f3a2a;
  --mvdt-ok-ink: #7fdca0;
  --mvdt-warn-bg: #3a2f1f;
  --mvdt-warn-ink: #ffce7a;
  --mvdt-warn-border: #5a4a2a;
  --mvdt-err-ink: #ff8a8a;
  --mvdt-err-bg: #3a2020;
  --mvdt-err-border: #5a2e2e;
  --mvdt-summary-bg: #20261d;
  --mvdt-summary-border: #38432c;
  --mvdt-summary-ink: #d7e7c7;
  --mvdt-ai-from: #7c5cff;
  --mvdt-ai-to: #2ec5d3;
  --mvdt-ai-bg: #201d2e;
  --mvdt-ai-ink: #e4defc;
  --mvdt-shadow: 0 12px 40px rgba(0,0,0,.45);
}
@media (prefers-color-scheme: light) {
  :host {
    --mvdt-bg: #ffffff;
    --mvdt-bg-raised: #f2f4f8;
    --mvdt-bg-inset: #f7f8fa;
    --mvdt-bg-hover: #eceff4;
    --mvdt-bg-active: #dde6f5;
    --mvdt-border: #c9cfd9;
    --mvdt-border-soft: #e2e6ec;
    --mvdt-ink: #23272f;
    --mvdt-ink-strong: #000000;
    --mvdt-muted: #5d6675;
    --mvdt-accent: #9a6b00;
    --mvdt-chart: #0b6fa4;
    --mvdt-btn-bg: #eef1f5;
    --mvdt-btn-ink: #2b323d;
    --mvdt-btn-border: #c9cfd9;
    --mvdt-btn-hover: #e2e7ee;
    --mvdt-pre-ink: #2b323d;
    --mvdt-ok-bg: #e2f5e9;
    --mvdt-ok-ink: #1c7a41;
    --mvdt-warn-bg: #fdf3df;
    --mvdt-warn-ink: #8a5a00;
    --mvdt-warn-border: #ecd9a8;
    --mvdt-err-ink: #b3261e;
    --mvdt-err-bg: #fceeee;
    --mvdt-err-border: #eecdcd;
    --mvdt-summary-bg: #f0f6e8;
    --mvdt-summary-border: #d4e2c2;
    --mvdt-summary-ink: #3c4f28;
    --mvdt-ai-from: #6a48f2;
    --mvdt-ai-to: #0da4b5;
    --mvdt-ai-bg: #f4f1ff;
    --mvdt-ai-ink: #3a2f74;
    --mvdt-shadow: 0 12px 40px rgba(30,40,60,.22);
  }
}
/* explicit override beats the media query */
:host([data-theme="dark"]) {
  --mvdt-bg: #1c1f26;
  --mvdt-bg-raised: #232733;
  --mvdt-bg-inset: #14171d;
  --mvdt-bg-hover: #262b36;
  --mvdt-bg-active: #2f3a52;
  --mvdt-border: #333a45;
  --mvdt-border-soft: #2a2f3a;
  --mvdt-ink: #e6e6e6;
  --mvdt-ink-strong: #ffffff;
  --mvdt-muted: #8a93a3;
  --mvdt-accent: #ffd24a;
  --mvdt-chart: #7fd1ff;
  --mvdt-btn-bg: #2c3240;
  --mvdt-btn-ink: #cfd6e0;
  --mvdt-btn-border: #3a4250;
  --mvdt-btn-hover: #353c4c;
  --mvdt-pre-ink: #cdd6e2;
  --mvdt-ok-bg: #1f3a2a;
  --mvdt-ok-ink: #7fdca0;
  --mvdt-warn-bg: #3a2f1f;
  --mvdt-warn-ink: #ffce7a;
  --mvdt-warn-border: #5a4a2a;
  --mvdt-err-ink: #ff8a8a;
  --mvdt-err-bg: #3a2020;
  --mvdt-err-border: #5a2e2e;
  --mvdt-summary-bg: #20261d;
  --mvdt-summary-border: #38432c;
  --mvdt-summary-ink: #d7e7c7;
  --mvdt-ai-from: #7c5cff;
  --mvdt-ai-to: #2ec5d3;
  --mvdt-ai-bg: #201d2e;
  --mvdt-ai-ink: #e4defc;
  --mvdt-shadow: 0 12px 40px rgba(0,0,0,.45);
}
:host([data-theme="light"]) {
  --mvdt-bg: #ffffff;
  --mvdt-bg-raised: #f2f4f8;
  --mvdt-bg-inset: #f7f8fa;
  --mvdt-bg-hover: #eceff4;
  --mvdt-bg-active: #dde6f5;
  --mvdt-border: #c9cfd9;
  --mvdt-border-soft: #e2e6ec;
  --mvdt-ink: #23272f;
  --mvdt-ink-strong: #000000;
  --mvdt-muted: #5d6675;
  --mvdt-accent: #9a6b00;
  --mvdt-chart: #0b6fa4;
  --mvdt-btn-bg: #eef1f5;
  --mvdt-btn-ink: #2b323d;
  --mvdt-btn-border: #c9cfd9;
  --mvdt-btn-hover: #e2e7ee;
  --mvdt-pre-ink: #2b323d;
  --mvdt-ok-bg: #e2f5e9;
  --mvdt-ok-ink: #1c7a41;
  --mvdt-warn-bg: #fdf3df;
  --mvdt-warn-ink: #8a5a00;
  --mvdt-warn-border: #ecd9a8;
  --mvdt-err-ink: #b3261e;
  --mvdt-err-bg: #fceeee;
  --mvdt-err-border: #eecdcd;
  --mvdt-summary-bg: #f0f6e8;
  --mvdt-summary-border: #d4e2c2;
  --mvdt-summary-ink: #3c4f28;
  --mvdt-ai-from: #6a48f2;
  --mvdt-ai-to: #0da4b5;
  --mvdt-ai-bg: #f4f1ff;
  --mvdt-ai-ink: #3a2f74;
  --mvdt-shadow: 0 12px 40px rgba(30,40,60,.22);
}

.mv-devtools, .mv-devtools * { box-sizing: border-box; }
.mv-devtools {
  position: fixed; z-index: 2147483000; right: 16px; bottom: 16px;
  width: 460px; max-width: calc(100vw - 32px); max-height: 70vh;
  display: flex; flex-direction: column;
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--mvdt-ink); background: var(--mvdt-bg); border: 1px solid var(--mvdt-border);
  border-radius: 10px; box-shadow: var(--mvdt-shadow); overflow: hidden;
}
.mv-devtools[hidden] { display: none; }
.mv-devtools-header {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  background: var(--mvdt-bg-raised); border-bottom: 1px solid var(--mvdt-border); cursor: default;
}
.mv-devtools-title { font-weight: 700; color: var(--mvdt-accent); letter-spacing: .02em; }
.mv-devtools-count { color: var(--mvdt-muted); }
.mv-devtools-spacer { flex: 1; }
.mv-devtools-btn {
  background: var(--mvdt-btn-bg); color: var(--mvdt-btn-ink); border: 1px solid var(--mvdt-btn-border);
  border-radius: 6px; padding: 3px 8px; cursor: pointer; font: inherit;
}
.mv-devtools-btn:hover { background: var(--mvdt-btn-hover); }
.mv-devtools-body { display: flex; min-height: 0; flex: 1; }
.mv-devtools-list {
  width: 34%; border-right: 1px solid var(--mvdt-border-soft); overflow: auto; padding: 4px;
}
.mv-devtools-item {
  padding: 6px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.mv-devtools-item:hover { background: var(--mvdt-bg-hover); }
.mv-devtools-item.is-active { background: var(--mvdt-bg-active); color: var(--mvdt-ink-strong); }
.mv-devtools-item .ct { color: var(--mvdt-chart); }
.mv-devtools-detail { flex: 1; overflow: auto; padding: 8px 10px; min-width: 0; }
.mv-devtools-detail h4 {
  margin: 10px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
  color: var(--mvdt-muted); font-weight: 700;
}
.mv-devtools-summary { color: var(--mvdt-summary-ink); background: var(--mvdt-summary-bg);
  border: 1px solid var(--mvdt-summary-border); border-radius: 6px; padding: 6px 8px; }
.mv-devtools-kv { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
.mv-devtools-kv .k { color: var(--mvdt-muted); }
.mv-devtools table { width: 100%; border-collapse: collapse; }
.mv-devtools th, .mv-devtools td {
  text-align: left; padding: 3px 6px; border-bottom: 1px solid var(--mvdt-border-soft); white-space: nowrap;
}
.mv-devtools th { color: var(--mvdt-muted); font-weight: 600; }
.mv-devtools .badge { display: inline-block; padding: 0 6px; border-radius: 999px; font-size: 11px; }
.mv-devtools .badge.actual { background: var(--mvdt-ok-bg); color: var(--mvdt-ok-ink); }
.mv-devtools .badge.predicted { background: var(--mvdt-warn-bg); color: var(--mvdt-warn-ink); }
.mv-devtools details { margin-top: 4px; }
.mv-devtools summary { cursor: pointer; color: var(--mvdt-muted); }
.mv-devtools pre {
  margin: 4px 0 0; padding: 8px; background: var(--mvdt-bg-inset); border: 1px solid var(--mvdt-border-soft);
  border-radius: 6px; overflow: auto; max-height: 220px; white-space: pre; color: var(--mvdt-pre-ink);
}
.mv-devtools textarea {
  width: 100%; min-height: 110px; resize: vertical; font: inherit; color: var(--mvdt-pre-ink);
  background: var(--mvdt-bg-inset); border: 1px solid var(--mvdt-border-soft); border-radius: 6px; padding: 6px;
}
.mv-devtools .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0; }
.mv-devtools label.chk { display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
  background: var(--mvdt-bg-raised); border: 1px solid var(--mvdt-border); border-radius: 6px; padding: 2px 6px; }
.mv-devtools .err { color: var(--mvdt-err-ink); }
.mv-devtools .empty { color: var(--mvdt-muted); padding: 16px; text-align: center; }
.mv-devtools-history { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
.mv-devtools-btn.is-active { background: var(--mvdt-bg-active); color: var(--mvdt-ink-strong); }
.mv-devtools-histbanner {
  color: var(--mvdt-warn-ink); background: var(--mvdt-warn-bg); border: 1px solid var(--mvdt-warn-border);
  border-radius: 6px; padding: 3px 8px; margin-bottom: 6px;
}
.mv-devtools-toggle {
  position: fixed; z-index: 2147482999; right: 16px; bottom: 16px;
  background: var(--mvdt-bg-raised); color: var(--mvdt-accent); border: 1px solid var(--mvdt-border);
  border-radius: 999px; padding: 8px 12px; cursor: pointer; box-shadow: var(--mvdt-shadow);
  font: 700 12px/1 ui-monospace, monospace;
}
.mv-devtools-toggle[hidden] { display: none; }

/* tabs */
.mv-devtools-tabs {
  display: flex; gap: 2px; padding: 4px 6px 0; border-bottom: 1px solid var(--mvdt-border-soft);
  background: var(--mvdt-bg);
  position: sticky; top: 0;
}
.mv-devtools-tab {
  background: transparent; color: var(--mvdt-muted); border: 1px solid transparent;
  border-bottom: none; border-radius: 6px 6px 0 0; padding: 4px 9px; cursor: pointer; font: inherit;
}
.mv-devtools-tab:hover { color: var(--mvdt-ink); background: var(--mvdt-bg-hover); }
.mv-devtools-tab.is-active {
  color: var(--mvdt-ink-strong); background: var(--mvdt-bg-raised);
  border-color: var(--mvdt-border-soft);
}

/* sizing / scales diagnostics */
.mv-devtools-flag { border-radius: 6px; padding: 5px 8px; margin: 4px 0; }
.mv-devtools-flag.ok { background: var(--mvdt-ok-bg); color: var(--mvdt-ok-ink); }
.mv-devtools-flag.warn { background: var(--mvdt-warn-bg); color: var(--mvdt-warn-ink);
  border: 1px solid var(--mvdt-warn-border); }
.mv-devtools-flag.err { background: var(--mvdt-err-bg); color: var(--mvdt-err-ink);
  border: 1px solid var(--mvdt-err-border); }

/* diff */
.mv-devtools-diff { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; align-items: baseline; }
.mv-devtools-diff .kind { font-weight: 700; text-transform: uppercase; font-size: 10px; }
.mv-devtools-diff .kind.added { color: var(--mvdt-ok-ink); }
.mv-devtools-diff .kind.removed { color: var(--mvdt-err-ink); }
.mv-devtools-diff .kind.changed { color: var(--mvdt-warn-ink); }
.mv-devtools-diff .path { color: var(--mvdt-chart); word-break: break-all; white-space: normal; }
.mv-devtools-diff .vals { grid-column: 2; color: var(--mvdt-muted); word-break: break-all; white-space: normal; }

/* hit-test */
.mv-devtools-hitlog { max-height: 220px; overflow: auto; }
.mv-devtools-hitlog .row { gap: 10px; margin: 1px 0; }
.mv-devtools-hitlog .hit { color: var(--mvdt-ok-ink); font-weight: 700; }
.mv-devtools-hitlog .miss { color: var(--mvdt-err-ink); font-weight: 700; }

/* profiler */
.mv-devtools-profbars { display: flex; align-items: flex-end; gap: 2px; height: 40px; margin: 6px 0; }
.mv-devtools-profbars .bar { width: 6px; background: var(--mvdt-chart); border-radius: 2px 2px 0 0; display: inline-block; }

/* insights (AI-styled) */
.mv-devtools-ai {
  position: relative; border-radius: 8px; padding: 8px 10px 8px 26px; margin: 6px 0;
  background: var(--mvdt-ai-bg); color: var(--mvdt-ai-ink);
  border: 1px solid transparent;
  background-clip: padding-box;
}
.mv-devtools-ai::before {
  content: "✦"; position: absolute; left: 9px; top: 7px;
  background: linear-gradient(135deg, var(--mvdt-ai-from), var(--mvdt-ai-to));
  -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 700;
}
.mv-devtools-ai::after {
  content: ""; position: absolute; inset: 0; border-radius: 8px; padding: 1px;
  background: linear-gradient(135deg, var(--mvdt-ai-from), var(--mvdt-ai-to));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; opacity: .55;
}
.mv-devtools-ai-result { white-space: pre-wrap; word-break: break-word; }
.mv-devtools-ai-action {
  background: linear-gradient(135deg, var(--mvdt-ai-from), var(--mvdt-ai-to));
  color: #fff; border: none; border-radius: 999px; padding: 4px 12px; cursor: pointer;
  font: 700 12px/1.3 ui-monospace, monospace;
}
.mv-devtools-ai-action:hover { filter: brightness(1.12); }
.mv-devtools-ai-action[disabled] { opacity: .6; cursor: wait; }
`;

/** Inject the devtools stylesheet into the panel's shadow root (idempotent per root). */
export function ensureDevtoolsStyles(root: ShadowRoot): void {
  if (root.querySelector("style[data-michi-vz-devtools]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-michi-vz-devtools", "");
  style.textContent = DEVTOOLS_CSS;
  root.appendChild(style);
}
