// Screenshot a page in a fresh, logged-out headless Chromium (never the user's Chrome).
// Usage: node scripts/shot.mjs <url> <out.jpeg> [width=1440] [full=1] [waitMs=1500]
// Prints console errors and horizontal overflow so a check gives evidence, not claims.
import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";

const npx = path.join(os.homedir(), ".npm/_npx");
const pwDir = fs.readdirSync(npx).map((d) => path.join(npx, d, "node_modules"))
  .find((d) => fs.existsSync(path.join(d, "playwright")));
const { chromium } = createRequire(path.join(pwDir, "/"))("playwright");
const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
const chromeDir = fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const exe = path.join(cache, chromeDir, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");

const [url, out, w = "1440", full = "1", wait = "1500"] = process.argv.slice(2);
const width = +w;
const b = await chromium.launch({ headless: true, executablePath: exe });
const ctx = await b.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
// scroll through so lazy images and in-view animations trigger
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(+wait);
fs.mkdirSync(path.dirname(out), { recursive: true });
await p.screenshot({ path: out, type: "jpeg", quality: 72, fullPage: full === "1" });
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await b.close();
console.log(JSON.stringify({ out, width, overflowPx: overflow, consoleErrors: errs.slice(0, 10) }));
