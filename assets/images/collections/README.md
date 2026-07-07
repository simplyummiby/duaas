# Collection images

The app reads collection artwork from `data.js`. Each collection can define:

- `iconImage` for circular collection icons.
- `bannerImage` for the collection page / Focus Mode banner.
- Optional `bannerImages` fallback list when legacy filenames should continue working.
- `trackerEnabled` as the authoritative flag for progress and habit tracking.
- `enabled` to keep future collections configured without showing them in the UI.
- `collectionType` and `trackingType` metadata for future collection behavior.

## Expected icon paths

Upload collection icons to:

- `assets/images/collections/icons/morning-icon.png`
- `assets/images/collections/icons/evening-icon.png`
- `assets/images/collections/icons/before-sleep-icon.png`
- `assets/images/collections/icons/travel-icon.png`
- `assets/images/collections/icons/weather-icon.png`
- `assets/images/collections/icons/prayer-icon.png`
- `assets/images/collections/icons/istikharah-icon.png`

Icons are displayed through circular containers with `object-fit: cover`, so square source images work best.

## Expected banner paths

Upload collection banners to:

- `assets/images/collections/home-banner.png`
- `assets/images/collections/morning-adhkar-banner.png`
- `assets/images/collections/evening-adhkar-banner.png`
- `assets/images/collections/before-sleep-banner.png`
- `assets/images/collections/travel-banner.png`
- `assets/images/collections/weather-banner.png`
- `assets/images/collections/prayer-banner.png`
- `assets/images/collections/istikharah-banner.png`
- `assets/images/collections/backup-restore-banner.png`

If a configured banner cannot be loaded, the app falls back to the default gradient/banner styling. Morning, Evening, and Before Sleep also keep legacy filename fallbacks where available.

## Adding future collections

1. Add the collection data to `window.DUAA_COLLECTIONS` in `data.js`.
2. Set `trackerEnabled: true` only for collections that should create progress and habit storage.
3. Set `trackerEnabled: false` for reference or occasion-based collections.
4. Set `enabled: true` for live collections, or `enabled: false` for future collections that should remain hidden and excluded from backups.
5. Set `collectionType` (for example `daily`, `reference`, or `seasonal`) and `trackingType` (for example `daily`, `none`, or future `calendar`).
6. Add `iconImage` and `bannerImage` paths in the collection object.
7. Use `items` for a normal duʿā list, or `categories` for grouped collections like Weather-Related Duʿās.
