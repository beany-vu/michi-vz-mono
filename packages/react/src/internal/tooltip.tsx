// Shared React → HTML bridges. The engine sanitizes a STRING tooltip and injects a
// STRING of svg markup, so a consumer formatter (or a JSX children slot) has to be
// serialised before it reaches the core. Five charts wrap a tooltipFormatter and two
// serialise children; this is the one place react-dom/server is imported so the
// bridge is shared by the subpaths instead of copied into each of them.
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";

/**
 * Serialise a consumer tooltipFormatter result to the static HTML the engine
 * expects. Consumers return JSX; the core sanitizes a STRING, so a React-node
 * result must be converted here (else it stringifies to "[object Object]").
 */
export function toTooltipHtml(out: string | ReactNode): string {
  return typeof out === "string" ? out : renderToStaticMarkup(out as ReactElement);
}

/**
 * Serialise JSX children → SVG markup so the engine can inject them into the <svg>
 * without a React context (matches the legacy charts' {children} slot).
 */
export function svgChildrenMarkup(children: ReactNode): string | undefined {
  return children ? renderToStaticMarkup(<>{children}</>) : undefined;
}
