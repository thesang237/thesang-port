# Floema verification — 2026-10-07

Reference and rebuild inspected in the Codex Chromium browser at 1440 × 900 and 390 × 844. Comparisons use the supplied running reference on port 3002 and the development rebuild on port 3026. The final production preview runs on port 3027.

## Observed

- All three routes render without browser errors.
- Desktop type, palette, gallery dimensions, nav positions, About heading position, and section spacing compared against source styles and browser geometry.
- Desktop reference collection card: x 552.375, width 268.195, height 378.594 px. Rebuild nominal geometry: x 552.375, width 268.2, height 378.6 px. Floating transforms are applied separately.
- About first heading at 1440 px: x 195, y 627, width 1050, height 181.5 px.
- Collection titles render behind the opaque WebGL cards, matching the reference.
- Home → Collections → About → Collections navigation exercised, with the curved cover and uncover. Browser Back and Forward preserve the outgoing page during the cover and reveal the destination afterward.
- A phone-width drag advances to Gold Bracelet without accidentally opening the product.
- Collection keyboard End reaches Onde. Product opening, full flip, matched Silver Necklace details, Close, and gallery restoration exercised.
- Phone product scrolling reaches the complete copy, shop link, and close control. WebGL image follows the detail's native scroll.
- Phone resize preserves card scaling. Product name lines do not split a final letter onto a separate line.
- About wheel scrolling, gallery movement, photo parallax, and reveal behavior exercised on desktop and phone widths.
- The 57 local assets were decoded and inspected in a contact sheet; no missing assets.
- Rich-text links retain one real anchor per CMS span; there are no `true` placeholder blocks. Heading accessible names preserve spaces across visual line breaks.
- A clean reload reports `floema--webgl`, one canvas, and zero broken DOM images. History navigation retains the same canvas.

## Checks

- Full-project TypeScript: `tsc --noEmit` passed.
- Scoped ESLint: zero errors and zero warnings.
- Production: `APP_ENV=preview npm run build -- --webpack` passed. The built server also passed a Home → Collections navigation smoke check with one canvas and no browser errors. The default Turbopack build rejects this checkout’s dependency symlink outside the worktree; Webpack validates the same application successfully.
- Short, warm development samples on this machine: desktop home median 8.3 ms / p95 9.0 ms; desktop collection 8.3 / 9.2 ms; phone-width About 8.2 / 9.7 ms. These are 120-frame CPU scheduling intervals, not a benchmark or GPU timing; hidden frames and pauses over 100 ms are excluded. Draw calls scale with visible cards (17, 8, 4 in those samples).

## Coverage limits

This is source-based fidelity plus manual Chromium verification, not a claim of mathematically identical screenshots across arbitrary animation times: the reference itself randomizes portrait rotations and its speed changes with refresh rate. Physical phone hardware, Safari, Firefox, GPU context-loss injection, and a throttled performance profile have not been tested. Reduced-motion behavior and cleanup paths are implemented and statically reviewed.

## Follow-up fixes

- Curtain SVG explicitly fills `100vw × 100dvh`; previously global SVG sizing left it 150 px tall. Browser measurements now report 1440 × 900 px on desktop and 390 × 844 px on phone.
- Oval hover uses the measured SVG path length and fractional attribute animation, from a fully hidden dash offset to zero; leaving reverses the stroke.
- Collection titles and description lines share an interruptible GSAP timeline: exit the old copy, then reveal the new copy with a 60 ms line offset. CSS no longer owns their transforms or delayed transitions.
- About text and highlight reveals play once per mounted page. Completed reveals stay visible outside the viewport and through responsive line re-splitting; End → Home and desktop → phone resize were exercised with the first title retaining zero transforms.
