// tests/e2e/harness.mjs — shared plumbing for the headless-browser E2E track.
//
// Serves the repo root over a local HTTP server and drives the REAL index.html in headless
// Chromium (WebGL via SwiftShader), so the Three.js globe, astronomy-engine, and the
// click-to-viewpoint raycast are exercised end-to-end.
//
// Skips gracefully when playwright-core or a Chromium binary isn't present.

import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { extname, join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
};

// E2E_ROOT=<dir> serves a different directory (e.g. the board-gaming hub checkout) and
// E2E_PAGE=<path> names the page under test there (default /index.html).
export const PAGE = process.env.E2E_PAGE || '/index.html';
export function startServer(root = process.env.E2E_ROOT || ROOT) {
  root = resolve(root);   // normalise separators so the containment check below works on Windows
  const server = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const fp = join(root, p);
    if (!fp.startsWith(root) || !existsSync(fp)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(readFileSync(fp));
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

// Locate a Chromium executable without hard-coding a version. Returns null if none found.
export function findChromium(chromium) {
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  try { const p = chromium && chromium.executablePath(); if (p && existsSync(p)) return p; } catch { /* not registered */ }
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '/opt/pw-browsers',
    join(homedir(), '.cache', 'ms-playwright'),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright'),
    join(homedir(), 'AppData', 'Local', 'ms-playwright'),
  ].filter(Boolean);
  const exeRel = [
    'chrome-linux/chrome', 'chrome-win/chrome.exe', 'chrome-win64/chrome.exe',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium',
    'chrome-linux/headless_shell',
    'chrome-headless-shell-linux64/chrome-headless-shell',
    'chrome-headless-shell-win64/chrome-headless-shell.exe',
    'chrome-headless-shell-mac-arm64/chrome-headless-shell',
  ];
  for (const root of roots) {
    let entries;
    try { entries = readdirSync(root); } catch { continue; }
    const ranked = entries
      .map(d => /^chromium(_headless_shell)?-(\d+)$/.exec(d))
      .filter(Boolean)
      .sort((a, b) => (!!a[1] - !!b[1]) || (Number(b[2]) - Number(a[2])))
      .map(m => m[0]);
    for (const d of ranked) {
      for (const rel of exeRel) { const p = join(root, d, ...rel.split('/')); if (existsSync(p)) return p; }
    }
  }
  return null;
}

export async function getBrowserLauncher(engine = process.env.E2E_BROWSER || 'chromium') {
  let pw;
  try { pw = await import('playwright-core'); }
  catch { return { skip: true, reason: 'playwright-core not installed (run: npm i -D playwright-core)' }; }
  if (engine === 'webkit' || engine === 'firefox') {
    const type = pw[engine];
    let executablePath = null;
    try { executablePath = type.executablePath(); } catch { /* not installed */ }
    if (!executablePath || !existsSync(executablePath)) return { skip: true, reason: `${engine} not installed (run: npx playwright-core install ${engine})` };
    return { skip: false, chromium: type, executablePath, engine, launchArgs: [] };
  }
  const chromium = pw.chromium;
  const executablePath = process.env.E2E_CHROMIUM || findChromium(chromium);
  if (!executablePath) return { skip: true, reason: 'no Chromium binary found (run: npx playwright install chromium)' };
  return { skip: false, chromium, executablePath, engine: 'chromium', launchArgs: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
}

// Block third-party beacons so a test run never records a pageview or loads the comments widget.
export async function quiet(ctx) {
  await ctx.route(/hc-refactored\.fly\.dev|giscus\.app/, (r) => r.abort());
}

// Wait until the page has computed its catalog and hidden the loading overlay.
export async function waitReady(page) {
  await page.waitForFunction(() => {
    const o = document.getElementById('loadOverlay');
    return o && o.style.display === 'none';
  }, null, { timeout: 90000 });
}
