# Collection Banner Upload Paths

Upload collection banner images to this folder using the exact filenames below.

## Current collections

| Collection | Upload path | Data key |
| --- | --- | --- |
| Morning Adhkār | `assets/images/collections/morning-adhkar.png` | `morning.bannerImage` |
| Evening Adhkār | `assets/images/collections/evening-adhkar-banner.png` | `evening.bannerImage` |
| Before Sleep | `assets/images/collections/before-sleep-banner.png` | `sleep.bannerImage` |

## Recommended image format

- Use `.png` if you want to preserve the uploaded artwork exactly.
- Use `.jpg` or `.webp` if you want a smaller file size.
- If you change the extension, update the matching `bannerImage` path in `data.js`.

## Future collections

1. Add the image to this folder using a readable kebab-case filename, for example:
   `assets/images/collections/travel-banner.png`
2. Add the same path to that collection's `bannerImage` property in `data.js`.
3. No additional Focus Mode or collection hero code changes should be needed.

The app checks whether a banner image can load before applying it. If the file is missing, the collection keeps the default banner background until the image is uploaded.
