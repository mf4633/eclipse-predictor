// tests/e2e/viewpoint.e2e.mjs — "duration at your viewpoint" in a real browser.
//
// What this locks down (none of it is reachable without a browser):
//   1. A deep link with a viewpoint (#YYYY-MM-DD@lat,lon) renders the contact table, the
//      headline duration, and the timeline strip for a known site (Hornedo, 2026-08-12).
//   2. The math panel's section 8 shows the shadow-cone numbers and its chord estimate
//      agrees with the root-found duration to within a few seconds.
//   3. Clicking the globe places the viewpoint (raycast → lat/lon → inputs → hash → pin);
//      dragging the globe does NOT.
//   4. Partial-only and annular sites take the right branch of the UI.
//   5. The touch path (tap) places a viewpoint on a phone-sized viewport.
//   6. No uncaught page errors anywhere along the way.

import { waitReady } from './harness.mjs';

const HORNEDO = '43.3872,-3.7478';

export default async function viewpointTests({ browser, port, t }) {
  const base = `http://127.0.0.1:${port}/index.html`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

  // ---- 1. deep link with viewpoint → Hornedo 2026 ----
  await page.goto(`${base}#2026-08-12@${HORNEDO}`);
  await waitReady(page);
  await page.waitForFunction(() => /TOTAL/.test(document.getElementById('locResult').textContent), null, { timeout: 20000 });
  const res = await page.$eval('#locResult', el => el.textContent);
  t.match(res, /TOTAL/, 'Hornedo 2026-08-12 is reported as TOTAL');
  t.match(res, /1m 1[01]s/, 'headline totality duration ≈ 1m 11s (NASA: 1m 10s at Hornedo)');
  t.match(res, /C1 partial begins/, 'C1 row present');
  t.match(res, /C2 totality begins/, 'C2 row present');
  t.match(res, /C3 totality ends/, 'C3 row present');
  t.match(res, /C4 partial ends/, 'C4 row present');
  t.match(res, /Partial phases C1→C4\s*1h 4\dm/, 'partial phases run ~1h 48m');
  t.match(res, /Obscuration\s*100\.0%/, 'obscuration is 100% inside the umbra');
  t.eq(await page.$eval('#locLat', el => el.value), '43.3872', 'lat input populated from the hash');
  t.eq(await page.$eval('#locLon', el => el.value), '-3.7478', 'lon input populated from the hash');
  t.eq(await page.evaluate(() => location.hash), `#2026-08-12@${HORNEDO}`, 'hash round-trips the viewpoint');
  t.eq(await page.$eval('#openDurMath', el => getComputedStyle(el).display), 'block', '"How is duration computed?" button is visible');
  t.eq(await page.evaluate(() => viewpointGroup.children.length), 2, 'viewpoint pin (dot + ring) drawn on the globe');
  // Timeline strip: totality segment is a small slice of the partial span, with the peak tick inside it.
  const strip = await page.$eval('#locResult', el => {
    const tot = el.querySelector('.vp-tot'), peak = el.querySelector('.vp-peak');
    return tot && peak ? { left: parseFloat(tot.style.left), width: parseFloat(tot.style.width), peak: parseFloat(peak.style.left) } : null;
  });
  t.ok(strip, 'timeline strip rendered with a totality segment and a peak tick');
  if (strip) {
    t.ok(strip.width > 0 && strip.width < 5, `totality segment is a thin slice of the partial span (${strip.width.toFixed(2)}%)`);
    t.ok(strip.peak >= strip.left && strip.peak <= strip.left + strip.width, 'peak tick sits inside the totality segment');
  }
  const meta = await page.$eval('#ecLocal', el => el.textContent);
  t.match(meta, /Your spot: TOTAL, 1m 1[01]s totality, peak 18:27:\d\d UTC/, 'info panel meta line summarises the viewpoint');

  // ---- 2. math panel section 8 ----
  await page.click('#openDurMath');
  await page.waitForSelector('#mathModal.open', { timeout: 5000 });
  const math = await page.$eval('#mathViewpoint', el => el.textContent);
  t.match(math, /Viewpoint:\s*43\.3872°, -3\.7478°/, 'section 8 names the viewpoint');
  t.match(math, /r₀ \(miss distance\):\s*\d+\.\d+ km/, 'r₀ shown in km');
  t.match(math, /k \(umbra radius\):\s*\d+\.\d+ km\s+\(positive/, 'k positive → umbra reaches the observer');
  t.match(math, /Inside umbra\?:\s*r₀ < \|k\|\s+⇒\s+TOTAL/, 'classification derived from r₀ < |k|');
  t.match(math, /C2 r = \|k\|:.*Δ -?\d\.\d\d km/, 'C2 residual r − |k| is shown and sub-km');
  t.match(math, /C1 r = p:.*Δ -?0\.0\d km/, 'C1 residual r − p is essentially zero');
  const m = /D_totality ≈ chord \/ v:\s*[\d.]+ \/ [\d.]+ = ([\d.]+) s\s+vs exact ([\d.]+) s/.exec(math);
  t.ok(m, 'chord-estimate line present');
  if (m) {
    t.close(parseFloat(m[1]), parseFloat(m[2]), 3, `chord estimate (${m[1]} s) agrees with root-found totality (${m[2]} s) within 3 s`);
    t.close(parseFloat(m[2]), 70.8, 2, 'root-found totality at Hornedo ≈ 70.8 s');
  }
  t.ok(await page.$$eval('#mathViewpointSection .katex', els => els.length) > 0, 'KaTeX rendered the section 8 formulas');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#mathModal.open'), null, { timeout: 5000 });

  // ---- 3a. drag does NOT move the viewpoint ----
  const box = await page.$eval('#globeCanvas', el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 40, cy + 10, { steps: 6 });
  await page.mouse.move(cx + 80, cy + 20, { steps: 6 });
  await page.mouse.up();
  t.eq(await page.$eval('#locLat', el => el.value), '43.3872', 'a drag leaves the viewpoint alone');
  t.eq(await page.$eval('#viewFree', el => el.getAttribute('aria-pressed')), 'true', 'a drag switches to free rotate');

  // ---- 3b. click places the viewpoint ----
  // Snap the eased camera onto its target before clicking, so the pin can be re-projected against
  // a stationary view. (Headless SwiftShader renders ~10 fps, so waiting for the ease is slow.)
  await page.evaluate(() => { Object.assign(camCurrent, camTarget); updateCamera(); });
  await page.waitForTimeout(150);
  await page.mouse.click(cx, cy);
  await page.waitForFunction((prev) => document.getElementById('locLat').value !== prev, '43.3872', { timeout: 5000 });
  const lat = parseFloat(await page.$eval('#locLat', el => el.value));
  const lon = parseFloat(await page.$eval('#locLon', el => el.value));
  t.ok(Number.isFinite(lat) && Math.abs(lat) <= 90, `click set a finite latitude (${lat})`);
  t.ok(Number.isFinite(lon) && Math.abs(lon) <= 180, `click set a finite longitude (${lon})`);
  t.match(await page.evaluate(() => location.hash), /^#2026-08-12@-?\d+\.\d{4},-?\d+\.\d{4}$/, 'hash carries the clicked viewpoint');
  t.eq(await page.evaluate(() => viewpointGroup.children.length), 2, 'pin redrawn at the clicked spot');
  t.eq(await page.$eval('#landmarkTip', el => getComputedStyle(el).display), 'block', 'toast shown at the click point');
  const toast = await page.$eval('#landmarkTip', el => el.textContent);
  t.match(toast, /°[NS] .*°[EW] — /, 'toast names the spot and its outcome');
  // The clicked point should sit on the globe: re-project the pin and check it lands under the cursor.
  const pinPx = await page.evaluate(() => {
    const p = viewpointGroup.children[0].position.clone().project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (p.x * 0.5 + 0.5) * r.width, y: r.top + (-p.y * 0.5 + 0.5) * r.height };
  });
  t.ok(Math.hypot(pinPx.x - cx, pinPx.y - cy) < 12, `pin projects back to the click point (${Math.hypot(pinPx.x - cx, pinPx.y - cy).toFixed(1)} px off)`);

  // ---- 3c. share link includes the viewpoint ----
  await page.click('#shareBtn');
  await page.waitForFunction(() => document.getElementById('shareMsg').textContent.length > 0, null, { timeout: 3000 });
  t.match(await page.$eval('#shareMsg', el => el.textContent), /@-?\d+\.\d{4},-?\d+\.\d{4}/, 'share message includes the @lat,lon suffix');

  // ---- 4a. partial-only site: Asheville, 2024-04-08 ----
  await page.evaluate(() => { location.hash = '#2024-04-08@35.5951,-82.5515'; });
  await page.waitForFunction(() => /PARTIAL/.test(document.getElementById('locResult').textContent), null, { timeout: 20000 });
  const partial = await page.$eval('#locResult', el => el.textContent);
  t.match(partial, /PARTIAL/, 'Asheville 2024 is PARTIAL');
  t.match(partial, /8[45]%\s*of the Sun covered at peak/, 'headline is obscuration ≈ 85% for a partial site');
  t.notOk(/C2 totality begins/.test(partial), 'no C2/C3 rows for a partial site');
  t.notOk(await page.$('#locResult .vp-tot'), 'no totality segment on the strip for a partial site');
  await page.click('#openDurMath');
  await page.waitForSelector('#mathModal.open', { timeout: 5000 });
  const pmath = await page.$eval('#mathViewpoint', el => el.textContent);
  t.match(pmath, /Inside umbra\?:\s*r₀ ≥ \|k\|\s+⇒\s+PARTIAL only/, 'section 8 explains the partial classification');
  t.match(pmath, /k² − r₀² < 0 — the umbra never reaches you/, 'chord check explains why there is no totality');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#mathModal.open'), null, { timeout: 5000 });

  // ---- 4b. annular site: Albuquerque, 2023-10-14 ----
  await page.evaluate(() => { location.hash = '#2023-10-14@35.0844,-106.6504'; });
  await page.waitForFunction(() => /ANNULAR/.test(document.getElementById('locResult').textContent), null, { timeout: 20000 });
  const ann = await page.$eval('#locResult', el => el.textContent);
  t.match(ann, /ANNULAR/, 'Albuquerque 2023 is ANNULAR');
  t.match(ann, /4m 4[3-6]s\s*of annularity here/, 'annularity ≈ 4m 45s');
  t.match(ann, /C2 annularity begins/, 'contact rows use "annularity" wording');
  await page.click('#openDurMath');
  await page.waitForSelector('#mathModal.open', { timeout: 5000 });
  const amath = await page.$eval('#mathViewpoint', el => el.textContent);
  t.match(amath, /k \(umbra radius\):\s*-\d+\.\d+ km\s+\(negative: antumbra — annular\)/, 'k is negative for the annular site');
  await page.keyboard.press('Escape');

  // ---- 4c. clearing the inputs returns to the empty state ----
  await page.fill('#locLat', '');
  await page.click('#locCheck');
  t.match(await page.$eval('#locResult', el => el.textContent), /Click anywhere on the globe/, 'empty state invites the user to click the globe');
  t.eq(await page.evaluate(() => viewpointGroup.children.length), 0, 'pin removed when the viewpoint is cleared');
  t.eq(await page.evaluate(() => location.hash), '#2023-10-14', 'hash drops the @suffix when the viewpoint is cleared');
  t.eq(await page.$eval('#openDurMath', el => getComputedStyle(el).display), 'none', 'duration-math button hidden without a viewpoint');

  t.eq(pageErrors.length, 0, `no uncaught page errors (desktop)${pageErrors.length ? ': ' + pageErrors.join(' | ') : ''}`);
  await ctx.close();

  // ---- 5. touch path on a phone viewport ----
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mpage = await mctx.newPage();
  const mErrors = [];
  mpage.on('pageerror', (e) => mErrors.push(String(e).slice(0, 300)));
  await mpage.goto(`${base}#2026-08-12`);
  await waitReady(mpage);
  await mpage.waitForTimeout(600);
  const mbox = await mpage.$eval('#globeCanvas', el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await mpage.touchscreen.tap(mbox.x + mbox.w / 2, mbox.y + mbox.h / 2);
  await mpage.waitForFunction(() => document.getElementById('locLat').value !== '43.3872', null, { timeout: 5000 }).catch(() => {});
  const mlat = await mpage.$eval('#locLat', el => el.value);
  t.ok(mlat !== '43.3872' && Number.isFinite(parseFloat(mlat)), `tap on the globe placed a viewpoint (lat ${mlat})`);
  t.match(await mpage.evaluate(() => location.hash), /@/, 'tap updated the hash');
  t.eq(await mpage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow on a phone');
  t.eq(mErrors.length, 0, `no uncaught page errors (phone)${mErrors.length ? ': ' + mErrors.join(' | ') : ''}`);
  await mctx.close();
}
