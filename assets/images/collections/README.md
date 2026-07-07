# Banner Image Upload Paths

Upload banner images to this folder using the exact filenames below.

## Current banners

| Area / Collection | Upload path | Configuration |
| --- | --- | --- |
| Home | `assets/images/collections/home-banner.png` | `homeBanner.bannerImage` in `app.js` |
| Morning Adhkār | `assets/images/collections/morning-adhkar.png` | `morning.bannerImage` in `data.js` |
| Evening Adhkār | `assets/images/collections/evening-adhkar.png` | `evening.bannerImage` in `data.js` |
| Before Sleep | `assets/images/collections/before-sleep-banner.png` | `sleep.bannerImage` in `data.js` |

## Recommended image format

- Use `.png` if you want to preserve the uploaded artwork exactly.
- Use `.jpg` or `.webp` if you want a smaller file size.
- If you change the extension, update the matching banner image path in code.

## Future collections

1. Add the image to this folder using a readable kebab-case filename, for example:
   `assets/images/collections/travel-banner.png`
2. Add the same path to that collection's `bannerImage` property in `data.js`.
3. No additional Focus Mode or collection hero code changes should be needed.

The app checks whether a banner image can load before applying it. If the file is missing, the page keeps the default banner background until the image is uploaded.
