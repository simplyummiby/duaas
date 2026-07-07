# Asset Guide

Assets help Duʿā Companion feel calm, cohesive, and devotional. The current app uses home banners, collection banners, and circular collection icons.

## Visual direction

- Calm and blue-toned.
- Soft light, spacious composition, and minimal visual noise.
- Devotional-first imagery: atmosphere, sky, landscape, subtle light, and gentle texture are preferable to busy illustrations.
- Avoid harsh contrast, neon colors, crowded typography, or UI-heavy imagery.

## Home page banners

The Home hero currently uses background candidates from `assets/backgrounds/`:

- `assets/backgrounds/sunset-beach.png`
- `assets/backgrounds/sunset-beach-2.jpg`

Home imagery should feel welcoming and broad, not tied to one specific collection.

## Collection banners

Collection banners are configured per collection using `bannerImage` and optional `bannerImages`. They are applied to collection pages and Focus Mode.

Current banner paths include:

- `assets/images/collections/banners/morning-banner.svg`
- `assets/images/collections/banners/morning-banner.png`
- `assets/images/collections/banners/evening-banner.png`
- `assets/images/collections/banners/sleep-banner.png`
- `assets/images/collections/banners/travel-banner.png`
- `assets/images/collections/banners/weather-banner.png`
- `assets/images/collections/banners/prayer-banner.png`
- `assets/images/collections/banners/istikharah-banner.png`
- `assets/images/collections/banners/resources-banner.png`

The app also references `assets/images/collections/backup-restore-banner.png` for Backup & Restore, but the current repository stores collection banners under `assets/images/collections/banners/`. See “Gaps noticed” in the task summary if this asset is missing.

## Circular collection icons

Collection cards use `iconImage` inside circular containers, with a text `icon` fallback.

Current icon paths include:

- `assets/images/collections/icons/morning-icon.png`
- `assets/images/collections/icons/evening-icon.png`
- `assets/images/collections/icons/sleep-icon.png`
- `assets/images/collections/icons/travel-icon.png`
- `assets/images/collections/icons/weather-icon.png`
- `assets/images/collections/icons/prayer-icon.png`
- `assets/images/collections/icons/istikharah-icon.png`

Square source images work best because icons are shown in circular cropped containers.

## Adding assets for future collections

For a future Ramadan collection, expected paths could be:

- `assets/images/collections/icons/ramadan-icon.png`
- `assets/images/collections/banners/ramadan-banner.png`

After adding assets, wire them through the collection object rather than adding one-off rendering logic.

## Fallback behavior

If a configured banner cannot load, the app falls back to the default gradient/banner styling. If an icon image cannot load, the circular text fallback remains available.
