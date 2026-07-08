# Duaa Verification Guide

> **Do not publish unless every required check is complete.** A duaa should stay marked **Coming Soon / Being Verified** until its Arabic wording, source/reference, translation or meaning, category placement, and study resources have been reviewed carefully.

This guide explains how to manually move a duaa from a placeholder state to fully visible and accessible in Focus Mode.

## Files to edit

Most duaa content lives in:

- `data.js`

The verification rules and page behavior live in:

- `app.js`
- `index.html`
- `styles.css`

For normal content maintenance, you should usually only edit `data.js`.

## What the verification fields mean

Each duaa should include these fields in `data.js`:

```js
verified: false,
sourceStatus: "needs-review",
arabicChecked: false,
translationChecked: false,
resourcesAdded: false,
sourceReference: "",
studyResources: [],
```

Use them this way:

- `verified: false` means the duaa is not ready for public use. It will show as **Coming Soon** and will not open in Focus Mode.
- `verified: true` means the duaa has passed review and may be fully visible and accessible.
- `sourceStatus` records the review state. Keep `"needs-review"` until the source has been checked.
- `arabicChecked` should only be changed to `true` after the Arabic wording has been checked.
- `translationChecked` should only be changed to `true` after the English translation or meaning has been checked.
- `resourcesAdded` should be `true` when helpful study resources have been added, or when you intentionally decide that no extra resources are available yet.
- `sourceReference` should contain the reviewed source citation or reference note.
- `studyResources` is where reviewed extra links or notes can be added.

## Before enabling a duaa

- [ ] Arabic wording checked
- [ ] Translation checked
- [ ] Source/reference added
- [ ] Category confirmed
- [ ] Study resources added if available
- [ ] `verified` changed from `false` to `true`
- [ ] Duaa appears in its collection
- [ ] Duaa opens in focus mode

## Step-by-step: enabling one duaa

### 1. Find the duaa in `data.js`

Open `data.js` and find the correct collection array, such as:

- `morningDuaas`
- `eveningDuaas`
- `sleepDuaas`
- `travelDuaas`
- `weatherCategories`
- `prayerDuaas`
- `istikharahDuaas`

Confirm that the duaa belongs in the right collection and category.

### 2. Check the Arabic wording

Before changing `arabicChecked`, compare the Arabic text against the source you trust for that duaa.

Check for:

- Missing words
- Extra words
- Letter mistakes
- Harakat/diacritic mistakes where included
- Line breaks that make the text confusing
- Whether the wording matches the cited narration or source

When complete, set:

```js
arabicChecked: true,
```

### 3. Check the translation or meaning

Review the English translation or meaning against the Arabic and the source.

Check for:

- Whether the meaning is accurate
- Whether any wording is misleading
- Whether important phrases are missing
- Whether the English is clear for readers
- Whether the translation avoids claiming more certainty than the source supports

When complete, set:

```js
translationChecked: true,
```

### 4. Add or confirm the source/reference

Every enabled duaa should have a clear source or reference.

Check the existing fields such as:

```js
reference: "Sahih al-Bukhari 6306, 6323",
grade: "Sahih",
```

Then fill in the verification reference field:

```js
sourceReference: "Sahih al-Bukhari 6306, 6323",
sourceStatus: "reviewed",
```

If the source is not ready, do **not** enable the duaa. Keep:

```js
verified: false,
sourceStatus: "needs-review",
```

### 5. Add study resources if available

Use `studyResources` for reviewed supporting links or notes. For example:

```js
studyResources: [
  {
    title: "Explanation of this duaa",
    url: "https://example.com/reviewed-resource",
    description: "Short note about why this resource is useful."
  }
],
resourcesAdded: true,
```

If there are no extra study resources yet, only set `resourcesAdded: true` if you have intentionally reviewed that and decided the duaa is still ready without them.

### 6. Change `verified` last

Only after all checks are complete, change:

```js
verified: false,
```

to:

```js
verified: true,
```

This is the final switch that makes the duaa fully accessible. Do this last so an unfinished duaa is not accidentally published.

## How to test after enabling a duaa

1. Open the app in a browser.
2. Go to the collection that contains the duaa.
3. Confirm the duaa no longer shows a **Coming Soon** or verification badge.
4. Click the duaa.
5. Confirm Focus Mode opens.
6. Confirm Arabic, translation, transliteration, repeat count, virtues/benefits, and source information look correct.
7. On a phone-size screen or browser responsive mode, confirm the card and Focus Mode still look readable.
8. Open the browser console and confirm there are no new errors.

## How to avoid accidentally publishing an unverified duaa

- Do not set `verified: true` until every checklist item is complete.
- If you are unsure about a source, keep `verified: false`.
- If a duaa is missing the `verified` field entirely, the app treats it as unverified by default.
- Prefer leaving a duaa as **Coming Soon** rather than publishing something uncertain.
- Change `verified` last, after the Arabic, translation, source, category, and resources have been checked.
