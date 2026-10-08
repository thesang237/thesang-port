# Learning guide verification

Verified on 2026-10-08 in the Chromium in-app browser. The route is `/floema/learn`; local production preview uses port 3027.

## Observed checks

- All 13 chapters mounted at 1440×900 and 375×812 with four concise teaching sections, a demo, source references, and three recall cards each. No console errors. Document scroll width matched viewport width on every chapter. Desktop controls sit beside the study; phone controls reflow beneath it.
- Source excerpts were extracted from the actual Floema module files with original line numbers. The experience modules were not changed for the guide. The parent route now separates the reading page from the existing persistent experience.
- Shared-position study: disabling the shared value visibly detaches the HTML outline from the image.
- Gesture study: an actual pointer drag reports a drag and suppresses its click; a subsequent still click reports selection. Keyboard arrows and native range controls are available.
- Infinite loop: explicit playback moves the cards; turning playback off freezes their transform. Negative and positive offsets use the imported source wrap helper.
- WebGL portrait: bend and wireframe controls work; changing segment count rebuilds the geometry. Five WebGL → hover → WebGL cycles showed exactly one active canvas, one geometry and one texture each time, and zero canvases in the hover chapter. No context-limit or shader warnings.
- Hover: measured SVG stroke offset reaches 0 after playback. Letters and outline use independent reversible timelines, matching the source’s ownership and timing.
- Reveal: scrolling a block into view increments “played” once; scrolling away and back leaves it at one. Recipe changes and explicit replay are available without resetting the guide’s page position.
- Collection captions: rapidly selecting Fold then Trace settled with only Trace visible, and all its title/description transforms at zero.
- Product opening: open/close interruption returns to zero. The final version caches layout size in a ResizeObserver and animates scale/translation/rotation, avoiding per-frame layout measurement. Its final desktop/phone opening is checked in the production preview.
- Hash routing: Back returned to the previous collection chapter and Forward returned to product. Direct loading of `#webgl` selected that chapter. Tabs support arrow keys, Home and End.
- Flashcard disclosure works. A full quiz run completed at 9/10 with a missed-question link to its source chapter. Question focus is retained through reveal/grading steps. The planner produces a short source-inspired motion brief and teaching starter.
- Performance study: identical separate meshes reported 25 draw calls and one geometry; instancing reported one draw call and one geometry. Its frame count stayed unchanged after scrolling off screen.
- Original experience regression: `/floema/collections` still mounts one canvas; navigating to About retains the original cover/swap/uncover lifecycle. The curtain measured the full 1440×900 viewport. The guide uses normal document scrolling without a Floema stage mounted beneath it.

## Build checks

Scoped ESLint completed with exit 0 and no findings. Full TypeScript checks completed with exit 0. Production Webpack build completed successfully and included `/[locale]/floema/learn`. `git diff --check` passed. Temporary logs are in `/tmp/floema-learn-{lint,build,tsc-final}.log`.

## Practical limits

Responsive checks use browser viewport sizes, not physical phones. Safari, Firefox, screen-reader speech, OS reduced-motion switching, and injected WebGL context loss were not exercised. Reduced-motion paths and resource cleanup were reviewed in source. Keyboard behavior was exercised through real focus/press actions.

The background in-app benchmark reported approximately 33ms frame intervals during this session; it does not establish the 60fps target in a foreground browser on a physical laptop. Renderer batching, resource counts, and off-screen pause behavior were observed directly. No GPU timing or heap-size claim is made. The host’s existing metadataBase warning remains unrelated to the guide.

Screenshots of all chapters at desktop/phone widths and the mount/overflow records are saved under the task’s visualization directory (`learn-*-desktop.jpg`, `learn-*-phone.jpg`, `learn-checks.json`).
