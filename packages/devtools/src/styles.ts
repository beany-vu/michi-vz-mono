// Self-contained styles for the devtools panel, namespaced under `.mv-devtools` so
// they never touch the charts' consumer color contract (core.css stays untouched).
// Light DOM (matching the library's no-shadow rule); injected once on first mount.
export const DEVTOOLS_CSS = `
.mv-devtools, .mv-devtools * { box-sizing: border-box; }
.mv-devtools {
  position: fixed; z-index: 2147483000; right: 16px; bottom: 16px;
  width: 420px; max-width: calc(100vw - 32px); max-height: 70vh;
  display: flex; flex-direction: column;
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: #e6e6e6; background: #1c1f26; border: 1px solid #333a45;
  border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.45); overflow: hidden;
}
.mv-devtools[hidden] { display: none; }
.mv-devtools-header {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  background: #232733; border-bottom: 1px solid #333a45; cursor: default;
}
.mv-devtools-title { font-weight: 700; color: #ffd24a; letter-spacing: .02em; }
.mv-devtools-count { color: #8a93a3; }
.mv-devtools-spacer { flex: 1; }
.mv-devtools-btn {
  background: #2c3240; color: #cfd6e0; border: 1px solid #3a4250; border-radius: 6px;
  padding: 3px 8px; cursor: pointer; font: inherit;
}
.mv-devtools-btn:hover { background: #353c4c; }
.mv-devtools-body { display: flex; min-height: 0; flex: 1; }
.mv-devtools-list {
  width: 38%; border-right: 1px solid #2a2f3a; overflow: auto; padding: 4px;
}
.mv-devtools-item {
  padding: 6px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.mv-devtools-item:hover { background: #262b36; }
.mv-devtools-item.is-active { background: #2f3a52; color: #fff; }
.mv-devtools-item .ct { color: #7fd1ff; }
.mv-devtools-detail { flex: 1; overflow: auto; padding: 8px 10px; min-width: 0; }
.mv-devtools-detail h4 {
  margin: 10px 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
  color: #8a93a3; font-weight: 700;
}
.mv-devtools-summary { color: #d7e7c7; background: #20261d; border: 1px solid #38432c;
  border-radius: 6px; padding: 6px 8px; }
.mv-devtools-kv { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
.mv-devtools-kv .k { color: #8a93a3; }
.mv-devtools table { width: 100%; border-collapse: collapse; }
.mv-devtools th, .mv-devtools td {
  text-align: left; padding: 3px 6px; border-bottom: 1px solid #2a2f3a; white-space: nowrap;
}
.mv-devtools th { color: #8a93a3; font-weight: 600; }
.mv-devtools .badge { display: inline-block; padding: 0 6px; border-radius: 999px; font-size: 11px; }
.mv-devtools .badge.actual { background: #1f3a2a; color: #7fdca0; }
.mv-devtools .badge.predicted { background: #3a2f1f; color: #ffce7a; }
.mv-devtools details { margin-top: 4px; }
.mv-devtools summary { cursor: pointer; color: #8a93a3; }
.mv-devtools pre {
  margin: 4px 0 0; padding: 8px; background: #14171d; border: 1px solid #2a2f3a;
  border-radius: 6px; overflow: auto; max-height: 220px; white-space: pre; color: #cdd6e2;
}
.mv-devtools textarea {
  width: 100%; min-height: 110px; resize: vertical; font: inherit; color: #cdd6e2;
  background: #14171d; border: 1px solid #2a2f3a; border-radius: 6px; padding: 6px;
}
.mv-devtools .row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 4px 0; }
.mv-devtools label.chk { display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
  background: #232733; border: 1px solid #333a45; border-radius: 6px; padding: 2px 6px; }
.mv-devtools .err { color: #ff8a8a; }
.mv-devtools .empty { color: #8a93a3; padding: 16px; text-align: center; }
.mv-devtools-history { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
.mv-devtools-btn.is-active { background: #2f3a52; color: #fff; }
.mv-devtools-histbanner {
  color: #ffce7a; background: #3a2f1f; border: 1px solid #5a4a2a;
  border-radius: 6px; padding: 3px 8px; margin-bottom: 6px;
}
.mv-devtools-toggle {
  position: fixed; z-index: 2147482999; right: 16px; bottom: 16px;
  background: #232733; color: #ffd24a; border: 1px solid #333a45; border-radius: 999px;
  padding: 8px 12px; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.4);
  font: 700 12px/1 ui-monospace, monospace;
}
.mv-devtools-toggle[hidden] { display: none; }
`;

let injected = false;

export function ensureDevtoolsStyles(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.setAttribute("data-michi-vz-devtools", "");
  style.textContent = DEVTOOLS_CSS;
  document.head.appendChild(style);
}
