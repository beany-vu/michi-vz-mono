// Renders the 1200x630 Open Graph card to public/og-card.png.
// Social platforms (X, Slack, Discord, LinkedIn) expect a landscape ~1.91:1
// image for summary_large_image cards; the portrait crest alone gets cropped.
// Run from apps/docs: node scripts/generate-og-card.mjs
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const docsDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const shieldPng = await readFile(path.join(docsDir, "public", "michi-shield.png"));
const shield = `data:image/png;base64,${shieldPng.toString("base64")}`;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Josefin+Sans:wght@600;700&display=swap">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; }
  .card {
    width: 100%; height: 100%;
    background: radial-gradient(120% 160% at 85% 20%, #c0392b 0%, #a3271f 45%, #7e1c16 100%);
    display: flex; align-items: center;
    padding: 0 72px;
    position: relative;
  }
  .frame {
    position: absolute; inset: 24px;
    border: 2px solid rgba(243, 217, 164, 0.45);
    border-radius: 18px;
    pointer-events: none;
  }
  .text { flex: 1; padding-right: 48px; }
  .name {
    font-family: "Josefin Sans", sans-serif; font-weight: 700;
    font-size: 108px; color: #fff8ec; letter-spacing: -2px; line-height: 1;
  }
  .tagline {
    font-family: "Figtree", sans-serif; font-weight: 600;
    font-size: 34px; color: #f3d9a4; margin-top: 26px; line-height: 1.35;
  }
  .pills { margin-top: 34px; display: flex; gap: 12px; flex-wrap: wrap; }
  .pill {
    font-family: "Figtree", sans-serif; font-weight: 600; font-size: 21px;
    color: #fff8ec; border: 1.5px solid rgba(243, 217, 164, 0.6);
    border-radius: 999px; padding: 8px 18px 9px;
  }
  .crest { height: 470px; filter: drop-shadow(0 14px 30px rgba(0,0,0,0.35)); }
</style>
</head>
<body>
  <div class="card">
    <div class="frame"></div>
    <div class="text">
      <div class="name">michi-vz</div>
      <div class="tagline">Framework-agnostic charts for React, Vue, Svelte, Angular &amp; web components</div>
      <div class="pills">
        <span class="pill">LLM-ready ChartContext</span>
        <span class="pill">17 chart types</span>
        <span class="pill">MIT</span>
      </div>
    </div>
    <img class="crest" src="${shield}" alt="">
  </div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const out = path.join(docsDir, "public", "og-card.png");
await writeFile(out, await page.screenshot({ type: "png" }));
await browser.close();
console.log(`wrote ${out}`);
