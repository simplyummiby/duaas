# Collection Architecture

The collection registry in `data.js` is the center of the app’s content architecture.

## Collection registry

Collections are defined under `window.DUAA_COLLECTIONS`. Each collection object should include:

| Property | Purpose |
| --- | --- |
| `id` | Stable collection identifier used for rendering, routing, localStorage keys, and backup filtering. |
| `title` | Full display title. |
| `shortTitle` | Short label for cards or compact displays. |
| `icon` | Text fallback if the image icon fails or is unavailable. |
| `iconImage` | Image path for circular collection icons. |
| `trackerEnabled` | Authoritative flag for progress/habit behavior. |
| `enabled` | Controls whether the collection appears in the app. |
| `collectionType` | Metadata for collection intent such as `daily`, `reference`, or future `seasonal`. |
| `trackingType` | Metadata for tracking shape such as `daily`, `none`, or future `calendar`. |
| `description` | Intro copy on cards and collection pages. |
| `bannerImage` | Main banner image candidate. |
| `bannerImages` | Optional fallback candidate list. |
| `items` | Flat duʿā list consumed by collection pages and Focus Mode. |
| `categories` | Optional grouped display, currently used by Weather. |

## Tracked collections

Tracked collections currently are:

- `morning` — Morning Adhkār.
- `evening` — Evening Adhkār.
- `sleep` — Before Sleep.

Tracked collections:

- Appear in the Home page “Today’s Remembrance” section.
- Appear in the Habit Tracker section.
- Show collection-page progress and a collection habit card.
- Render completion check controls in collection rows.
- Let Focus Mode complete the current duʿā and advance.
- Create `dc_<collectionId>_progress_<YYYY-MM-DD>` keys.
- Create `dc_<collectionId>_habit_<YYYY-MM-DD>` keys after at least one item is complete.
- Are included in backup export and restore.

## Non-tracked collections

Non-tracked collections currently are:

- `travel` — Travel Duʿās.
- `weather` — Weather-Related Duʿās.
- `prayer` — Prayer Duʿās.
- `istikharah` — Istikhārah.

Non-tracked collections:

- Appear as Home page occasion cards.
- Do not appear in “Today’s Remembrance.”
- Do not appear in the Habit Tracker.
- Do not show completion check controls.
- Do not create localStorage progress or habit keys.
- Are excluded from backup export and restore.
- Still open in Focus Mode for calm reading.

## Standalone non-collection views

The app also has standalone views that are not entries in `window.DUAA_COLLECTIONS`:

- Resources.
- Backup & Restore.
- About.

Resources and Backup & Restore are non-tracked by design. They should not create collection progress or habit storage.

## Category architecture

Weather currently uses `categories` and a flattened `items` array:

- `categories` drives grouped display on the collection page.
- `items: weatherCategories.flatMap(...)` gives Focus Mode a flat list of items and stable indices.

When adding categorized collections, keep both needs in mind: category browsing and Focus Mode indexing.

## Future Ramadan collection

Ramadan should likely begin as a disabled seasonal collection:

- `enabled: false`
- `collectionType: 'seasonal'`
- `trackingType: 'none'` or future `calendar`
- `trackerEnabled: false` unless a new seasonal tracking experience is intentionally designed

Do not default Ramadan into daily habit tracking unless the UX, storage, and backup rules are updated together.
