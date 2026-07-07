# Roadmap

This roadmap reflects the current app architecture and the product direction implied by the existing collection metadata, UI, and storage rules.

## Current foundation

- Single-page app powered by `index.html`, `styles.css`, `app.js`, and `data.js`.
- Tracked daily collections: Morning, Evening, Before Sleep.
- Non-tracked reference/occasion collections: Travel, Weather, Prayer, Istikhārah.
- Standalone Resources and Backup & Restore views.
- Collection metadata includes `trackerEnabled`, `enabled`, `collectionType`, `trackingType`, `iconImage`, `bannerImage`, and optional `bannerImages`.
- Focus Mode adapts controls based on whether the active collection is tracked.
- Backup & Restore exports/imports only localStorage keys for enabled tracked collections.

## Near-term roadmap

### Documentation and maintainability

- Keep `/docs` updated whenever collection behavior or storage behavior changes.
- Treat `docs/COLLECTION_ARCHITECTURE.md` and `docs/DATA_STORAGE_BACKUP.md` as required reading before adding new collections.
- Keep asset paths documented so circular icons and banners remain consistent.

### Content quality

- Review references, grades, translations, and transliterations for all collections.
- Replace placeholder Resources links with production-quality references.
- Expand short occasion collections only where the added duʿās are well-sourced and do not clutter the experience.

### UI refinement

- Preserve the current calm blue visual system.
- Improve responsive spacing only where needed.
- Avoid adding unnecessary dashboard widgets.
- Keep daily progress visible on tracked collections, and keep non-tracked collections free of habit pressure.

### Backup clarity

- Continue explaining that data is stored locally in the browser.
- Keep backups limited to tracked progress/habit keys.
- Consider future backup validation messaging that reports how many tracked keys were restored.

## Future collection ideas

### Ramadan seasonal collection

A Ramadan collection is a strong future candidate because it is time-bound and devotional, but it should be designed carefully.

Possible metadata:

```js
ramadan: {
  id: 'ramadan',
  title: 'Ramadan Duʿās',
  shortTitle: 'Ramadan',
  trackerEnabled: false, // or true only if a deliberate Ramadan tracker is designed
  enabled: false,
  collectionType: 'seasonal',
  trackingType: 'none', // future option could be 'calendar'
  iconImage: 'assets/images/collections/icons/ramadan-icon.png',
  bannerImage: 'assets/images/collections/banners/ramadan-banner.png',
  items: []
}
```

Recommended first version:

- Start as `enabled: false` until content and assets are ready.
- Prefer `trackerEnabled: false` unless a distinct Ramadan tracking design is created.
- Use `collectionType: 'seasonal'` and `trackingType: 'none'` or a future `calendar` type.
- Do not reuse daily habit storage unless the UX explicitly calls for a Ramadan-specific progress model.

## Longer-term possibilities

- Better source/resource pages with real links and editorial notes.
- Optional font-size controls inside Focus Mode.
- Optional audio recitation if it can be done without clutter.
- Import/export UX improvements.
- Additional seasonal or situational collections after the architecture is stable.

## Non-goals for now

- Social sharing streaks or competitive habit mechanics.
- Account-based sync.
- Large dashboards that distract from reading.
- Tracking every collection by default.
