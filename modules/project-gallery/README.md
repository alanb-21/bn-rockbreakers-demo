# Module: project-gallery

Filterable project / portfolio grid. Click filter buttons to show only matching cards. No backend needed — content is hand-curated in HTML.

## What it adds

- Filter pill row (`All` + N tag buttons)
- Responsive card grid with image, title, location, year, tags
- Smooth filter transitions

## Dependencies

None. Pure front-end.

## Files to copy

```
modules/project-gallery/snippet.html  →  paste into a "projects.html" page
modules/project-gallery/gallery.css   →  append to shared.css
modules/project-gallery/gallery.js    →  append to shared.js
```

## Customization

- Each `.gallery-card` has a `data-tag="..."` attribute matching one of the filter buttons' `data-filter="..."` values.
- Add more filters by adding a `<button class="filter-btn" data-filter="...">` and matching `data-tag` on cards.
- For a one-row "featured projects" preview on the homepage, just drop in 3 cards without the filter row.
