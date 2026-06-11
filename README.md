# Eclipse Predictor

Single-file 3D solar eclipse visualizer. Step through every solar eclipse from **1900 to 2200** — about 3,700 events generated live using astronomy-engine (Don Cross's MIT-licensed port of Steve Moshier's ephemeris, sub-arcsecond accuracy) — and watch the path of totality sweep across a Three.js Earth.

**Live demo**: open `index.html` in any modern browser, or visit the deployed copy at <https://boardgaminghub.com/EclipsePredictor.html>.

![screenshot placeholder](https://via.placeholder.com/800x400?text=Eclipse+Predictor)

## What it does

- **Computed catalog** — every solar eclipse 1900–2200 (~3,700 events) generated at page load using astronomy-engine's SearchGlobalSolarEclipse / NextGlobalSolarEclipse (matches NASA's Five Millennium Canon)
- **Live path computation** — Besselian elements from astronomy-engine positions, central path (and penumbra) traced where the Moon's shadow axis intersects Earth's surface, sampled at high frequency
- **Shaded partial-eclipse zone** — 11 stacked translucent penumbra rings sampled across ±2 hours show the swath of partial visibility around the central path
- **3D landmarks** — 17 cartoon monuments (Eiffel, Pyramids, Sphinx, Opera House, Liberty, Big Ben, Taj, Fuji, Christ Redeemer, Stonehenge, Moai, Colosseum, Burj, Petra, Chichen Itza, Angkor Wat, Kilimanjaro) at correct lat/lon with hover tooltips
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
| `?` | Help modal |

## Accuracy

Catalog dates, types, and greatest-eclipse circumstances match NASA's [Five Millennium Canon of Solar Eclipses](https://eclipse.gsfc.nasa.gov) to high precision (via astronomy-engine). Central paths are accurate to roughly **±1–2 km** on the ground across the full range. Partial visibility zones are approximate. For mission-critical use, cross-check with <https://eclipse.gsfc.nasa.gov>.

## Stack

- Single HTML file, no build step
- [Three.js r128](https://threejs.org) (CDN)
- [world-atlas](https://github.com/topojson/world-atlas) coastlines (CDN, ~80 KB TopoJSON, decoded inline)

## License

MIT — see [LICENSE](LICENSE).
