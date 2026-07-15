// Headless browser verification of the GapChart PoC playground: serves the repo
// over http, loads playground/index.html in chromium, and asserts all in-page
// self-tests pass (incl. the canvas colour contract via pixel readback).
// NOTE: `page.evaluate()` below is Playwright's sanctioned API for running a
// function INSIDE the already-launched, sandboxed headless Chromium page it
// controls (server-served, trusted local content) - it is unrelated to, and
// not a stand-in for, JS `eval()` on untrusted input.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".map": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const path = join(ROOT, normalize(url).replace(/^(\.\.[/\\])+/, ""));
    const body = await readFile(path);
    res.writeHead(200, { "content-type": MIME[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/playground/index.html`;

let code = 1;
try {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.getElementById("results")?.textContent?.includes("checks passed"),
    {
      timeout: 15000,
    },
  );
  const text = await page.$eval("#results", (el) => el.textContent);
  console.log("\n" + text + "\n");
  if (errors.length) console.log("page errors:\n" + errors.join("\n"));
  const m = text.match(/(\d+)\/(\d+) checks passed/);
  let passed = m ? Number(m[1]) : 0;
  let total = m ? Number(m[2]) : 0;

  // B3.7 real-pointer SVG small-circle hover check. SymbolMapChart's SVG
  // renderer wires hover as native per-mark `mouseenter`/`mouseleave` on a
  // descendant <g> (renderSvg.ts) - a synthetic `dispatchEvent` call from
  // in-page JS can't exercise that (dispatchEvent only visits the target +
  // its ANCESTORS, never descendants). `locator.hover()` drives a REAL
  // OS-level pointer move (scrolling the target into view first - this card
  // sits far down the page, and raw viewport coordinates from an unscrolled
  // `getBoundingClientRect()` would miss the actual browser viewport
  // entirely), which the browser resolves via genuine geometric hit-testing
  // - exactly what jsdom vitest tests cannot do, and the only way to prove
  // the reported bug (tiny circles finding nothing on hover) is actually
  // fixed for the SVG renderer.
  const tooltipVisible = () =>
    page.evaluate((id) => window.__b37TooltipVisible(id), "symbolSmallSvg");
  const tinyLocator = page.locator('#symbolSmallSvg circle.symbol[data-label="Tiny"]');
  const extra = [];
  if ((await tinyLocator.count()) > 0) {
    // `force: true`: B3.7's invisible, larger `circle.symbol-hit` sits ON TOP
    // of the tiny visible circle BY DESIGN (that's the forgiving hit target
    // itself), so Playwright's default actionability check correctly reports
    // it as "intercepting" the click - that IS what a real pointer lands on
    // too, and the `g.symbol-cell` listener fires regardless of which of its
    // painted children the browser resolves as the topmost hit target.
    await tinyLocator.hover({ force: true });
    extra.push([
      "SYMBOL SVG SMALL-CIRCLE (real pointer): hovering the tiny (r=3) node's exact center shows the tooltip (B3.7 repro fixed)",
      await tooltipVisible(),
    ]);
    const box = await tinyLocator.boundingBox();
    await tinyLocator.hover({ position: { x: box.width / 2 + 6, y: box.height / 2 }, force: true });
    extra.push([
      "SYMBOL SVG SMALL-CIRCLE (real pointer): hovering 6px off the tiny node's center still shows the tooltip (forgiving hover)",
      await tooltipVisible(),
    ]);
    await page.mouse.move(1, 1);
    extra.push([
      "SYMBOL SVG SMALL-CIRCLE (real pointer): moving well away hides the tooltip again (forgiveness isn't unbounded)",
      !(await tooltipVisible()),
    ]);
  } else {
    extra.push([
      "SYMBOL SVG SMALL-CIRCLE (real pointer): tiny node's circle.symbol was not found in the page",
      false,
    ]);
  }
  for (const [msg, ok] of extra) {
    console.log(`${ok ? "✅ PASS" : "❌ FAIL"}  ${msg}`);
    total++;
    if (ok) passed++;
  }

  console.log(`\n${passed}/${total} checks passed.\n`);
  code = passed === total ? 0 : 1;
  await browser.close();
} catch (e) {
  console.error("verification failed to run:", e.message);
  code = 2;
} finally {
  server.close();
}
process.exit(code);
