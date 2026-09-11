# Map assets

- `island-world.png` — Mountain island world map (warm RPG micro-pixel). Landscape 1280×720; used with pan+zoom on portrait (`app/src/components/IslandWorldMap.jsx`). Harbor south, castle summit, blue crystal, no dragon. Candidate locked 2026-09-11 (Boss / Anthony).
  - Note: the file bytes are actually JPEG (JFIF) despite the `.png` name. Browsers sniff the content so it renders fine; keep the path as wired, or re-export as real PNG when the final asset lands.

## Island hotspots (% of image, approximate — DESIGN-OPEN: precise %)

Clockwise intent from the south harbor. Defined in `IslandWorldMap.jsx` (`ISLAND_HOTSPOTS`).

| Hotspot | World | x % | y % | Art landmark |
|---------|-------|-----|-----|--------------|
| Veinharbor | — (opens Town tab) | 49 | 85 | south docks / harbor town |
| Shoreline Forest | W1 | 29 | 62 | dense woods SW of the town |
| Peninsula Town | W2 | 20 | 35 | ruined orange-roofed town, west peninsula |
| Ravine Path | W3 | 83 | 47 | jagged east cliffs |
| The Forge | W4 | 42 | 44 | temple/forge on the mountain's west face |
| Upper Castle | W5 | 51 | 10 | castle at the peak (label drawn above the pin) |
| Vaelyx (summit) | W6 | 51 | 22 | blue crystal |

Camera: starts centred on Veinharbor at zoom 1.4 (zoom 1.0 = whole island fits the viewport height; max 3.5).
