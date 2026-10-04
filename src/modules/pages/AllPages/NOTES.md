# /all — playground index

One card per project. Extra routes of a project (guide, sub-pages) are chips on its card.

## Add a project

1. Add an entry to `PROJECTS` in `data.ts`: `id`, `title`, one-line `desc`, main `route`, `category`, `tags` (searchable),
   `added` (first commit date of the route folder) and optional `pages` (`guide: true` marks a learn page).
2. Capture its thumbnail with the dev server running on :3000:

    ```bash
    node src/modules/pages/AllPages/capture-thumbs.mjs <id>
    ```

    It saves `public/all/<id>.webp` (1440×900 viewport, 960px wide). Pages with loaders or heavy scenes get extra time in
    `WAIT`; pages that need a click get a step in `ACT`; tiny centred demos get a zoomed `CLIP`. If a page renders
    blank, set `noThumb: true` and the card shows a typographic cover instead.

## What is on the page

- **Timeline strip** (desktop with a mouse only): every project oldest → newest, magnified like a dock under the
  pointer. The strip keeps its width (fisheye), dims projects hidden by the filters, and clicking jumps to the card. One
  tab stop; arrow keys, Home and End move along it.
- **Toolbar** (sticky): search (`/` focuses it, Esc clears it, Enter opens the first result), category pills with live
  counts, "Has guide", sort (type / newest by month / A–Z) and grid or list. Filters live in the URL, so a filtered view
  can be shared.
- **List view**: a dense table; hovering a row shows a large preview below the pointer.
- **Theme**: follows the system; the toggle remembers the choice (`localStorage` key `ix-theme`).
- "New" marks projects added in the last 21 days.

Tokens follow ui-craft (warm paper neutrals, 4px scale, hairlines, one accent) and motion follows web-motion
(smooth-out curve, 700ms / 18px entrance, 70ms stagger). Thumbnails are served as-is (`unoptimized`), because the image
optimiser caches for a year and would keep showing old captures.
