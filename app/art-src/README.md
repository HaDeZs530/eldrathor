# Art sources (full resolution, not served)

Full-resolution originals for raster assets that ship downsampled in `app/public/`. Never import
from here at runtime; export with proportional Lanczos downsampling and a minimal centred crop to the
slot's aspect (see `docs/SESSION_LOG.md`, PR #49 for the recipe).

- `town/veinharbor-hero.png` 1567×1004 → `public/town/veinharbor-hero.png` 1170×750 (harbor panorama)
- `town/town-party.png` 1380×1140 → `public/town/town-party.png` 276×228 (three travelers on the quay)
- `town/town-crafter.png` 1380×1140 → `public/town/town-crafter.png` 276×228 (artisan workbench, embroidery hoop)
- `town/town-smith.png` 1380×1140 → `public/town/town-smith.png` 276×228 (anvil and hammer before the forge)
- `town/town-market.png` 1380×1140 → `public/town/town-market.png` 276×228 (merchant stall with brass scales)
