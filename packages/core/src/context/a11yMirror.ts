// Visually-hidden semantic DOM mirror placed next to the <svg>/<canvas>. Gives
// screen readers (and DOM-scraping tools / LLMs) a real, readable representation
// even in canvas mode where there are no per-mark nodes. Built from the same
// ChartContext as everything else.
import { htmlEl, clear } from "../dom";
import type { ChartContext } from "../types";

export function renderA11yMirror(host: HTMLElement, ctx: ChartContext): void {
  clear(host);
  host.setAttribute("aria-label", ctx.summary);

  const caption = htmlEl("p");
  caption.textContent = ctx.summary;
  host.appendChild(caption);

  const table = htmlEl("table");
  const thead = htmlEl("thead");
  const hr = htmlEl("tr");
  for (const h of ["Label", "Value 1", "Value 2", "Difference", "Gap"]) {
    const th = htmlEl("th");
    th.textContent = h;
    hr.appendChild(th);
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = htmlEl("tbody");
  for (const s of ctx.series) {
    const tr = htmlEl("tr");
    for (const cell of [s.label, s.value1, s.value2, s.difference, s.gap]) {
      const td = htmlEl("td");
      td.textContent = String(cell);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  host.appendChild(table);
}
