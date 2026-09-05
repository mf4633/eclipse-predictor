# Eclipse Predictor

Single-file 3D solar eclipse visualizer. Step through every solar eclipse from **1900 to 2200** — about 690 events generated live using astronomy-engine (Don Cross's MIT-licensed port of Steve Moshier's ephemeris, sub-arcsecond accuracy) — and watch the path of totality sweep across a Three.js Earth.

**Live demo**: open `index.html` in any modern browser, or visit the deployed copy at <https://boardgaminghub.com/EclipsePredictor.html>.

![screenshot placeholder](https://via.placeholder.com/800x400?text=Eclipse+Predictor)

## What it does

- **Computed catalog** — every solar eclipse 1900–2200 (~690 events) generated at page load using astronomy-engine's SearchGlobalSolarEclipse / NextGlobalSolarEclipse (matches NASA's Five Millennium Canon)
- **Live path computation** — Besselian elements from astronomy-engine positions, central path (and penumbra) traced where the Moon's shadow axis intersects Earth's surface, sampled at high frequency
- **Shaded partial-eclipse zone** — 11 stacked translucent penumbra rings sampled across ±2 hours show the swath of partial visibility around the central path
- **3D landmarks** — 17 cartoon monuments (Eiffel, Pyramids, Sphinx, Opera House, Liberty, Big Ben, Taj, Fuji, Christ Redeemer, Stonehenge, Moai, Colosseum, Burj, Petra, Chichen Itza, Angkor Wat, Kilimanjaro) at correct lat/lon with hover tooltips
- **Duration at your viewpoint** — click anywhere on the globe (or type lat/lon) to pin a viewpoint. The panel lists the four contact times C1–C4, how long totality / annularity lasts there, how long the partial phases run, obscuration, and Sun altitude, with a timeline strip showing the totality window inside the partial span. Viewpoints ride along in share links (`#2026-08-12@43.3872,-3.7478`).
- **Transparent duration math** — "How is duration computed?" opens section 8 of the math panel: the shadow-cone geometry (observer's distance *r* from the shadow axis vs. the umbra radius *k* and penumbra radius *p* in the observer's plane), the contact conditions *r = p* and *r = |k|* with their residuals, and an independent chord-over-speed estimate that reproduces the root-found duration to within a few seconds
- **Year jump** — type a year to jump to the nearest cataloged eclipse
- **Day/night terminator** — Earth's lit and shaded sides at the eclipse instant

## Controls

| | |
|---|---|
| `←` / `→` | Previous / next eclipse |
| `JUMP TO` field | Type year + Enter to jump |
| `PLAY` | Auto-advance every ~2 seconds |
| Drag | Rotate globe |
| Scroll | Zoom |
| Hover landmark | Show name |
| Click / tap globe | Set your viewpoint (contact times + durations) |
| `?` | Help modal |

## Accuracy

Catalog dates, types, and greatest-eclipse circumstances match NASA's [Five Millennium Canon of Solar Eclipses](https://eclipse.gsfc.nasa.gov) to high precision (via astronomy-engine). Central paths are accurate to roughly **±1–2 km** on the ground across the full range. Partial visibility zones are approximate. Local contact times come from astronomy-engine's `SearchLocalSolarEclipse` (sea-level observer, no limb corrections, ±1 s root-finding), so per-viewpoint durations agree with NASA/Espenak local circumstances to a few seconds. For mission-critical use, cross-check with <https://eclipse.gsfc.nasa.gov>.

## Tests

```
npm install
npm run test:e2e          # headless Chromium (SwiftShader WebGL) drives the real page
E2E_BROWSER=webkit npm run test:e2e
# drive the boardgaminghub.com copy (merged hub page) from a sibling checkout:
E2E_ROOT=../board-gaming E2E_PAGE=/EclipsePredictor.html npm run test:e2e
```

The suite deep-links a known site (Hornedo, 2026-08-12), checks the contact table, headline duration, timeline strip, and math panel, verifies that clicking the globe places the pin under the cursor while dragging does not, exercises partial-only and annular sites, and taps the globe on a phone-sized viewport. It skips cleanly when playwright-core or a browser is missing.

## Stack

- Single HTML file, no build step
- [Three.js r128](https://threejs.org) (CDN)
- [world-atlas](https://github.com/topojson/world-atlas) coastlines (CDN, ~80 KB TopoJSON, decoded inline)

## License

MIT — see [LICENSE](LICENSE).

## See also

For a single location and date, the [eclipse sun position calculator](https://pe-calc.com/tools/eclipse-sun-position.html) on pe-calc.com gives altitude, azimuth, and a totality check without the 3D globe.
