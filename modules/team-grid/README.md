# Module: team-grid

Team-member card grid with photo, name, role badge, qualifications, bio. Drops onto an about page.

## What it adds

- 2-column responsive card grid
- Role badge overlay on photo
- Qualification chips at the bottom of each card

## Dependencies

None. Pure front-end.

## Files to copy

```
modules/team-grid/snippet.html  →  paste into about.html (typically below the .about section)
modules/team-grid/team.css      →  append to shared.css
```

No JS needed.

## Customization

- For 3-up on wide desktops, change `grid-template-columns: repeat(2, 1fr)` to `repeat(3, 1fr)` in `team.css`.
- For 1-up cards (single founder), change to `1fr` and tweak the photo aspect ratio.
- Qualification chips are arbitrary tags — fit certifications, languages spoken, areas of focus, etc.
