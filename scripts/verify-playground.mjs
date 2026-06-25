// Headless browser verification of the GapChart PoC playground: serves the repo
// over http, loads playground/index.html in chromium, and asserts all in-page
// self-tests pass (incl. the canvas colour contract via pixel readback).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".map": "application/json" };

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
  await page.waitForFunction(() => document.getElementById("results")?.textContent?.includes("checks passed"), {
    timeout: 15000,
  });
  const text = await page.$eval("#results", (el) => el.textContent);
  console.log("\n" + text + "\n");
  if (errors.length) console.log("page errors:\n" + errors.join("\n"));
  const m = text.match(/(\d+)\/(\d+) checks passed/);
  code = m && m[1] === m[2] ? 0 : 1;
  await browser.close();
} catch (e) {
  console.error("verification failed to run:", e.message);
  code = 2;
} finally {
  server.close();
}
process.exit(code);
