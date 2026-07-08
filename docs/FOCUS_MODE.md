# Focus Mode

Focus Mode is the app’s full-screen calm reading experience. It is shared by tracked daily collections and non-tracked reference collections, but its controls adapt to collection tracking behavior.

## Purpose

Focus Mode should:

- Center the current duʿā and reduce surrounding distractions.
- Show Arabic, transliteration when available, English translation, source metadata, repeat count, and virtues/benefits when available.
- Use collection banner imagery to maintain context.
- Preserve fixed navigation controls so the reader can move through a collection easily.

## Shared behavior

For all collections, Focus Mode shows:

- Collection title plus “Focus Mode.”
- Duaa count such as “Duaa 1 of 16.”
- A progress bar based on current Focus Mode index, not necessarily completion state.
- Collection banner image candidates.
- Heading from summary/label/opening words/title.
- Repeat badge from `count`, `repeat`, or `repeatCount`.
- Source metadata from `reference` and/or `source`.
- Arabic text.
- English translation.
- Transliteration block only when transliteration exists.
- Virtues/Benefits section only when content exists.

## Tracked collection behavior

For Morning, Evening, and Before Sleep:

- Close button says “Exit Focus Mode.”
- Skip button is visible.
- Primary button says “Complete & Next.”
- Completing an item sets its daily progress value to true.
- If at least one item is complete, the daily habit key is set to true.
- At the last item, completion/advance exits Focus Mode.

This makes Focus Mode part of the daily progress workflow.

## Non-tracked collection behavior

For Travel, Weather, Prayer, and future open non-tracked collections:

- Close button says “Back to Collection.”
- Skip button is hidden.
- Primary button says “Next.”
- Next advances through items but does not write progress.
- No habit key is created.
- No backup-relevant storage should be produced.

This makes Focus Mode a reader, not a tracker.

Istikhārah is temporarily excluded from Focus Mode while it is marked `comingSoon: true`. Future Istikhārah work should use a guided experience that explains praying two rakʿahs first, presents the duʿā with translation/transliteration and source details, clarifies when to say it, and avoids implying that showing the duʿā alone is the full process.

## Design principles

- Focus Mode should stay uncluttered and readable.
- Avoid adding secondary widgets that compete with Arabic and translation text.
- Any future controls, such as font-size or audio, should be optional and visually quiet.
- Non-tracked collections must not imply a devotional obligation or streak.
