// Visually-hidden semantic DOM mirror placed next to the <svg>/<canvas>. Gives
// screen readers (and DOM-scraping tools / LLMs) a real, readable representation
// even in canvas mode where there are no per-mark nodes. Renders purely from the
// chart-agnostic BaseChartContext (`summary` + `a11yTable`), so EVERY chart reuses
// it — no per-chart series shape leaks in here.
import { htmlEl, clear } from "../dom";
import type { BaseChartContext } from "../types";

export function renderA11yMirror(host: HTMLElement, ctx: BaseChartContext): void {
  clear(host);
  host.setAttribute("aria-label", ctx.summary);

  const caption = htmlEl("p");
  caption.textContent = ctx.summary;
  host.appendChild(caption);

  const table = htmlEl("table");
  const thead = htmlEl("thead");
  const hr = htmlEl("tr");
  for (const h of ctx.a11yTable.headers) {
    const th = htmlEl("th");
    th.textContent = h;
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = htmlEl("tbody");
  for (const row of ctx.a11yTable.rows) {
    const tr = htmlEl("tr");
    for (const cell of row) {
      const td = htmlEl("td");
      td.textContent = String(cell);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  host.appendChild(table);
}
