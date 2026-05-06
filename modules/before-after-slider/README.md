# Module: before-after-slider

Drag-to-reveal image comparison slider. Two images stacked, a vertical handle that the user drags to wipe between them. Common on construction / renovation / cleaning sites.

## What it adds

- Reusable `.ba-slider` component supporting any number of slider instances on a page
- Mouse + touch drag handling
- Captioned before/after labels

## Dependencies

None. Pure front-end.

## Files to copy

```
modules/before-after-slider/snippet.html  →  paste anywhere a comparison fits
modules/before-after-slider/slider.css    →  append to shared.css
modules/before-after-slider/slider.js     →  append to shared.js
```

## Customization

- Drop in as many `.ba-slider` blocks as you want — the JS auto-wires each one.
- Both images should be the same dimensions or the wipe will look off.
- Default handle starts at 50%; tweak with inline `style="--start:30%"` if you want to bias one side.
