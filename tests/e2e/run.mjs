// tests/e2e/run.mjs — headless-browser E2E runner.
//
//   npm run test:e2e                # newest Chromium in the Playwright cache
//   E2E_BROWSER=webkit npm run test:e2e
//   E2E_ONLY=viewpoint npm run test:e2e
//
// Exits 0 with a SKIPPED banner when playwright-core / a browser aren't available;
// exits 1 on any assertion failure or uncaught page error.

import { startServer, getBrowserLauncher } from './harness.mjs';
import viewpointTests from './viewpoint.e2e.mjs';

const GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', BOLD = '\x1b[1m', RESET = '\x1b[0m';
const SUITES = [['viewpoint', viewpointTests]];

function makeT(name, fails) {
  let pass = 0, fail = 0;
  const rec = (ok, msg, extra) => { if (ok) { pass++; } else { fail++; fails.push(`  ${RED}✗${RESET} ${name} » ${msg}${extra ? '\n      ' + extra : ''}`); } };
  return {
    ok: (v, m) => rec(!!v, m),
    notOk: (v, m) => rec(!v, m),
    eq: (a, b, m) => rec(a === b, m, a === b ? '' : `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`),
    match: (s, re, m) => rec(re.test(String(s)), m, re.test(String(s)) ? '' : `expected /${re.source}/ in ${JSON.stringify(String(s).slice(0, 200))}`),
    close: (a, b, tol, m) => rec(Math.abs(a - b) <= tol, m, Math.abs(a - b) <= tol ? '' : `expected ${b}±${tol}, got ${a}`),
    counts: () => ({ pass, fail }),
  };
}

async function main() {
  console.log(`\n${BOLD}Eclipse Predictor E2E suite (headless browser)${RESET}\n`);
  const launcher = await getBrowserLauncher();
  if (launcher.skip) {
    console.log(`${DIM}⊘ SKIPPED — ${launcher.reason}.${RESET}\n`);
    process.exit(0);
  }
  const { server, port } = await startServer();
  const engine = launcher.engine || 'chromium';
  console.log(`${DIM}engine: ${engine} (${launcher.executablePath})${RESET}\n`);
  const browser = await launcher.chromium.launch({ executablePath: launcher.executablePath, args: launcher.launchArgs || [] });
  const ONLY = process.env.E2E_ONLY ? new Set(process.env.E2E_ONLY.split(',')) : null;
  const fails = [];
  let totalPass = 0, totalFail = 0;

  for (const [name, testFn] of SUITES) {
    if (ONLY && !ONLY.has(name)) continue;
    const t = makeT(name, fails);
    try {
      await testFn({ browser, port, t, engine });
    } catch (e) {
      totalFail++;
      fails.push(`  ${RED}✗${RESET} ${name} » threw: ${String(e && e.stack || e).slice(0, 600)}`);
    }
    const { pass, fail } = t.counts();
    totalPass += pass; totalFail += fail;
    const status = fail === 0 ? `${GREEN}✓ pass${RESET}` : `${RED}✗ fail${RESET}`;
    console.log(`${status}  ${BOLD}${name}${RESET}  ${DIM}(${pass} passed, ${fail} failed)${RESET}`);
  }

  await browser.close();
  server.close();
  if (fails.length) console.log('\n' + fails.join('\n'));
  console.log(`\n${BOLD}${totalFail === 0 ? GREEN + 'PASS' : RED + 'FAIL'}${RESET}  ${totalPass} passed, ${totalFail} failed\n`);
  process.exit(totalFail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
