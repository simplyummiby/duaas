# Data Storage and Backup

Duʿā Companion stores progress in browser localStorage. There is no account, server sync, or database in the current app.

## Storage keys

Tracked daily collections use two daily key patterns:

```text
dc_<collectionId>_progress_<YYYY-MM-DD>
dc_<collectionId>_habit_<YYYY-MM-DD>
```

Weekly tracking also uses date-based week metadata:

```text
dc_current_week_start
dc_weekly_history
```

`dc_current_week_start` stores the Sunday start date for the active Home tracker week. `dc_weekly_history` stores completed week snapshots keyed by that same week-start date, for example `2026-07-05`.

Examples:

```text
dc_morning_progress_2026-07-07
dc_morning_habit_2026-07-07
```

Progress keys store JSON objects keyed by item index. Habit keys store the string `true` after at least one item in that collection has been completed for that day.

Completed weekly history entries include `weekStart`, `weekEnd`, and per-tracked-collection day snapshots with habit completion, completed item counts, total item counts, and completion percentages. Weekly history is intentionally keyed by ISO-like local dates rather than arbitrary week numbers so future reporting can group by week, month, Ramadan, or streak windows without depending on year/week-number conventions.

## Tracked-only rule

Only collections that are both enabled and `trackerEnabled: true` should create storage. Currently that means:

- Morning Adhkār.
- Evening Adhkār.
- Before Sleep.

Non-tracked collections must not create progress or habit storage:

- Travel.
- Weather.
- Prayer.
- Istikhārah.
- Resources.
- Backup & Restore.
- About.

This rule protects the app from accidentally treating reference material as a habit obligation.

## Backup export

The Backup & Restore page creates a JSON file with this general shape:

```json
{
  "app": "duaa-companion",
  "version": "1.3",
  "exportedAt": "2026-07-07T00:00:00.000Z",
  "localStorage": {}
}
```

During export, localStorage keys are filtered so only tracked collection progress/habit keys and weekly tracking metadata are included. The filename uses the current date:

```text
duaa-companion-backup-YYYY-MM-DD.json
```

## Backup restore

Restore accepts JSON files that identify the app as `duaa-companion` and include a `localStorage` object. Restore then filters incoming keys through the same tracked-collection rule before writing them back to localStorage.

This means:

- Old or unrelated localStorage keys are ignored.
- Keys for disabled or non-tracked collections are ignored.
- Weekly history and the active week marker are restored with tracked progress.
- Reference/occasion collections cannot be restored into fake progress state.

## Browser-local limitation

The app explains that progress is stored in the current browser. Users should download a backup before:

- Clearing browser data.
- Switching browsers.
- Moving to a different device.
- Using private/incognito windows where storage may be temporary.

## Future storage notes

If settings are added later, decide whether Backup & Restore remains progress-only or expands to include settings. Do not include non-tracked collection reading state unless there is a clear product reason.
