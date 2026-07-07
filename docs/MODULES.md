# Modules and Project Structure

Duʿā Companion is a small static app. There is no build step in the current repository.

## Root files

| File | Role |
| --- | --- |
| `index.html` | App shell, navigation, views, Focus Mode markup, script/style includes. |
| `styles.css` | Global design system, layout, collection cards, banners, Focus Mode, responsive behavior. |
| `app.js` | Runtime logic: collection filtering, rendering, Focus Mode, progress, history, backup/restore. |
| `data.js` | Duʿā content arrays and `window.DUAA_COLLECTIONS` registry. |
| `CHANGELOG.md` | Version history and feature notes. |
| `assets/images/collections/README.md` | Existing asset and collection metadata guidance. |

## Data module

`data.js` defines the content arrays and the collection registry.

Important content arrays include:

- `morningDuaas`
- `eveningDuaas`
- `sleepDuaas`
- `travelDuaas`
- `weatherCategories`
- `prayerDuaas`
- `istikharahDuaas`

`window.DUAA_COLLECTIONS` is the authoritative list of app collections. It currently includes:

| ID | Title | Items | Categories | Tracked |
| --- | --- | ---: | ---: | --- |
| `morning` | Morning Adhkār | 16 | 0 | Yes |
| `evening` | Evening Adhkār | 15 | 0 | Yes |
| `sleep` | Before Sleep | 3 | 0 | Yes |
| `travel` | Travel Duʿās | 2 | 0 | No |
| `weather` | Weather-Related Duʿās | 5 | 5 | No |
| `prayer` | Prayer Duʿās | 2 | 0 | No |
| `istikharah` | Istikhārah | 1 | 0 | No |

## UI module

`index.html` contains these major views:

- `homeView`
- `collectionView`
- `resourcesView`
- `backupView`
- `aboutView`
- `focusMode`

The sidebar directly links to Home, the three tracked daily collections, Resources, Backup & Restore, and About. Occasion collections are surfaced from the Home page rather than listed as sidebar primary navigation.

## Runtime module

`app.js` handles:

- Filtering enabled collections.
- Splitting collections into tracked and non-tracked groups.
- Rendering home cards, habit cards, occasion cards, resources, and the dynamic collection view.
- Applying collection/home/resource/backup banners.
- Opening and closing Focus Mode.
- Toggling tracked progress for daily collections.
- Creating localStorage progress and habit keys only for tracked collections.
- Exporting/importing backup JSON.
- Browser history state for views and Focus Mode.

## Asset module

Collection assets are under `assets/images/collections/`:

- `icons/` stores circular collection icon images.
- `banners/` stores collection and special page banners.

The home hero currently uses `assets/backgrounds/sunset-beach.png` and `assets/backgrounds/sunset-beach-2.jpg` as candidates.
