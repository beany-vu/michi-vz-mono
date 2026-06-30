// Visually-hidden semantic DOM mirror placed next to the <svg>/<canvas>. Gives
// screen readers (and DOM-scraping tools / LLMs) a real, readable representation
// even in canvas mode where there are no per-mark nodes. Renders purely from the
// chart-agnostic BaseChartContext (`summary` + `a11yTable`), so EVERY chart reuses
// it — no per-chart series shape leaks in here.
import { htmlEl, svgEl, clear } from "../dom";
import type { BaseChartContext } from "../types";

/**
 * Add machine-readable SEO/semantic nodes to the chart `<svg>`: a `<title>` (chart
 * title), `<desc>` (the deterministic summary), and a `<metadata>` block carrying
 * schema.org JSON-LD. The text lands in the DOM so crawlers index it; the SVG is also
 * marked `aria-hidden` because the visually-hidden `.mv-a11y` table is the screen-reader
 * representation (this avoids a double announcement). Called from renderA11yMirror, which
 * every engine already invokes with the context — so all charts get it from one place.
 * render() clears the <svg> each pass, so these nodes are re-added fresh (no duplicates).
 */
function applySvgSemantics(svg: SVGElement, ctx: BaseChartContext): void {
  const titleText = ctx.title || "Chart";

  const title = svgEl("title", { class: "mv-title" });
  title.textContent = titleText;
  const desc = svgEl("desc", { class: "mv-desc" });
  desc.textContent = ctx.summary;
  const metadata = svgEl("metadata", { class: "mv-metadata" });
  metadata.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: titleText,
    description: ctx.summary,
    encodingFormat: "image/svg+xml",
    creator: { "@type": "SoftwareApplication", name: "michi-vz", url: "https://michi-vz.netlify.app" },
  });

  // Semantic order: title -> desc -> metadata at the top of the <svg>.
  svg.insertBefore(metadata, svg.firstChild);
  svg.insertBefore(desc, svg.firstChild);
  svg.insertBefore(title, svg.firstChild);
  svg.setAttribute("aria-hidden", "true");
}

export function renderA11yMirror(host: HTMLElement, ctx: BaseChartContext): void {
  clear(host);
  host.setAttribute("aria-label", ctx.summary);

  // The chart <svg> is a direct sibling of this a11y host; enrich it for crawlers.
  const svg = host.parentElement?.querySelector(":scope > svg");
  if (svg) applySvgSemantics(svg as SVGElement, ctx);

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
