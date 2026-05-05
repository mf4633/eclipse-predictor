# Eclipse Predictor

Single-file 3D solar eclipse visualizer. Step through every solar eclipse from **1900 to 2200** — about 3,700 events generated live from Meeus astronomical algorithms — and watch the path of totality sweep across a Three.js Earth.

**Live demo**: open `index.html` in any modern browser, or visit the deployed copy at <https://boardgaminghub.com/EclipsePredictor.html>.

![screenshot placeholder](https://via.placeholder.com/800x400?text=Eclipse+Predictor)

## What it does

- **Computed catalog** — every solar eclipse 1900–2200 (~3,700 events) generated at page load by walking new moons via the synodic month and classifying each via Besselian elements
- **Live path computation** — Sun position from Meeus *Astronomical Algorithms* ch. 25, Moon position from a 30-term truncated ELP-2000 model, Besselian elements derived from sub-solar/sub-lunar geometry, central path traced where the shadow axis pierces Earth's surface
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

Catalog dates and types match NASA's [Five Millennium Canon of Solar Eclipses](https://eclipse.gsfc.nasa.gov). Computed paths are accurate to roughly **±100 km** — fine for visualization, **not** for chasing totality. For mission-critical predictions go to <https://eclipse.gsfc.nasa.gov>.

## Stack

- Single HTML file, no build step
- [Three.js r128](https://threejs.org) (CDN)
- [world-atlas](https://github.com/topojson/world-atlas) coastlines (CDN, ~80 KB TopoJSON, decoded inline)

## License

MIT — see [LICENSE](LICENSE).
