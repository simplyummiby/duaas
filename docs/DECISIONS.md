# Project Decisions

This file records current product and technical decisions so future changes stay aligned with the app.

## Decision: daily collections are the only tracked collections

Morning Adhkār, Evening Adhkār, and Before Sleep have `trackerEnabled: true`, `collectionType: 'daily'`, and `trackingType: 'daily'`.

Travel, Weather, Prayer, and Istikhārah have `trackerEnabled: false`, `collectionType: 'reference'`, and `trackingType: 'none'`.

Reasoning:

- Daily adhkār benefit from gentle completion state and weekly habit visibility.
- Occasion collections should be available when needed without producing streak pressure.
- Backup files should stay small, relevant, and free of accidental reference-collection state.

## Decision: `trackerEnabled` is authoritative

Use `trackerEnabled` to decide whether a collection can create progress/habit storage or show completion controls. Other metadata is useful for future architecture, but storage and habit behavior should not infer tracking from title, route, or collection type alone.

## Decision: non-tracked collections still use Focus Mode

Reference collections can be opened in the same Focus Mode reader, but controls are simplified:

- The close button says “Back to Collection.”
- Skip is hidden.
- The primary action says “Next.”
- Clicking Next does not create progress or habit storage.

This keeps the reading experience consistent without implying completion tracking.

## Decision: Backup & Restore is tracked-only

Backup export and restore filter keys through tracked collection IDs. Non-tracked collections must not create or restore progress/habit data.

## Decision: assets are metadata-driven

Collection icons and banners should be configured on the collection object through `iconImage`, `bannerImage`, and optional `bannerImages`. UI code should render the same component patterns rather than hardcoding artwork per collection.

## Decision: UI should remain calm and sparse

The app should avoid unnecessary UI. Progress indicators are acceptable for tracked daily collections. Reference collections should prioritize reading, category browsing, and source clarity.

## Decision: disabled collections can exist in data

Future collections may be present with `enabled: false`. Disabled collections should be hidden from the UI and excluded from tracked collection ordering and backup behavior.

## Open questions

- Should a future Ramadan collection be tracked, seasonal-only, or use a new calendar-based tracking model?
- Should Resources eventually become a data-driven collection-like registry, or remain a standalone view?
- Should Backup & Restore include user settings if future settings are added, or remain progress-only?
