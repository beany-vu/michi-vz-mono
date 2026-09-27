// tooltipFormatter receives the item with its value resolved (the median of the
// samples when the item gives none), so 1.28 code that reads d.value keeps working:
// at runtime (no TypeError on a samples-only item) and in strict TypeScript (d.value
// is a number, and a (d: FountainDataItem) => string formatter still fits).
import { afterEach, describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { mountFountainChart } from "../src/engine/fountainChart";
import type { FountainChartProps, FountainDataItem } from "../src/types";

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of hosts.splice(0)) h.remove();
});

function hover(props: FountainChartProps): string {
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  mountFountainChart(host, { width: 600, height: 400, ...props });
  const big = host.querySelector("circle.mv-fountain-value")!;
  host.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      clientX: Number(big.getAttribute("cx")),
      clientY: Number(big.getAttribute("cy")),
    }),
  );
  return host.querySelector(".tooltip")!.innerHTML;
}

describe("fountain tooltipFormatter: the item with its resolved value", () => {
  it("a samples-only item: d.value is the median, the formatter does not throw", () => {
    const seen: FountainDataItem[] = [];
    const item: FountainDataItem = { label: "Car", samples: [22, 30, 31, 55] };
    const html = hover({
      dataSet: [item],
      tooltipFormatter: (d) => {
        seen.push(d);
        return `<em>${d.value.toFixed(1)}</em>`;
      },
    });
    expect(html).toBe("<em>30.5</em>");
    // Every other field is the item's own; the item itself is left alone.
    expect(seen[0]).toMatchObject({ label: "Car", samples: [22, 30, 31, 55], value: 30.5 });
    expect(item.value).toBeUndefined();
  });

  it("an item that gives its value passes it through unchanged", () => {
    const html = hover({
      dataSet: [{ label: "Bus", value: 40, low: 32, high: 65, code: "B" }],
      tooltipFormatter: (d, jet) => `${d.value} ${d.code} ${jet?.value}`,
    });
    expect(html).toBe("40 B 40");
  });

  it("types: d.value is a number, and a (d: FountainDataItem) => string formatter still fits", () => {
    const typesFile = join(dirname(fileURLToPath(import.meta.url)), "../src/types.ts");
    const consumer = "/virtual/consumer.ts";
    const source = `
      import type { FountainChartProps, FountainDataItem } from ${JSON.stringify(typesFile.replace(/\.ts$/, ""))};
      const inline: FountainChartProps["tooltipFormatter"] = (d) => d.value.toFixed(1);
      const reused = (d: FountainDataItem): string => String(d.value ?? "");
      const props: Pick<FountainChartProps, "tooltipFormatter"> = { tooltipFormatter: reused };
      const both: FountainChartProps["tooltipFormatter"] = (d, jet) => \`\${d.value * 2} \${jet?.low}\`;
      export { inline, props, both };
    `;
    const options: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      types: [],
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, lang, ...rest) =>
      name === consumer
        ? ts.createSourceFile(name, source, lang)
        : getSourceFile(name, lang, ...rest);
    const fileExists = host.fileExists.bind(host);
    host.fileExists = (name) => name === consumer || fileExists(name);
    const program = ts.createProgram([consumer], options, host);
    // The consumer's own errors (types.ts leans on the GeoJSON globals, not loaded here).
    const errors = ts
      .getPreEmitDiagnostics(program, program.getSourceFile(consumer))
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    expect(errors).toEqual([]);
  });
});
